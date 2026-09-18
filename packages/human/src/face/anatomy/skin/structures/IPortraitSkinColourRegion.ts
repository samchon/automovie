/**
 * One numerical pigmentation region in the reference face, independent of
 * illumination and current expression. It multiplies base colour in linear
 * RGB and does not infer a biological chromophore concentration.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-skin-colour Gives regional skin colour independent named controls and a stable anatomical attachment.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour Declares a reference anchor, millimetre envelope and bounded linear RGB attenuation.
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
