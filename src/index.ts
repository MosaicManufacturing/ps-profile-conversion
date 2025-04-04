import {
  ArcFitting,
  BrimType,
  GCodeFlavor,
  InfillPattern,
  SeamPosition,
  SolidFillPattern,
  SupportStyle,
  TopOnePerimeterType,
} from './enums';
import { applyMachineLimits } from './machine-limits';
import Profile from './profile';
import { applyStartSequenceDefaults, convertToPrinterScript } from './sequences';
import type { MachineLimits } from './types/machine-limits';
import type { Material } from './types/materials';
import type { PaletteData } from './types/palette';
import type { MachineSettings } from './types/printers';
import { Firmware } from './types/printers';
import {
  CanvasSupportStyle,
  slic3rInfillStylesToFillPattern,
  type StyleSettings,
  TransitionMethod,
} from './types/styles';
import type { TransitionTower, VariableTransitions } from './types/transitions';
import {
  ANY_COLOR,
  getMaterialFieldValue,
  getTransitionLength,
  getVolumetricFlowRate,
  ProjectColor,
  rgbToHex,
  roundTo,
  validateArrayLengths,
  variantValue,
} from './utils';

const convertSolidFillStyle = (solidFillStyle: number): SolidFillPattern => {
  switch (solidFillStyle) {
    case 0: // rectilinear
      return SolidFillPattern.RECTILINEAR;
    case 1: // monotonic
      return SolidFillPattern.MONOTONIC;
    case 2: // concentric
      return SolidFillPattern.CONCENTRIC;
    default:
      return SolidFillPattern.RECTILINEAR;
  }
};

const convertSupportDensity = (density: number, extrusionWidth: number): number => {
  switch (density) {
    case 2:
      return extrusionWidth * 10;
    case 4:
      return extrusionWidth * 5;
    case 6:
    default:
      return extrusionWidth * 2;
  }
};

const convertSupportStyle = (supportStyle: CanvasSupportStyle): SupportStyle => {
  switch (supportStyle) {
    case CanvasSupportStyle.Grid: // grid
      return SupportStyle.GRID;
    case CanvasSupportStyle.Snug: // snug
      return SupportStyle.SNUG;
    default:
      return SupportStyle.GRID;
  }
};

const densityToSpacing = (density: number, extrusionWidth: number): number =>
  roundTo((100 / density - 1) * extrusionWidth, 2);

// volume of a cylinder = pi * r^2 * h
const filamentLengthToVolume = (length: number, diameter = 1.75): number =>
  roundTo((diameter / 2) ** 2 * Math.PI * length, 2);

// extract number from `${number}%`
const extractNumberValue = (value: number | string): number => {
  if (typeof value === 'number') {
    return value;
  }
  const parsedFloat = parseFloat(value.replace('%', '').trim());
  if (Number.isNaN(parsedFloat)) {
    throw new Error(`Error parsing number from string: ${value}`);
  }
  return parsedFloat;
};

interface Inputs {
  usableInputCount: number | null;
  machine: MachineSettings;
  style: StyleSettings;
  materials: Material[];
  colors: ProjectColor[];
  palette: PaletteData | null;
  drivesUsed: boolean[];
  transitionTower?: TransitionTower;
  variableTransitionLengths?: VariableTransitions;
  machineLimits?: MachineLimits;
}

const index = ({
  usableInputCount,
  machine,
  style,
  materials,
  colors,
  palette,
  drivesUsed,
  transitionTower,
  variableTransitionLengths,
  machineLimits,
}: Inputs) => {
  // TODO: support dual-extruders here in the future?
  const maxExtruderCount = palette ? palette.getMaxInputCount() : 1;
  const extruderCount =
    usableInputCount !== null ? Math.min(maxExtruderCount, usableInputCount) : maxExtruderCount;

  validateArrayLengths(extruderCount, materials, colors, drivesUsed, variableTransitionLengths);

  const profile = new Profile(extruderCount);

  // nozzle diameter(s)
  // filament diameters
  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i]!;
    const machineExtruderIndex = i >= machine.nozzleDiameter.length ? 0 : i;
    profile.nozzleDiameter[i] = machine.nozzleDiameter[machineExtruderIndex]!;
    if (material.id === '0' && machine.filamentDiameter) {
      profile.filamentDiameter[i] = machine.filamentDiameter[machineExtruderIndex]!;
    } else {
      profile.filamentDiameter[i] = material.diameter;
    }
  }

  // bed shape
  profile.bedCircular = machine.circular;
  profile.bedSize = [...machine.bedSize];
  profile.originOffset = [...machine.originOffset, 0];

  // bed offset Z logic:
  if (palette) {
    /* For multi-material project, we use the highest Z offset
      among all materials used in the first layer.
      This logic is handled in a post-processing script.
      Generate the `zOffsetPerExt` array to store the Z offset for each material.
    */
    for (let i = 0; i < extruderCount; i++) {
      if (drivesUsed[i]) {
        const zOffset = getMaterialFieldValue(materials[i]!, 'zOffset', style.zOffset);
        profile.zOffsetPerExt[i] = zOffset;
      }
    }
    // Set `profile.zOffset` to 0 to avoid unnecessary calculations in the post-processing script.
    profile.zOffset = 0;
  } else {
    // if no Palette, then only one input is used in the project
    // but it may not be input 0
    const singleExtUsed = drivesUsed.findIndex((isDriveUsed) => isDriveUsed);
    const material = materials[singleExtUsed]!;
    profile.zOffset = getMaterialFieldValue(material, 'zOffset', style.zOffset);
  }

  // comments
  // (force-enabled for use in postprocessing, may be stripped later)
  profile.gcodeComments = true;

  // firmware
  if (machine.firmwareType === Firmware.FIRMWARE_5D_REL) {
    // RepRap 5D Relative
    profile.useRelativeEDistances = true;
  } else if (machine.firmwareType === Firmware.FIRMWARE_5D_ABS) {
    // RepRap 5D Absolute
    profile.useRelativeEDistances = false;
  } else if (machine.firmwareType === Firmware.FIRMWARE_FLASHFORGE) {
    // FlashForge
    profile.useRelativeEDistances = false;
  } else if (machine.firmwareType === Firmware.FIRMWARE_GRIFFIN) {
    // Ultimaker Griffin
    profile.useRelativeEDistances = false;
  }
  profile.useFirmwareRetraction = machine.firmwareRetraction > 0;

  // layer heights
  // TODO: re-enable when variable layer height is supported
  // profile.variableLayerHeight = style.useVariableLayerHeight;
  if (profile.variableLayerHeight) {
    profile.layerHeight = style.layerHeight;
    profile.minLayerHeight = new Array(extruderCount).fill(style.layerHeight);
    profile.maxLayerHeight = new Array(extruderCount).fill(
      variantValue(style.maxLayerHeight, style.layerHeight)
    );
  } else {
    profile.layerHeight = style.layerHeight;
    profile.minLayerHeight = new Array(extruderCount).fill(style.layerHeight);
    profile.maxLayerHeight = new Array(extruderCount).fill(style.layerHeight);
  }
  profile.firstLayerHeight = variantValue(style.firstLayerHeight, style.layerHeight);

  // extrusion widths
  profile.extrusionWidth = style.extrusionWidth;
  profile.solidInfillExtrusionWidth = style.extrusionWidth;
  profile.topInfillExtrusionWidth = style.extrusionWidth;
  profile.supportMaterialExtrusionWidth = style.extrusionWidth;
  if (style.perimeterExtrusionWidth) {
    profile.perimeterExtrusionWidth = variantValue(
      style.perimeterExtrusionWidth,
      style.extrusionWidth,
      style.extrusionWidth
    );
  } else {
    profile.perimeterExtrusionWidth = style.extrusionWidth;
  }
  if (style.externalPerimeterExtrusionWidth) {
    profile.externalPerimeterExtrusionWidth = variantValue(
      style.externalPerimeterExtrusionWidth,
      style.extrusionWidth,
      style.extrusionWidth
    );
  } else {
    profile.externalPerimeterExtrusionWidth = style.extrusionWidth;
  }
  if (style.firstLayerExtrusionWidth) {
    if (style.firstLayerExtrusionWidth.units === 'mm') {
      profile.firstLayerExtrusionWidth = style.firstLayerExtrusionWidth.value;
    } else {
      profile.firstLayerExtrusionWidth = roundTo(
        (style.extrusionWidth * style.firstLayerExtrusionWidth.value) / 100,
        4
      );
    }
  } else {
    profile.firstLayerExtrusionWidth = style.extrusionWidth;
  }
  profile.infillExtrusionWidth = variantValue(
    style.infillExtrusionWidth,
    style.extrusionWidth,
    style.extrusionWidth * 1.2
  );

  // solid layers
  {
    let solidLayers;
    let solidLayersMM;
    if (style.skinThickness.units === 'mm') {
      solidLayersMM = style.skinThickness.value;
      solidLayers = Math.round(solidLayersMM / style.layerHeight);
    } else {
      solidLayers = style.skinThickness.value;
      solidLayersMM = roundTo(solidLayers * style.layerHeight, 4);
    }
    profile.bottomSolidLayers = solidLayers;
    profile.bottomSolidMinThickness = solidLayersMM;
    if (style.topSkinThickness) {
      let topSolidLayers = solidLayers;
      let topSolidLayersMM = solidLayersMM;
      if (style.topSkinThickness.units === 'mm') {
        topSolidLayersMM = style.topSkinThickness.value;
        topSolidLayers = Math.round(topSolidLayersMM / style.layerHeight);
      } else if (style.topSkinThickness.units === 'layers') {
        topSolidLayers = style.topSkinThickness.value;
        topSolidLayersMM = roundTo(topSolidLayers * style.layerHeight, 4);
      }
      profile.topSolidLayers = topSolidLayers;
      profile.topSolidMinThickness = topSolidLayersMM;
    } else {
      profile.topSolidLayers = solidLayers;
      profile.topSolidMinThickness = solidLayersMM;
    }
  }
  if (style.solidLayerStyle !== undefined) {
    profile.bottomFillPattern = convertSolidFillStyle(style.solidLayerStyle);
  } else if (style.monotonicSweep) {
    profile.bottomFillPattern = SolidFillPattern.MONOTONIC;
  } else {
    profile.bottomFillPattern = SolidFillPattern.RECTILINEAR;
  }
  if (style.topSolidLayerStyle !== undefined && style.topSolidLayerStyle >= 0) {
    profile.topFillPattern = convertSolidFillStyle(style.topSolidLayerStyle);
  } else {
    profile.topFillPattern = profile.bottomFillPattern;
  }
  profile.gapFillEnabled = style.useGapFill;

  // ironing
  if (style.useIroning) {
    profile.ironing = true;
    if (style.ironingFlowrate.units === '%') {
      profile.ironingFlowrate = style.ironingFlowrate.value;
    } else {
      // 'auto'
      profile.ironingFlowrate = 15;
    }
    if (style.ironingSpacing.units === 'mm') {
      profile.ironingSpacing = style.ironingSpacing.value;
    } else {
      // 'auto'
      profile.ironingSpacing = 0.1;
    }
    profile.ironingSpeed = variantValue(style.ironingSpeed, style.solidLayerSpeed, 15);
  }

  // perimeters and seams
  profile.perimeters = style.perimeterCount;
  profile.externalPerimetersFirst = style.perimeterOrder === 0;
  if (style.seamOnCorners) {
    profile.seamPosition = SeamPosition.NEAREST;
  } else if (style.seamAngle >= 45 && style.seamAngle <= 135) {
    profile.seamPosition = SeamPosition.REAR;
  }
  if (style.avoidCrossingPerimeters) {
    profile.avoidCrossingPerimeters = true;
    profile.avoidCrossingPerimetersMaxDetour =
      style.avoidCrossingPerimetersMaxDetour.units === '%'
        ? `${style.avoidCrossingPerimetersMaxDetour.value}%`
        : style.avoidCrossingPerimetersMaxDetour.value;
  }
  if (style.firstLayerSizeCompensation) {
    profile.elephantFootCompensation = style.firstLayerSizeCompensation;
  }

  if (style.extraPerimetersIfNeeded !== undefined) {
    profile.extraPerimeters = style.extraPerimetersIfNeeded;
  }
  if (style.extraPerimetersOnOverhangs !== undefined) {
    profile.extraPerimetersOnOverhangs = style.extraPerimetersOnOverhangs;
  }
  profile.arcFitting = style.useArcMoves ? ArcFitting.EMIT_CENTER : ArcFitting.DISABLED;
  if (style.detectBridgingPerimeters !== undefined) {
    profile.overhangs = style.detectBridgingPerimeters;
  }
  if (style.singlePerimeterOnTopLayers !== undefined) {
    profile.topOnePerimeterType = style.singlePerimeterOnTopLayers
      ? TopOnePerimeterType.TOP
      : TopOnePerimeterType.NONE;
  }

  if (style.infillAnchorLength) {
    if (style.infillAnchorLength.units === 'mm') {
      profile.infillAnchor = style.infillAnchorLength.value;
    } else {
      profile.infillAnchor = `${style.infillAnchorLength.value}%`;
    }
  }
  if (style.maxInfillAnchorLength) {
    if (style.maxInfillAnchorLength.units === 'mm') {
      profile.infillAnchorMax = style.maxInfillAnchorLength.value;
    } else {
      profile.infillAnchorMax = `${style.maxInfillAnchorLength.value}%`;
    }
  }
  if (style.solidLayerThresholdArea !== undefined) {
    profile.solidInfillBelowArea = style.solidLayerThresholdArea;
  }

  // skirt/brim
  if (style.useBrim) {
    if (style.brimLayers > 1) {
      profile.skirts = style.brimLoops;
      profile.skirtDistance = style.brimGap;
      profile.skirtHeight = style.brimLayers;
    } else {
      profile.brimType = BrimType.OUTER_ONLY;
      profile.brimWidth = roundTo(style.brimLoops * profile.firstLayerExtrusionWidth, 4);
      profile.brimSeparation = style.brimGap;
    }
  }

  // infill
  profile.fillDensity = style.infillDensity;
  profile.spiralVase = style.spiralVaseMode;
  profile.infillOverlap = style.infillPerimeterOverlap;
  profile.wipeIntoInfill = style.purgeToInfill;
  profile.fillPattern = slic3rInfillStylesToFillPattern[style.slic3rInfillStyle] ?? InfillPattern.RECTILINEAR;

  // speeds
  profile.solidInfillSpeed = style.solidLayerSpeed;

  if (style.topSolidLayerSpeed) {
    if (style.topSolidLayerSpeed.units === 'mm/s') {
      profile.topSolidInfillSpeed = style.topSolidLayerSpeed.value;
    } else {
      profile.topSolidInfillSpeed = `${style.topSolidLayerSpeed.value}%`;
    }
  } else {
    profile.topSolidInfillSpeed = profile.solidInfillSpeed;
  }

  if (style.perimeterSpeed) {
    profile.perimeterSpeed = variantValue(style.perimeterSpeed, style.solidLayerSpeed, style.solidLayerSpeed);
  } else {
    profile.perimeterSpeed = style.solidLayerSpeed;
  }
  if (style.externalPerimeterSpeed) {
    profile.externalPerimeterSpeed = variantValue(
      style.externalPerimeterSpeed,
      style.solidLayerSpeed,
      style.solidLayerSpeed
    );
  } else {
    profile.externalPerimeterSpeed = style.solidLayerSpeed;
  }

  if (style.smallPerimeterSpeed) {
    if (style.smallPerimeterSpeed.units === 'mm/s') {
      profile.smallPerimeterSpeed = style.smallPerimeterSpeed.value;
    } else {
      profile.smallPerimeterSpeed = `${style.smallPerimeterSpeed.value}%`;
    }
  } else {
    profile.smallPerimeterSpeed = Math.min(profile.perimeterSpeed, profile.externalPerimeterSpeed);
  }

  if (style.gapFillSpeed !== undefined) {
    profile.gapFillSpeed = style.gapFillSpeed;
  }

  profile.travelSpeed = style.rapidXYSpeed;
  profile.travelSpeedZ = style.rapidZSpeed;
  profile.machineMaxFeedrateX = [style.rapidXYSpeed, style.rapidXYSpeed];
  profile.machineMaxFeedrateY = [style.rapidXYSpeed, style.rapidXYSpeed];
  profile.machineMaxFeedrateZ = [style.rapidZSpeed, style.rapidZSpeed];
  profile.infillSpeed = variantValue(style.infillSpeed, style.solidLayerSpeed);
  profile.firstLayerSpeed = variantValue(style.firstLayerSpeed, style.solidLayerSpeed);
  profile.firstLayerSpeedOverRaft = profile.firstLayerSpeed;
  if (style.maxBridgingSpeed && style.maxBridgingSpeed.value !== 'auto') {
    profile.bridgeSpeed = variantValue(style.maxBridgingSpeed, style.solidLayerSpeed);
  } else {
    // excludes infill, first layer, and travel speeds
    const fastestSpeed = Math.max(
      profile.solidInfillSpeed,
      extractNumberValue(profile.topSolidInfillSpeed),
      profile.perimeterSpeed,
      profile.externalPerimeterSpeed
    );
    profile.bridgeSpeed = Math.round(fastestSpeed / 2);
  }
  if (style.supportSpeed && style.supportSpeed.value !== 'auto') {
    profile.supportMaterialSpeed = variantValue(style.supportSpeed, style.solidLayerSpeed);
  } else {
    profile.supportMaterialSpeed = style.solidLayerSpeed;
  }
  if (style.supportInterfaceSpeed && style.supportInterfaceSpeed.value !== 'auto') {
    profile.supportMaterialInterfaceSpeed = variantValue(style.supportInterfaceSpeed, style.solidLayerSpeed);
  } else {
    profile.supportMaterialInterfaceSpeed = style.solidLayerSpeed;
  }

  // acceleration settings
  if (style.useAccelerationControl === false) {
    // if acceleration control is disabled, set all to 0
    profile.defaultAcceleration = 0;
    profile.solidInfillAcceleration = 0;
    profile.topSolidInfillAcceleration = 0;
    profile.infillAcceleration = 0;
    profile.perimeterAcceleration = 0;
    profile.externalPerimeterAcceleration = 0;
    profile.firstLayerAcceleration = 0;
    profile.bridgeAcceleration = 0;
    profile.travelAcceleration = 0;
  } else {
    if (style.defaultAcceleration !== undefined) {
      profile.defaultAcceleration = style.defaultAcceleration;
    }
    if (style.solidLayerAcceleration !== undefined) {
      profile.solidInfillAcceleration = style.solidLayerAcceleration;
    }
    if (style.topSolidLayerAcceleration !== undefined) {
      profile.topSolidInfillAcceleration = style.topSolidLayerAcceleration;
    }
    if (style.infillAcceleration !== undefined) {
      profile.infillAcceleration = style.infillAcceleration;
    }
    if (style.perimeterAcceleration !== undefined) {
      profile.perimeterAcceleration = style.perimeterAcceleration;
    }
    if (style.externalPerimeterAcceleration !== undefined) {
      profile.externalPerimeterAcceleration = style.externalPerimeterAcceleration;
    }
    if (style.firstLayerAcceleration !== undefined) {
      profile.firstLayerAcceleration = style.firstLayerAcceleration;
    }
    if (style.bridgingAcceleration !== undefined) {
      profile.bridgeAcceleration = style.bridgingAcceleration;
    }
    if (style.travelAcceleration !== undefined) {
      profile.travelAcceleration = style.travelAcceleration;
    }
  }

  // supports
  profile.supportMaterial = style.useSupport;
  profile.supportMaterialAuto = !style.useCustomSupports;
  profile.supportMaterialSpacing = convertSupportDensity(style.supportDensity, profile.extrusionWidth);
  if (style.supportStyle !== undefined) {
    profile.supportMaterialStyle = convertSupportStyle(style.supportStyle);
  }
  if (style.useCustomSupports) {
    profile.supportMaterialThreshold = 90;
  } else {
    profile.supportMaterialThreshold = Math.max(0, Math.min(90, 90 - style.maxOverhangAngle));
  }
  // some notes about subtracting 1e-5 from supportMaterialContactDistance:
  // - PS has an issue that appears to be caused by rounding errors/imprecision if
  //   supportMaterialContactDistance is equal to (or is a multiple/factor of) layer height
  // - sometimes, FlowErrorNegativeFlow is thrown (Flow::mm3_per_mm() produced negative flow.
  //   Did you set some extrusion width too small?)
  // - ensuring neither value is a multiple of the other appears to avoid the issue
  // - 1e-5 is more decimal places than are allowed in Canvas, and small enough to not
  //   significantly affect flow calculations, but large enough to avoid this issue
  if (style.supportZGap.units === 'layers') {
    profile.supportMaterialContactDistance = style.supportZGap.value * style.layerHeight - 1e-5;
  } else {
    // units === 'mm'
    profile.supportMaterialContactDistance = style.supportZGap.value - 1e-5;
  }
  profile.supportMaterialXYSpacing = style.supportXYGap;
  if (style.defaultSupportExtruder.value === 'auto') {
    profile.supportMaterialExtruder = 0;
  } else {
    profile.supportMaterialExtruder = style.defaultSupportExtruder.value + 1;
  }
  if (style.useSupportInterface) {
    profile.supportMaterialInterfaceExtruder = style.defaultSupportInterfaceExtruder + 1;
    profile.supportMaterialInterfaceLayers = style.supportInterfaceThickness.value;
    if (style.supportInterfaceThickness.units === 'mm') {
      profile.supportMaterialInterfaceLayers *= style.layerHeight;
    }
    if (style.supportInterfaceDensity.value === 'auto') {
      profile.supportMaterialInterfaceSpacing = 0; // 100% solid
    } else {
      // percentage
      profile.supportMaterialInterfaceSpacing = densityToSpacing(
        style.supportInterfaceDensity.value,
        profile.extrusionWidth
      );
    }
  } else {
    profile.supportMaterialInterfaceExtruder = profile.supportMaterialExtruder;
    profile.supportMaterialInterfaceLayers = 0;
  }

  // rafts
  if (style.useRaft) {
    profile.raftLayers = 2;
    profile.raftContactDistance = style.raftZGap;
    profile.raftExpansion = style.raftXYInflation === undefined ? 1.5 : style.raftXYInflation;
    profile.raftFirstLayerExpansion = profile.raftExpansion * 2;
    if (style.lowerRaftDensity.value === 'auto') {
      profile.raftFirstLayerDensity = 60;
    } else {
      profile.raftFirstLayerDensity = style.lowerRaftDensity.value;
    }
  }

  // temperatures
  // bed temperature logic:
  let usedHintMaxBedTemp = 0;
  for (let i = 0; i < extruderCount; i++) {
    if (drivesUsed[i]) {
      const bedTemperatureMaterial = getMaterialFieldValue(
        materials[i]!,
        'bedTemperature',
        style.bedTemperature
      );
      usedHintMaxBedTemp = Math.max(usedHintMaxBedTemp, bedTemperatureMaterial);
    }
  }

  for (let i = 0; i < extruderCount; i++) {
    // if element/ palette is used, use the material's bed temperature
    if (palette) {
      const bedTemperatureMaterial = getMaterialFieldValue(
        materials[i]!,
        'bedTemperature',
        style.bedTemperature
      );
      profile.bedTemperature[i] = bedTemperatureMaterial;
      profile.firstLayerBedTemperature[i] = bedTemperatureMaterial;
    } else {
      // if no palette/element is used, use the highest bed temperature
      profile.bedTemperature[i] = usedHintMaxBedTemp;
      profile.firstLayerBedTemperature[i] = usedHintMaxBedTemp;
    }
  }

  // chamber temperature logic:
  // - ignore inputs we know we won't be using
  // - only look at project's chamber temp setting if no inputs have a material override
  // - use the lowest chamber temperature seen (including 0)
  let useChamberTemperatureFromStyle = true;
  for (let i = 0; i < extruderCount; i++) {
    if (drivesUsed[i]) {
      const material = materials[i]!;
      if (material.style.useChamberTemperature) {
        useChamberTemperatureFromStyle = false;
        break;
      }
    }
  }
  let chamberTemperature = Infinity;
  if (useChamberTemperatureFromStyle) {
    chamberTemperature = style.chamberTemperature ?? 0;
  } else {
    for (let i = 0; i < extruderCount; i++) {
      if (drivesUsed[i]) {
        const material = materials[i]!;
        if (material.style.useChamberTemperature && material.style.chamberTemperature !== undefined) {
          chamberTemperature = Math.min(chamberTemperature, material.style.chamberTemperature);
        }
      }
    }
  }
  profile.chamberTemperature.fill(chamberTemperature);

  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i]!;
    const printTemperatureMaterial = getMaterialFieldValue(
      material,
      'printTemperature',
      style.printTemperature
    );
    profile.temperature[i] = printTemperatureMaterial;

    let firstLayerPrintTemperatureMaterial;
    if (material.style.useFirstLayerPrintTemperature) {
      // material profile overrides first layer temperature
      if (material.style.firstLayerPrintTemperature.value === 'auto') {
        // 'auto' -- use the main temperature for this material
        firstLayerPrintTemperatureMaterial = printTemperatureMaterial;
      } else {
        // not 'auto' -- a value in °C is supplied
        firstLayerPrintTemperatureMaterial = material.style.firstLayerPrintTemperature.value;
      }
    } else if (material.style.usePrintTemperature) {
      // no override for first layer temperature, but yes override for main temperature
      firstLayerPrintTemperatureMaterial = printTemperatureMaterial;
    } else {
      // no overrides at all -- use global first layer temperature
      firstLayerPrintTemperatureMaterial =
        style.firstLayerPrintTemperature.value === 'auto'
          ? printTemperatureMaterial
          : style.firstLayerPrintTemperature.value;
    }
    profile.firstLayerTemperature[i] = firstLayerPrintTemperatureMaterial;
  }

  // extrusion multiplier
  for (let i = 0; i < extruderCount; i++) {
    const extrusionMultiplierInt = getMaterialFieldValue(
      materials[i]!,
      'extrusionMultiplier',
      style.extrusionMultiplier
    );
    profile.extrusionMultiplier[i] = extrusionMultiplierInt / 100;
  }

  // cooling fan
  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i]!;
    profile.slowdownBelowLayerTime[i] = getMaterialFieldValue(material, 'minLayerTime', style.minLayerTime);
    const useFan = getMaterialFieldValue(material, 'useFan', style.useFan);
    if (useFan) {
      profile.fanAlwaysOn[i] = true;
      const fanSpeedMaterial = getMaterialFieldValue(material, 'fanSpeed', style.fanSpeed);
      profile.minFanSpeed[i] = fanSpeedMaterial;

      const maxFanSpeedMaterial = getMaterialFieldValue(material, 'maxFanSpeed', style.maxFanSpeed);
      if (maxFanSpeedMaterial && maxFanSpeedMaterial.value !== 'auto') {
        profile.maxFanSpeed[i] = maxFanSpeedMaterial.value;
      } else {
        profile.maxFanSpeed[i] = fanSpeedMaterial;
      }

      const useDynamicFanSpeedsMaterial = getMaterialFieldValue(
        material,
        'useDynamicFanSpeeds',
        style.useDynamicFanSpeeds
      );
      profile.enableDynamicFanSpeeds[i] = useDynamicFanSpeedsMaterial;

      // set fan speeds for overhangs if dynamic fan speeds are enabled
      if (profile.enableDynamicFanSpeeds[i]) {
        profile.overhangFanSpeed0[i] = getMaterialFieldValue(
          material,
          'overhangFanSpeed0',
          style.overhangFanSpeed0
        );
        profile.overhangFanSpeed1[i] = getMaterialFieldValue(
          material,
          'overhangFanSpeed1',
          style.overhangFanSpeed1
        );
        profile.overhangFanSpeed2[i] = getMaterialFieldValue(
          material,
          'overhangFanSpeed2',
          style.overhangFanSpeed2
        );
        profile.overhangFanSpeed3[i] = getMaterialFieldValue(
          material,
          'overhangFanSpeed3',
          style.overhangFanSpeed3
        );
      } else {
        profile.overhangFanSpeed0[i] = 0;
        profile.overhangFanSpeed1[i] = 0;
        profile.overhangFanSpeed2[i] = 0;
        profile.overhangFanSpeed3[i] = 0;
      }

      profile.fanBelowLayerTime[i] = getMaterialFieldValue(
        material,
        'fanBelowLayerTime',
        style.fanBelowLayerTime
      );

      const bridgeFanSpeedMaterial = getMaterialFieldValue(
        material,
        'bridgingFanSpeed',
        style.bridgingFanSpeed ?? { value: 'auto' }
      );
      if (!bridgeFanSpeedMaterial || bridgeFanSpeedMaterial.value === 'auto') {
        profile.bridgeFanSpeed[i] = fanSpeedMaterial;
      } else {
        profile.bridgeFanSpeed[i] = bridgeFanSpeedMaterial.value;
      }
      const fanLayerMaterial = getMaterialFieldValue(material, 'enableFanAtLayer', style.enableFanAtLayer);
      if (fanLayerMaterial <= 0) {
        profile.disableFanFirstLayers[i] = 0;
        profile.fullFanSpeedLayer[i] = 0;
      } else {
        profile.disableFanFirstLayers[i] = fanLayerMaterial;
        profile.fullFanSpeedLayer[i] = fanLayerMaterial + 1;
      }
    } else {
      profile.fanAlwaysOn[i] = false;
      profile.cooling[i] = false;
      profile.minFanSpeed[i] = 0;
      profile.maxFanSpeed[i] = 0;
      profile.bridgeFanSpeed[i] = 0;
      profile.enableDynamicFanSpeeds[i] = false;
      profile.overhangFanSpeed0[i] = 0;
      profile.overhangFanSpeed1[i] = 0;
      profile.overhangFanSpeed2[i] = 0;
      profile.overhangFanSpeed3[i] = 0;
    }
  }

  // cooling module
  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i]!;
    const useCoolingModule = getMaterialFieldValue(material, 'useCoolingModule', style.useCoolingModule);
    if (useCoolingModule) {
      const coolingModuleSpeedMaterial = getMaterialFieldValue(
        material,
        'coolingModuleSpeed',
        style.coolingModuleSpeed
      );
      const enableCoolingModuleAtLayerMaterial = getMaterialFieldValue(
        material,
        'enableCoolingModuleAtLayer',
        style.enableCoolingModuleAtLayer
      );
      if (coolingModuleSpeedMaterial <= 0) {
        profile.coolingModuleSpeed[i] = 0;
        // initialize the value to twice the bed height to guarantee that it will not be activated
        profile.enableCoolingModuleAtLayer[i] = machine.bedSize[2] * 2;
      } else {
        profile.coolingModuleSpeed[i] = coolingModuleSpeedMaterial;
        profile.enableCoolingModuleAtLayer[i] = enableCoolingModuleAtLayerMaterial;
      }
    } else {
      profile.coolingModuleSpeed[i] = 0;
      profile.enableCoolingModuleAtLayer[i] = machine.bedSize[2] * 2;
    }
  }

  // retraction
  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i]!;
    if (style.useRetracts || style.useRetracts === undefined) {
      const retractLength = getMaterialFieldValue(material, 'retractLength', style.retractLength);
      profile.retractLength[i] = retractLength;
      profile.retractLengthToolchange[i] = retractLength;
    } else {
      profile.retractLength[i] = 0;
      profile.retractLengthToolchange[i] = 0;
    }
    profile.retractSpeed[i] = getMaterialFieldValue(material, 'retractSpeed', style.retractSpeed);
    if (!profile.useFirmwareRetraction) {
      profile.wipe[i] = getMaterialFieldValue(material, 'wipeLength', style.wipeLength) > 0;
    }
    profile.retractBeforeTravel[i] = style.retractDisableThreshold;
    profile.retractLift[i] = style.zLift;
    profile.retractLiftAbove[i] = 0;
    profile.retractLiftBelow[i] = Math.floor(machine.bedSize[2] - 2 * style.zLift);
  }

  // max flowrate
  for (let i = 0; i < extruderCount; i++) {
    const maxMaterialFlowrate = getMaterialFieldValue(materials[i]!, 'maxPrintSpeed', {
      units: 'mm/s',
      value: 0,
    });
    if (maxMaterialFlowrate.value > 0) {
      if (maxMaterialFlowrate.units === 'mm3/s') {
        profile.filamentMaxVolumetricSpeed[i] = maxMaterialFlowrate.value;
      } else {
        // mm/s
        profile.filamentMaxVolumetricSpeed[i] = getVolumetricFlowRate(
          maxMaterialFlowrate.value,
          style.layerHeight,
          style.extrusionWidth
        );
      }
    }

    // apply minPrintSpeed from material profile or use a default value
    const material = materials[i]!;
    profile.minPrintSpeed[i] = getMaterialFieldValue(material, 'minPrintSpeed', 15);
  }

  // material names and colors
  for (let i = 0; i < extruderCount; i++) {
    const projectColor = colors[i]!;
    const material = materials[i]!;
    // set the HEX color to 'any' (an invalid HEX value) when the input allows using any color
    const hexColor = projectColor === ANY_COLOR ? ANY_COLOR : `#${rgbToHex(projectColor)}`;
    profile.filamentColor[i] = hexColor;
    profile.extruderColor[i] = hexColor;
    profile.filamentSettingsId[i] = material.name.replace(/"/g, '\\"');
  }

  // transition settings
  if (extruderCount > 1) {
    if (transitionTower) {
      profile.supportMaterialSynchronizeLayers = true;
      // sadly need to override support Z-gap for two reasons:
      // - https://github.com/prusa3d/PrusaSlicer/issues/553
      // - https://github.com/prusa3d/PrusaSlicer/issues/599
      profile.supportMaterialContactDistance = 0;
      for (let i = 0; i < extruderCount; i++) {
        const material = materials[i]!;
        // need to override "minimum travel before retraction" with towers because
        // it takes precedence over "retract on layer change" and it's important
        // for postprocessing that travel sequences are consistent
        profile.retractBeforeTravel[i] = 0;
        let towerSpeed;
        if (material.style.useTowerSpeed) {
          towerSpeed = material.style.towerSpeed;
        } else if (style.towerSpeed && style.towerSpeed.value !== 'auto') {
          towerSpeed = style.towerSpeed.value;
        } else {
          towerSpeed = profile.infillSpeed;
        }
        profile.towerSpeed[i] = towerSpeed;
        profile.firstLayerTowerSpeed[i] = Math.min(towerSpeed, profile.firstLayerSpeed);
      }
      if (style.towerExtrusionWidth && style.towerExtrusionWidth.units === 'mm') {
        profile.towerExtrusionWidth = style.towerExtrusionWidth.value;
      } else {
        profile.towerExtrusionWidth = Math.max(profile.extrusionWidth, profile.infillExtrusionWidth);
      }
    } else {
      // side transitions
    }
  }

  // variable transition lengths
  if (variableTransitionLengths) {
    profile.wipingVolumesUseCustomMatrix = true;
    if (variableTransitionLengths.advancedMode) {
      for (let i = 0; i < extruderCount; i++) {
        for (let j = 0; j < extruderCount; j++) {
          if (i !== j) {
            profile.wipingVolumesMatrix[i]![j] = filamentLengthToVolume(
              variableTransitionLengths.transitionLengths[i]![j]!
            );
          }
        }
      }
    } else {
      const { driveColorStrengths, minTransitionLength, maxTransitionLength } = variableTransitionLengths;
      for (let ingoing = 0; ingoing < extruderCount; ingoing++) {
        for (let outgoing = 0; outgoing < extruderCount; outgoing++) {
          if (ingoing !== outgoing) {
            const ingoingStrength = driveColorStrengths[ingoing]!;
            const outgoingStrength = driveColorStrengths[outgoing]!;
            profile.wipingVolumesMatrix[ingoing]![outgoing] = filamentLengthToVolume(
              getTransitionLength(ingoingStrength, outgoingStrength, minTransitionLength, maxTransitionLength)
            );
          }
        }
      }
    }
  } else {
    profile.wipingVolumesUseCustomMatrix = false;
    // set wiping volumes based on transition length
    const transitionVolume = filamentLengthToVolume(style.transitionLength);
    // Volume to purge
    profile.multiMaterialPurging = transitionVolume;
    for (let i = 0; i < extruderCount; i++) {
      for (let j = 0; j < extruderCount; j++) {
        if (i !== j) {
          profile.wipingVolumesMatrix[i]![j] = transitionVolume;
        }
      }
    }
  }

  // firmware-specific automatic overrides
  // (must happen after everything but G-code sequences)
  switch (machine.extension) {
    case 'mcfx':
    case 'daf':
      profile.filamentDiameter = new Array(extruderCount).fill(1.75);
      profile.preSideTransitionPrinterscript = '';
      profile.sideTransitionPrinterscript = '';
      profile.postSideTransitionPrinterscript = '';
      profile.gcodeFlavor = GCodeFlavor.MARLIN_2;
      profile.useRelativeEDistances = false;
      profile.useFirmwareRetraction = false;
      break;
    case 'makerbot':
      profile.useRelativeEDistances = true;
      profile.useFirmwareRetraction = false;
      break;
    case 'x3g':
      profile.gcodeFlavor = GCodeFlavor.MAKERWARE;
      profile.useFirmwareRetraction = false;
      break;
    default:
      break;
  }

  // G-code sequences

  // command to wait for printer buffer to clear
  if (machine.clearBufferCommand === 1) {
    profile.clearBufferCommand = 'M400';
  }

  // start sequence
  profile.startGcode = [
    ';*/*/*/*/* START SEQUENCE */*/*/*/*',
    `M191 S${chamberTemperature}`,
    'M190 S[first_layer_bed_temperature]',
    'M104 S[first_layer_temperature]',
    ';*/*/*/*/* ENDSTART SEQUENCE */*/*/*/*',
  ].join('\\n');
  if (machine.startSequence.startsWith('@printerscript')) {
    profile.startGcodePrinterscript = machine.startSequence;
  } else {
    profile.startGcodePrinterscript = convertToPrinterScript(machine.startSequence, true);
  }

  // apply start sequence defaults
  profile.startGcodePrinterscript = applyStartSequenceDefaults(
    profile.startGcodePrinterscript,
    palette ? palette.extruder : 0,
    usedHintMaxBedTemp,
    chamberTemperature
  );

  // end sequence
  profile.endGcode = ';*/*/*/*/* END SEQUENCE */*/*/*/*';
  if (machine.endSequence.startsWith('@printerscript')) {
    profile.endGcodePrinterscript = machine.endSequence;
  } else {
    profile.endGcodePrinterscript = convertToPrinterScript(machine.endSequence);
  }

  // layer change sequence
  if (machine.layerChangeSequence) {
    profile.layerGcode = ';*/*/*/*/* LAYER CHANGE SEQUENCE ([layer_num], [layer_z]) */*/*/*/*';
    if (machine.layerChangeSequence.startsWith('@printerscript')) {
      profile.layerGcodePrinterscript = machine.layerChangeSequence;
    } else {
      profile.layerGcodePrinterscript = convertToPrinterScript(machine.layerChangeSequence);
    }
  }

  // material change sequence
  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i]!;
    if (material.materialChangeSequence) {
      profile.startFilamentGcode[i] = `;*/*/*/*/* MATERIAL CHANGE SEQUENCE (${i}) */*/*/*/*`;
      if (material.materialChangeSequence.startsWith('@printerscript')) {
        profile.startFilamentGcodePrinterscript[i] = material.materialChangeSequence;
      } else {
        profile.startFilamentGcodePrinterscript[i] = convertToPrinterScript(material.materialChangeSequence);
      }
    }
  }

  // DAF printers are always considered as using side transitions
  if (style.transitionMethod === TransitionMethod.Side || machine.extension === 'daf') {
    if (machine.preSideTransitionSequence) {
      if (machine.preSideTransitionSequence.startsWith('@printerscript')) {
        profile.preSideTransitionPrinterscript = machine.preSideTransitionSequence;
      } else {
        profile.preSideTransitionPrinterscript = convertToPrinterScript(machine.preSideTransitionSequence);
      }
    }
    if (machine.sideTransitionSequence) {
      profile.sideTransitionPrinterscript = machine.sideTransitionSequence;
    }
    if (machine.postSideTransitionSequence) {
      if (machine.postSideTransitionSequence.startsWith('@printerscript')) {
        profile.postSideTransitionPrinterscript = machine.postSideTransitionSequence;
      } else {
        profile.postSideTransitionPrinterscript = convertToPrinterScript(machine.postSideTransitionSequence);
      }
    }
  }

  // machine limits (if provided)
  if (machineLimits) {
    applyMachineLimits(profile, machineLimits);
  }

  return profile;
};

export default index;
