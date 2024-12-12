/*
prusaslicer_config_overrides_begin
fuzzy_skin = all
infill_acceleration = 1000
prusaslicer_config_overrides_end
 */

const START_MARKER = 'prusaslicer_config_overrides_begin';
const END_MARKER = 'prusaslicer_config_overrides_end';

export const parseOverrides = (text: string) => {
  const overrides: Record<string, string> = {};
  // split lines, trim whitespace, and ignore whitespace-only lines
  const lines = text
    .split(/\r\n|\r|\n/g)
    .map((line) => line.trim())
    .filter((line) => !!line);

  // loop over lines until we see the start marker, and until we see the end marker
  let startMarkerFound = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (startMarkerFound) {
      if (line === END_MARKER) break;
      // if line is of format x=y, parse key x and value y and populate map
      const equalsIndex = line.indexOf('=');
      if (equalsIndex > 0) {
        const key = line.slice(0, equalsIndex).trim();
        const value = line.slice(equalsIndex + 1).trim();
        overrides[key] = value;
      }
    }
    if (line === START_MARKER) startMarkerFound = true;
  }

  return overrides;
};
