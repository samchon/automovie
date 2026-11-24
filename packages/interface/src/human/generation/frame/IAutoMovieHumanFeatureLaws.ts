import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFeatureTemplate } from "./IAutoMovieHumanFeatureTemplate";

/**
 * Public contracts for anatomical surface feature laws.
 */
export namespace IAutoMovieHumanFeatureLaws {
  /**
   * The length a law's shares are of.
   */
  export type Scale = "stature" | "knee" | "ankle";

  /**
   * One feature's law.
   */
  export interface ILaw {
    /** The feature's name. */
    name: string;

    /** What makes it, which decides what moves its height (`AutoMovieHumanFeatureTemplate.Class`). */
    class: IAutoMovieHumanFeatureTemplate.Class;

    /** The segment whose frame it is placed in. */
    segment: string;

    /** The landmarks that place it: one, its centre, or two, the ends it runs between. */
    landmarks: readonly [string] | readonly [string, string];

    /** The length its shares are of. */
    scale: Scale;

    /** Its half extent along its long direction as a share of the scale; absent for a feature between two landmarks, whose length is theirs. */
    along?: number;

    /** Its half extent across as a share of the scale. */
    across: number;

    /** Its height at the centre as a share of the scale: positive a mound, negative a hollow. */
    height: number;
  }

  /**
   * A catalogue feature that has no template, and why.
   */
  export interface INone {
    /** The feature's name. */
    name: string;

    /** Why it has none. */
    why: string;
  }

  /**
   * What a law is given to make its template: points and directions in its segment's frame.
   */
  export interface IDatums {
    /** Its centre's landmark, or the landmark it starts at, mm. */
    from: AutoMovieVector3Tuple;

    /** The landmark it ends at, for a law of two landmarks. */
    to?: AutoMovieVector3Tuple;

    /** The direction out of the skin there; it need not be unit. */
    outward: AutoMovieVector3Tuple;

    /** The segment's long direction, for a law of one landmark; it need not be unit nor square to `outward`. */
    along?: AutoMovieVector3Tuple;
  }
}
