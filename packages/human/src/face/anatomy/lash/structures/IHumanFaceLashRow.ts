import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One generated free-shaft row and the source card region it replaces.
 * Empty authored populations still identify the replaced source region.
 *
 * @evidence contracts/common.md#principled-implementation Source replacement and generated geometry travel together without naming guesses.
 * @evidence contracts/common.md#clear-and-simple-design One row identifies its side, source region, generated mesh and centreline observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty population removes cards without inventing follicles.
 * @evidence contracts/common.md#meaningful-documentation States empty geometry and source replacement meaning.
 * @evidence contracts/modeling.md#spatial-conventions Meshes and centreline points are canonical head-frame metres.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries constructed geometry rather than a measured follicle population.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission belongs to the row generator.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Generated output, without a personal strand input.
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
