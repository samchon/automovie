/**
 * Publisher-qualified implantation boundaries on the shared forehead skin.
 *
 * @evidence contracts/common.md#principled-implementation buildHumanFaceBrowAssembly uses same-generation live forehead boundaries and its material chart to seat generated shafts, with exact source-card replacement sets and registered foreground finish.
 * @evidence contracts/common.md#clear-and-simple-design Provenance, ordered host band, replaced card population and source finish have distinct fields under one qualified anatomical side.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The consumer checks resident host/generation/source ID and finish, then native walks and emitted shaft clearance; sourceObserved/authoredConvention metadata and hash strings do not themselves prove measured follicle distribution or validate arbitrary replacement indices.
 * @evidence contracts/common.md#meaningful-documentation Medial-to-lateral band direction, host-skin versus old card identities and eligibility qualification identify the source-to-generated transition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The band record implements no native walk, root placement or tint calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Immutable band identity is source data; chart/shaft reuse is consumer-owned.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Source boundary/replacement arrays create no shafts, skin gains or query resources here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularBrowBand {
  /** Licensed source-authoring receipt identity for the forehead implantation band. */
  sourceId: string;

  /** Same compiler generation as the registered skin host and periocular record. */
  generation: string;

  /** Actual raw source and authored band selection SHA-256 identities. */
  sourceSha256: string[];

  /** Host skin, never the old detached brow card surface. */
  surface: string;

  /** Medial-to-lateral ordered host boundaries, matching anatomical head/body/tail. */
  upper: number[];

  /** Lower host-skin boundary in the same medial-to-lateral direction as upper. */
  lower: number[];

  /** Exact original card surface and finish to replace when population is requested. */
  replaceSurface: string;

  /** Exact old-card surface vertex population removed only when this side is requested. */
  replaceVertices: number[];

  /** Registered source finish supplying foreground painting for generated shafts. */
  material: string;

  /** Band eligibility is source-authored, not a measured follicle distribution. */
  qualification: "authoredConvention" | "sourceObserved";
}
