export enum GCodeFlavor {
  REPRAP_SPRINTER = 'reprap',
  REPRAP_FIRMWARE = 'reprapfirmware',
  REPETIER = 'repetier',
  TEACUP = 'teacup',
  MAKERWARE = 'makerware',
  MARLIN = 'marlin',
  SAILFISH = 'sailfish',
  SMOOTHIE = 'smoothie',
}

export enum MachineLimitsUsage {
  EMIT_TO_GCODE = 'emit_to_gcode',
  USE_FOR_TIME_ESTIMATE = 'time_estimate_only',
  IGNORE = 'ignore',
}

export enum InfillPattern {
  RECTILINEAR = 'rectilinear',
  ALIGNED_RECTILINEAR = 'alignedrectilinear',
  GRID = 'grid',
  TRIANGLES = 'triangles',
  STARS = 'stars',
  CUBIC = 'cubic',
  LINE = 'line',
  CONCENTRIC = 'concentric',
  HONEYCOMB = 'honeycomb',
  HONEYCOMB_3D = '3dhoneycomb',
  GYROID = 'gyroid',
  HILBERT_CURVE = 'hilbertcurve',
  ARCHIMEDEAN_CHORDS = 'archimedeanchords',
  OCTAGRAM_SPIRAL = 'octagramspiral',
  ADAPTIVE_CUBIC = 'adaptivecubic',
  SUPPORT_CUBIC = 'supportcubic',
  LIGHTNING = 'lightning',
}

export enum SolidFillPattern {
  RECTILINEAR = 'rectilinear',
  MONOTONIC = 'monotonic',
  ALIGNED_RECTILINEAR = 'alignedrectilinear',
  CONCENTRIC = 'concentric',
  HILBERT_CURVE = 'hilbertcurve',
  ARCHIMEDEAN_CHORDS = 'archimedeanchords',
  OCTAGRAM_SPIRAL = 'octagramspiral',
}

export enum SupportPattern {
  RECTILINEAR = 'rectilinear',
  RECTILINEAR_GRID = 'rectilinear-grid',
  HONEYCOMB = 'honeycomb',
}

export enum IroningType {
  ALL_TOP_SURFACES = 'top',
  TOPMOST_SURFACE_ONLY = 'topmost',
  ALL_SOLID_SURFACES = 'solid',
}

export enum SeamPosition {
  RANDOM = 'random',
  NEAREST = 'nearest',
  ALIGNED = 'aligned',
  REAR = 'rear',
}

export enum BrimType {
  NO_BRIM = 'no_brim',
  OUTER_ONLY = 'outer_only',
  INNER_ONLY = 'inner_only',
  OUTER_AND_INNER = 'outer_and_inner',
}

export enum DraftShieldMode {
  DISABLED = 'disabled',
  LIMITED = 'limited',
  ENABLED = 'enabled',
}

export enum FuzzySkinType {
  NONE = 'none',
  EXTERNAL_PERIMETERS = 'external',
  ALL_PERIMETERS = 'all',
}

export enum SupportStyle {
  GRID = 'grid',
  SNUG = 'snug',
}

export enum SupportInterfacePattern {
  AUTO = 'auto',
  RECTILINEAR = 'rectilinear',
  CONCENTRIC = 'concentric',
}

export enum PerimeterGenerator {
  CLASSIC = 'classic',
  ARACHNE = 'arachne',
}

// def->set_enum<LabelObjectsStyle>({
//     { "disabled",   L("Disabled") },
//     { "octoprint",  L("OctoPrint comments") },
//     { "firmware",   L("Firmware-specific") }
//     });
export enum GcodeLabelObjects {
  DISABLED = 'disabled',
  OCTOPRINT = 'octoprint', // OctoPrint comments
  FIRMWARE = 'firmware', // Firmware-specific
}

// def = this->add("arc_fitting", coEnum);
// def->label = L("Arc fitting");
// def->tooltip = L("Enable to get a G-code file which has G2 and G3 moves. "
//                  "G-code resolution will be used as the fitting tolerance.");
// def->set_enum<ArcFittingType>({
//     { "disabled",       "Disabled" },
//     { "emit_center",    "Enabled: G2/3 I J" }
// });
// def->mode = comAdvanced;
// def->set_default_value(new ConfigOptionEnum<ArcFittingType>(ArcFittingType::Disabled));

export enum ArcFitting {
  DISABLED = 'disabled',
  EMIT_CENTER = 'emit_center', //Enabled: G2/3 I J
}

// def->set_enum<TopOnePerimeterType>({
//   { "none",    L("Disabled") },
//   { "top",     L("All top surfaces") },
//   { "topmost", L("Topmost surface only") }
// });
export enum TopOnePerimeterType {
  NONE = 'none', //Disabled
  TOP = 'top', // All top surfaces
  TOPMOST = 'topmost', // Topmost surface only
}
