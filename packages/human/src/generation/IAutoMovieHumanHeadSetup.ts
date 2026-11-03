import type { AutoMovieHumanHeadConstruction } from "./AutoMovieHumanHeadConstruction";
import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadNeck } from "./IAutoMovieHumanHeadNeck";

/**
 * The fixed inputs of one person's head: everything a pass builds from, and
 * nothing of the body around it. The public head inputs, the prior's compiled
 * splines, the neck ring the head stands on (its place, its radius and its
 * back and the slope of its back with height), the scale that closes the
 * stature, and the neck chain's two rings the head hands over from. A pass
 * (`AutoMovieHumanHeadPass.build`) and every piece's standalone entry start
 * from this and from the corrections the secant passes have found so far.
 */
export interface IAutoMovieHumanHeadSetup {
  /** The public inputs: head identity, stature, neck length and tape, sex and fat. */
  inputs: AutoMovieHumanHeadConstruction.IInputs;

  /** The prior's compiled profile and dorsum splines. */
  compiled: IAutoMovieHumanHeadCompiled;

  /** The neck ring: level, centre, radius, back place and slope. */
  neck: IAutoMovieHumanHeadNeck;

  /** Calibration millimetres per world millimetre, closing the stature. */
  scale: number;

  /** The neck chain's top ring, 720 uniform phases, `[x, y, z]`. */
  ring: [number, number, number][];

  /** The top ring's plan, `[x, z]`. */
  flat: [number, number][];

  /** The plan of the ring just under it, from which the neck's slope with height is read. */
  under: [number, number][];

  /** How far that ring lies under the top ring, millimetres. */
  drop: number;

  /** The plan of the ring twice that far under the top ring, from which the neck's second derivative with height is read. */
  lower: [number, number][];
}
