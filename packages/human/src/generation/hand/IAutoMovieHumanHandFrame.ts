import type { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/** The hand's frame on its knuckles. */
export interface IAutoMovieHumanHandFrame {
  /** Wrist centre to knuckle III. */
  along: Vec3;

  /** Knuckle V toward II, square to `along`. */
  across: Vec3;

  /** Toward the palm, square to both. */
  palmar: Vec3;
}
