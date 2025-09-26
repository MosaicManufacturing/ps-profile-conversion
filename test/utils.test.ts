import { getVolumetricFlowRate } from '../src/utils';

describe('getVolumetricFlowRate', () => {
  it('calculates correct flow rate', () => {
    // feedrate = 10 mm/s, layerHeight = 0.2 mm, extrusionWidth = 0.4 mm
    const feedrate = 10;
    const layerHeight = 0.2;
    const extrusionWidth = 0.4;
    // rectangle area
    const rectangleArea = layerHeight * (extrusionWidth - layerHeight);
    // circle area
    const circleArea = Math.PI * (layerHeight / 2) ** 2;
    // add areas
    const totalArea = rectangleArea + circleArea;
    // multiply by feedrate
    const expected = totalArea * feedrate;
    const result = getVolumetricFlowRate(feedrate, layerHeight, extrusionWidth);
    expect(result).toBe(expected);
  });

  it('returns 0 if feedrate is 0', () => {
    expect(getVolumetricFlowRate(0, 0.2, 0.4)).toBe(0);
  });

  it('returns 0 if layer height is 0', () => {
    expect(getVolumetricFlowRate(10, 0, 0.4)).toBe(0);
  });

  it('returns sphere flow when extrusion width equals layer height', () => {
    const result = getVolumetricFlowRate(10, 0.2, 0.2);
    const expected = Math.PI * (0.2 / 2) ** 2 * 10;
    expect(result).toBe(expected);
  });

  it('scales linearly with feedrate', () => {
    const r1 = getVolumetricFlowRate(100, 0.2, 0.4);
    const r2 = getVolumetricFlowRate(200, 0.2, 0.4);
    expect(r2).toBe(r1 * 2);
  });

  it('throws for negative inputs', () => {
    expect(() => getVolumetricFlowRate(-1, 0.2, 0.4)).toThrow(RangeError);
    expect(() => getVolumetricFlowRate(10, -0.2, 0.4)).toThrow(RangeError);
    expect(() => getVolumetricFlowRate(10, 0.2, -0.4)).toThrow(RangeError);
  });

  it('throws when extrusionWidth < layerHeight', () => {
    expect(() => getVolumetricFlowRate(10, 0.4, 0.2)).toThrow(RangeError);
  });
});
