import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One generated free-shaft row and the source card region it replaces.
 * Empty authored populations still identify the replaced source region.
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
