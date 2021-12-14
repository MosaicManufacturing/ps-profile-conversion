const GCodeFlavors = {
  REPRAP_SPRINTER: 'reprap',
  REPRAP_FIRMWARE: 'reprapfirmware',
  REPETIER: 'repetier',
  TEACUP: 'teacup',
  MAKERWARE: 'makerware',
  MARLIN: 'marlin',
  SAILFISH: 'sailfish',
  SMOOTHIE: 'smoothie',
};

const MachineLimitsUsage = {
  EMIT_TO_GCODE: 'emit_to_gcode',
  USE_FOR_TIME_ESTIMATE: 'time_estimate_only',
  IGNORE: 'ignore',
};

const InfillPatterns = {
  RECTILINEAR: 'rectilinear',
  ALIGNED_RECTILINEAR: 'alignedrectilinear',
  GRID: 'grid',
  TRIANGLES: 'triangles',
  STARS: 'stars',
  CUBIC: 'cubic',
  LINE: 'line',
  CONCENTRIC: 'concentric',
  HONEYCOMB: 'honeycomb',
  HONEYCOMB_3D: '3dhoneycomb',
  GYROID: 'gyroid',
  HILBERT_CURVE: 'hilbertcurve',
  ARCHIMEDEAN_CHORDS: 'archimedeanchords',
  OCTAGRAM_SPIRAL: 'octagramspiral',
  ADAPTIVE_CUBIC: 'adaptivecubic',
  SUPPORT_CUBIC: 'supportcubic',
};

const SolidFillPatterns = {
  RECTILINEAR: 'rectilinear',
  MONOTONIC: 'monotonic',
  ALIGNED_RECTILINEAR: 'alignedrectilinear',
  CONCENTRIC: 'concentric',
  HILBERT_CURVE: 'hilbertcurve',
  ARCHIMEDEAN_CHORDS: 'archimedeanchords',
  OCTAGRAM_SPIRAL: 'octagramspiral',
};

const SupportPatterns = {
  RECTILINEAR: 'rectilinear',
  RECTILINEAR_GRID: 'rectilinear-grid',
  HONEYCOMB: 'honeycomb',
};

const IroningTypes = {
  ALL_TOP_SURFACES: 'top',
  TOPMOST_SURFACE_ONLY: 'topmost',
  ALL_SOLID_SURFACES: 'solid',
};

const SeamPositions = {
  RANDOM: 'random',
  NEAREST: 'nearest',
  ALIGNED: 'aligned',
  REAR: 'rear',
};

const BrimTypes = {
  NO_BRIM: 'no_brim',
  OUTER_ONLY: 'outer_only',
  INNER_ONLY: 'inner_only',
  OUTER_AND_INNER: 'outer_and_inner',
};

const DraftShieldModes = {
  DISABLED: 'disabled',
  LIMITED: 'limited',
  ENABLED: 'enabled',
};

const FuzzySkinTypes = {
  NONE: 'none',
  EXTERNAL_PERIMETERS: 'external',
  ALL_PERIMETERS: 'all',
};

const SupportStyles = {
  GRID: 'grid',
  SNUG: 'snug',
};

const SupportInterfacePatterns = {
  AUTO: 'auto',
  RECTILINEAR: 'rectilinear',
  CONCENTRIC: 'concentric',
};

module.exports = {
  GCodeFlavors,
  MachineLimitsUsage,
  InfillPatterns,
  SolidFillPatterns,
  SupportPatterns,
  IroningTypes,
  SeamPositions,
  BrimTypes,
  DraftShieldModes,
  FuzzySkinTypes,
  SupportStyles,
  SupportInterfacePatterns,
};
