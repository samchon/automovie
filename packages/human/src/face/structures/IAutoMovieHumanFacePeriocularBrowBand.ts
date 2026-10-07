/** Publisher-qualified implantation boundaries on the shared forehead skin.
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
