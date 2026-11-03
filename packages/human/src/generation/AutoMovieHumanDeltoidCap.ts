import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import { AutoMovieHumanShoulderCap } from "./AutoMovieHumanShoulderCap";

/**
 * The deltoid cap: the arm's cap about the glenohumeral centre, the arm's
 * horizontal ellipse above the centre's height, where the ellipse's lateral
 * extreme follows the shoulder cap's outline instead of the arm's edge. Its
 * own centre is the humeral head's (the glenohumeral centre), not the shoulder
 * girdle's, which stands at the acromioclavicular joint.
 *
 * The ellipse keeps its centre and its aspect `AutoMovieHumanShoulderCap.STRETCH` and
 * shrinks to nothing at the shoulder point, so the cap merges with the girdle
 * at the point where both stand at the same lateral place.
 */
export namespace AutoMovieHumanDeltoidCap {
  /** An ellipse in a horizontal plane. */
  export interface IOval {
    /** Forward place of the centre, mm. */
    x: number;

    /** Lateral place of the centre, mm. */
    z: number;

    /** Forward half size, mm. */
    rx: number;

    /** Lateral half size, mm. */
    rz: number;
  }

  /** What the cap reads. */
  export interface IInput {
    /** The glenohumeral centre `[x, y, z]`, mm. */
    glenohumeral: readonly [number, number, number];

    /** The cap's outline from the centre's height to the shoulder point. */
    outline: IAutoMovieHumanShoulderOutline;
  }

  /** Smallest lateral half size kept, mm: under it the cap is the girdle's. */
  const MINIMUM: number = 0.5;

  /**
   * The cap's ellipse at a height above the glenohumeral centre.
   *
   * @param input The centre and the outline.
   * @param y Height, mm.
   * @returns The ellipse, or null at and above the shoulder point and where it is too small to keep.
   */
  export function at(input: IInput, y: number): IOval | null {
    const [x, , gz]: readonly [number, number, number] = input.glenohumeral;
    if (y >= input.outline.to) return null;

    // The ellipse reaches the outline from the fixed centre.
    const rz: number = input.outline.at(y).value - gz;
    if (rz < MINIMUM) return null;

    return { x, z: gz, rx: rz / AutoMovieHumanShoulderCap.STRETCH, rz };
  }
}
