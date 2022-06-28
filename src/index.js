const Profile = require('./profile');

const {
  SeamPositions, SolidFillPatterns, InfillPatterns, GCodeFlavors,
  BrimTypes,
} = require('./enums');
const {
  roundTo, rgbToHex, getTransitionLength,
  getMaterialFieldValue, getVolumetricFlowRate,
  validateArrayLengths, variantValue,
} = require('./utils');
const sequences = require('./sequences');

const convertSolidFillStyle = (solidFillStyle) => {
  switch (solidFillStyle) {
    case 0: // rectilinear
      return SolidFillPatterns.RECTILINEAR;
    case 1: // monotonic
      return SolidFillPatterns.MONOTONIC;
    case 2: // concentric
      return SolidFillPatterns.CONCENTRIC;
    default:
      return SolidFillPatterns.RECTILINEAR;
  }
};

const convertInfillStyle = (infillStyle) => {
  switch (infillStyle) {
    case 0: // straight
      return InfillPatterns.RECTILINEAR;
    case 1: // octagonal
      return InfillPatterns.HONEYCOMB_3D;
    case 2: // rounded
    case 3: // cellular
      return InfillPatterns.GYROID;
    default:
      return InfillPatterns.RECTILINEAR;
  }
};

const convertSupportDensity = (density, extrusionWidth) => {
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

const densityToSpacing = (density, extrusionWidth) =>
  roundTo((100 / density) * extrusionWidth, 2);

// volume of a cylinder = pi * r^2 * h
const filamentLengthToVolume = (length, diameter = 1.75) =>
  roundTo(((diameter / 2) ** 2) * Math.PI * length, 2);

const index = (input) => {
  const {
    machine,
    style,
    materials,
    colors,
    palette,
    drivesUsed,
    transitionTower,
    variableTransitionLengths
  } = input;

  // TODO: support dual-extruders here in the future?
  const extruderCount = palette ? palette.getInputCount() : 1;

  validateArrayLengths(extruderCount, materials, colors, drivesUsed, variableTransitionLengths);

  const profile = new Profile(extruderCount);

  // nozzle diameter(s)
  // filament diameters
  for (let i = 0; i < extruderCount; i++) {
    const machineExtruderIndex = i >= machine.nozzleDiameter.length ? 0 : i;
    profile.nozzleDiameter[i] = machine.nozzleDiameter[machineExtruderIndex];
    if (materials[i].id === '0' && machine.filamentDiameter) {
      profile.filamentDiameter[i] = machine.filamentDiameter[machineExtruderIndex];
    } else {
      profile.filamentDiameter[i] = materials[i].diameter;
    }
  }

  // bed shape and Z-offset
  profile.bedCircular = machine.circular;
  profile.bedSize = [...machine.bedSize];
  profile.originOffset = [...machine.originOffset];
  profile.zOffset = style.zOffset;

  // comments
  // (force-enabled for use in postprocessing, may be stripped later)
  profile.gcodeComments = true;

  // firmware
  if (machine.firmwareType === 1) {
    // RepRap 5D Relative
    profile.useRelativeEDistances = true;
  } else if (machine.firmwareType === 2) {
    // RepRap 5D Absolute
    profile.useRelativeEDistances = false;
  } else if (machine.firmwareType === 10) {
    // FlashForge
    profile.useRelativeEDistances = true;
  } else if (machine.firmwareType === 11) {
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
    profile.maxLayerHeight = new Array(extruderCount)
      .fill(variantValue(style.maxLayerHeight, style.layerHeight));
  } else {
    profile.layerHeight = style.layerHeight;
    profile.minLayerHeight = new Array(extruderCount).fill(style.layerHeight);
    profile.maxLayerHeight = new Array(extruderCount).fill(style.layerHeight);
  }
  profile.firstLayerHeight = variantValue(style.firstLayerHeight, style.layerHeight);

  // extrusion widths
  profile.extrusionWidth = style.extrusionWidth;
  profile.solidInfillExtrusionWidth = style.extrusionWidth;
  if (style.perimeterExtrusionWidth) {
    profile.perimeterExtrusionWidth = variantValue(
      style.perimeterExtrusionWidth,
      style.extrusionWidth,
      style.extrusionWidth,
    );
  } else {
    profile.perimeterExtrusionWidth = style.extrusionWidth;
  }
  if (style.externalPerimeterExtrusionWidth) {
    profile.externalPerimeterExtrusionWidth = variantValue(
      style.externalPerimeterExtrusionWidth,
      style.extrusionWidth,
      style.extrusionWidth,
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
      solidLayersMM = solidLayers * style.layerHeight;
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
        topSolidLayersMM = topSolidLayers * style.layerHeight;
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
    profile.bottomFillPattern = SolidFillPatterns.MONOTONIC;
  } else {
    profile.bottomFillPattern = SolidFillPatterns.RECTILINEAR;
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
    profile.seamPosition = SeamPositions.NEAREST;
  } else if (style.seamJitter) {
    profile.seamPosition = SeamPositions.RANDOM;
  } else if (style.seamAngle >= 45 && style.seamAngle <= 135) {
    profile.seamPosition = SeamPositions.REAR;
  }
  if (style.avoidCrossingPerimeters) {
    profile.avoidCrossingPerimeters = true;
    profile.avoidCrossingPerimetersMaxDetour = style.avoidCrossingPerimetersMaxDetour.units === '%'
      ? `${style.avoidCrossingPerimetersMaxDetour.value}%`
      : style.avoidCrossingPerimetersMaxDetour.value;
  }
  if (style.firstLayerSizeCompensation) {
    profile.elephantFootCompensation = style.firstLayerSizeCompensation;
  }

  // skirt/brim
  if (style.useBrim) {
    profile.brimType = BrimTypes.OUTER_ONLY;
    profile.brimWidth = style.brimLoops * profile.firstLayerExtrusionWidth;
    profile.brimSeparation = style.brimGap;
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
    profile.perimeterSpeed = variantValue(
      style.perimeterSpeed,
      style.solidLayerSpeed,
      style.solidLayerSpeed,
    );
  } else {
    profile.perimeterSpeed = style.solidLayerSpeed;
  }
  if (style.externalPerimeterSpeed) {
    profile.externalPerimeterSpeed = variantValue(
      style.externalPerimeterSpeed,
      style.solidLayerSpeed,
      style.solidLayerSpeed,
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
      profile.externalPerimeterSpeed,
    );
    profile.bridgeSpeed = Math.round(fastestSpeed / 2);
  }
  if (style.supportSpeed && style.supportSpeed.value !== 'auto') {
    profile.supportMaterialSpeed = variantValue(style.supportSpeed, style.solidLayerSpeed);
  } else {
    profile.supportMaterialSpeed = style.solidLayerSpeed;
  }
  if (style.supportInterfaceSpeed && style.supportInterfaceSpeed.value !== 'auto') {
    profile.supportMaterialInterfaceSpeed = variantValue(
      style.supportInterfaceSpeed,
      style.solidLayerSpeed,
    );
  } else {
    profile.supportMaterialInterfaceSpeed = style.solidLayerSpeed;
  }

  // supports
  profile.supportMaterial = style.useSupport;
  profile.supportMaterialAuto = !style.useCustomSupports;
  profile.supportMaterialSpacing = convertSupportDensity(
    style.supportDensity,
    profile.extrusionWidth,
  );
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
    if (style.defaultSupportInterfaceExtruder === 'auto') {
      profile.supportMaterialInterfaceExtruder = 0;
    } else {
      profile.supportMaterialInterfaceExtruder = style.defaultSupportInterfaceExtruder + 1;
    }
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
        profile.extrusionWidth,
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
      const bedTemperatureMaterial = getMaterialFieldValue(materials[i], 'bedTemperature', style.bedTemperature);
      bedTemperature = Math.max(bedTemperature, bedTemperatureMaterial);
    }
  }
  for (let i = 0; i < extruderCount; i++) {
    profile.bedTemperature[i] = bedTemperature;
    profile.firstLayerBedTemperature[i] = bedTemperature;

    const printTemperatureMaterial = getMaterialFieldValue(materials[i], 'printTemperature', style.printTemperature);
    profile.temperature[i] = printTemperatureMaterial;

    let firstLayerPrintTemperatureMaterial;
    if (materials[i].style.useFirstLayerPrintTemperature) {
      // material profile overrides first layer temperature
      if (materials[i].style.firstLayerPrintTemperature.value === 'auto') {
        // 'auto' -- use the main temperature for this material
        firstLayerPrintTemperatureMaterial = printTemperatureMaterial;
      } else {
        // not 'auto' -- a value in °C is supplied
        firstLayerPrintTemperatureMaterial = materials[i].style.firstLayerPrintTemperature.value;
      }
    } else if (materials[i].style.usePrintTemperature) {
      // no override for first layer temperature, but yes override for main temperature
      firstLayerPrintTemperatureMaterial = printTemperatureMaterial;
    } else {
      // no overrides at all -- use global first layer temperature
      firstLayerPrintTemperatureMaterial = style.firstLayerPrintTemperature.value === 'auto'
        ? printTemperatureMaterial
        : style.firstLayerPrintTemperature.value;
    }
    profile.firstLayerTemperature[i] = firstLayerPrintTemperatureMaterial;
  }

  // extrusion multiplier
  for (let i = 0; i < extruderCount; i++) {
    const extrusionMultiplierInt = getMaterialFieldValue(materials[i], 'extrusionMultiplier', style.extrusionMultiplier);
    profile.extrusionMultiplier[i] = extrusionMultiplierInt / 100;
  }

  // cooling fan
  for (let i = 0; i < extruderCount; i++) {
    profile.slowdownBelowLayerTime[i] = style.minLayerTime;
    const useFan = getMaterialFieldValue(materials[i], 'useFan', style.useFan);
    if (useFan) {
      profile.fanAlwaysOn[i] = true;
      const fanSpeedMaterial = getMaterialFieldValue(materials[i], 'fanSpeed', style.fanSpeed);
      profile.minFanSpeed[i] = fanSpeedMaterial;
      profile.maxFanSpeed[i] = fanSpeedMaterial;
      profile.bridgeFanSpeed[i] = fanSpeedMaterial;
      const fanLayerMaterial = getMaterialFieldValue(materials[i], 'enableFanAtLayer', style.enableFanAtLayer);
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
    profile.retractLength[i] = getMaterialFieldValue(materials[i], 'retractLength', style.retractLength);
    profile.retractLengthToolchange[i] = profile.retractLength[i];
    profile.retractSpeed[i] = getMaterialFieldValue(materials[i], 'retractSpeed', style.retractSpeed);
    if (!profile.useFirmwareRetraction) {
      profile.wipe[i] = getMaterialFieldValue(materials[i], 'wipeLength', style.wipeLength) > 0;
    }
    profile.retractBeforeTravel[i] = style.retractDisableThreshold;
    profile.retractLift[i] = style.zLift;
    profile.retractLiftAbove[i] = 0;
    profile.retractLiftBelow[i] = Math.floor(machine.bedSize[2] - (2 * profile.retractLift[i]));
  }

  // max flowrate
  for (let i = 0; i < extruderCount; i++) {
    const maxMaterialFlowrate = getMaterialFieldValue(materials[i], 'maxPrintSpeed', 0);
    if (typeof maxMaterialFlowrate === 'object') {
      if (maxMaterialFlowrate.units === 'mm3/s') {
        profile.filamentMaxVolumetricSpeed[i] = maxMaterialFlowrate.value;
      } else {
        // mm/s
        profile.filamentMaxVolumetricSpeed[i] = getVolumetricFlowRate(
          maxMaterialFlowrate.value,
          style.layerHeight,
          style.extrusionWidth,
        );
      }
    } else if (maxMaterialFlowrate > 0) {
      // mm/s
      profile.filamentMaxVolumetricSpeed[i] = getVolumetricFlowRate(
        maxMaterialFlowrate,
        style.layerHeight,
        style.extrusionWidth,
      );
    }
  }

  // material names and colors
  for (let i = 0; i < extruderCount; i++) {
    const hexColor = `#${rgbToHex(colors[i])}`;
    profile.filamentColor[i] = hexColor;
    profile.extruderColor[i] = hexColor;
    profile.filamentSettingsId[i] = materials[i].name;
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
        if (materials[i].style.useTowerSpeed) {
          profile.towerSpeed[i] = materials[i].style.towerSpeed;
        } else if (style.towerSpeed && style.towerSpeed.value !== 'auto') {
          profile.towerSpeed[i] = style.towerSpeed.value;
        } else {
          profile.towerSpeed[i] = profile.infillSpeed;
        }
      }
      if (style.towerExtrusionWidth && style.towerExtrusionWidth.units === 'mm') {
        profile.towerExtrusionWidth = style.towerExtrusionWidth.value;
      } else {
        profile.towerExtrusionWidth = Math
          .max(profile.extrusionWidth, profile.infillExtrusionWidth);
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
            profile.wipingVolumesMatrix[i][j] = (
              filamentLengthToVolume(variableTransitionLengths.transitionLengths[i][j])
            );
          }
        }
      }
    } else {
      const {
        driveColorStrengths, minTransitionLength, maxTransitionLength
      } = variableTransitionLengths;
      for (let ingoing = 0; ingoing < driveColorStrengths.length; ingoing++) {
        for (let outgoing = 0; outgoing < driveColorStrengths.length; outgoing++) {
          if (ingoing !== outgoing) {
            const ingoingStrength = driveColorStrengths[ingoing];
            const outgoingStrength = driveColorStrengths[outgoing];
            profile.wipingVolumesMatrix[ingoing][outgoing] = (
              filamentLengthToVolume(getTransitionLength(
                ingoingStrength,
                outgoingStrength,
                minTransitionLength,
                maxTransitionLength
              ))
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
          profile.wipingVolumesMatrix[i][j] = transitionVolume;
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
      profile.firmwareRetraction = false;
      profile.gcodeComments = false;
      break;
    case 'makerbot':
      profile.useRelativeEDistances = true;
      profile.firmwareRetraction = false;
      break;
    case 'x3g':
      profile.gcodeFlavor = GCodeFlavors.MAKERWARE;
      profile.firmwareRetraction = false;
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
    profile.startGcodePrinterscript = sequences.convertToPrinterScript(machine.startSequence, true);
  }
  // apply start sequence defaults
  profile.startGcodePrinterscript = sequences.applyStartSequenceDefaults(
    profile.startGcodePrinterscript,
    machine,
    palette ? palette.extruder : 0,
    bedTemperature,
  );

  // end sequence
  profile.endGcode = ';*/*/*/*/* END SEQUENCE */*/*/*/*';
  if (machine.endSequence.startsWith('@printerscript')) {
    profile.endGcodePrinterscript = machine.endSequence;
  } else {
    profile.endGcodePrinterscript = sequences.convertToPrinterScript(machine.endSequence);
  }

  // layer change sequence
  if (machine.layerChangeSequence) {
    profile.layerGcode = ';*/*/*/*/* LAYER CHANGE SEQUENCE ([layer_num], [layer_z]) */*/*/*/*';
    if (machine.layerChangeSequence.startsWith('@printerscript')) {
      profile.layerGcodePrinterscript = machine.layerChangeSequence;
    } else {
      profile.layerGcodePrinterscript = sequences
        .convertToPrinterScript(machine.layerChangeSequence);
    }
  }

  // material change sequence
  for (let i = 0; i < extruderCount; i++) {
    if (materials[i].materialChangeSequence) {
      profile.startFilamentGcode[i] = `;*/*/*/*/* MATERIAL CHANGE SEQUENCE (${i}) */*/*/*/*`;
      if (materials[i].materialChangeSequence.startsWith('@printerscript')) {
        profile.startFilamentGcodePrinterscript[i] = materials[i].materialChangeSequence;
      } else {
        profile.startFilamentGcodePrinterscript[i] = sequences
          .convertToPrinterScript(materials[i].materialChangeSequence);
      }
    }
  }

  if (style.transitionMethod === 2) {
    if (machine.preSideTransitionSequence) {
      if (machine.preSideTransitionSequence.startsWith('@printerscript')) {
        profile.preSideTransitionPrinterscript = machine.preSideTransitionSequence;
      } else {
        profile.preSideTransitionPrinterscript = sequences
          .convertToPrinterScript(machine.preSideTransitionSequence);
      }
    }
    if (machine.sideTransitionSequence) {
      profile.sideTransitionPrinterscript = machine.sideTransitionSequence;
    }
    if (machine.postSideTransitionSequence) {
      if (machine.postSideTransitionSequence.startsWith('@printerscript')) {
        profile.postSideTransitionPrinterscript = machine.postSideTransitionSequence;
      } else {
        profile.postSideTransitionPrinterscript = sequences
          .convertToPrinterScript(machine.postSideTransitionSequence);
      }
    }
  }

  return profile;
};

module.exports = index;
