import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One oriented sheet that internal parts must stay inside.
 *
 * A reference is a skin surface or a face derived from one, such as the fascial face under the subcutaneous layer. It may be open: a body's faces are open at the collar, where the head's skin continues them.
 *
 * @evidence contracts/common.md#principled-implementation A named outward-oriented skin/derived sheet supplies one containment reference, explicitly allowing an open collar continued by the head.
 * @evidence contracts/common.md#clear-and-simple-design Name and actual mesh stay together so readings retain the identity of each anatomical boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An open reference is not silently capped or promoted to a closed anatomical solid.
 * @evidence contracts/common.md#meaningful-documentation Comments identify outward orientation, derived fascial meaning and open-neck semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reference records do not execute signed-distance or closure algorithms themselves.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A named sheet is input geometry without cached containment-query results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Mesh references remain caller-owned and the type acquires no spatial index.
 * @author Samchon
 */
export interface IHumanBodyLayerReference {
  /** Name the reading reports this sheet under. */
  name: string;

  /** Outward-oriented surface, possibly open. */
  mesh: IAutoMovieMesh;
}
