import type { IHumanSourceLandmarkNeighbour } from "./IHumanSourceLandmarkNeighbour.ts";

/**
 * The determination record of one body skin landmark: its meaning, the
 * sample and body view vertex chosen, its neutral position, the compared
 * neighbours and the limit of a fixed vertex.
 *
 * @author Samchon
 */
export interface IHumanSourceBodyLandmark {
  /** Landmark name. */
  name: string;

  /** The anatomical definition. */
  definition: string;

  /** Source of the definition. */
  citation: string;

  /** How the vertex was determined; a mirrored twin says so. */
  status: string;

  /** Generation skin sample. */
  sample: number;

  /** Body view vertex. */
  viewVertex: number;

  /** Neutral position, metres. */
  position: number[];

  /** Compared neighbouring samples with their neutral positions. */
  neighbours: IHumanSourceLandmarkNeighbour[];

  /** What the fixed vertex cannot follow and any reading limit. */
  limit: string;

  /** The named ambiguity of the reading (which alternative positions the evidence leaves open, and why), or null when the reading has none beyond the limit. */
  ambiguity: string | null;

  /** Index space, frame and side convention of `sample`, `viewVertex` and `position`. */
  convention: string;
}
