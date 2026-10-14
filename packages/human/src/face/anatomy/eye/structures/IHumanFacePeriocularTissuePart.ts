import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanLocalMeshFrame } from "../../../../common/mesh/IHumanLocalMeshFrame";
import type { AutoMovieHumanFacePeriocularTissue } from "../../../structures/AutoMovieHumanFacePeriocularTissue";
import type { IHumanFacePeriocularMappingReading } from "./IHumanFacePeriocularMappingReading";
import type { IHumanFacePeriocularTissueFit } from "./IHumanFacePeriocularTissueFit";

/** Actual generated closed tissue shell and its shared source attachment.
 *
 *
 * @evidence contracts/common.md#principled-implementation Actual closed tissue geometry and its local Float32/TRS publication retain source side/generation and requested-room readings.
 * @evidence contracts/common.md#clear-and-simple-design The tissue producer owns shells while contact/finish/mapping consume the same registered geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source receipt is licensed authoring evidence rather than personal clinical acquisition; mapping is observational.
 * @evidence contracts/common.md#meaningful-documentation Fields state metre shell, local publication, source identity and optional lazy mapping meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularTissuePart is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularTissuePart declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularTissuePart acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularTissuePart {
  /** Anatomical side whose live source cage carries the shell. */
  side: "left" | "right";

  /** Coarse tissue identity; role assignment retains source authoring qualification. */
  tissue: AutoMovieHumanFacePeriocularTissue;

  /** Exact source generation shared by cage, host skin and this geometry. */
  generation: string;

  /** Licensed authored cage receipt identity, without a clinical acquisition claim. */
  sourceId: string;

  /** Closed capped shell in canonical head-frame metres, read by contact and finish. */
  mesh: IAutoMovieMesh;

  /** Same shell's strict local Float32 publication frame, without changing the head-frame source. */
  publication: IHumanLocalMeshFrame;

  /** Room the requested dimensions had inside the lid at the stations this shell is built from. */
  fit: IHumanFacePeriocularTissueFit;

  /** Actual optional mapping observation; never a replacement admission verdict.
   *
   * @evidence contracts/common.md#principled-implementation An optional callback reads the original emitted band's material/source/offset mapping observations.
   * @evidence contracts/common.md#clear-and-simple-design The tissue producer memoizes the actual reading while retaining its shared band/geometry for part lifetime.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This callback supplies no replacement admission verdict or fabricated second geometry query.
   * @evidence contracts/common.md#meaningful-documentation The member states optional actual mapping observation separate from physical qualification.
   * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularTissuePart.readMapping is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularTissuePart.readMapping declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularTissuePart.readMapping acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
   */
  readMapping?: () => IHumanFacePeriocularMappingReading;
}
