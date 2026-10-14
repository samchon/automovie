import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One generated free-shaft row and the source card region it replaces. Empty authored populations still identify the replaced source region.
 *
 * @evidence contracts/common.md#principled-implementation Generated shaft geometry identifies the registered source row/region it replaces even for an empty population.
 * @evidence contracts/common.md#clear-and-simple-design Geometry generation, contact admission and finish composition consume the same row record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null mesh denotes explicit zero output rather than a missing source registration or inferred card-based count.
 * @evidence contracts/common.md#meaningful-documentation Side/row/material/generation preserve source ownership and centrelines reflect emitted tube rings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Sampling, meshing, contact and finish work execute in their row consumers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same row avoids regenerating shaft geometry between admission and finishing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns mesh/centreline arrays until model composition or observation releases them; the type allocates no separate resource.
 *
 * @author Samchon
 */
export interface IHumanFaceLashRow {
  /** Anatomical side. */
  side: "left" | "right";

  /** Upper or lower lid population. */
  row: "upper" | "lower";

  /** Source card region explicitly registered by the producer. */
  region: string;

  /** Its source material, retained as the appearance control identity. */
  material: string;

  /** Common source generation that registered the roots. */
  generation: string;

  /** New free-shaft geometry, or null for the requested zero population. */
  mesh: IAutoMovieMesh | null;

  /** Actual sampled shaft centrelines read from the generated tube rings. */
  centrelines: number[][];
}
