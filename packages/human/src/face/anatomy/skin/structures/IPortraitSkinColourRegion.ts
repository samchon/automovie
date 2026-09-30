/**
 * One numerical pigmentation region in the reference face, independent of
 * illumination and current expression. It multiplies base colour in linear
 * RGB and does not infer a biological chromophore concentration.
 *
 * @author Samchon
 */
export interface IPortraitSkinColourRegion {
  /** Unique nonempty anatomical or authored region identity. */
  name: string;

  /** Resident vertex identity on the reference host, before current performance. */
  anchor: number;

  /** XYZ offset from that reference anchor, in millimetres. */
  offset: [number, number, number];

  /** Positive XYZ support radii in millimetres. */
  radius: [number, number, number];

  /** Linear RGB multipliers in [0,1]; white leaves the base colour unchanged. */
  gain: [number, number, number];

  /** Region strength in [0,1]; zero is the identity multiplier. */
  strength: number;
}
