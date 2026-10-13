/** CIE relative luminance of linear sRGB (IEC 61966-2-1 primaries). */
export const humanPreviewLuminance = (rgb: readonly number[]): number =>
  0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
