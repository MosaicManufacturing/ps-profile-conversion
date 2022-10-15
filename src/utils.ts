const roundTo = (value, decimalPlaces) => {
  const factor = 10 ** decimalPlaces;
  return Math.round(value * factor) / factor;
};

const boolToIntString = value => (value ? '1' : '0');

const rgbToHex = rgb =>
  rgb.slice(0, 3).map(channel => `00${channel.toString(16)}`.slice(-2)).join('');

const getMaterialFieldValue = (material, fieldName, defaultValue) => {
  const useField = `use${fieldName[0].toUpperCase()}${fieldName.slice(1)}`;
  return material.style[useField] ? material.style[fieldName] : defaultValue;
};

const getVolumetricFlowRate = (feedrate, layerHeight, extrusionWidth) =>
  (layerHeight * extrusionWidth * feedrate);

const validateArrayLengths = (extCount, materials, colors, drivesUsed, variableTransitions) => {
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
        if (transitionLengths[i].length < extCount) throw err;
      }
    } else if (variableTransitions.driveColorStrengths.length < extCount) {
      // simple configuration allows N drive color strengths to be provided
      const actualLength = variableTransitions.driveColorStrengths.length;
      throw new Error(`Expected ${extCount} drive color strengths, but received ${actualLength}`);
    }
  }
};

const variantValue = (variantData, percentMultiplier, autoValue = null) => {
  if (variantData.value === 'auto') return autoValue;
  if (variantData.units === '%') return Math.round(variantData.value * percentMultiplier * 1000) / 100000;
  return variantData.value;
};

const getTransitionLength = (ingoingStrength, outgoingStrength, min, max) => {
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
  const t = ((outgoingStrength - ingoingStrength) + 2) / 4;
  return Math.round((t * (max - min)) + min);
};

module.exports = {
  roundTo,
  boolToIntString,
  rgbToHex,
  getMaterialFieldValue,
  getVolumetricFlowRate,
  validateArrayLengths,
  variantValue,
  getTransitionLength,
};
