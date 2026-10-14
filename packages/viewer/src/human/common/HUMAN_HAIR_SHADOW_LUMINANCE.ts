/**
 * Linear sRGB relative-luminance RGB weights for grey shadow transmission.
 * See https://www.w3.org/TR/WCAG22/#dfn-relative-luminance.
 * Both numerical and shader evaluators share this fixed tuple; monochrome
 * depth shadows cannot retain the input transmission color and no handle is owned.
 */
export const HUMAN_HAIR_SHADOW_LUMINANCE: readonly [number, number, number] = [0.2126, 0.7152, 0.0722] as const;
