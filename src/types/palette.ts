export const deviceTypes = ['palette', 'palette-2', 'palette-3', 'element'] as const;

export type DeviceType = typeof deviceTypes[number];

export type DeviceModels = {
  [K in DeviceType]: readonly string[];
};

export const deviceModels: DeviceModels = {
  palette: ['p', 'p-plus'],
  'palette-2': ['p2', 'p2-pro', 'p2s', 'p2s-pro'],
  'palette-3': ['p3', 'p3-pro'],
  element: ['el'],
} as const;

export type DeviceModel<T extends DeviceType> = typeof deviceModels[T][number];

export interface PaletteData<T extends DeviceType = DeviceType> {
  type: T;
  model: DeviceModel<T>;
  extruder: number;
  printerId: string;
  connectedMode: boolean;
  loadingOffset: number;
  printValue: number;
  calibrationLength: number;
  getMaxInputCount(): number;
}
