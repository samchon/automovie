import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";

/**
 * A front handspring: from standing, the body reaches forward into a lunge,
 * turns head over heels in pitch over its hands, leaves them and flies to its
 * feet, landing arched and rising to stand.
 *
 * Two phases, each turning about one axis, the body's left one:
 *
 * 1. Supported: the body rolls as a wheel (`GymnasticsWheel`) over its feet, its
 *    leading foot and its two hands, its shape going from standing to the lunge
 *    `lunged` by the angle `REACH` and from there to the arched line `arched`
 *    by `RELEASE`, where the hands leave. The angle grows with constant angular
 *    acceleration from rest, so it arrives at the release with the rate the
 *    flight keeps.
 * 2. Flight: the centre of mass follows the parabola of the velocity the wheel
 *    gave it at the release, and the arched body keeps turning at the release's
 *    rate, its kept angular momentum, until the centre comes down to the height
 *    it has standing arched at `LAND`. That rate is the one whose turn over
 *    that flight time brings the body from `RELEASE` to `LAND`, found by
 *    bisection, since the flight time itself grows with the rate the wheel
 *    throws the centre at.
 *
 * No duration is authored. The wheel turns from rest to `RELEASE` (145 degrees)
 * at constant angular acceleration, the flight lasts until the centre has
 * fallen to the height of the arched stand at `LAND` (330 degrees), under
 * gravity 9.80665 m/s2 (`handspring.RELEASE`, `handspring.LAND`, provisional);
 * the landing takes the jump's absorption and rise (`jump.ABSORB` 0.3 s and
 * `jump.RISE` 0.45 s).
 *
 * Landing, the feet are planted where they came down, the body absorbs and
 * rises to stand over the jump's `ABSORB` and `RISE` seconds while its tip
 * comes up from `LAND`, the arched landing of the skill, with the root carrying
 * the touchdown velocity out.
 *
 * A rate past the salto's bound (`salto.RATE`) is refused. With the hands on a
 * prop's `surface` the same law is the vault (`vault`).
 *
 * First pass: the body is rigid through the flight (no repulsion from the
 * shoulders, no change of shape), so its pitch rate and its centre's speed are
 * tied by the wheel's radius and the flight is longer and faster than a
 * gymnast's, who shortens the body and pushes off the hands; the hands and feet
 * are carried by the shape and not laid flat by a solve.
 *
 * Events: `handsDown`, `release` (the hands leave), `touchdown`, `settled` and
 * `relax`.
 */
export namespace IAutoMovieMotionHumanHandspring {
  /** Parameters. */
  export interface IParams {
    /** The leg that lunges; `left` when absent. */
    lead?: "left" | "right";
  }

  /** What the hands land on. */
  export interface ISurface {
    /** The surface's height, world metres. */
    height: number;

    /** What the hands bear on. */
    support: IAutoMovieMotionHumanContactWindow.Support;

    /**
     * Refuse a place for the hands' middle off the surface.
     *
     * @param point The hands' middle as they come down, world metres.
     * @throws {HumanRefusal} When the point is off the surface.
     */
    within(point: IAutoMovieVector3): void;
  }
}
