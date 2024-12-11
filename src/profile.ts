import {
  ArcFitting,
  BrimType,
  DraftShieldMode,
  FuzzySkinType,
  GCodeFlavor,
  GcodeLabelObjects,
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
import { boolToIntString, roundTo } from './utils';

type Nil = 'nil';

const SETTINGS_ID = 'out.3mf';

export default class Profile {
  avoidCrossingPerimeters = false;
  avoidCrossingPerimetersMaxDetour: number | string = 0;
  bedCircular = false;
  bedCustomModel = '';
  bedCustomTexture = '';
  bedSize: [number, number, number] = [250, 250, 210];
  originOffset: [number, number, number] = [0, 0, 0];
  bedTemperature: number[];
  beforeLayerGcode = '';
  betweenObjectsGcode = '';
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
  endFilamentGcode: string[];
  endGcode = '';
  ensureVerticalShellThickness = true;
  externalPerimeterExtrusionWidth = 0.45;
  externalPerimeterSpeed = 25;
  externalPerimetersFirst = false;
  extraLoadingMove = 0;
  extraPerimeters = false;
  extruderClearanceHeight = 20;
  extruderClearanceRadius = 45;
  extruderColor: string[];
  extruderOffset: [number, number][];
  extrusionAxis = 'E';
  extrusionMultiplier: number[];
  extrusionWidth = 0.45;
  fanAlwaysOn: boolean[];
  fanBelowLayerTime: number[];
  filamentColor: string[];
  filamentCoolingFinalSpeed: number[];
  filamentCoolingInitialSpeed: number[];
  filamentCoolingMoves: number[];
  filamentCost: number[];
  filamentDensity: number[];
  filamentDeretractSpeed: Nil[];
  filamentDiameter: number[];
  filamentLoadTime: number[];
  filamentLoadingSpeed: number[];
  filamentLoadingSpeedStart: number[];
  filamentMaxVolumetricSpeed: number[];
  filamentMinimalPurgeOnWipeTower: number[];
  filamentNotes: string[];
  filamentRammingParameters: string[];
  filamentRetractBeforeTravel: Nil[];
  filamentRetractBeforeWipe: Nil[];
  filamentRetractLayerChange: Nil[];
  filamentRetractLength: Nil[];
  filamentRetractLift: Nil[];
  filamentRetractLiftAbove: Nil[];
  filamentRetractLiftBelow: Nil[];
  filamentRetractRestartExtra: Nil[];
  filamentRetractSpeed: Nil[];
  filamentSettingsId: string[];
  filamentSoluble: boolean[];
  filamentSpoolWeight: number[];
  filamentToolchangeDelay: number[];
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

  // def = this->add("gcode_label_objects", coEnum);
  // def->label = L("Label objects");
  // def->tooltip = L("Selects whether labels should be exported at object boundaries and in what format.\n"
  //                  "OctoPrint = comments to be consumed by OctoPrint CancelObject plugin.\n"
  //                  "Firmware = firmware specific G-code (it will be chosen based on firmware flavor and it can end up to be empty).\n\n"
  //                  "This settings is NOT compatible with Single Extruder Multi Material setup and Wipe into Object / Wipe into Infill.");

  // def->set_enum<LabelObjectsStyle>({
  //     { "disabled",   L("Disabled") },
  //     { "octoprint",  L("OctoPrint comments") },
  //     { "firmware",   L("Firmware-specific") }
  //     });

  // gcodeLabelObjects = true; // currently required for Palette postprocessing
  gcodeLabelObjects = GcodeLabelObjects.OCTOPRINT;

  gcodeResolution = 0.0125;
  gcodeSubstitutions = '';
  highCurrentOnFilamentSwap = false;
  hostType = 'octoprint';
  infillAcceleration = 0;
  infillAnchor = 2.5;
  infillAnchorMax = 12;
  infillEveryLayers = 1;
  infillExtruder = 1;
  infillExtrusionWidth = 0.45;
  infillFirst = false;
  infillOnlyWhereNeeded = false;
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
  mmuSegmentedRegionMaxWidth = 0;
  notes = '';
  nozzleDiameter: number[];
  onlyRetractWhenCrossingPerimeters = false;
  oozePrevention = false;
  outputFilenameFormat =
    '{input_filename_base}_{layer_height}mm_{filament_type[0]}_{printer_model}_{print_time}.gcode';
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
  smallPerimeterSpeed = 0;
  solidInfillBelowArea = 0;
  solidInfillEveryLayers = 0;
  solidInfillExtruder = 1;
  solidInfillExtrusionWidth = 0.45;
  solidInfillSpeed = 80;
  spiralVase = false;
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
  temperature: number[];
  templateCustomGcode = '';
  thickBridges = false;
  thinWalls = true;
  threads = 20;
  thumbnails: [number, number][] = [];
  thumbnailsFormat = 'PNG';
  toolchangeGcode = '';
  topFillPattern = SolidFillPattern.MONOTONIC;
  topInfillExtrusionWidth = 0.4;
  topSolidInfillSpeed = 40;
  topSolidLayers = 5;
  topSolidMinThickness = 0.7;
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
  wipeTowerBridging = 10;
  wipeTowerBrimWidth = 2;
  wipeTowerNoSparseLayers = false;
  wipeTowerRotationAngle = 0;
  wipeTowerWidth = 60;
  wipeTowerX = 180;
  wipeTowerY = 140;
  wipingVolumesExtruders: [number, number][];
  wipingVolumesMatrix: number[][];
  xySizeCompensation = 0;
  zOffset = 0;

  // new ones
  // =========

  //; arc_fitting = disabled
  arcFitting = ArcFitting.DISABLED;

  //   def = this->add("autoemit_temperature_commands", coBool);
  // def->label = L("Emit temperature commands automatically");
  // def->tooltip = L("When enabled, PrusaSlicer will check whether your custom Start G-Code contains G-codes to set "
  //                  "extruder, bed or chamber temperature (M104, M109, M140, M190, M141 and M191). "
  //                  "If so, the temperatures will not be emitted automatically so you're free to customize "
  //                  "the order of heating commands and other custom actions. Note that you can use "
  //                  "placeholder variables for all PrusaSlicer settings, so you can put "
  //                  "a \"M109 S[first_layer_temperature]\" command wherever you want.\n"
  //                  "If your custom Start G-Code does NOT contain these G-codes, "
  //                  "PrusaSlicer will execute the Start G-Code after heated chamber was set to its temperature, "
  //                  "bed reached its target temperature and extruder just started heating.\n\n"
  //                  "When disabled, PrusaSlicer will NOT emit commands to heat up extruder, bed or chamber, "
  //                  "leaving all to Custom Start G-Code.");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBool(true));

  // ; autoemit_temperature_commands = 1
  autoEmitTemperatureCommands = true;

  // def = this->add("avoid_crossing_curled_overhangs", coBool);
  //   def->label = L("Avoid crossing curled overhangs (Experimental)");
  //   // TRN PrintSettings: "Avoid crossing curled overhangs (Experimental)"
  //   def->tooltip = L("Plan travel moves such that the extruder avoids areas where the filament may be curled up. "
  //                  "This is mostly happening on steeper rounded overhangs and may cause a crash with the nozzle. "
  //                  "This feature slows down both the print and the G-code generation.");
  //   def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBool(false));

  // ; avoid_crossing_curled_overhangs = 0
  avoidCrossingCurledOverhangs = false;

  // def = this->add("binary_gcode", coBool);
  // def->label = L("Supports binary G-code");
  // def->tooltip = L("Enable, if the firmware supports binary G-code format (bgcode). "
  //                  "To generate .bgcode files, make sure you have binary G-code enabled in Configuration->Preferences->Other.");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBool(false));
  // ; binary_gcode = 0
  binarygcode = false;

  // def = this->add("chamber_minimal_temperature", coInts);
  // // TRN: Label of a configuration parameter: Minimal chamber temperature
  // def->label = L("Minimal");
  // def->full_label = L("Chamber minimal temperature");
  // def->tooltip = L("Minimal chamber temperature that the printer waits for before the print starts. This allows "
  //                  "to start the print before the nominal chamber temperature is reached.\nWhen set to zero, "
  //                  "the minimal chamber temperature is not set in the G-code.");
  // def->sidetext = L("°C");
  // def->min = 0;
  // def->max = 1000;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionInts{ 0 });
  // ; chamber_minimal_temperature = 0,0
  chamberMinimalTemperatureActual: number[];

  // def = this->add("chamber_temperature", coInts);
  // // TRN: Label of a configuration parameter: Nominal chamber temperature.
  // def->label = L("Nominal");
  // def->full_label = L("Chamber temperature");
  // def->tooltip = L("Required chamber temperature for the print.\nWhen set to zero, "
  //                  "the nominal chamber temperature is not set in the G-code.");
  // def->sidetext = L("°C");
  // def->min = 0;
  // def->max = 1000;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionInts{ 0 });
  // ; chamber_temperature = 0,0`
  chamberTemperatureActual: number[];

  // def          = this->add("enable_dynamic_fan_speeds", coBools);
  // def->label   = L("Enable dynamic fan speeds");
  // def->tooltip = L("This setting enables dynamic fan speed control on overhangs.");
  // def->mode    = comExpert;
  // def->set_default_value(new ConfigOptionBools{false});
  // ; enable_dynamic_fan_speeds = 0,0
  enableDynamicFanSpeed: boolean[];

  // def             = this->add("enable_dynamic_overhang_speeds", coBool);
  // def->label      = L("Enable dynamic overhang speeds");
  // def->category   = L("Speed");
  // def->tooltip    = L("This setting enables dynamic speed control on overhangs.");
  // def->mode       = comExpert;
  // def->set_default_value(new ConfigOptionBool(false));
  // ; enable_dynamic_overhang_speeds = 0
  enableDynamicOverhangSpeed = false;

  //  def = this->add("external_perimeter_acceleration", coFloat);
  //   def->label = L("External perimeters");
  //   def->tooltip = L("This is the acceleration your printer will use for external perimeters. "
  //                    "Set zero to use the value for perimeters.");
  //   def->sidetext = L("mm/s²");
  //   def->mode = comExpert;
  //   def->set_default_value(new ConfigOptionFloat(0));
  // ; external_perimeter_acceleration = 0
  externalPerimeterAcceleration = 0;

  // def = this->add("extra_perimeters_on_overhangs", coBool);
  // def->label = L("Extra perimeters on overhangs (Experimental)");
  // def->category = L("Layers and Perimeters");
  // def->tooltip = L("Detect overhang areas where bridges cannot be anchored, and fill them with "
  //                 "extra perimeter paths. These paths are anchored to the nearby non-overhang area when possible.");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBool(false));
  // ; extra_perimeters_on_overhangs = 0
  extraPerimetersOnOverhang = false;

  // def = this->add("filament_abrasive", coBools);
  // def->label = L("Abrasive material");
  // def->tooltip = L("This flag means that the material is abrasive and requires a hardened nozzle. The value is used by the printer to check it.");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBools { false });
  // ; filament_abrasive = 0,0
  filamentAbrasive: boolean[];

  // def = this->add("filament_infill_max_crossing_speed", coFloats);
  // def->label = L("Max crossing infill speed");
  // def->tooltip = L("Maximum speed allowed for this filament while printing infill with "
  //                  "self intersections in a single layer. "
  //                  "Set to zero for no limit.");
  // def->sidetext = L("mm/s");
  // def->min = 0;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloats { 0. });
  // ; filament_infill_max_crossing_speed = 0,0
  filamentInfillMaxCrossingSpeed: number[];

  // def = this->add("filament_infill_max_speed", coFloats);
  // def->label = L("Max non-crossing infill speed");
  // def->tooltip = L("Maximum speed allowed for this filament while printing infill without "
  //                  "any self intersections in a single layer. "
  //                  "Set to zero for no limit.");
  // def->sidetext = L("mm/s");
  // def->min = 0;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloats { 0. });
  // ; filament_infill_max_speed = 0,0
  filamentInfillMaxSpeed: number[];

  // def = this->add("filament_multitool_ramming", coBools);
  // def->label = L("Enable ramming for multitool setups");
  // def->tooltip = L("Perform ramming when using multitool printer (i.e. when the 'Single Extruder Multimaterial' in Printer Settings is unchecked). "
  //                  "When checked, a small amount of filament is rapidly extruded on the wipe tower just before the toolchange. "
  //                  "This option is only used when the wipe tower is enabled.");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBools { false });
  // ; filament_multitool_ramming = 0,0
  filamentMultiToolRamming: boolean[];

  // def = this->add("filament_multitool_ramming_flow", coFloats);
  // def->label = L("Multitool ramming flow");
  // def->tooltip = L("Flow used for ramming the filament before the toolchange.");
  // def->sidetext = L("mm³/s");
  // def->min = 0;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionFloats { 10. });
  // ; filament_multitool_ramming_flow = 10,10
  filamentMultiToolRammingFlow: number[];

  // def = this->add("filament_multitool_ramming_volume", coFloats);
  // def->label = L("Multitool ramming volume");
  // def->tooltip = L("The volume to be rammed before the toolchange.");
  // def->sidetext = L("mm³");
  // def->min = 0;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionFloats { 10. });
  // ; filament_multitool_ramming_volume = 10,10
  filamentMultiToolRammingVolume: number[];

  // def = this->add("filament_purge_multiplier", coPercents);
  // def->label = L("Purge volume multiplier");
  // def->tooltip = L("Purging volume on the wipe tower is determined by 'multimaterial_purging' in Printer Settings. "
  //                  "This option allows to modify the volume on filament level. "
  //                  "Note that the project can override this by setting project-specific values.");
  // def->sidetext = L("%");
  // def->min = 0;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionPercents { 100 });
  // ; filament_purge_multiplier = 100%,100%
  filamentPurgeMultiplier: number[];

  // ; filament_retract_length_toolchange = nil,nil
  filamentRetractLengthToolChange: Nil[];

  // ; filament_retract_restart_extra_toolchange = nil,nil
  filamentRetractRestartExtraToolChange: Nil[];

  //   def = this->add("filament_shrinkage_compensation_xy", coPercents);
  // def->label = L("Shrinkage compensation XY");
  // def->tooltip = L("Enter your filament shrinkage percentages for the X and Y axes here to apply scaling of the object to "
  //                  "compensate for shrinkage in the X and Y axes. For example, if you measured 99mm instead of 100mm, "
  //                  "enter 1%.");
  // def->sidetext = L("%");
  // def->mode = comAdvanced;
  // def->min = -10.;
  // def->max = 10.;
  // def->set_default_value(new ConfigOptionPercents { 0 });
  // ; filament_shrinkage_compensation_xy = 0%,0%
  filamentShrinkageCompensationXY: number[];

  // def = this->add("filament_shrinkage_compensation_z", coPercents);
  // def->label = L("Shrinkage compensation Z");
  // def->tooltip = L("Enter your filament shrinkage percentages for the Z axis here to apply scaling of the object to "
  //                  "compensate for shrinkage in the Z axis. For example, if you measured 99mm instead of 100mm, "
  //                  "enter 1%.");
  // def->sidetext = L("%");
  // def->mode = comAdvanced;
  // def->min = -10.;
  // def->max = 10.;
  // def->set_default_value(new ConfigOptionPercents { 0. });
  // ; filament_shrinkage_compensation_z = 0%,0%
  filamentShrinkageCompensationZ: number[];

  // def = this->add("filament_stamping_distance", coFloats);
  // def->label = L("Stamping distance measured from the center of the cooling tube");
  // def->tooltip = L("If set to nonzero value, filament is moved toward the nozzle between the individual cooling moves (\"stamping\"). "
  //                  "This option configures how long this movement should be before the filament is retracted again.");
  // def->sidetext = L("mm");
  // def->min = 0;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionFloats { 0. });
  // ; filament_stamping_distance = 0,0
  filamentStampingDistance: number[];

  // def = this->add("filament_stamping_loading_speed", coFloats);
  // def->label = L("Stamping loading speed");
  // def->tooltip = L("Speed used for stamping.");
  // def->sidetext = L("mm/s");
  // def->min = 0;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionFloats { 20. });
  // ; filament_stamping_loading_speed = 20,20
  filamentStampingLoadingSpeed: number[];

  // ; filament_travel_lift_before_obstacle = nil,nil
  filamentTravelLiftBeforeObstacle: Nil[];
  // ; filament_travel_max_lift = nil,nil
  filamentTravelMaxLift: Nil[];
  // ; filament_travel_ramping_lift = nil,nil
  filamentTravelRampLift: Nil[];
  // ; filament_travel_slope = nil,nil
  filamentTravelSlope: Nil[];

  //def = this->add_nullable("idle_temperature", coInts);
  // def->label = L("Idle temperature");
  // def->tooltip = L("Nozzle temperature when the tool is currently not used in multi-tool setups."
  //                  "This is only used when 'Ooze prevention' is active in Print Settings.");
  // def->sidetext = L("°C");
  // def->min = 0;
  // def->max = max_temp;
  // def->set_default_value(new ConfigOptionIntsNullable { ConfigOptionIntsNullable::nil_value() });
  // ; idle_temperature = nil,nil
  idleTemperature: number | Nil[];

  // def = this->add("mmu_segmented_region_interlocking_depth", coFloat);
  // def->label = L("Interlocking depth of a segmented region");
  // def->tooltip = L("Interlocking depth of a segmented region. It will be ignored if "
  //                    "\"mmu_segmented_region_max_width\" is zero or if \"mmu_segmented_region_interlocking_depth\""
  //                    "is bigger then \"mmu_segmented_region_max_width\". Zero disables this feature.");
  // def->sidetext = L("mm (zero to disable)");
  // def->min = 0;
  // def->category = L("Advanced");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionFloat(0.));
  // ; mmu_segmented_region_interlocking_depth = 0
  mmuSegmentedRegionInterlockingDepth = 0;

  // def = this->add("multimaterial_purging", coFloat);
  // def->label = L("Purging volume");
  // def->tooltip = L("Determines purging volume on the wipe tower. This can be modified in Filament Settings "
  //                  "('filament_purge_multiplier') or overridden using project-specific settings.");
  // def->sidetext = L("mm³");
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloat(140.));
  // ; multimaterial_purging = 140
  multiMaterialPurging = 140;

  // def = this->add("nozzle_high_flow", coBools);
  // def->label = L("High flow nozzle");
  // def->tooltip = L("High flow nozzles allow higher print speeds.");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBools{false});
  // ; nozzle_high_flow = 0,0
  nozzleHighFlow: boolean[];

  // def = this->add("only_one_perimeter_first_layer", coBool);
  // def->label = L("Only one perimeter on first layer");
  // def->category = L("Layers and Perimeters");
  // def->tooltip = L("Use only one perimeter on the first layer.");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBool(false));
  // ; only_one_perimeter_first_layer = 0
  onlyOnePerimeterFirstLayer = false;

  // def           = this->add("overhang_fan_speed_0", coInts);
  // def->label    = L("speed for 0% overlap (bridge)");
  // def->tooltip  = fan_speed_setting_description;
  // def->sidetext = L("%");
  // def->min      = 0;
  // def->max      = 100;
  // def->mode     = comExpert;
  // def->set_default_value(new ConfigOptionInts{0});
  // ; overhang_fan_speed_0 = 0,0
  overHangFanSpeed0: number[];
  // ; overhang_fan_speed_1 = 0,0
  overHangFanSpeed1: number[];
  // ; overhang_fan_speed_2 = 0,0
  overHangFanSpeed2: number[];
  // ; overhang_fan_speed_3 = 0,0
  overHangFanSpeed3: number[];

  // def             = this->add("overhang_speed_0", coFloatOrPercent);
  // def->label      = L("speed for 0% overlap (bridge)");
  // def->category   = L("Speed");
  // def->tooltip    = overhang_speed_setting_description;
  // def->sidetext   = L("mm/s or %");
  // def->min        = 0;
  // def->mode       = comExpert;
  // def->set_default_value(new ConfigOptionFloatOrPercent(15, false));
  // TODO: NOTE: mm/s
  // ; overhang_speed_0 = 15
  overHangSpeed0 = 15;
  // ; overhang_speed_1 = 15
  overHangSpeed1 = 15;
  // ; overhang_speed_2 = 20
  overHangSpeed2 = 20;
  // ; overhang_speed_3 = 25
  overHangSpeed3 = 25;

  // def = this->add("prefer_clockwise_movements", coBool);
  // def->label = L("Prefer clockwise movements");
  // def->tooltip = L("This setting makes the printer print loops clockwise instead of counterclockwise.");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBool(false));
  // ; prefer_clockwise_movements = 0
  preferClockwiseMovements = false;

  // def = this->add("solid_infill_acceleration", coFloat);
  // def->label = L("Solid infill");
  // def->tooltip = L("This is the acceleration your printer will use for solid infill. Set zero to use "
  //                  "the value for infill.");
  // def->sidetext = L("mm/s²");
  // def->min = 0;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionFloat(0));
  // ; solid_infill_acceleration = 0
  solidInfillAcceleration = 0;

  // def = this->add("staggered_inner_seams", coBool);
  // def->label = L("Staggered inner seams");
  // // TRN PrintSettings: "Staggered inner seams"
  // def->tooltip = L("This option causes the inner seams to be shifted backwards based on their depth, forming a zigzag pattern.");
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionBool(false));
  // ; staggered_inner_seams = 0
  staggeredInnerSeams = false;

  // def = this->add("support_tree_angle", coFloat);
  // def->label = L("Maximum Branch Angle");
  // def->category = L("Support material");
  // // TRN PrintSettings: "Organic supports" > "Maximum Branch Angle"
  // def->tooltip = L("The maximum angle of the branches, when the branches have to avoid the model. "
  //                  "Use a lower angle to make them more vertical and more stable. Use a higher angle to be able to have more reach.");
  // def->sidetext = L("°");
  // def->min = 0;
  // def->max = 85;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloat(40));
  // ; support_tree_angle = 40
  supportTreeAngle = 40;
  // ; support_tree_angle_slow = 25
  support_tree_angle_slow = 25;

  // def = this->add("support_tree_branch_diameter", coFloat);
  // def->label = L("Branch Diameter");
  // def->category = L("Support material");
  // // TRN PrintSettings: "Organic supports" > "Branch Diameter"
  // def->tooltip = L("The diameter of the thinnest branches of organic support. Thicker branches are more sturdy. "
  //                  "Branches towards the base will be thicker than this.");
  // def->sidetext = L("mm");
  // def->min = 0.1f;
  // def->max = 100.f;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloat(2));
  // ; support_tree_branch_diameter = 2
  supportTreeBranchDiameter = 2;

  // def = this->add("support_tree_branch_diameter_angle", coFloat);
  // TRN PrintSettings: #lmFIXME
  // def->label = L("Branch Diameter Angle");
  // def->category = L("Support material");
  // TRN PrintSettings: "Organic supports" > "Branch Diameter Angle"
  // def->tooltip = L("The angle of the branches' diameter as they gradually become thicker towards the bottom. "
  //                  "An angle of 0 will cause the branches to have uniform thickness over their length. "
  //                  "A bit of an angle can increase stability of the organic support.");
  // def->sidetext = L("°");
  // def->min = 0;
  // def->max = 15;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloat(5));
  // ; support_tree_branch_diameter_angle = 5
  supportTreeBranchDiameterAngle = 5;

  // def = this->add("support_tree_branch_diameter_double_wall", coFloat);
  // def->label = L("Branch Diameter with double walls");
  // def->category = L("Support material");
  // // TRN PrintSettings: "Organic supports" > "Branch Diameter"
  // def->tooltip = L("Branches with area larger than the area of a circle of this diameter will be printed with double walls for stability. "
  //                  "Set this value to zero for no double walls.");
  // def->sidetext = L("mm");
  // def->min = 0;
  // def->max = 100.f;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloat(3));
  // ; support_tree_branch_diameter_double_wall = 3
  supportTreeBranchDiameterDoubleWall = 3;

  // Tree Support Branch Distance
  // How far apart the branches need to be when they touch the model. Making this distance small will cause
  // the tree support to touch the model at more points, causing better overhang but making support harder to remove.
  // def = this->add("support_tree_branch_distance", coFloat);
  // // TRN PrintSettings: #lmFIXME
  // def->label = L("Branch Distance");
  // def->category = L("Support material");
  // // TRN PrintSettings: "Organic supports" > "Branch Distance"
  // def->tooltip = L("How far apart the branches need to be when they touch the model. "
  //                  "Making this distance small will cause the tree support to touch the model at more points, "
  //                  "causing better overhang but making support harder to remove.");
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloat(1.));
  // ; support_tree_branch_distance = 1
  supportTreeBranchDistance = 1;

  // def = this->add("support_tree_tip_diameter", coFloat);
  // def->label = L("Tip Diameter");
  // def->category = L("Support material");
  // // TRN PrintSettings: "Organic supports" > "Tip Diameter"
  // def->tooltip = L("Branch tip diameter for organic supports.");
  // def->sidetext = L("mm");
  // def->min = 0.1f;
  // def->max = 100.f;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloat(0.8));
  // ; support_tree_tip_diameter = 0.8
  supportTreeTipDiameter = 0.8;

  // def = this->add("support_tree_top_rate", coPercent);
  // def->label = L("Branch Density");
  // def->category = L("Support material");
  // TRN PrintSettings: "Organic supports" > "Branch Density"
  // def->tooltip = L("Adjusts the density of the support structure used to generate the tips of the branches. "
  //                  "A higher value results in better overhangs but the supports are harder to remove, "
  //                  "thus it is recommended to enable top support interfaces instead of a high branch density value "
  //                  "if dense interfaces are needed.");
  // def->sidetext = L("%");
  // def->min = 5;
  // def->max_literal = 35;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionPercent(15));
  // ; support_tree_top_rate = 15%
  supportTreeTopRate = 15;

  // def = this->add("top_one_perimeter_type", coEnum);
  // def->label = L("Single perimeter on top surfaces");
  // def->category = L("Layers and Perimeters");
  // def->tooltip = L("Use only one perimeter on flat top surface, to give more space to the top infill pattern. Could be applied on topmost surface or all top surfaces.");
  // def->mode = comExpert;
  // def->set_enum<TopOnePerimeterType>({
  //     { "none",    L("Disabled") },
  //     { "top",     L("All top surfaces") },
  //     { "topmost", L("Topmost surface only") }
  // });
  // def->set_default_value(new ConfigOptionEnum<TopOnePerimeterType>(TopOnePerimeterType::None));
  // ; top_one_perimeter_type = none
  topOnePerimeterType = TopOnePerimeterType.NONE;

  // def = this->add("top_solid_infill_acceleration", coFloat);
  // def->label = L("Top solid infill");
  // def->tooltip = L("This is the acceleration your printer will use for top solid infill. Set zero to use "
  //                  "the value for solid infill.");
  // def->sidetext = L("mm/s²");
  // def->min = 0;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionFloat(0));
  // ; top_solid_infill_acceleration = 0
  topSolidInfillAcceleration = 0;

  // def = this->add("travel_acceleration", coFloat);
  // def->label = L("Travel");
  // def->tooltip = L("This is the acceleration your printer will use for travel moves. Set zero to disable "
  //                  "acceleration control for travel.");
  // def->sidetext = L("mm/s²");
  // def->min = 0;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionFloat(0));
  // ; travel_acceleration = 0
  travelAcceleration = 0;

  //   def = this->add("travel_lift_before_obstacle", coBools);
  // def->label = L("Steeper ramp before obstacles");
  // def->tooltip = L("If enabled, PrusaSlicer detects obstacles along the travel path and makes the slope steeper "
  //                  "in case an obstacle might be hit during the initial phase of the travel.");
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionBools{false});
  // ; travel_lift_before_obstacle = 0,0
  travelLiftBeforeObstacle: boolean[];

  // def = this->add("travel_max_lift", coFloats);
  // def->label = L("Maximum ramping lift");
  // def->tooltip = L("Maximum lift height of the ramping lift. It may not be reached if the next position "
  //                  "is close to the old one.");
  // def->sidetext = L("mm");
  // def->min = 0;
  // def->max_literal = 1000;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloats{0.0});
  // ; travel_max_lift = 0,0
  travelMaxLift: number[];

  // def = this->add("travel_ramping_lift", coBools);
  // def->label = L("Use ramping lift");
  // def->tooltip = L("Generates a ramping lift instead of lifting the extruder directly upwards. "
  //                  "The travel is split into two phases: the ramp and the standard horizontal travel. "
  //                  "This option helps reduce stringing.");
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionBools{ false });
  // ; travel_ramping_lift = 0,0
  travelRampLift: boolean[];

  // def = this->add("travel_slope", coFloats);
  // def->label = L("Ramping slope angle");
  // def->tooltip = L("Slope of the ramp in the initial phase of the travel.");
  // def->sidetext = L("°");
  // def->min = 0;
  // def->max = 90;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionFloats{0.0});
  // ; travel_slope = 0,0
  travelSlope: number[];

  // def = this->add("wipe_tower_acceleration", coFloat);
  // def->label = L("Wipe tower");
  // def->tooltip = L("This is the acceleration your printer will use for wipe tower. Set zero to disable "
  //                  "acceleration control for the wipe tower.");
  // def->sidetext = L("mm/s²");
  // def->min = 0;
  // def->mode = comExpert;
  // def->set_default_value(new ConfigOptionFloat(0));
  // ; wipe_tower_acceleration = 0
  wipeTowerAcceleration = 0;

  // def = this->add("wipe_tower_cone_angle", coFloat);
  // def->label = L("Stabilization cone apex angle");
  // def->tooltip = L("Angle at the apex of the cone that is used to stabilize the wipe tower. "
  //                  "Larger angle means wider base.");
  // def->sidetext = L("°");
  // def->mode = comAdvanced;
  // def->min = 0.;
  // def->max = 90.;
  // def->set_default_value(new ConfigOptionFloat(0.));
  // ; wipe_tower_cone_angle = 0
  wipeTowerConeAngle = 0;

  // def = this->add("wipe_tower_extra_flow", coPercent);
  // def->label = L("Extra flow for purging");
  // def->tooltip = L("Extra flow used for the purging lines on the wipe tower. This makes the purging lines thicker or narrower "
  //                  "than they normally would be. The spacing is adjusted automatically.");
  // def->sidetext = L("%");
  // def->mode = comExpert;
  // def->min = 100.;
  // def->max = 300.;
  // def->set_default_value(new ConfigOptionPercent(100.));
  // ; wipe_tower_extra_flow = 100%
  wipeTowerExtraFlow = 100;

  // def = this->add("wipe_tower_extra_spacing", coPercent);
  // def->label = L("Wipe tower purge lines spacing");
  // def->tooltip = L("Spacing of purge lines on the wipe tower.");
  // def->sidetext = L("%");
  // def->mode = comExpert;
  // def->min = 100.;
  // def->max = 300.;
  // def->set_default_value(new ConfigOptionPercent(100.));
  // ; wipe_tower_extra_spacing = 100%
  wipeTowerExtraSpacing = 100;

  // def = this->add("wipe_tower_extruder", coInt);
  // def->label = L("Wipe tower extruder");
  // def->category = L("Extruders");
  // def->tooltip = L("The extruder to use when printing perimeter of the wipe tower. "
  //                  "Set to 0 to use the one that is available (non-soluble would be preferred).");
  // def->min = 0;
  // def->mode = comAdvanced;
  // def->set_default_value(new ConfigOptionInt(0));
  // ; wipe_tower_extruder = 0
  wipeTowerExtruder = 0;

  // def = this->add("wiping_volumes_use_custom_matrix", coBool);
  // def->label = "";
  // def->tooltip = "";
  // def->set_default_value(new ConfigOptionBool{ false });
  // ; wiping_volumes_use_custom_matrix = 1
  // TODO: 3mf file default is different from printConfig.ccp default
  // TODO: verify what this does:
  // if (config.has("wiping_volumes_matrix") && !config.has("wiping_volumes_use_custom_matrix")) {
  // This is apparently some pre-2.7.3 config, where the wiping_volumes_matrix was always used.
  // The 2.7.3 introduced an option to use defaults derived from config. In case the matrix
  // contains only default values, switch it to default behaviour. The default values
  // were zeros on the diagonal and 140 otherwise.
  //       std::vector<double> matrix = config.opt<ConfigOptionFloats>("wiping_volumes_matrix")->values;
  //       int num_of_extruders = int(std::sqrt(matrix.size()) + 0.5);
  //       int i = -1;
  //       bool custom = false;
  //       for (int j = 0; j < int(matrix.size()); ++j) {
  //           if (j % num_of_extruders == 0)
  //               ++i;
  //           if (i != j % num_of_extruders && !is_approx(matrix[j], 140.)) {
  //               custom = true;
  //               break;
  //           }
  //       }
  //       config.set_key_value("wiping_volumes_use_custom_matrix", new ConfigOptionBool(custom));
  //   }
  wipingVolumesUseCustomMatrix = false;

  // not used by PrusaSlicer
  clearBufferCommand = 'G4 P0';
  coolingModuleSpeed: number[];
  enableCoolingModuleAtLayer: number[];
  towerSpeed: number[];
  firstLayerTowerSpeed: number[];
  towerExtrusionWidth = 0.45;
  // TODO - replace 
  chamberTemperature = 0;
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
    this.cooling = new Array(extruderCount).fill(true);
    this.deretractSpeed = new Array(extruderCount).fill(0);
    this.disableFanFirstLayers = new Array(extruderCount).fill(1);
    this.endFilamentGcode = new Array(extruderCount).fill('');
    this.extruderColor = new Array(extruderCount).fill('#000000');
    this.extruderOffset = new Array(extruderCount).fill(0).map(() => [0, 0]);
    this.extrusionMultiplier = new Array(extruderCount).fill(1);
    this.fanAlwaysOn = new Array(extruderCount).fill(true);
    this.fanBelowLayerTime = new Array(extruderCount).fill(100);
    this.filamentColor = new Array(extruderCount).fill('#000000');
    this.filamentCoolingFinalSpeed = new Array(extruderCount).fill(0);
    this.filamentCoolingInitialSpeed = new Array(extruderCount).fill(0);
    this.filamentCoolingMoves = new Array(extruderCount).fill(0);
    this.filamentCost = new Array(extruderCount).fill(0);
    this.filamentDensity = new Array(extruderCount).fill(1.25);
    this.filamentDeretractSpeed = new Array(extruderCount).fill('nil');
    this.filamentDiameter = new Array(extruderCount).fill(1.75);
    this.filamentLoadTime = new Array(extruderCount).fill(0);
    this.filamentLoadingSpeed = new Array(extruderCount).fill(28);
    this.filamentLoadingSpeedStart = new Array(extruderCount).fill(0);
    this.filamentMaxVolumetricSpeed = new Array(extruderCount).fill(0);
    this.filamentMinimalPurgeOnWipeTower = new Array(extruderCount).fill(0);
    this.filamentNotes = new Array(extruderCount).fill('');
    this.filamentRammingParameters = new Array(extruderCount).fill('');
    this.filamentRetractBeforeTravel = new Array(extruderCount).fill('nil');
    this.filamentRetractBeforeWipe = new Array(extruderCount).fill('nil');
    this.filamentRetractLayerChange = new Array(extruderCount).fill('nil');
    this.filamentRetractLength = new Array(extruderCount).fill('nil');
    this.filamentRetractLift = new Array(extruderCount).fill('nil');
    this.filamentRetractLiftAbove = new Array(extruderCount).fill('nil');
    this.filamentRetractLiftBelow = new Array(extruderCount).fill('nil');
    this.filamentRetractRestartExtra = new Array(extruderCount).fill('nil');
    this.filamentRetractSpeed = new Array(extruderCount).fill('nil');
    this.filamentSettingsId = new Array(extruderCount).fill(`${SETTINGS_ID} (Filament)`);
    this.filamentSoluble = new Array(extruderCount).fill(false);
    this.filamentSpoolWeight = new Array(extruderCount).fill(0);
    this.filamentToolchangeDelay = new Array(extruderCount).fill(0);
    this.filamentType = new Array(extruderCount).fill('PLA');
    this.filamentUnloadTime = new Array(extruderCount).fill(0);
    this.filamentUnloadingSpeed = new Array(extruderCount).fill(0);
    this.filamentUnloadingSpeedStart = new Array(extruderCount).fill(0);
    this.filamentWipe = new Array(extruderCount).fill('nil');
    this.firstLayerBedTemperature = new Array(extruderCount).fill(0);
    this.firstLayerTemperature = new Array(extruderCount).fill(215);
    this.fullFanSpeedLayer = new Array(extruderCount).fill(4);
    this.maxFanSpeed = new Array(extruderCount).fill(100);
    this.maxLayerHeight = new Array(extruderCount).fill(0.25);
    this.minFanSpeed = new Array(extruderCount).fill(100);
    this.minLayerHeight = new Array(extruderCount).fill(0.07);
    this.minPrintSpeed = new Array(extruderCount).fill(15);
    this.nozzleDiameter = new Array(extruderCount).fill(0.4);
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
    this.wipe = new Array(extruderCount).fill(false);
    this.wipingVolumesExtruders = new Array(extruderCount).fill(0).map(() => [70, 70]);
    this.wipingVolumesMatrix = new Array(extruderCount)
      .fill(0)
      .map((_, i) => new Array(extruderCount).fill(0).map((__, j) => (i === j ? 0 : 140)));
    this.towerSpeed = new Array(extruderCount).fill(0);
    this.firstLayerTowerSpeed = new Array(extruderCount).fill(0);
    this.startFilamentGcodePrinterscript = new Array(extruderCount).fill('');
    this.enableCoolingModuleAtLayer = new Array(extruderCount).fill(0);
    this.coolingModuleSpeed = new Array(extruderCount).fill(100);
    this.zOffsetPerExt = new Array(extruderCount).fill(0);
    this.chamberMinimalTemperatureActual = new Array(extruderCount).fill(0);
    this.chamberTemperatureActual = new Array(extruderCount).fill(0);
    this.enableDynamicFanSpeed = new Array(extruderCount).fill(false);
    this.filamentAbrasive = new Array(extruderCount).fill(false);
    this.filamentInfillMaxCrossingSpeed = new Array(extruderCount).fill(0);
    this.filamentInfillMaxSpeed = new Array(extruderCount).fill(0);
    this.filamentMultiToolRamming = new Array(extruderCount).fill(false);
    this.filamentMultiToolRammingFlow = new Array(extruderCount).fill(10);
    this.filamentMultiToolRammingVolume = new Array(extruderCount).fill(10);
    this.filamentPurgeMultiplier = new Array(extruderCount).fill(100);
    this.filamentRetractLengthToolChange = new Array(extruderCount).fill('nil');
    this.filamentRetractRestartExtraToolChange = new Array(extruderCount).fill('nil');
    this.filamentShrinkageCompensationXY = new Array(extruderCount).fill(0);
    this.filamentShrinkageCompensationZ = new Array(extruderCount).fill(0);
    this.filamentStampingDistance = new Array(extruderCount).fill(0);
    this.filamentStampingLoadingSpeed = new Array(extruderCount).fill(20);
    this.filamentTravelLiftBeforeObstacle = new Array(extruderCount).fill('nil');
    this.filamentTravelMaxLift = new Array(extruderCount).fill('nil');
    this.filamentTravelRampLift = new Array(extruderCount).fill('nil');
    this.filamentTravelSlope = new Array(extruderCount).fill('nil');
    this.idleTemperature = new Array(extruderCount).fill('nil');
    this.nozzleHighFlow = new Array(extruderCount).fill(false);
    this.overHangFanSpeed0 = new Array(extruderCount).fill(0);
    this.overHangFanSpeed1 = new Array(extruderCount).fill(0);
    this.overHangFanSpeed2 = new Array(extruderCount).fill(0);
    this.overHangFanSpeed3 = new Array(extruderCount).fill(0);
    this.travelLiftBeforeObstacle = new Array(extruderCount).fill(false);
    this.travelMaxLift = new Array(extruderCount).fill(0);
    this.travelRampLift = new Array(extruderCount).fill(false);
    this.travelSlope = new Array(extruderCount).fill(0);
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

; avoid_crossing_perimeters = ${boolToIntString(this.avoidCrossingPerimeters)}
; avoid_crossing_perimeters_max_detour = ${this.avoidCrossingPerimetersMaxDetour}
; bed_custom_model = ${this.bedCustomModel}
; bed_custom_texture = ${this.bedCustomTexture}
; bed_shape = ${this.getBedShapeString()}
; bed_temperature = ${this.bedTemperature.join(',')}
; before_layer_gcode = ${this.beforeLayerGcode || ';'}
; between_objects_gcode = ${this.betweenObjectsGcode || ';'}
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
; end_filament_gcode = ${this.endFilamentGcode.map((gcode) => (gcode ? `"${gcode}"` : '";"')).join(';')}
; end_gcode = ${this.endGcode || ';'}
; ensure_vertical_shell_thickness = ${boolToIntString(this.ensureVerticalShellThickness)}
; external_perimeter_extrusion_width = ${this.externalPerimeterExtrusionWidth}
; external_perimeter_speed = ${this.externalPerimeterSpeed}
; external_perimeters_first = ${boolToIntString(this.externalPerimetersFirst)}
; extra_loading_move = ${this.extraLoadingMove}
; extra_perimeters = ${boolToIntString(this.extraPerimeters)}
; extruder_clearance_height = ${this.extruderClearanceHeight}
; extruder_clearance_radius = ${this.extruderClearanceRadius}
; extruder_colour = ${this.extruderColor.join(';')}
; extruder_offset = ${this.extruderOffset.map(([x, y]) => `${x}x${y}`).join(',')}
; extrusion_axis = ${this.extrusionAxis}
; extrusion_multiplier = ${this.extrusionMultiplier.join(',')}
; extrusion_width = ${this.extrusionWidth}
; fan_always_on = ${this.fanAlwaysOn.map(boolToIntString).join(',')}
; fan_below_layer_time = ${this.fanBelowLayerTime.join(',')}
; filament_colour = ${this.filamentColor.join(';')}
; filament_cooling_final_speed = ${this.filamentCoolingFinalSpeed.join(',')}
; filament_cooling_initial_speed = ${this.filamentCoolingInitialSpeed.join(',')}
; filament_cooling_moves = ${this.filamentCoolingMoves.join(',')}
; filament_cost = ${this.filamentCost.join(',')}
; filament_density = ${this.filamentDensity.join(',')}
; filament_deretract_speed = ${this.filamentDeretractSpeed.join(',')}
; filament_diameter = ${this.filamentDiameter.join(',')}
; filament_load_time = ${this.filamentLoadTime.join(',')}
; filament_loading_speed = ${this.filamentLoadingSpeed.join(',')}
; filament_loading_speed_start = ${this.filamentLoadingSpeedStart.join(',')}
; filament_max_volumetric_speed = ${this.filamentMaxVolumetricSpeed.join(',')}
; filament_minimal_purge_on_wipe_tower = ${this.filamentMinimalPurgeOnWipeTower.join(',')}
; filament_notes = ${this.filamentNotes.map((notes) => `"${notes}"`).join(';')}
; filament_ramming_parameters = ${this.filamentRammingParameters.map((params) => `"${params}"`).join(';')}
; filament_retract_before_travel = ${this.filamentRetractBeforeTravel.join(',')}
; filament_retract_before_wipe = ${this.filamentRetractBeforeWipe.join(',')}
; filament_retract_layer_change = ${this.filamentRetractLayerChange.join(',')}
; filament_retract_length = ${this.filamentRetractLength.join(',')}
; filament_retract_lift = ${this.filamentRetractLift.join(',')}
; filament_retract_lift_above = ${this.filamentRetractLiftAbove.join(',')}
; filament_retract_lift_below = ${this.filamentRetractLiftBelow.join(',')}
; filament_retract_restart_extra = ${this.filamentRetractRestartExtra.join(',')}
; filament_retract_speed = ${this.filamentRetractSpeed.join(',')}
; filament_settings_id = ${this.filamentSettingsId.map((val) => `"${val}"`).join(';')}
; filament_soluble = ${this.filamentSoluble.map(boolToIntString).join(',')}
; filament_spool_weight = ${this.filamentSpoolWeight.join(',')}
; filament_toolchange_delay = ${this.filamentToolchangeDelay.join(',')}
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
; infill_acceleration = ${this.infillAcceleration}
; infill_anchor = ${this.infillAnchor}
; infill_anchor_max = ${this.infillAnchorMax}
; infill_every_layers = ${this.infillEveryLayers}
; infill_extruder = ${this.infillExtruder}
; infill_extrusion_width = ${this.infillExtrusionWidth}
; infill_first = ${boolToIntString(this.infillFirst)}
; infill_only_where_needed = ${boolToIntString(this.infillOnlyWhereNeeded)}
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
; mmu_segmented_region_max_width = ${this.mmuSegmentedRegionMaxWidth}
; notes = ${this.notes}
; nozzle_diameter = ${this.nozzleDiameter.join(',')}
; only_retract_when_crossing_perimeters = ${boolToIntString(this.onlyRetractWhenCrossingPerimeters)}
; ooze_prevention = ${boolToIntString(this.oozePrevention)}
; output_filename_format = ${this.outputFilenameFormat}
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
; retract_before_wipe = ${this.retractBeforeWipe.map((val) => `${val}%`).join(',')}
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
; solid_infill_below_area = ${this.solidInfillBelowArea}
; solid_infill_every_layers = ${this.solidInfillEveryLayers}
; solid_infill_extruder = ${this.solidInfillExtruder}
; solid_infill_extrusion_width = ${this.solidInfillExtrusionWidth}
; solid_infill_speed = ${this.solidInfillSpeed}
; spiral_vase = ${boolToIntString(this.spiralVase)}
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
; temperature = ${this.temperature.join(',')}
; template_custom_gcode = ${this.templateCustomGcode || ';'}
; thick_bridges = ${boolToIntString(this.thickBridges)}
; thin_walls = ${boolToIntString(this.thinWalls)}
; threads = ${this.threads}
; thumbnails = ${this.thumbnails.map(([x, y]) => `${x}x${y}`).join(',')}
; thumbnails_format = ${this.thumbnailsFormat}
; toolchange_gcode = ${this.toolchangeGcode || ';'}
; top_fill_pattern = ${this.topFillPattern}
; top_infill_extrusion_width = ${this.topInfillExtrusionWidth}
; top_solid_infill_speed = ${this.topSolidInfillSpeed}
; top_solid_layers = ${this.topSolidLayers}
; top_solid_min_thickness = ${this.topSolidMinThickness}
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
; wipe_tower_bridging = ${this.wipeTowerBridging}
; wipe_tower_brim_width = ${this.wipeTowerBrimWidth}
; wipe_tower_no_sparse_layers = ${boolToIntString(this.wipeTowerNoSparseLayers)}
; wipe_tower_rotation_angle = ${this.wipeTowerRotationAngle}
; wipe_tower_width = ${this.wipeTowerWidth}
; wipe_tower_x = ${this.wipeTowerX}
; wipe_tower_y = ${this.wipeTowerY}
; wiping_volumes_extruders = ${this.wipingVolumesExtruders.map((vals) => vals.join(',')).join(',')}
; wiping_volumes_matrix = ${this.wipingVolumesMatrix.map((vals) => vals.join(',')).join(',')}
; xy_size_compensation = ${this.xySizeCompensation}
; z_offset = ${this.zOffset}
`;
  }
}
