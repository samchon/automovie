import type { IHumanSourceLandmarkCandidate } from "./IHumanSourceLandmarkCandidate.ts";

/**
 * The selection record of one head skin landmark, written to the generation
 * manifest: what the point means, how its vertex was chosen and from which
 * candidates, where it sits at neutral, and what a fixed vertex cannot do.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadLandmark {
  /** Landmark name the head view declares. */
  name: string;

  /** The ANSUR definition, or the stated meaning of a named approximation. */
  definition: string;

  /** Source of the definition (report, section and page), or why there is none. */
  citation: string;

  /** Whether the vertex realises the definition or stands in for it. */
  status: "definition" | "definition, read from renders" | "named approximation";

  /** The selection rule as applied, including any stand-in it uses. */
  rule: string;

  /** Chosen base-mesh (hm08) vertex, which is also its source sample. */
  vertex: number;

  /** Its index on the head view's skin surface. */
  viewVertex: number;

  /** Neutral position in the generation frame, metres. */
  position: number[];

  /** Candidates compared, best first. */
  candidates: IHumanSourceLandmarkCandidate[];

  /** What a fixed vertex cannot follow. */
  limit: string;
}
