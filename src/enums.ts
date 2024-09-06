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
