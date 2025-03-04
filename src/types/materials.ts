import type { AutoStyleVariant, NumericStyleVariant } from './styles';

export interface MaterialStyleValues {
  extrusionMultiplier: number;
  retractLength: number;
  retractSpeed: number;
  wipeLength: number;
  maxPrintSpeed: NumericStyleVariant<'mm/s'> | NumericStyleVariant<'mm3/s'>;
  printTemperature: number;
  firstLayerPrintTemperature: NumericStyleVariant<'C'> | AutoStyleVariant;
  bedTemperature: number;
  chamberTemperature?: number;
  useFan: boolean;
  enableFanAtLayer: number;
  fanSpeed: number;
  perimeterFanSpeed: NumericStyleVariant<'%'> | AutoStyleVariant;
  bridgingFanSpeed: NumericStyleVariant<'%'> | AutoStyleVariant;
  towerSpeed: number;
  maxBridgingSpeed: number;
  zOffset: number;
  useCoolingModule: boolean;
  coolingModuleSpeed: number;
  enableCoolingModuleAtLayer: number;
  maxFanSpeed: NumericStyleVariant<'%'> | AutoStyleVariant;
  useDynamicFanSpeeds: boolean;
  overhangFanSpeed0: number;
  overhangFanSpeed1: number;
  overhangFanSpeed2: number;
  overhangFanSpeed3: number;
  minLayerTime: number;
  fanBelowLayerTime: number;
  minPrintSpeed: number;
}

export type MaterialStyleFlags = {
  [K in keyof MaterialStyleValues as `use${Capitalize<K>}`]: boolean;
};

export type MaterialStyleSettings = MaterialStyleValues & MaterialStyleFlags;

export interface Material {
  id: string;
  name: string;
  type: string;
  timestamp: string;
  density: number;
  diameter: number;
  materialChangeSequence?: string;
  style: MaterialStyleSettings;
}
