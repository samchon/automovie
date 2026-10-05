import type { IHumanSourceLandmarkCandidate } from "./IHumanSourceLandmarkCandidate.ts";

/**
 * The outcome of ranking one landmark's candidates: the chosen vertex and
 * every candidate it was compared with, best first.
 *
 * @author Samchon
 */
export interface IHumanSourceLandmarkPick {
  /** Chosen base-mesh vertex. */
  vertex: number;

  /** Compared candidates, best first. */
  candidates: IHumanSourceLandmarkCandidate[];
}
