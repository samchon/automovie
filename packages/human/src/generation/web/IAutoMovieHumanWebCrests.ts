import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";
import type { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/**
 * The first stage of a web's build: every web the parent's ring parts at, and
 * the parent's own surface read at its end ring, which later stages read.
 */
export interface IAutoMovieHumanWebCrests {
  /** Every web, by the pair of its pinches. */
  webs: Map<string, IAutoMovieHumanWeb>;

  /** The web of a pair of pinch vertices. */
  webOf: (a: number, b: number) => IAutoMovieHumanWeb;

  /** The mesh's point of a vertex, mm. */
  position: (v: number) => Vec3;

  /** The parent's outward unit direction at a phase of its end ring. */
  outward: (t: number) => Vec3;

  /** The parent's station jet at a phase of its end ring, leaving it. */
  parentJet: (t: number) => IAutoMovieHumanSeam.IArcJet;
}
