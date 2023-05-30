import { BrimType, GCodeFlavor, InfillPattern, SeamPosition, SolidFillPattern } from './enums';
import Profile from './profile';
import { applyStartSequenceDefaults, convertToPrinterScript } from './sequences';
import type { MachineLimits } from './types/machine-limits';
import type { Material } from './types/materials';
import type { PaletteData } from './types/palette';
import type { MachineSettings } from './types/printers';
import { Firmware } from './types/printers';
import type { StyleSettings } from './types/styles';
import type { DriveColorStrength, TransitionTower, VariableTransitions } from './types/transitions';
import {
  getMaterialFieldValue,
  getTransitionLength,
  getVolumetricFlowRate,
  RGBA,
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

const convertInfillStyle = (infillStyle: number): InfillPattern => {
  switch (infillStyle) {
    case 0: // straight
      return InfillPattern.RECTILINEAR;
    case 1: // octagonal
      return InfillPattern.HONEYCOMB_3D;
    case 2: // rounded
    case 3: // cellular
      return InfillPattern.GYROID;
    default:
      return InfillPattern.RECTILINEAR;
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

const densityToSpacing = (density: number, extrusionWidth: number): number =>
  roundTo((100 / density - 1) * extrusionWidth, 2);

// volume of a cylinder = pi * r^2 * h
const filamentLengthToVolume = (length: number, diameter = 1.75): number =>
  roundTo((diameter / 2) ** 2 * Math.PI * length, 2);

interface Inputs {
  usableInputCount: number | null;
  machine: MachineSettings;
  style: StyleSettings;
  materials: Material[];
  colors: RGBA[];
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
  const maxExtruderCount = palette ? palette.getInputCount() : 1;
  const extruderCount =
    usableInputCount !== null ? Math.min(maxExtruderCount, usableInputCount) : maxExtruderCount;

  validateArrayLengths(extruderCount, materials, colors, drivesUsed, variableTransitionLengths);

  const profile = new Profile(extruderCount);

  // nozzle diameter(s)
  // filament diameters
  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i] as Material;
    const machineExtruderIndex = i >= machine.nozzleDiameter.length ? 0 : i;
    profile.nozzleDiameter[i] = machine.nozzleDiameter[machineExtruderIndex] as number;
    if (material.id === '0' && machine.filamentDiameter) {
      profile.filamentDiameter[i] = machine.filamentDiameter[machineExtruderIndex] as number;
    } else {
      profile.filamentDiameter[i] = material.diameter;
    }
  }

  // bed shape and Z-offset
  profile.bedCircular = machine.circular;
  profile.bedSize = [...machine.bedSize];
  profile.originOffset = [...machine.originOffset, 0];
  profile.zOffset = style.zOffset;

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
    profile.useRelativeEDistances = true;
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
  profile.firstLayerExtrusionWidth = style.extrusionWidth;
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
    profile.bottomFillPattern = convertSolidFillStyle(style.solidLayerStyle as number);
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
  profile.fillPattern = convertInfillStyle(style.infillStyle);

  // speeds
  profile.solidInfillSpeed = style.solidLayerSpeed;
  profile.topSolidInfillSpeed = profile.solidInfillSpeed;
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
  profile.smallPerimeterSpeed = Math.min(profile.perimeterSpeed, profile.externalPerimeterSpeed);
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
      profile.topSolidInfillSpeed,
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

  // supports
  profile.supportMaterial = style.useSupport;
  profile.supportMaterialAuto = !style.useCustomSupports;
  profile.supportMaterialSpacing = convertSupportDensity(style.supportDensity, profile.extrusionWidth);
  if (style.useCustomSupports) {
    profile.supportMaterialThreshold = 90;
  } else {
    profile.supportMaterialThreshold = Math.max(0, Math.min(90, 90 - style.maxOverhangAngle));
  }
  if (style.supportZGap.units === 'layers') {
    profile.supportMaterialContactDistance = style.supportZGap.value * style.layerHeight;
  } else {
    // units === 'mm'
    profile.supportMaterialContactDistance = style.supportZGap.value;
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
  let bedTemperature = 0;
  for (let i = 0; i < extruderCount; i++) {
    if (drivesUsed[i]) {
      const bedTemperatureMaterial = getMaterialFieldValue(
        materials[i] as Material,
        'bedTemperature',
        style.bedTemperature
      );
      bedTemperature = Math.max(bedTemperature, bedTemperatureMaterial);
    }
  }

  // chamber temperature logic:
  // - ignore inputs we know we won't be using
  // - only look at project's chamber temp setting if no inputs have a material override
  // - use the lowest chamber temperature seen (including 0)
  let useChamberTemperatureFromStyle = true;
  for (let i = 0; i < extruderCount; i++) {
    if (drivesUsed[i]) {
      const material = materials[i] as Material;
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
        const material = materials[i] as Material;
        if (material.style.useChamberTemperature && material.style.chamberTemperature !== undefined) {
          chamberTemperature = Math.min(chamberTemperature, material.style.chamberTemperature);
        }
      }
    }
  }
  profile.chamberTemperature = chamberTemperature;

  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i] as Material;
    profile.bedTemperature[i] = bedTemperature;
    profile.firstLayerBedTemperature[i] = bedTemperature;

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
      materials[i] as Material,
      'extrusionMultiplier',
      style.extrusionMultiplier
    );
    profile.extrusionMultiplier[i] = extrusionMultiplierInt / 100;
  }

  // cooling fan
  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i] as Material;
    profile.slowdownBelowLayerTime[i] = style.minLayerTime;
    const useFan = getMaterialFieldValue(material, 'useFan', style.useFan);
    if (useFan) {
      profile.fanAlwaysOn[i] = true;
      const fanSpeedMaterial = getMaterialFieldValue(material, 'fanSpeed', style.fanSpeed);
      profile.minFanSpeed[i] = fanSpeedMaterial;
      profile.maxFanSpeed[i] = fanSpeedMaterial;
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
    }
  }

  // retraction
  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i] as Material;
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
    const maxMaterialFlowrate = getMaterialFieldValue(materials[i] as Material, 'maxPrintSpeed', {
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
  }

  // material names and colors
  for (let i = 0; i < extruderCount; i++) {
    const material = materials[i] as Material;
    const hexColor = `#${rgbToHex(colors[i] as RGBA)}`;
    profile.filamentColor[i] = hexColor;
    profile.extruderColor[i] = hexColor;
    profile.filamentSettingsId[i] = material.name;
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
        const material = materials[i] as Material;
        // need to override "minimum travel before retraction" with towers because
        // it takes precedence over "retract on layer change" and it's important
        // for postprocessing that travel sequences are consistent
        profile.retractBeforeTravel[i] = 0;
        if (material.style.useTowerSpeed) {
          profile.towerSpeed[i] = material.style.towerSpeed;
        } else if (style.towerSpeed && style.towerSpeed.value !== 'auto') {
          profile.towerSpeed[i] = style.towerSpeed.value;
        } else {
          profile.towerSpeed[i] = profile.infillSpeed;
        }
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
    if (variableTransitionLengths.advancedMode) {
      for (let i = 0; i < extruderCount; i++) {
        for (let j = 0; j < extruderCount; j++) {
          if (i !== j) {
            (profile.wipingVolumesMatrix[i] as number[])[j] = filamentLengthToVolume(
              (variableTransitionLengths.transitionLengths[i] as number[])[j] as number
            );
          }
        }
      }
    } else {
      const { driveColorStrengths, minTransitionLength, maxTransitionLength } = variableTransitionLengths;
      for (let ingoing = 0; ingoing < driveColorStrengths.length; ingoing++) {
        for (let outgoing = 0; outgoing < driveColorStrengths.length; outgoing++) {
          if (ingoing !== outgoing) {
            const ingoingStrength = driveColorStrengths[ingoing] as DriveColorStrength;
            const outgoingStrength = driveColorStrengths[outgoing] as DriveColorStrength;
            (profile.wipingVolumesMatrix[ingoing] as number[])[outgoing] = filamentLengthToVolume(
              getTransitionLength(ingoingStrength, outgoingStrength, minTransitionLength, maxTransitionLength)
            );
          }
        }
      }
    }
  } else {
    // set wiping volumes based on transition length
    const transitionVolume = filamentLengthToVolume(style.transitionLength);
    const halfTransitionVolume = roundTo(transitionVolume / 2, 2);
    for (let i = 0; i < extruderCount; i++) {
      profile.wipingVolumesExtruders[i] = [halfTransitionVolume, halfTransitionVolume];
      for (let j = 0; j < extruderCount; j++) {
        if (i !== j) {
          (profile.wipingVolumesMatrix[i] as number[])[j] = transitionVolume;
        }
      }
    }
  }

  if (profile.supportMaterialContactDistance !== 0) {
    // some projects crash if this setting is false when contact distance !== 0
    profile.thickBridges = true;
  }

  // firmware-specific automatic overrides
  // (must happen after everything but G-code sequences)
  switch (machine.extension) {
    case 'mcfx':
      profile.useFirmwareRetraction = false;
      profile.gcodeComments = false;
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
    bedTemperature,
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
    const material = materials[i] as Material;
    if (material.materialChangeSequence) {
      profile.startFilamentGcode[i] = `;*/*/*/*/* MATERIAL CHANGE SEQUENCE (${i}) */*/*/*/*`;
      if (material.materialChangeSequence.startsWith('@printerscript')) {
        profile.startFilamentGcodePrinterscript[i] = material.materialChangeSequence;
      } else {
        profile.startFilamentGcodePrinterscript[i] = convertToPrinterScript(material.materialChangeSequence);
      }
    }
  }

  if (style.transitionMethod === 2) {
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
    if (machineLimits.maxFeedrate) {
      if (machineLimits.maxFeedrate.x !== undefined) {
        profile.machineMaxFeedrateX = [machineLimits.maxFeedrate.x, machineLimits.maxFeedrate.x];
      }
      if (machineLimits.maxFeedrate.y !== undefined) {
        profile.machineMaxFeedrateY = [machineLimits.maxFeedrate.y, machineLimits.maxFeedrate.y];
      }
      if (machineLimits.maxFeedrate.z !== undefined) {
        profile.machineMaxFeedrateZ = [machineLimits.maxFeedrate.z, machineLimits.maxFeedrate.z];
      }
      if (machineLimits.maxFeedrate.e !== undefined) {
        profile.machineMaxFeedrateE = [machineLimits.maxFeedrate.e, machineLimits.maxFeedrate.e];
      }
    }
    if (machineLimits.maxAcceleration) {
      if (machineLimits.maxAcceleration.x !== undefined) {
        profile.machineMaxAccelerationX = [machineLimits.maxAcceleration.x, machineLimits.maxAcceleration.x];
      }
      if (machineLimits.maxAcceleration.y !== undefined) {
        profile.machineMaxAccelerationY = [machineLimits.maxAcceleration.y, machineLimits.maxAcceleration.y];
      }
      if (machineLimits.maxAcceleration.z !== undefined) {
        profile.machineMaxAccelerationZ = [machineLimits.maxAcceleration.z, machineLimits.maxAcceleration.z];
      }
      if (machineLimits.maxAcceleration.e !== undefined) {
        profile.machineMaxAccelerationE = [machineLimits.maxAcceleration.e, machineLimits.maxAcceleration.e];
      }
      if (machineLimits.maxAcceleration.extruding !== undefined) {
        profile.machineMaxAccelerationExtruding = [
          machineLimits.maxAcceleration.extruding,
          machineLimits.maxAcceleration.extruding,
        ];
      }
      if (machineLimits.maxAcceleration.retracting !== undefined) {
        profile.machineMaxAccelerationRetracting = [
          machineLimits.maxAcceleration.retracting,
          machineLimits.maxAcceleration.retracting,
        ];
      }
    }
    if (machineLimits.maxJerk) {
      if (machineLimits.maxJerk.x !== undefined) {
        profile.machineMaxJerkX = [machineLimits.maxJerk.x, machineLimits.maxJerk.x];
      }
      if (machineLimits.maxJerk.y !== undefined) {
        profile.machineMaxJerkY = [machineLimits.maxJerk.y, machineLimits.maxJerk.y];
      }
      if (machineLimits.maxJerk.z !== undefined) {
        profile.machineMaxJerkZ = [machineLimits.maxJerk.z, machineLimits.maxJerk.z];
      }
      if (machineLimits.maxJerk.e !== undefined) {
        profile.machineMaxJerkE = [machineLimits.maxJerk.e, machineLimits.maxJerk.e];
      }
    }
  }

  return profile;
};

export default index;
