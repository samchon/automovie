import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Half-plane bounds on an elbow's place, solved in closed form on the circle a
 * wrist's place leaves the elbow (the swivel of Tolani, Goswami and Badler
 * 2000). The elbow on the circle is `C + ρ(u cos ψ + v sin ψ)`, so its signed
 * distance past any plane is one sinusoid of the swivel, refused on the arc
 * between its roots (`swivelArcs`); a hint is kept when its swivel meets every
 * bound, else moved to the nearest swivel that does. The drinking range is four
 * such bounds (`AutoMovieMotionHumanDrinkingSwivel`).
 */
export namespace IAutoMovieMotionHumanSwivelBound {
  /** The half-space an elbow is kept in: `normal · (elbow - point) >= margin`. */
  export interface IHalfPlane {
    /**
     * The direction inside, world; any length, read as its own unit times its
     * length.
     */
    normal: IAutoMovieVector3;

    /** A point on the plane, world metres. */
    point: IAutoMovieVector3;

    /**
     * How far inside the elbow is kept, in the normal's units (metres for a
     * unit normal).
     */
    margin: number;
  }

  /** An arm on a posture's trunk: its shoulder and its two lengths. */
  export interface IArm {
    /** The shoulder joint, world metres. */
    shoulder: IAutoMovieVector3;

    /** The shoulder to the elbow, metres. */
    upper: number;

    /** The elbow to the wrist, metres. */
    lower: number;
  }
}
