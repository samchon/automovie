/**
 * One numerical pigmentation region in the reference face, independent of
 * illumination and current expression. It multiplies base colour in linear
 * RGB and does not infer a biological chromophore concentration.
 *
 * @evidence contracts/common.md#principled-implementation A region is a name, a reference-host anchor, an offset, radii, linear RGB gains in [0,1] and a strength, evaluated on reference coordinates so it is independent of illumination and current expression; it multiplies base colour and infers no chromophore concentration.
 * @evidence contracts/common.md#clear-and-simple-design Six fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitSkinColourRegion carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the frame (reference host, before performance), the units and the identity values of gain and strength.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres on the reference host for offsets and radii, linear RGB for gains, stated on the members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitSkinColourRegion is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitSkinColourRegion carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitSkinColourRegion decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitSkinColourRegion constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitSkinColourRegion is a declaration and displays nothing itself; the parts built from it are observed by their owners.
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
