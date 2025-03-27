import type { Material, MaterialStyleFlags, MaterialStyleValues } from './types/materials';
import type { AutoStyleVariant, NumericStyleVariant, StyleVariant } from './types/styles';
import type { DriveColorStrength, VariableTransitions } from './types/transitions';

import type { ProjectColor } from '.';

export type RGB = [number, number, number];

export type RGBA = [number, number, number, number];

export const roundTo = (value: number, decimalPlaces: number) => {
  const factor = 10 ** decimalPlaces;
  return Math.round(value * factor) / factor;
};

export const boolToIntString = (value?: boolean): string => (value ? '1' : '0');

export const rgbToHex = (rgb: RGB | RGBA): string =>
  rgb
    .slice(0, 3)
    .map((channel) => `00${channel.toString(16)}`.slice(-2))
    .join('');

export const getMaterialFieldValue = <T extends keyof MaterialStyleValues>(
  material: Material,
  fieldName: T,
  defaultValue: MaterialStyleValues[T]
): MaterialStyleValues[T] => {
  const firstChar = fieldName[0]!.toUpperCase();
  const remainingChars = fieldName.slice(1);
  const useField = `use${firstChar}${remainingChars}` as keyof MaterialStyleFlags;
  return material.style[useField] ? material.style[fieldName] : defaultValue;
};

export const getVolumetricFlowRate = (
  feedrate: number,
  layerHeight: number,
  extrusionWidth: number
): number => layerHeight * extrusionWidth * feedrate;

export const validateArrayLengths = (
  extCount: number,
  materials: Material[],
  colors: ProjectColor[],
  drivesUsed: boolean[],
  variableTransitions?: VariableTransitions
) => {
  if (materials.length < extCount) {
    throw new Error(`Expected ${extCount} materials, but received ${materials.length}`);
  }
  if (colors.length < extCount) {
    throw new Error(`Expected ${extCount} colors, but received ${colors.length}`);
  }
  if (drivesUsed.length < extCount) {
    throw new Error(`Expected ${extCount} drivesUsed values, but received ${drivesUsed.length}`);
  }
  if (variableTransitions) {
    if (variableTransitions.advancedMode) {
      // advanced configuration allows N x N values to be provided
      const { transitionLengths } = variableTransitions;
      const err = new Error(`Expected ${extCount} x ${extCount} transition lengths`);
      if (transitionLengths.length < extCount) throw err;
      for (let i = 0; i < extCount; i++) {
        const row = transitionLengths[i]!;
        if (row.length < extCount) throw err;
      }
    } else if (variableTransitions.driveColorStrengths.length < extCount) {
      // simple configuration allows N drive color strengths to be provided
      const actualLength = variableTransitions.driveColorStrengths.length;
      throw new Error(`Expected ${extCount} drive color strengths, but received ${actualLength}`);
    }
  }
};

export function variantValue(variantData: NumericStyleVariant, percentMultiplier: number): number;

export function variantValue(
  variantData: NumericStyleVariant | AutoStyleVariant,
  percentMultiplier: number,
  autoValue: number
): number;

export function variantValue(
  variantData: StyleVariant,
  percentMultiplier: number,
  autoValue?: number
): number | undefined {
  if (variantData.value === 'auto') {
    return autoValue;
  }
  if (variantData.units === '%') {
    return Math.round(variantData.value * percentMultiplier * 1000) / 100000;
  }
  return variantData.value;
}

export const getTransitionLength = (
  ingoingStrength: DriveColorStrength,
  outgoingStrength: DriveColorStrength,
  min: number,
  max: number
): number => {
  // drive strength     t
  // ----------------   ----
  // -1 = weak          0 = min transition length
  //  0 = normal        ...
  //  1 = strong        1 = max transition length
  //
  //  t =       | -1    0     1      (to)
  //        ----+------------------
  //         -1 | 0.5   0.25  0
  //  (from)  0 | 0.75  0.5   0.25
  //          1 | 1     0.75  0.5
  //
  // t = (outgoingStrength - ingoingStrength) is in range [-2 .. 2]
  //     - add 2 for range [0 .. 4]
  //     - divide by 4 for range [0 .. 1]
  const t = (outgoingStrength - ingoingStrength + 2) / 4;
  return Math.round(t * (max - min) + min);
};
