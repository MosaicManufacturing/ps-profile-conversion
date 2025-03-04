import { InfillPattern } from '../enums';

export enum PerimeterOrder {
  PerimeterFirst = 0,
  // LoopThenPerimeter = 1,
  PerimeterLast = 2,
}

export enum SolidFillStyle {
  Rectilinear = 0,
  Monotonic = 1,
  Concentric = 2,
}

export enum TopSolidFillStyle {
  Auto = -1,
  Rectilinear = 0,
  Monotonic = 1,
  Concentric = 2,
}

export enum InfillStyle {
  STRAIGHT = 0,
  OCTAGONAL = 1,
  ROUNDED = 2,
  CELLULAR = 3,
  // DYNAMIC = 4,
}
export enum Slic3rInfillStyle {
  Rectilinear = 0,
  Triangles = 1,
  Gyroid = 2,
  AdaptiveCubic = 3,
  Honeycomb3D = 4,
  Lightning = 5,
}

export enum SupportStylesCanvas {
  grid = 0,
  snug = 1,
}

export const slic3rInfillStylesToFillPattern: Readonly<Record<Slic3rInfillStyle, InfillPattern>> = {
  [Slic3rInfillStyle.Rectilinear]: InfillPattern.RECTILINEAR,
  [Slic3rInfillStyle.Triangles]: InfillPattern.TRIANGLES,
  [Slic3rInfillStyle.Gyroid]: InfillPattern.GYROID,
  [Slic3rInfillStyle.AdaptiveCubic]: InfillPattern.ADAPTIVE_CUBIC,
  [Slic3rInfillStyle.Honeycomb3D]: InfillPattern.HONEYCOMB_3D,
  [Slic3rInfillStyle.Lightning]: InfillPattern.LIGHTNING,
} as const;

export enum TransitionMethod {
  None = 0,
  Tower = 1,
  Side = 2,
}

export interface NumericStyleVariant<T extends string = string> {
  units: T;
  value: number;
}

export interface AutoStyleVariant {
  units?: never;
  value: 'auto';
}

export type StyleVariant = NumericStyleVariant | AutoStyleVariant;

export interface StyleSettings {
  skinThickness: NumericStyleVariant<'mm'> | NumericStyleVariant<'layers'>;
  topSkinThickness: NumericStyleVariant<'mm'> | NumericStyleVariant<'layers'> | AutoStyleVariant;
  semiSolidLayers?: boolean;
  extrusionMultiplier: number;
  layerHeight: number;
  firstLayerHeight: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'>;
  firstLayerSizeCompensation?: number;
  maxLayerHeight: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'>;
  supportedStepover: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  unsupportedStepover: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  extrusionWidth: number;
  zOffset: number;
  rapidXYSpeed: number;
  rapidZSpeed: number;
  monotonicSweep: boolean;
  solidLayerSpeed: number;
  solidLayerStyle: SolidFillStyle;
  topSolidLayerStyle: TopSolidFillStyle;
  useIroning: boolean;
  ironingFlowrate: NumericStyleVariant<'%'> | AutoStyleVariant;
  ironingSpacing: NumericStyleVariant<'mm'> | AutoStyleVariant;
  ironingSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  avoidCrossingPerimeters: boolean;
  avoidCrossingPerimetersMaxDetour: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'>;
  perimeterCount: number;
  perimeterOrder: PerimeterOrder;
  perimeterSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  externalPerimeterSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  perimeterExtrusionWidth: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  externalPerimeterExtrusionWidth: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  seamAngle: number;
  seamOnCorners: boolean;
  seamJitter: number;
  coastDistance: number;
  infillExtrusionWidth: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  useVariableLayerHeight?: boolean;
  useGapFill: boolean;
  gapFillMinLength: number;
  useRetracts: boolean;
  retractLength: number;
  retractSpeed: number;
  retractForceThreshold: number;
  retractDisableThreshold: number;
  zLift: number;
  wipeLength: number;
  infillDensity: number;
  spiralVaseMode: boolean;
  infillStyle: InfillStyle;
  infillSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'>;
  infillPerimeterOverlap: number;
  printTemperature: number;
  firstLayerPrintTemperature: NumericStyleVariant<'C'> | AutoStyleVariant;
  bedTemperature: number;
  chamberTemperature?: number;
  useFan: boolean;
  enableFanAtLayer: number;
  fanSpeed: number;
  perimeterFanSpeed: NumericStyleVariant<'%'> | AutoStyleVariant;
  bridgingFanSpeed?: NumericStyleVariant<'%'> | AutoStyleVariant;
  minLayerTime: number;
  firstLayerSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'>;
  maxBridgingSpeed?: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  useBrim: boolean;
  brimLoops: number;
  brimLayers: number;
  brimGap: number;
  useRaft?: boolean;
  useRaftInterfaces?: boolean;
  defaultRaftExtruder: number;
  raftXYInflation: number;
  lowerRaftSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'>;
  upperRaftSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'>;
  raftZGap: number;
  lowerRaftLayerHeight: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  upperRaftLayerHeight: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  lowerRaftExtrusionWidth: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  upperRaftExtrusionWidth: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  lowerRaftDensity: NumericStyleVariant<'%'> | AutoStyleVariant;
  upperRaftDensity: NumericStyleVariant<'%'> | AutoStyleVariant;
  useSupport: boolean;
  defaultSupportExtruder: NumericStyleVariant<'index'> | AutoStyleVariant;
  supportDensity: number;
  maxOverhangAngle: number;
  useSupportInterface: boolean;
  defaultSupportInterfaceExtruder: number;
  supportXYGap: number;
  supportZGap: NumericStyleVariant<'mm'> | NumericStyleVariant<'layers'>;
  supportXYInflation: number;
  useSupportStitchInterval: boolean;
  supportStitchInterval: number;
  supportSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  supportInterfaceSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'> | AutoStyleVariant;
  useCustomSupports: boolean;
  supportInterfaceThickness: NumericStyleVariant<'mm'> | NumericStyleVariant<'layers'>;
  supportInterfaceDensity: NumericStyleVariant<'%'> | AutoStyleVariant;
  supportInterfaceExtrusionWidth: NumericStyleVariant<'mm'> | AutoStyleVariant;
  transitionMethod: TransitionMethod;
  transitionLength: number;
  transitionTarget: number;
  purgeToInfill: boolean;
  towerMinDensity: number;
  towerMinBottomDensity: number;
  towerMaxDensity: number;
  towerMinBrims: number;
  towerSpeed: NumericStyleVariant<'mm/s'> | AutoStyleVariant;
  towerExtrusionWidth: NumericStyleVariant<'mm'> | AutoStyleVariant;
  sideTransitionPurgeSpeed: number;
  useCoolingModule: boolean;
  coolingModuleSpeed: number;
  enableCoolingModuleAtLayer: number;
  slic3rInfillStyle: Slic3rInfillStyle;
  useArcMoves: boolean;
  extraPerimetersIfNeeded: boolean;
  extraPerimetersOnOverhangs: boolean;
  detectBridgingPerimeters: boolean;
  singlePerimeterOnTopLayers: boolean;
  infillAnchorLength: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'>;
  maxInfillAnchorLength: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'>;
  solidLayerThresholdArea: number;
  topSolidLayerSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'>;
  smallPerimeterSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'%'>;
  gapFillSpeed: number;
  useAccelerationControl: boolean;
  defaultAcceleration: number;
  solidLayerAcceleration: number;
  topSolidLayerAcceleration: number;
  infillAcceleration: number;
  perimeterAcceleration: number;
  externalPerimeterAcceleration: number;
  firstLayerAcceleration: number;
  bridgingAcceleration: number;
  travelAcceleration: number;
  firstLayerExtrusionWidth: NumericStyleVariant<'mm'> | NumericStyleVariant<'%'>;
  maxFanSpeed: NumericStyleVariant<'%'> | AutoStyleVariant;
  useDynamicFanSpeeds: boolean;
  overhangFanSpeed0: number;
  overhangFanSpeed1: number;
  overhangFanSpeed2: number;
  overhangFanSpeed3: number;
  fanBelowLayerTime: number;
  supportStyle: SupportStylesCanvas;
}
