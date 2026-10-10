/**
 * The named skin sites of the fixed 478-landmark basis on which the procedural
 * face paints a regional colour. Each site is one landmark of that basis: the
 * forehead centre (151), the zygomatic prominences (116 anatomical right, 345
 * left), the mid cheeks (205 right, 425 left), the nasal tip (4) and the
 * chin's pogonion (199). The names match the sites of
 * `IAutoMovieHumanFaceSkinColourParameters`.
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
