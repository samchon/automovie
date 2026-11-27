import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The polo stroke's form: its phases, its key angles and the measures that
 * bound them.
 */
export namespace HumanPoloForm {
  /**
   * The phases' durations, seconds (provisional stage readings of a polo
   * swing).
   */
  export const PHASES: Readonly<Record<PHASESEntryItem, number>> = {
    lean: 0.4,
    takeAway: 0.5,
    down: 0.4,
    follow: 0.35,
    settle: 0.6,
  };

  /**
   * How far the arm turns on past the contact in the follow-through, degrees
   * (provisional).
   */
  export const FINISH: number = 80;

  /**
   * How far short of straight up along the trunk the arm stands at the carry
   * and the top of the backswing, degrees: the shoulder's flexion ends at 180
   * (the AAOS normal range, read through secondary summaries), and the margin
   * keeps the arm off that end (provisional).
   */
  export const TOP: number = 20;

  /** The body's own up and ahead. */
  export const AXES: Readonly<Record<AXESEntryItem, IAutoMovieVector3>> = {
    up: { x: 0, y: 1, z: 0 },
    ahead: { x: 0, y: 0, z: 1 },
  };

  /**
   * The wrist's deviation range, degrees: radial 20, ulnar 30 (the AAOS normal
   * ranges, read through secondary summaries). The top of the backswing cocks
   * the wrist to the radial end, the double pendulum's hinge.
   */
  export const DEVIATION: Readonly<Record<DEVIATIONEntryItem, number>> = {
    radial: 20,
    ulnar: 30,
  };

  /**
   * The elbow's flexion through the swing, degrees: the arm nearly straight,
   * off its reach singularity (provisional).
   */
  export const ELBOW: number = 15;

  /**
   * The trunk's turn toward the swing's side through the stroke, degrees: the
   * shoulders turned so the swinging arm passes beside the trunk rather than
   * behind it (provisional, within the trunk's axial range).
   */
  export const TURN: number = 45;

  /**
   * How near the contact the mallet's head is held to the ball's place,
   * seconds: half a frame of a 24 fps film, the instant the film shows.
   */
  export const HIT: number = 1 / 48;

  /** The most a rider leans out of the saddle, degrees (provisional). */
  export const MOST: number = 45;

  /** How far the rider rises in the stirrups, metres (provisional). */
  export const RISE: number = 0.1;

  /** How far the trunk pitches forward over the swing, degrees (provisional). */
  export const PITCH: number = 20;
}

/** The alternatives of `PHASESEntryItem`'s site. */
type PHASESEntryItem = "lean" | "takeAway" | "down" | "follow" | "settle";

/** The alternatives of `AXESEntryItem`'s site. */
type AXESEntryItem = "up" | "ahead";

/** The alternatives of `DEVIATIONEntryItem`'s site. */
type DEVIATIONEntryItem = "radial" | "ulnar";
