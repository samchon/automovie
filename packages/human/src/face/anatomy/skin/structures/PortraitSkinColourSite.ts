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
