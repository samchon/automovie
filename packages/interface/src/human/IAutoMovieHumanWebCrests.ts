import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieArcLengthJet } from "../geometry/IAutoMovieArcLengthJet";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";

/**
 * The first stage of a web's build: every web the parent's ring parts at, and
 * the parent's own surface read at its end ring, which later stages read.
 */
export interface IAutoMovieHumanWebCrests {
  /** Every web, by the pair of its pinches. */
  webs: Map<string, IAutoMovieHumanWeb>;

  /**
   * Read the retained web for an unordered pair of pinch vertex indices;
   * callers must supply a pair present in webs.
   */
  webOf: (a: number, b: number) => IAutoMovieHumanWeb;

  /** The mesh's point of a vertex, mm. */
  position: (v: number) => AutoMovieVector3Tuple;

  /**
   * Outward unit direction estimated between the end ring and its inward
   * station sample at phase t in radians.
   */
  outward: (t: number) => AutoMovieVector3Tuple;

  /**
   * Parent's outward station jet at end-ring phase t in radians, estimated by
   * the producer's one-sided three-point samples; it is not an exact source
   * derivative.
   */
  parentJet: (t: number) => IAutoMovieArcLengthJet;
}
