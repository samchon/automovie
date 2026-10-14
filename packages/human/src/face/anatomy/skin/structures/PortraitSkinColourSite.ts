/**
 * The named skin sites of the fixed 478-landmark basis on which the procedural
 * face paints a regional colour. Each site is one landmark of that basis: the
 * forehead centre (151), the zygomatic prominences (116 anatomical right, 345
 * left), the mid cheeks (205 right, 425 left), the nasal tip (4) and the
 * chin's pogonion (199). The names match the sites of
 * `IAutoMovieHumanFaceSkinColourParameters`.
 *
 * @evidence contracts/common.md#principled-implementation A closed seven-site union maps declared facial landmarks on the fixed 478-point basis to regional colour centres; createPortraitSkinColour uses its own-property site map to admit the actual runtime names.
 * @evidence contracts/common.md#clear-and-simple-design One vocabulary connects input region records to producer landmark identities without accepting arbitrary caller vertices or duplicate site tables in consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The numbered landmarks and side assignments belong to this fixed basis contract; they are not inferred correspondences for a different face topology.
 * @evidence contracts/common.md#meaningful-documentation The comment gives all seven numerical landmark identities and their anatomical sides, making the fixed mapping reviewable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This literal union implements no lookup or sampling; the colour producer owns the fixed site-map access and field evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type schedules no work; the producer shares its declared mapping for all regions in one call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union acquires no resource or retained population; consuming field samplers own their derived data.
 */
export type PortraitSkinColourSite =
  | "forehead"
  | "rightCheekbone"
  | "leftCheekbone"
  | "rightCheek"
  | "leftCheek"
  | "noseTip"
  | "chin";
