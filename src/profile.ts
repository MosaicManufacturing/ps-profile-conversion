import {
  ArcFitting,
  BrimType,
  DraftShieldMode,
  FuzzySkinType,
  GCodeFlavor,
  GCodeLabelObjects,
  InfillPattern,
  IroningType,
  MachineLimitsUsage,
  PerimeterGenerator,
  SeamPosition,
  SolidFillPattern,
  SupportInterfacePattern,
  SupportPattern,
  SupportStyle,
  TopOnePerimeterType,
} from './enums';
import { parseOverrides } from './overrides';
import { boolToIntString, roundTo } from './utils';

type Nil = 'nil';

const SETTINGS_ID = 'out.3mf';
const addPercent = (val: number) => `${val}%`;

export default class Profile {
  // used indirectly
  bedSize: [number, number, number] = [250, 250, 210];
  originOffset: [number, number, number] = [0, 0, 0];
  bedCircular = false;

  // PrusaSlicer config fields
  arcFitting = ArcFitting.DISABLED;
  autoEmitTemperatureCommands = true;
  avoidCrossingCurledOverhangs = false;
  avoidCrossingPerimeters = false;
  avoidCrossingPerimetersMaxDetour: number | string = 0;
  bedCustomModel = '';
  bedCustomTexture = '';
  bedTemperature: number[];
  beforeLayerGcode = '';
  betweenObjectsGcode = '';
  binaryGcode = false;
  bottomFillPattern = SolidFillPattern.MONOTONIC;
  bottomSolidLayers = 4;
  bottomSolidMinThickness = 0.5;
  bridgeAcceleration = 0;
  bridgeAngle = 0;
  bridgeFanSpeed: number[];
  bridgeFlowRatio = 0.95;
  bridgeSpeed = 30;
  brimSeparation = 0.1;
  brimType = BrimType.NO_BRIM;
  brimWidth = 0;
  chamberMinimalTemperature: number[];
  chamberTemperature: number[];
  clipMultipartObjects = true;
  colorChangeGcode = 'M600';
  colorPrintHeights = [];
  completeObjects = false;
  cooling: boolean[];
  coolingTubeLength = 0;
  coolingTubeRetraction = 0;
  defaultAcceleration = 0;
  defaultFilamentProfile = '';
  defaultPrintProfile = '';
  deretractSpeed: number[];
  disableFanFirstLayers: number[];
  dontSupportBridges = false;
  draftShield = DraftShieldMode.DISABLED;
  duplicateDistance = 6;
  elephantFootCompensation = 0;
  enableDynamicFanSpeeds: boolean[];
  enableDynamicOverhangSpeeds = false;
  endFilamentGcode: string[];
  endGcode = '';
  ensureVerticalShellThickness = true;
  externalPerimeterAcceleration = 0;
  externalPerimeterExtrusionWidth = 0.45;
  externalPerimeterSpeed = 25;
  externalPerimetersFirst = false;
  extraLoadingMove = 0;
  extraPerimeters = false;
  extraPerimetersOnOverhangs = false;
  extruderClearanceHeight = 20;
  extruderClearanceRadius = 45;
  extruderColor: string[];
  extruderOffset: [number, number][];
  extrusionAxis = 'E';
  extrusionMultiplier: number[];
  extrusionWidth = 0.45;
  fanAlwaysOn: boolean[];
  fanBelowLayerTime: number[];
  filamentAbrasive: boolean[];
  filamentColor: string[];
  filamentCoolingFinalSpeed: number[];
  filamentCoolingInitialSpeed: number[];
  filamentCoolingMoves: number[];
  filamentCost: number[];
  filamentDensity: number[];
  filamentDeretractSpeed: Nil[];
  filamentDiameter: number[];
  filamentInfillMaxCrossingSpeed: number[];
  filamentInfillMaxSpeed: number[];
  filamentLoadTime: number[];
  filamentLoadingSpeed: number[];
  filamentLoadingSpeedStart: number[];
  filamentMaxVolumetricSpeed: number[];
  filamentMinimalPurgeOnWipeTower: number[];
  filamentMultiToolRamming: boolean[];
  filamentMultiToolRammingFlow: number[];
  filamentMultiToolRammingVolume: number[];
  filamentNotes: string[];
  filamentPurgeMultiplier: number[];
  filamentRammingParameters: string[];
  filamentRetractBeforeTravel: Nil[];
  filamentRetractBeforeWipe: Nil[];
  filamentRetractLayerChange: Nil[];
  filamentRetractLength: Nil[];
  filamentRetractLengthToolChange: Nil[];
  filamentRetractLift: Nil[];
  filamentRetractLiftAbove: Nil[];
  filamentRetractLiftBelow: Nil[];
  filamentRetractRestartExtra: Nil[];
  filamentRetractRestartExtraToolChange: Nil[];
  filamentRetractSpeed: Nil[];
  filamentSettingsId: string[];
  filamentShrinkageCompensationXY: number[];
  filamentShrinkageCompensationZ: number[];
  filamentSoluble: boolean[];
  filamentSpoolWeight: number[];
  filamentStampingDistance: number[];
  filamentStampingLoadingSpeed: number[]; // REMOVed?
  filamentToolchangeDelay: number[];
  filamentTravelLiftBeforeObstacle: Nil[];
  filamentTravelMaxLift: Nil[];
  filamentTravelRampingLift: Nil[];
  filamentTravelSlope: Nil[];
  filamentType: string[];
  filamentUnloadTime: number[];
  filamentUnloadingSpeed: number[];
  filamentUnloadingSpeedStart: number[];
  filamentVendor = 'Generic';
  filamentWipe: Nil[];
  fillAngle = 45;
  fillDensity = 15;
  fillPattern = InfillPattern.RECTILINEAR;
  firstLayerAcceleration = 0;
  firstLayerAccelerationOverRaft = 0;
  firstLayerBedTemperature: number[];
  firstLayerExtrusionWidth = 0.42;
  firstLayerHeight = 0.2;
  firstLayerSpeed = 20;
  firstLayerSpeedOverRaft = 0;
  firstLayerTemperature: number[];
  fullFanSpeedLayer: number[];
  fuzzySkin = FuzzySkinType.NONE;
  fuzzySkinPointDistance = 0.8;
  fuzzySkinThickness = 0.3;
  gapFillEnabled = true;
  gapFillSpeed = 40;
  gcodeComments = false;
  gcodeFlavor = GCodeFlavor.REPRAP_SPRINTER;
  gcodeLabelObjects = GCodeLabelObjects.OCTOPRINT; // currently required for Palette postprocessing
  gcodeResolution = 0.0125;
  gcodeSubstitutions = '';
  highCurrentOnFilamentSwap = false;
  hostType = 'octoprint';
  idleTemperature: Nil[];
  infillAcceleration = 0;
  infillAnchor: number | string = 2.5;
  infillAnchorMax: number | string = 12;
  infillEveryLayers = 1;
  infillExtruder = 1;
  infillExtrusionWidth = 0.45;
  infillFirst = false;
  infillOverlap = 25;
  infillSpeed = 80;
  interfaceShells = false;
  ironing = false;
  ironingFlowrate = 15;
  ironingSpacing = 0.1;
  ironingSpeed = 15;
  ironingType = IroningType.ALL_TOP_SURFACES;
  layerGcode = '';
  layerHeight = 0.2;
  machineLimitsUsage = MachineLimitsUsage.USE_FOR_TIME_ESTIMATE;
  machineMaxAccelerationE = [5000, 5000]; // [normal, stealth]
  machineMaxAccelerationExtruding = [1250, 1250]; // [normal, stealth]
  machineMaxAccelerationRetracting = [1250, 1250]; // [normal, stealth]
  machineMaxAccelerationTravel = [1500, 1250]; // [normal, stealth]
  machineMaxAccelerationX = [1000, 960]; // [normal, stealth]
  machineMaxAccelerationY = [1000, 960]; // [normal, stealth]
  machineMaxAccelerationZ = [200, 200]; // [normal, stealth]
  machineMaxFeedrateE = [120, 120]; // [normal, stealth]
  machineMaxFeedrateX = [200, 100]; // [normal, stealth]
  machineMaxFeedrateY = [200, 100]; // [normal, stealth]
  machineMaxFeedrateZ = [12, 12]; // [normal, stealth]
  machineMaxJerkE = [4.5, 4.5]; // [normal, stealth]
  machineMaxJerkX = [8, 8]; // [normal, stealth]
  machineMaxJerkY = [8, 8]; // [normal, stealth]
  machineMaxJerkZ = [0.4, 0.4]; // [normal, stealth]
  machineMinExtrudingRate = [0, 0]; // [normal, stealth]
  machineMinTravelRate = [0, 0]; // [normal, stealth]
  maxFanSpeed: number[];
  maxLayerHeight: number[];
  maxPrintSpeed = 200;
  maxVolumetricExtrusionRateSlopeNegative = 0;
  maxVolumetricExtrusionRateSlopePositive = 0;
  maxVolumetricSpeed = 0;
  minBeadWidth = 85; // 0-100
  minFanSpeed: number[];
  minFeatureSize = 25; // 0-100
  minLayerHeight: number[];
  minPrintSpeed: number[];
  minSkirtLength = 4;
  mmuSegmentedRegionInterlockingDepth = 0;
  mmuSegmentedRegionMaxWidth = 0;
  multiMaterialPurging = 140;
  notes = '';
  nozzleDiameter: number[];
  nozzleHighFlow: boolean[];
  onlyOnePerimeterFirstLayer = false;
  onlyRetractWhenCrossingPerimeters = false;
  oozePrevention = false;
  outputFilenameFormat =
    '{input_filename_base}_{layer_height}mm_{filament_type[0]}_{printer_model}_{print_time}.gcode';
  overhangFanSpeed0: number[];
  overhangFanSpeed1: number[];
  overhangFanSpeed2: number[];
  overhangFanSpeed3: number[];
  overhangSpeed0 = 15;
  overhangSpeed1 = 15;
  overhangSpeed2 = 20;
  overhangSpeed3 = 25;
  overhangs = true; // 'Detect Bridging Perimeters'
  parkingPosRetraction = 0;
  pausePrintGcode = 'M601';
  perimeterAcceleration = 0;
  perimeterExtruder = 1;
  perimeterExtrusionWidth = 0.45;
  perimeterGenerator = PerimeterGenerator.ARACHNE;
  perimeterSpeed = 45;
  perimeters = 2;
  physicalPrinterSettingsId = '';
  postProcess = '';
  preferClockwiseMovements = false;
  printSettingsId = SETTINGS_ID;
  printerModel = '';
  printerNotes = '';
  printerSettingsId = SETTINGS_ID;
  printerTechnology = 'FFF';
  printerVariant = '';
  printerVendor = '';
  raftContactDistance = 0.2;
  raftExpansion = 1.5;
  raftFirstLayerDensity = 90;
  raftFirstLayerExpansion = 3;
  raftLayers = 0;
  remainingTimes = false;
  resolution = 0;
  retractBeforeTravel: number[];
  retractBeforeWipe: number[];
  retractLayerChange: boolean[];
  retractLength: number[];
  retractLengthToolchange: number[];
  retractLift: number[];
  retractLiftAbove: number[];
  retractLiftBelow: number[];
  retractRestartExtra: number[];
  retractRestartExtraToolchange: number[];
  retractSpeed: number[];
  seamPosition = SeamPosition.NEAREST;
  silentMode = false;
  singleExtruderMultiMaterial = true;
  singleExtruderMultiMaterialPriming = false;
  skirtDistance = 2;
  skirtHeight = 3;
  skirts = 0;
  sliceClosingRadius = 0.049;
  slicingMode = 'regular';
  slowdownBelowLayerTime: number[];
  smallPerimeterSpeed: number | string = 0;
  solidInfillAcceleration = 0;
  solidInfillBelowArea = 0;
  solidInfillEveryLayers = 0;
  solidInfillExtruder = 1;
  solidInfillExtrusionWidth = 0.45;
  solidInfillSpeed = 80;
  spiralVase = false;
  staggeredInnerSeams = false;
  standbyTemperatureDelta = -5;
  startFilamentGcode: string[];
  startGcode = '';
  supportMaterial = false;
  supportMaterialAngle = 0;
  supportMaterialAuto = true;
  supportMaterialBottomContactDistance = -1; // -1 == use same setting as top interfaces
  supportMaterialBottomInterfaceLayers = -1; // -1 == use same setting as top interfaces
  supportMaterialBuildplateOnly = false;
  supportMaterialClosingRadius = 2;
  supportMaterialContactDistance = 0;
  supportMaterialEnforceLayers = 0;
  supportMaterialExtruder = 0; // 0 == use current extruder
  supportMaterialExtrusionWidth = 0.35;
  supportMaterialInterfaceContactLoops = false;
  supportMaterialInterfaceExtruder = 0; // 0 == use current extruder
  supportMaterialInterfaceLayers = 0;
  supportMaterialInterfacePattern = SupportInterfacePattern.RECTILINEAR;
  supportMaterialInterfaceSpacing = 0.2;
  supportMaterialInterfaceSpeed = 80;
  supportMaterialPattern = SupportPattern.RECTILINEAR;
  supportMaterialSpacing = 2;
  supportMaterialSpeed = 50;
  supportMaterialStyle = SupportStyle.GRID;
  supportMaterialSynchronizeLayers = false;
  supportMaterialThreshold = 55;
  supportMaterialWithSheath = false;
  supportMaterialXYSpacing: number | string = '50%';
  supportTreeAngle = 40;
  supportTreeAngleSlow = 25;
  supportTreeBranchDiameter = 2;
  supportTreeBranchDiameterAngle = 5;
  supportTreeBranchDiameterDoubleWall = 3;
  supportTreeBranchDistance = 1;
  supportTreeTipDiameter = 0.8;
  supportTreeTopRate = 15;
  temperature: number[];
  templateCustomGcode = '';
  thickBridges = false;
  thinWalls = true;
  thumbnails: [number, number][] = [];
  thumbnailsFormat = 'PNG';
  toolchangeGcode = '';
  topFillPattern = SolidFillPattern.MONOTONIC;
  topInfillExtrusionWidth = 0.4;
  topOnePerimeterType = TopOnePerimeterType.NONE;
  topSolidInfillAcceleration = 0;
  topSolidInfillSpeed: number | string = 40;
  topSolidLayers = 5;
  topSolidMinThickness = 0.7;
  travelAcceleration = 0;
  travelLiftBeforeObstacle: boolean[];
  travelMaxLift: number[];
  travelRampingLift: boolean[];
  travelSlope: number[];
  travelSpeed = 180;
  travelSpeedZ = 180;
  useFirmwareRetraction = false;
  useRelativeEDistances = false;
  useVolumetricE = false;
  variableLayerHeight = false;
  wallDistributionCount = 1;
  wallTransitionAngle = 10;
  wallTransitionFilterDeviation = 25; // 0-100
  wallTransitionLength = 100; // 0-100
  wipe: boolean[];
  wipeIntoInfill = false;
  wipeIntoObjects = false;
  wipeTower = false;
  wipeTowerAcceleration = 0;
  wipeTowerBridging = 10;
  wipeTowerBrimWidth = 2;
  wipeTowerConeAngle = 0;
  wipeTowerExtraFlow = 100;
  wipeTowerExtraSpacing = 100;
  wipeTowerExtruder = 0;
  wipeTowerNoSparseLayers = false;
  wipeTowerRotationAngle = 0;
  wipeTowerWidth = 60;
  wipeTowerX = 180;
  wipeTowerY = 140;
  wipingVolumesMatrix: number[][];
  wipingVolumesUseCustomMatrix = false;
  xySizeCompensation = 0;
  zOffset = 0;

  // not used by PrusaSlicer
  clearBufferCommand = 'G4 P0';
  coolingModuleSpeed: number[];
  enableCoolingModuleAtLayer: number[];
  towerSpeed: number[];
  firstLayerTowerSpeed: number[];
  towerExtrusionWidth = 0.45;
  layerGcodePrinterscript = '';
  endGcodePrinterscript = '';
  startFilamentGcodePrinterscript: string[];
  startGcodePrinterscript = '';
  preSideTransitionPrinterscript = '';
  sideTransitionPrinterscript = '';
  postSideTransitionPrinterscript = '';
  zOffsetPerExt: number[];

  constructor(extruderCount: number) {
    this.bedTemperature = new Array(extruderCount).fill(0);
    this.bottomFillPattern = SolidFillPattern.MONOTONIC;
    this.bridgeFanSpeed = new Array(extruderCount).fill(100);
    this.chamberMinimalTemperature = new Array(extruderCount).fill(0);
    this.chamberTemperature = new Array(extruderCount).fill(0);
    this.cooling = new Array(extruderCount).fill(true);
    this.coolingModuleSpeed = new Array(extruderCount).fill(100);
    this.deretractSpeed = new Array(extruderCount).fill(0);
    this.disableFanFirstLayers = new Array(extruderCount).fill(1);
    this.enableDynamicFanSpeeds = new Array(extruderCount).fill(false);
    this.endFilamentGcode = new Array(extruderCount).fill('');
    this.extruderColor = new Array(extruderCount).fill('#000000');
    this.extruderOffset = new Array(extruderCount).fill(0).map(() => [0, 0]);
    this.extrusionMultiplier = new Array(extruderCount).fill(1);
    this.fanAlwaysOn = new Array(extruderCount).fill(true);
    this.fanBelowLayerTime = new Array(extruderCount).fill(100);
    this.filamentAbrasive = new Array(extruderCount).fill(false);
    this.filamentColor = new Array(extruderCount).fill('#000000');
    this.filamentCoolingFinalSpeed = new Array(extruderCount).fill(0);
    this.filamentCoolingInitialSpeed = new Array(extruderCount).fill(0);
    this.filamentCoolingMoves = new Array(extruderCount).fill(0);
    this.filamentCost = new Array(extruderCount).fill(0);
    this.filamentDensity = new Array(extruderCount).fill(1.25);
    this.filamentDeretractSpeed = new Array(extruderCount).fill('nil');
    this.filamentDiameter = new Array(extruderCount).fill(1.75);
    this.filamentInfillMaxCrossingSpeed = new Array(extruderCount).fill(0);
    this.filamentInfillMaxSpeed = new Array(extruderCount).fill(0);
    this.filamentLoadingSpeed = new Array(extruderCount).fill(28);
    this.filamentLoadingSpeedStart = new Array(extruderCount).fill(0);
    this.filamentLoadTime = new Array(extruderCount).fill(0);
    this.filamentMaxVolumetricSpeed = new Array(extruderCount).fill(0);
    this.filamentMinimalPurgeOnWipeTower = new Array(extruderCount).fill(0);
    this.filamentMultiToolRamming = new Array(extruderCount).fill(false);
    this.filamentMultiToolRammingFlow = new Array(extruderCount).fill(10);
    this.filamentMultiToolRammingVolume = new Array(extruderCount).fill(10);
    this.filamentNotes = new Array(extruderCount).fill('');
    this.filamentPurgeMultiplier = new Array(extruderCount).fill(100);
    this.filamentRammingParameters = new Array(extruderCount).fill('');
    this.filamentRetractBeforeTravel = new Array(extruderCount).fill('nil');
    this.filamentRetractBeforeWipe = new Array(extruderCount).fill('nil');
    this.filamentRetractLayerChange = new Array(extruderCount).fill('nil');
    this.filamentRetractLength = new Array(extruderCount).fill('nil');
    this.filamentRetractLengthToolChange = new Array(extruderCount).fill('nil');
    this.filamentRetractLift = new Array(extruderCount).fill('nil');
    this.filamentRetractLiftAbove = new Array(extruderCount).fill('nil');
    this.filamentRetractLiftBelow = new Array(extruderCount).fill('nil');
    this.filamentRetractRestartExtra = new Array(extruderCount).fill('nil');
    this.filamentRetractRestartExtraToolChange = new Array(extruderCount).fill('nil');
    this.filamentRetractSpeed = new Array(extruderCount).fill('nil');
    this.filamentSettingsId = new Array(extruderCount).fill(`${SETTINGS_ID} (Filament)`);
    this.filamentShrinkageCompensationXY = new Array(extruderCount).fill(0);
    this.filamentShrinkageCompensationZ = new Array(extruderCount).fill(0);
    this.filamentSoluble = new Array(extruderCount).fill(false);
    this.filamentSpoolWeight = new Array(extruderCount).fill(0);
    this.filamentStampingDistance = new Array(extruderCount).fill(0);
    this.filamentStampingLoadingSpeed = new Array(extruderCount).fill(20);
    this.filamentToolchangeDelay = new Array(extruderCount).fill(0);
    this.filamentTravelLiftBeforeObstacle = new Array(extruderCount).fill('nil');
    this.filamentTravelMaxLift = new Array(extruderCount).fill('nil');
    this.filamentTravelRampingLift = new Array(extruderCount).fill('nil');
    this.filamentTravelSlope = new Array(extruderCount).fill('nil');
    this.filamentType = new Array(extruderCount).fill('PLA');
    this.filamentUnloadingSpeed = new Array(extruderCount).fill(0);
    this.filamentUnloadingSpeedStart = new Array(extruderCount).fill(0);
    this.filamentUnloadTime = new Array(extruderCount).fill(0);
    this.filamentWipe = new Array(extruderCount).fill('nil');
    this.firstLayerBedTemperature = new Array(extruderCount).fill(0);
    this.firstLayerTemperature = new Array(extruderCount).fill(215);
    this.fullFanSpeedLayer = new Array(extruderCount).fill(4);
    this.idleTemperature = new Array(extruderCount).fill('nil');
    this.maxFanSpeed = new Array(extruderCount).fill(100);
    this.maxLayerHeight = new Array(extruderCount).fill(0.25);
    this.minFanSpeed = new Array(extruderCount).fill(100);
    this.minLayerHeight = new Array(extruderCount).fill(0.07);
    this.minPrintSpeed = new Array(extruderCount).fill(15);
    this.nozzleDiameter = new Array(extruderCount).fill(0.4);
    this.nozzleHighFlow = new Array(extruderCount).fill(false);
    this.overhangFanSpeed0 = new Array(extruderCount).fill(0);
    this.overhangFanSpeed1 = new Array(extruderCount).fill(0);
    this.overhangFanSpeed2 = new Array(extruderCount).fill(0);
    this.overhangFanSpeed3 = new Array(extruderCount).fill(0);
    this.retractBeforeTravel = new Array(extruderCount).fill(2);
    this.retractBeforeWipe = new Array(extruderCount).fill(0);
    this.retractLayerChange = new Array(extruderCount).fill(true);
    this.retractLength = new Array(extruderCount).fill(0.8);
    this.retractLengthToolchange = new Array(extruderCount).fill(4);
    this.retractLift = new Array(extruderCount).fill(0.4);
    this.retractLiftAbove = new Array(extruderCount).fill(0);
    this.retractLiftBelow = new Array(extruderCount).fill(209);
    this.retractRestartExtra = new Array(extruderCount).fill(0);
    this.retractRestartExtraToolchange = new Array(extruderCount).fill(0);
    this.retractSpeed = new Array(extruderCount).fill(35);
    this.slowdownBelowLayerTime = new Array(extruderCount).fill(15);
    this.startFilamentGcode = new Array(extruderCount).fill('');
    this.temperature = new Array(extruderCount).fill(205);
    this.towerSpeed = new Array(extruderCount).fill(0);
    this.travelLiftBeforeObstacle = new Array(extruderCount).fill(false);
    this.travelMaxLift = new Array(extruderCount).fill(0);
    this.travelRampingLift = new Array(extruderCount).fill(false);
    this.travelSlope = new Array(extruderCount).fill(0);
    this.wipe = new Array(extruderCount).fill(false);
    this.wipingVolumesMatrix = new Array(extruderCount)
      .fill(0)
      .map((_, i) => new Array(extruderCount).fill(0).map((__, j) => (i === j ? 0 : 140)));

    // not used by PrusaSlicer
    this.towerSpeed = new Array(extruderCount).fill(0);
    this.firstLayerTowerSpeed = new Array(extruderCount).fill(0);
    this.startFilamentGcodePrinterscript = new Array(extruderCount).fill('');
    this.enableCoolingModuleAtLayer = new Array(extruderCount).fill(0);
    this.coolingModuleSpeed = new Array(extruderCount).fill(100);
    this.zOffsetPerExt = new Array(extruderCount).fill(0);
  }

  getBedShapeString() {
    const points = [];
    if (this.bedCircular) {
      // generate 72 points representing the perimeter of circle as a 72-gon
      // (starting at 360 deg / 72, going counter-clockwise, and ending at 0 deg)
      const [diameter] = this.bedSize;
      const [xOff, yOff] = this.originOffset;
      // math explained at https://math.stackexchange.com/a/2547424
      for (let i = 1; i <= 72; i++) {
        const x = Math.cos((2 * Math.PI * i) / 72);
        const y = Math.cos((2 * Math.PI * i) / 72);
        // scale to correct diameter and apply offsets
        points.push([roundTo(x * diameter + xOff, 5), roundTo(y * diameter + yOff, 5)]);
      }
    } else {
      const bottomLeftX = -this.originOffset[0];
      const bottomLeftY = -this.originOffset[1];
      points.push([bottomLeftX, bottomLeftY]);
      points.push([bottomLeftX + this.bedSize[0], bottomLeftY]);
      points.push([bottomLeftX + this.bedSize[0], bottomLeftY + this.bedSize[1]]);
      points.push([bottomLeftX, bottomLeftY + this.bedSize[1]]);
    }
    return points.map(([x, y]) => `${x}x${y}`).join(',');
  }

  toString() {
    const now = new Date();
    const Y = now.getUTCFullYear();
    const M = `0${now.getUTCMonth() + 1}`.slice(-2);
    const D = `0${now.getUTCDate()}`.slice(-2);
    const h = `0${now.getUTCHours()}`.slice(-2);
    const m = `0${now.getUTCMinutes()}`.slice(-2);
    const s = `0${now.getUTCSeconds()}`.slice(-2);
    return `; generated by Canvas on ${Y}-${M}-${D} at ${h}:${m}:${s} UTC

; arc_fitting = ${this.arcFitting}
; autoemit_temperature_commands = ${boolToIntString(this.autoEmitTemperatureCommands)}
; avoid_crossing_curled_overhangs = ${boolToIntString(this.avoidCrossingCurledOverhangs)}
; avoid_crossing_perimeters = ${boolToIntString(this.avoidCrossingPerimeters)}
; avoid_crossing_perimeters_max_detour = ${this.avoidCrossingPerimetersMaxDetour}
; bed_custom_model = ${this.bedCustomModel}
; bed_custom_texture = ${this.bedCustomTexture}
; bed_shape = ${this.getBedShapeString()}
; bed_temperature = ${this.bedTemperature.join(',')}
; before_layer_gcode = ${this.beforeLayerGcode || ';'}
; between_objects_gcode = ${this.betweenObjectsGcode || ';'}
; binary_gcode = ${boolToIntString(this.binaryGcode)}
; bottom_fill_pattern = ${this.bottomFillPattern}
; bottom_solid_layers = ${this.bottomSolidLayers}
; bottom_solid_min_thickness = ${this.bottomSolidMinThickness}
; bridge_acceleration = ${this.bridgeAcceleration}
; bridge_angle = ${this.bridgeAngle}
; bridge_fan_speed = ${this.bridgeFanSpeed.join(',')}
; bridge_flow_ratio = ${this.bridgeFlowRatio}
; bridge_speed = ${this.bridgeSpeed}
; brim_separation = ${this.brimSeparation}
; brim_type = ${this.brimType}
; brim_width = ${this.brimWidth}
; chamber_minimal_temperature = ${this.chamberMinimalTemperature.join(',')}
; chamber_temperature = ${this.chamberTemperature.join(',')}
; clip_multipart_objects = ${boolToIntString(this.clipMultipartObjects)}
; color_change_gcode = ${this.colorChangeGcode || ';'}
; colorprint_heights = ${this.colorPrintHeights.join(',')}
; complete_objects = ${boolToIntString(this.completeObjects)}
; cooling = ${this.cooling.map(boolToIntString).join(',')}
; cooling_tube_length = ${this.coolingTubeLength}
; cooling_tube_retraction = ${this.coolingTubeRetraction}
; default_acceleration = ${this.defaultAcceleration}
; default_filament_profile = "${this.defaultFilamentProfile}"
; default_print_profile = ${this.defaultPrintProfile}
; deretract_speed = ${this.deretractSpeed.join(',')}
; disable_fan_first_layers = ${this.disableFanFirstLayers.join(',')}
; dont_support_bridges = ${boolToIntString(this.dontSupportBridges)}
; draft_shield = ${this.draftShield}
; duplicate_distance = ${this.duplicateDistance}
; elefant_foot_compensation = ${this.elephantFootCompensation}
; enable_dynamic_fan_speeds = ${this.enableDynamicFanSpeeds.map(boolToIntString).join(',')}
; enable_dynamic_overhang_speeds = ${boolToIntString(this.enableDynamicOverhangSpeeds)}
; end_filament_gcode = ${this.endFilamentGcode.map((gcode) => (gcode ? `"${gcode}"` : '";"')).join(';')}
; end_gcode = ${this.endGcode || ';'}
; ensure_vertical_shell_thickness = ${boolToIntString(this.ensureVerticalShellThickness)}
; external_perimeter_acceleration = ${this.externalPerimeterAcceleration}
; external_perimeter_extrusion_width = ${this.externalPerimeterExtrusionWidth}
; external_perimeter_speed = ${this.externalPerimeterSpeed}
; external_perimeters_first = ${boolToIntString(this.externalPerimetersFirst)}
; extra_loading_move = ${this.extraLoadingMove}
; extra_perimeters = ${boolToIntString(this.extraPerimeters)}
; extra_perimeters_on_overhangs = ${boolToIntString(this.extraPerimetersOnOverhangs)}
; extruder_clearance_height = ${this.extruderClearanceHeight}
; extruder_clearance_radius = ${this.extruderClearanceRadius}
; extruder_colour = ${this.extruderColor.join(';')}
; extruder_offset = ${this.extruderOffset.map(([x, y]) => `${x}x${y}`).join(',')}
; extrusion_axis = ${this.extrusionAxis}
; extrusion_multiplier = ${this.extrusionMultiplier.join(',')}
; extrusion_width = ${this.extrusionWidth}
; fan_always_on = ${this.fanAlwaysOn.map(boolToIntString).join(',')}
; fan_below_layer_time = ${this.fanBelowLayerTime.join(',')}
; filament_abrasive = ${this.filamentAbrasive.map(boolToIntString).join(',')}
; filament_colour = ${this.filamentColor.join(';')}
; filament_cooling_final_speed = ${this.filamentCoolingFinalSpeed.join(',')}
; filament_cooling_initial_speed = ${this.filamentCoolingInitialSpeed.join(',')}
; filament_cooling_moves = ${this.filamentCoolingMoves.join(',')}
; filament_cost = ${this.filamentCost.join(',')}
; filament_density = ${this.filamentDensity.join(',')}
; filament_deretract_speed = ${this.filamentDeretractSpeed.join(',')}
; filament_diameter = ${this.filamentDiameter.join(',')}
; filament_infill_max_crossing_speed = ${this.filamentInfillMaxCrossingSpeed.join(',')}
; filament_infill_max_speed = ${this.filamentInfillMaxSpeed.join(',')}
; filament_load_time = ${this.filamentLoadTime.join(',')}
; filament_loading_speed = ${this.filamentLoadingSpeed.join(',')}
; filament_loading_speed_start = ${this.filamentLoadingSpeedStart.join(',')}
; filament_max_volumetric_speed = ${this.filamentMaxVolumetricSpeed.join(',')}
; filament_minimal_purge_on_wipe_tower = ${this.filamentMinimalPurgeOnWipeTower.join(',')}
; filament_multitool_ramming = ${this.filamentMultiToolRamming.map(boolToIntString).join(',')}
; filament_multitool_ramming_flow = ${this.filamentMultiToolRammingFlow.join(',')}
; filament_multitool_ramming_volume = ${this.filamentMultiToolRammingVolume.join(',')}
; filament_notes = ${this.filamentNotes.map((notes) => `${notes}`).join(';')}
; filament_purge_multiplier = ${this.filamentPurgeMultiplier.join(',')}
; filament_ramming_parameters = ${this.filamentRammingParameters.map((params) => `${params}`).join(';')}
; filament_retract_before_travel = ${this.filamentRetractBeforeTravel.join(',')}
; filament_retract_before_wipe = ${this.filamentRetractBeforeWipe.join(',')}
; filament_retract_layer_change = ${this.filamentRetractLayerChange.join(',')}
; filament_retract_length = ${this.filamentRetractLength.join(',')}
; filament_retract_length_toolchange = ${this.filamentRetractLengthToolChange.join(',')}
; filament_retract_lift = ${this.filamentRetractLift.join(',')}
; filament_retract_lift_above = ${this.filamentRetractLiftAbove.join(',')}
; filament_retract_lift_below = ${this.filamentRetractLiftBelow.join(',')}
; filament_retract_restart_extra = ${this.filamentRetractRestartExtra.join(',')}
; filament_retract_restart_extra_toolchange = ${this.filamentRetractRestartExtraToolChange.join(',')}
; filament_retract_speed = ${this.filamentRetractSpeed.join(',')}
; filament_settings_id = ${this.filamentSettingsId.map((val) => `"${val}"`).join(';')}
; filament_shrinkage_compensation_xy = ${this.filamentShrinkageCompensationXY.map(addPercent).join(',')}
; filament_shrinkage_compensation_z = ${this.filamentShrinkageCompensationZ.map(addPercent).join(',')}
; filament_soluble = ${this.filamentSoluble.map(boolToIntString).join(',')}
; filament_spool_weight = ${this.filamentSpoolWeight.join(',')}
; filament_stamping_distance = ${this.filamentStampingDistance.join(',')}
; filament_stamping_loading_speed = ${this.filamentStampingLoadingSpeed.map(addPercent).join(',')}
; filament_toolchange_delay = ${this.filamentToolchangeDelay.join(',')}
; filament_travel_lift_before_obstacle = ${this.filamentTravelLiftBeforeObstacle.join(',')}
; filament_travel_max_lift = ${this.filamentTravelMaxLift.join(',')}
; filament_travel_ramping_lift = ${this.filamentTravelRampingLift.join(',')}
; filament_travel_slope = ${this.filamentTravelSlope.join(',')}
; filament_type = ${this.filamentType.join(';')}
; filament_unload_time = ${this.filamentUnloadTime.join(',')}
; filament_unloading_speed = ${this.filamentUnloadingSpeed.join(',')}
; filament_unloading_speed_start = ${this.filamentUnloadingSpeedStart.join(',')}
; filament_vendor = ${this.filamentVendor}
; filament_wipe = ${this.filamentWipe.join(',')}
; fill_angle = ${this.fillAngle}
; fill_density = ${this.fillDensity}%
; fill_pattern = ${this.fillPattern}
; first_layer_acceleration = ${this.firstLayerAcceleration}
; first_layer_acceleration_over_raft = ${this.firstLayerAccelerationOverRaft}
; first_layer_bed_temperature = ${this.firstLayerBedTemperature.join(',')}
; first_layer_extrusion_width = ${this.firstLayerExtrusionWidth}
; first_layer_height = ${this.firstLayerHeight}
; first_layer_speed = ${this.firstLayerSpeed}
; first_layer_speed_over_raft = ${this.firstLayerSpeedOverRaft}
; first_layer_temperature = ${this.firstLayerTemperature.join(',')}
; full_fan_speed_layer = ${this.fullFanSpeedLayer.join(',')}
; fuzzy_skin = ${this.fuzzySkin}
; fuzzy_skin_point_dist = ${this.fuzzySkinPointDistance}
; fuzzy_skin_thickness = ${this.fuzzySkinThickness}
; gap_fill_enabled = ${boolToIntString(this.gapFillEnabled)}
; gap_fill_speed = ${this.gapFillSpeed}
; gcode_comments = ${boolToIntString(this.gcodeComments)}
; gcode_flavor = ${this.gcodeFlavor}
; gcode_label_objects = ${this.gcodeLabelObjects}
; gcode_resolution = ${this.gcodeResolution}
; gcode_substitutions = ${this.gcodeSubstitutions}
; high_current_on_filament_swap = ${boolToIntString(this.highCurrentOnFilamentSwap)}
; host_type = ${this.hostType}
; idle_temperature = ${this.idleTemperature.join(',')}
; infill_acceleration = ${this.infillAcceleration}
; infill_anchor = ${this.infillAnchor}
; infill_anchor_max = ${this.infillAnchorMax}
; infill_every_layers = ${this.infillEveryLayers}
; infill_extruder = ${this.infillExtruder}
; infill_extrusion_width = ${this.infillExtrusionWidth}
; infill_first = ${boolToIntString(this.infillFirst)}
; infill_overlap = ${this.infillOverlap}%
; infill_speed = ${this.infillSpeed}
; interface_shells = ${boolToIntString(this.interfaceShells)}
; ironing = ${boolToIntString(this.ironing)}
; ironing_flowrate = ${this.ironingFlowrate}%
; ironing_spacing = ${this.ironingSpacing}
; ironing_speed = ${this.ironingSpeed}
; ironing_type = ${this.ironingType}
; layer_gcode = ${this.layerGcode || ';'}
; layer_height = ${this.layerHeight}
; machine_limits_usage = ${this.machineLimitsUsage}
; machine_max_acceleration_e = ${this.machineMaxAccelerationE.join(',')}
; machine_max_acceleration_extruding = ${this.machineMaxAccelerationExtruding.join(',')}
; machine_max_acceleration_retracting = ${this.machineMaxAccelerationRetracting.join(',')}
; machine_max_acceleration_travel = ${this.machineMaxAccelerationTravel.join(',')}
; machine_max_acceleration_x = ${this.machineMaxAccelerationX.join(',')}
; machine_max_acceleration_y = ${this.machineMaxAccelerationY.join(',')}
; machine_max_acceleration_z = ${this.machineMaxAccelerationZ.join(',')}
; machine_max_feedrate_e = ${this.machineMaxFeedrateE.join(',')}
; machine_max_feedrate_x = ${this.machineMaxFeedrateX.join(',')}
; machine_max_feedrate_y = ${this.machineMaxFeedrateY.join(',')}
; machine_max_feedrate_z = ${this.machineMaxFeedrateZ.join(',')}
; machine_max_jerk_e = ${this.machineMaxJerkE.join(',')}
; machine_max_jerk_x = ${this.machineMaxJerkX.join(',')}
; machine_max_jerk_y = ${this.machineMaxJerkY.join(',')}
; machine_max_jerk_z = ${this.machineMaxJerkZ.join(',')}
; machine_min_extruding_rate = ${this.machineMinExtrudingRate.join(',')}
; machine_min_travel_rate = ${this.machineMinTravelRate.join(',')}
; max_fan_speed = ${this.maxFanSpeed.join(',')}
; max_layer_height = ${this.maxLayerHeight.join(',')}
; max_print_height = ${this.bedSize[2]}
; max_print_speed = ${this.maxPrintSpeed}
; max_volumetric_extrusion_rate_slope_negative = ${this.maxVolumetricExtrusionRateSlopeNegative}
; max_volumetric_extrusion_rate_slope_positive = ${this.maxVolumetricExtrusionRateSlopePositive}
; max_volumetric_speed = ${this.maxVolumetricSpeed}
; min_bead_width = ${this.minBeadWidth}%
; min_fan_speed = ${this.minFanSpeed.join(',')}
; min_feature_size = ${this.minFeatureSize}%
; min_layer_height = ${this.minLayerHeight.join(',')}
; min_print_speed = ${this.minPrintSpeed.join(',')}
; min_skirt_length = ${this.minSkirtLength}
; mmu_segmented_region_interlocking_depth = ${this.mmuSegmentedRegionInterlockingDepth}
; mmu_segmented_region_max_width = ${this.mmuSegmentedRegionMaxWidth}
; multimaterial_purging = ${this.multiMaterialPurging}
; notes = ${this.notes}
; nozzle_diameter = ${this.nozzleDiameter.join(',')}
; nozzle_high_flow = ${this.nozzleHighFlow.map(boolToIntString).join(',')}
; only_one_perimeter_first_layer = ${boolToIntString(this.onlyOnePerimeterFirstLayer)}
; only_retract_when_crossing_perimeters = ${boolToIntString(this.onlyRetractWhenCrossingPerimeters)}
; ooze_prevention = ${boolToIntString(this.oozePrevention)}
; output_filename_format = ${this.outputFilenameFormat}
; overhang_fan_speed_0 = ${this.overhangFanSpeed0.join(',')}
; overhang_fan_speed_1 = ${this.overhangFanSpeed1.join(',')} 
; overhang_fan_speed_2 = ${this.overhangFanSpeed2.join(',')} 
; overhang_fan_speed_3 = ${this.overhangFanSpeed3.join(',')} 
; overhang_speed_0 = ${this.overhangSpeed0}
; overhang_speed_1 = ${this.overhangSpeed1}
; overhang_speed_2 = ${this.overhangSpeed2}
; overhang_speed_3 = ${this.overhangSpeed3}
; overhangs = ${boolToIntString(this.overhangs)}
; parking_pos_retraction = ${this.parkingPosRetraction}
; pause_print_gcode = ${this.pausePrintGcode || ';'}
; perimeter_acceleration = ${this.perimeterAcceleration}
; perimeter_extruder = ${this.perimeterExtruder}
; perimeter_extrusion_width = ${this.perimeterExtrusionWidth}
; perimeter_generator = ${this.perimeterGenerator}
; perimeter_speed = ${this.perimeterSpeed}
; perimeters = ${this.perimeters}
; physical_printer_settings_id = ${this.physicalPrinterSettingsId}
; post_process = ${this.postProcess}
; prefer_clockwise_movements = ${boolToIntString(this.preferClockwiseMovements)}
; print_settings_id = ${this.printSettingsId}
; printer_model = ${this.printerModel}
; printer_notes = ${this.printerNotes}
; printer_settings_id = ${this.printerSettingsId}
; printer_technology = ${this.printerTechnology}
; printer_variant = ${this.printerVariant}
; printer_vendor = ${this.printerVendor}
; raft_contact_distance = ${this.raftContactDistance}
; raft_expansion = ${this.raftExpansion}
; raft_first_layer_density = ${this.raftFirstLayerDensity}%
; raft_first_layer_expansion = ${this.raftFirstLayerExpansion}
; raft_layers = ${this.raftLayers}
; remaining_times = ${boolToIntString(this.remainingTimes)}
; resolution = ${this.resolution}
; retract_before_travel = ${this.retractBeforeTravel.join(',')}
; retract_before_wipe = ${this.retractBeforeWipe.map(addPercent).join(',')}
; retract_layer_change = ${this.retractLayerChange.map(boolToIntString).join(',')}
; retract_length = ${this.retractLength.join(',')}
; retract_length_toolchange = ${this.retractLengthToolchange.join(',')}
; retract_lift = ${this.retractLift.join(',')}
; retract_lift_above = ${this.retractLiftAbove.join(',')}
; retract_lift_below = ${this.retractLiftBelow.join(',')}
; retract_restart_extra = ${this.retractRestartExtra.join(',')}
; retract_restart_extra_toolchange = ${this.retractRestartExtraToolchange.join(',')}
; retract_speed = ${this.retractSpeed.join(',')}
; seam_position = ${this.seamPosition}
; silent_mode = ${boolToIntString(this.silentMode)}
; single_extruder_multi_material = ${boolToIntString(this.singleExtruderMultiMaterial)}
; single_extruder_multi_material_priming = ${boolToIntString(this.singleExtruderMultiMaterialPriming)}
; skirt_distance = ${this.skirtDistance}
; skirt_height = ${this.skirtHeight}
; skirts = ${this.skirts}
; slice_closing_radius = ${this.sliceClosingRadius}
; slicing_mode = ${this.slicingMode}
; slowdown_below_layer_time = ${this.slowdownBelowLayerTime.join(',')}
; small_perimeter_speed = ${this.smallPerimeterSpeed}
; solid_infill_acceleration = ${this.solidInfillAcceleration}
; solid_infill_below_area = ${this.solidInfillBelowArea}
; solid_infill_every_layers = ${this.solidInfillEveryLayers}
; solid_infill_extruder = ${this.solidInfillExtruder}
; solid_infill_extrusion_width = ${this.solidInfillExtrusionWidth}
; solid_infill_speed = ${this.solidInfillSpeed}
; spiral_vase = ${boolToIntString(this.spiralVase)}
; staggered_inner_seams = ${boolToIntString(this.staggeredInnerSeams)}
; standby_temperature_delta = ${this.standbyTemperatureDelta}
; start_filament_gcode = ${this.startFilamentGcode.map((gcode) => (gcode ? `"${gcode}"` : '";"')).join(';')}
; start_gcode = ${this.startGcode || ';'}
; support_material = ${boolToIntString(this.supportMaterial)}
; support_material_angle = ${this.supportMaterialAngle}
; support_material_auto = ${boolToIntString(this.supportMaterialAuto)}
; support_material_bottom_contact_distance = ${this.supportMaterialBottomContactDistance}
; support_material_bottom_interface_layers = ${this.supportMaterialBottomInterfaceLayers}
; support_material_buildplate_only = ${boolToIntString(this.supportMaterialBuildplateOnly)}
; support_material_closing_radius = ${this.supportMaterialClosingRadius}
; support_material_contact_distance = ${this.supportMaterialContactDistance}
; support_material_enforce_layers = ${this.supportMaterialEnforceLayers}
; support_material_extruder = ${this.supportMaterialExtruder}
; support_material_extrusion_width = ${this.supportMaterialExtrusionWidth}
; support_material_interface_contact_loops = ${boolToIntString(this.supportMaterialInterfaceContactLoops)}
; support_material_interface_extruder = ${this.supportMaterialInterfaceExtruder}
; support_material_interface_layers = ${this.supportMaterialInterfaceLayers}
; support_material_interface_pattern = ${this.supportMaterialInterfacePattern}
; support_material_interface_spacing = ${this.supportMaterialInterfaceSpacing}
; support_material_interface_speed = ${this.supportMaterialInterfaceSpeed}%
; support_material_pattern = ${this.supportMaterialPattern}
; support_material_spacing = ${this.supportMaterialSpacing}
; support_material_speed = ${this.supportMaterialSpeed}
; support_material_style = ${this.supportMaterialStyle}
; support_material_synchronize_layers = ${boolToIntString(this.supportMaterialSynchronizeLayers)}
; support_material_threshold = ${this.supportMaterialThreshold}
; support_material_with_sheath = ${boolToIntString(this.supportMaterialWithSheath)}
; support_material_xy_spacing = ${this.supportMaterialXYSpacing}
; support_tree_angle = ${this.supportTreeAngle}
; support_tree_angle_slow = ${this.supportTreeAngleSlow}
; support_tree_branch_diameter = ${this.supportTreeBranchDiameter}
; support_tree_branch_diameter_angle = ${this.supportTreeBranchDiameterAngle}
; support_tree_branch_diameter_double_wall = ${this.supportTreeBranchDiameterDoubleWall}
; support_tree_branch_distance = ${this.supportTreeBranchDistance}
; support_tree_tip_diameter = ${this.supportTreeTipDiameter}
; support_tree_top_rate = ${this.supportTreeTopRate}%
; temperature = ${this.temperature.join(',')}
; template_custom_gcode = ${this.templateCustomGcode || ';'}
; thick_bridges = ${boolToIntString(this.thickBridges)}
; thin_walls = ${boolToIntString(this.thinWalls)}
; thumbnails = ${this.thumbnails.map(([x, y]) => `${x}x${y}`).join(',')}
; thumbnails_format = ${this.thumbnailsFormat}
; toolchange_gcode = ${this.toolchangeGcode || ';'}
; top_fill_pattern = ${this.topFillPattern}
; top_infill_extrusion_width = ${this.topInfillExtrusionWidth}
; top_one_perimeter_type = ${this.topOnePerimeterType}
; top_solid_infill_acceleration = ${this.topSolidInfillAcceleration}
; top_solid_infill_speed = ${this.topSolidInfillSpeed}
; top_solid_layers = ${this.topSolidLayers}
; top_solid_min_thickness = ${this.topSolidMinThickness}
; travel_acceleration = ${this.travelAcceleration}
; travel_lift_before_obstacle = ${this.travelLiftBeforeObstacle.map(boolToIntString).join(',')}
; travel_max_lift = ${this.travelMaxLift.join(',')}
; travel_ramping_lift = ${this.travelRampingLift.map(boolToIntString).join(',')}
; travel_slope = ${this.travelSlope.join(',')}
; travel_speed = ${this.travelSpeed}
; travel_speed_z = ${this.travelSpeedZ}
; use_firmware_retraction = ${boolToIntString(this.useFirmwareRetraction)}
; use_relative_e_distances = ${boolToIntString(this.useRelativeEDistances)}
; use_volumetric_e = ${boolToIntString(this.useVolumetricE)}
; variable_layer_height = ${boolToIntString(this.variableLayerHeight)}
; wall_distribution_count = ${this.wallDistributionCount}
; wall_transition_angle = ${this.wallTransitionAngle}
; wall_transition_filter_deviation = ${this.wallTransitionFilterDeviation}%
; wall_transition_length = ${this.wallTransitionLength}%
; wipe = ${this.wipe.map(boolToIntString).join(',')}
; wipe_into_infill = ${boolToIntString(this.wipeIntoInfill)}
; wipe_into_objects = ${boolToIntString(this.wipeIntoObjects)}
; wipe_tower = ${boolToIntString(this.wipeTower)}
; wipe_tower_acceleration = ${this.wipeTowerAcceleration}
; wipe_tower_bridging = ${this.wipeTowerBridging}
; wipe_tower_brim_width = ${this.wipeTowerBrimWidth}
; wipe_tower_cone_angle = ${this.wipeTowerConeAngle}
; wipe_tower_extra_flow = ${this.wipeTowerExtraFlow}%
; wipe_tower_extra_spacing = ${this.wipeTowerExtraSpacing}%
; wipe_tower_extruder = ${this.wipeTowerExtruder}
; wipe_tower_no_sparse_layers = ${boolToIntString(this.wipeTowerNoSparseLayers)}
; wipe_tower_rotation_angle = ${this.wipeTowerRotationAngle}
; wipe_tower_width = ${this.wipeTowerWidth}
; wipe_tower_x = ${this.wipeTowerX}
; wipe_tower_y = ${this.wipeTowerY}
; wiping_volumes_matrix = ${this.wipingVolumesMatrix.map((vals) => vals.join(',')).join(',')}
; wiping_volumes_use_custom_matrix = ${boolToIntString(this.wipingVolumesUseCustomMatrix)}
; xy_size_compensation = ${this.xySizeCompensation}
; z_offset = ${this.zOffset}
`;
  }

  toStringWithOverrides(text: string) {
    let str = this.toString();
    const overrides = parseOverrides(text);
    Object.keys(overrides).forEach((key) => {
      if (str.includes(`; ${key} =`)) {
        const value = overrides[key]!;
        const regex = new RegExp(`^; (${key}) = (.*)$`, 'm');
        str = str.replace(regex, `; $1 = ${value}`);
      }
    });
    return str;
  }
}
