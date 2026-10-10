/**
 * One source-native relief station and an optional source-reference offset.
 * The vertex comes from the shared anatomical registration, not a person's
 * sculpt input. A displacement uses head-frame metres and is converted by the
 * registered material chart's shape-only native reference before performance.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinMaterialGuidePoint {
  /** Native vertex of the shared source skin. */
  vertex: number;

  /** Optional authored guide displacement in source-reference head-frame metres. */
  displacement?: readonly number[];
}
