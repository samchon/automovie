import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Racket-sport strokes and the solo ready position, split step and golf
 * address. A named implement stays in the racket hand through preparation,
 * impact and recovery.
 *
 * - Ready position: the feet step in sequence to two shoulder widths, the pelvis
 *   lowers by 4 % of stature and the trunk leans 15 degrees, the racket hand on
 *   the handle at waist height before the body and the other hand a hand ahead
 *   on the throat (provisional places).
 * - Split step: from the ready position's width, a small hop of 3 % of the
 *   stature (provisional) in 0.3 s, landing a quarter shoulder width wider on
 *   each side, the step that precedes every stroke (Elliott et al. 1986 place
 *   it before the serve's backswing; here before any stroke).
 * - Golf address: the trunk hinges 35 degrees at the hips over slightly flexed
 *   knees (provisional), the two hands together on the grip hanging `HANG` of
 *   the arm below the shoulders, and the waggle moves them a twentieth of the
 *   arm forward and back twice.
 *
 * Each is a phrase: into the position in 0.6 s, the stroke (the hop or the
 * waggle), held, and back in 0.6 s.
 */
export namespace IAutoMovieMotionHumanRacket {
  /** Parameters. */
  export interface IParams {
    /** The position or stroke. */
    kind: IAutoMovieMotionHumanRacket.Kind;

    /** The racket or lead hand; `right` when absent. */
    hand?: "left" | "right";

    /** Seconds held for a solo position, at least 0; 0.6 when absent. */
    hold?: number;

    /**
     * The held racket subject during a ready position, split step or stroke.
     * Omit to rehearse without a prop.
     */
    implement?: string;

    /**
     * The desired centre of the striking face at the stroke, in world metres.
     * Omit for a body-relative rehearsal.
     */
    contactAt?: IAutoMovieVector3;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** Solo racket and golf positions and court strokes. */
  export type Kind = Position | Stroke;

  /** The original solo ready, split-step and golf actions. */
  export type Position = "readyPosition" | "splitStep" | "golfAddress";

  /** Court strokes with sport-specific support, approach and recovery. */
  export type Stroke =
    | "tennisServe"
    | "tennisForehand"
    | "tennisBackhand"
    | "tennisVolley"
    | "badmintonLunge"
    | "badmintonClear"
    | "tableTennisTopspin"
    | "squashDrive"
    | "padelGlassReturn";
}
