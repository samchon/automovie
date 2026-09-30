/**
 * The named skin sites of the fixed 478-landmark basis on which the procedural
 * face paints a regional colour. Each site is one landmark of that basis: the
 * forehead centre (151), the zygomatic prominences (116 anatomical right, 345
 * left), the mid cheeks (205 right, 425 left), the nasal tip (4) and the
 * chin's pogonion (199). The names match the sites of
 * `IAutoMovieHumanFaceSkinColourParameters`.
 *
 * @evidence contracts/common.md#principled-implementation A closed union of seven named sites, each one fixed landmark of the basis, so a caller can only choose among named anatomical places.
 * @evidence contracts/common.md#clear-and-simple-design One union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts PortraitSkinColourSite carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation Lists the sites with their landmarks and states that the names match the observed-colour parameters.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping PortraitSkinColourSite is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels PortraitSkinColourSite carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry PortraitSkinColourSite decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries PortraitSkinColourSite constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation PortraitSkinColourSite is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/modeling.md#spatial-conventions PortraitSkinColourSite states no unit or frame beyond what its members document.
 */
export type PortraitSkinColourSite =
  | "forehead"
  | "rightCheekbone"
  | "leftCheekbone"
  | "rightCheek"
  | "leftCheek"
  | "noseTip"
  | "chin";

/**
 * One numerical pigmentation of a named skin site, independent of illumination
 * and current expression. It multiplies base colour in linear RGB and does not
 * infer a biological chromophore concentration. The region's extent is not an
 * input: it is a fixed fraction of the host's bizygomatic breadth, so a caller
 * names where and how strongly, never which vertices or how far.
 *
 * @evidence contracts/common.md#principled-implementation A region is a site, linear RGB gains and a strength, which is all the compact kernel needs; the extent is a fixed fraction of the host breadth and the centre is the site's landmark, so neither is an input.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitSkinColourRegion carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States that it is independent of illumination and expression, multiplies base colour and infers no chromophore concentration, and that extent is not an input.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named skin site with linear gains in [0,1] and a strength in [0,1]; none addresses a vertex, offsets a centre or sets a radius.
 * @evidence contracts/modeling.md#spatial-conventions Gains are linear RGB multipliers and strength is a fraction; no length is an input.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitSkinColourRegion is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitSkinColourRegion carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitSkinColourRegion decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitSkinColourRegion constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitSkinColourRegion is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitSkinColourRegion {
  /** The named site; unique within a population, and its landmark is fixed by the basis. */
  site: PortraitSkinColourSite;

  /** Linear RGB multipliers in [0,1]; white leaves the base colour unchanged. */
  gain: [number, number, number];

  /** Region strength in [0,1]; zero is the identity multiplier. */
  strength: number;
}
