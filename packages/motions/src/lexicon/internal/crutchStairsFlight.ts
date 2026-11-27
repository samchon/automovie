import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanCrutchStairs,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import type { crutchHeldLeg } from "./crutchHeldLeg";

/*
 * The crutch stair climb's flight and clock, shared by the law's plan and the
 * track the scene's crutch props read, so both derive every crutch frame and
 * tread from the same flight.
 */
export namespace crutchStairsFlight {
  /*
   * One crutch move: when it lifts and plants, and the level it leaves.
   */
  export interface IMove {
    /*
     * Lift, seconds since the climb's start.
     */
    from: number;

    /*
     * Plant, seconds since the climb's start.
     */
    to: number;

    /*
     * The level left.
     */
    level: number;
  }

  /*
   * The climb's resolved shape and clock.
   */
  export interface IClimb {
    /*
     * +1 going up, -1 going down.
     */
    sign: number;

    /*
     * Each riser's height, metres.
     */
    riser: number;

    /*
     * Each tread's depth, metres.
     */
    tread: number;

    /*
     * The first nosing's distance ahead of the toes, metres.
     */
    start: number;

    /*
     * Seconds before the first step: the hands take the grips.
     */
    ready: number;

    /*
     * Seconds each step takes.
     */
    step: number;

    /*
     * Each crutch move.
     */
    moves: readonly IMove[];
  }

  /*
   * The climb's shape and clock from its parameters, refused where the climb's
   * own bounds refuse: a riser above 0.35 of the hip height, a tread shorter
   * than 0.6 of the foot, a rounded count below one or a step of no time.
   * Going up the sound foot steps first, then the crutches; going down the
   * crutches first.
   * Parameter params: The climb.
   * Parameter hipHeight: The body's hip height, metres, or none for a track.
   * Parameter footLength: The body's foot length, metres, or none for a track.
   * Returns: The resolved climb.
   * On a bound the climb refuses.
   */
  export function resolve(
    params: IAutoMovieMotionHumanCrutchStairs,
    hipHeight: number | undefined,
    footLength: number | undefined,
  ): IClimb {
    const count: number = HumanBound.whole("count", params.count);
    const riser: number = params.riser ?? 0.17;
    const tread: number = params.tread ?? 0.28;
    if (hipHeight !== undefined)
      HumanBound.within("riser", riser, 0, 0.35 * hipHeight, "m", "minimum");
    if (footLength !== undefined)
      HumanBound.least("tread", tread, 0.6 * footLength, "m");
    const step: number = params.seconds ?? 2;
    HumanBound.above("seconds", step, 0, "s");
    const sign: number = (params.direction ?? "up") === "up" ? 1 : -1;
    const ready: number = step / 4;
    const moves: IMove[] = Array.from(
      { length: count },
      (_v: unknown, i: number): IMove => {
        const t: number = ready + i * step;
        return sign > 0
          ? { from: t + step / 2, to: t + step, level: i }
          : { from: t, to: t + step / 2, level: i };
      },
    );
    return {
      sign,
      riser,
      tread,
      start: params.start ?? START,
      ready,
      step,
      moves,
    };
  }

  /*
   * How far ahead of the toes, and how high from the entry floor, a level's
   * foot or tip comes down: `ON` of its tread back from the front edge.
   * Parameter climb: The climb.
   * Parameter k: The level, 0 for the entry floor.
   * Returns: The offset, metres, z ahead and y up.
   */
  export function level(climb: IClimb, k: number): IAutoMovieVector3 {
    return k === 0
      ? { x: 0, y: 0, z: 0 }
      : {
          x: 0,
          y: climb.sign * k * climb.riser,
          z: climb.start + (k - 1 + ON) * climb.tread,
        };
  }

  /*
   * The flight's profile along its climb: the entry floor, then each tread from
   * its nosing on, each a riser above (going up) or below (going down) the one
   * before.
   * Parameter climb: The climb.
   * Parameter ground: The entry floor's height, world metres.
   * Returns: The levels, nearest first, each from where it begins ahead of the
   * toes' start.
   */
  export function profile(
    climb: IClimb,
    ground: number,
  ): crutchHeldLeg.IStep[] {
    return [
      { from: -Infinity, height: ground },
      ...climb.moves.map(
        (_: IMove, i: number): crutchHeldLeg.IStep => ({
          from: climb.start + i * climb.tread,
          height: ground + climb.sign * (i + 1) * climb.riser,
        }),
      ),
    ];
  }

  /*
   * A crutch's frame at a second: planted at its level, or on its move's path,
   * up first and then over going up, over first and then down going down,
   * clearing the nosing by `LIFT`.
   * Parameter climb: The climb.
   * Parameter start: The crutch's staged frame.
   * Parameter seconds: Seconds since the climb's start.
   * Returns: The frame, world metres.
   */
  export function frameAt(
    climb: IClimb,
    start: IAutoMovieRigidTransform,
    seconds: number,
  ): IAutoMovieRigidTransform {
    const forward: IAutoMovieVector3 = AutoMovieEngineVector3.normalize({
      ...AutoMovieEngineQuaternion.rotateVector(start.rotation, { x: 0, y: 0, z: 1 }),
      y: 0,
    });
    const place = (offset: IAutoMovieVector3): IAutoMovieRigidTransform => ({
      position: AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.add(start.position, AutoMovieEngineVector3.scale(forward, offset.z)),
        AutoMovieEngineVector3.scale(UP, offset.y),
      ),
      rotation: start.rotation,
    });
    let k: number = 0;
    for (const move of climb.moves) {
      if (seconds <= move.from) break;
      if (seconds < move.to) {
        const s: number = (seconds - move.from) / (move.to - move.from);
        const a: IAutoMovieVector3 = level(climb, move.level);
        const b: IAutoMovieVector3 = level(climb, move.level + 1);
        const clamp = (v: number): number =>
          AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, v)));
        const along: number =
          climb.sign > 0 ? clamp((s - 0.3) / 0.7) : clamp(s / 0.6);
        const rise: number =
          climb.sign > 0
            ? (climb.riser + LIFT) * clamp(s / 0.5) -
              LIFT * clamp((s - 0.6) / 0.4)
            : LIFT * clamp(s / 0.3) -
              (climb.riser + LIFT) * clamp((s - 0.4) / 0.6);
        return place({ x: 0, y: a.y + rise, z: a.z + (b.z - a.z) * along });
      }
      k = move.level + 1;
    }
    return place(level(climb, k));
  }

  /*
   * How many treads the sound foot stands past for a plant window opening at a
   * second: the window of a tread opens when the foot is set down there, after
   * its step's foot stance begins (each step's start going up, its middle going
   * down).
   * Parameter climb: The climb.
   * Parameter seconds: The window's opening, seconds since the climb's start.
   * Returns: The tread count, 0 for the entry floor.
   */
  export function arrived(climb: IClimb, seconds: number): number {
    let k: number = 0;
    for (let i: number = 0; i < climb.moves.length; ++i)
      if (
        seconds >
        climb.ready + i * climb.step + (climb.sign > 0 ? 0 : 0.5) * climb.step
      )
        k = i + 1;
    return k;
  }
}

/*
 * World vertical.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * How high a crutch tip clears a nosing as it moves, metres (provisional, as
 * the crutch walk's lift).
 */
const LIFT: number = 0.04;

/*
 * The first nosing's distance ahead of the toes when the author gives none,
 * metres: the climb's own default (`climbStairsFlight.START`).
 */
const START: number = 0.05;

/*
 * Where on its tread a foot's ball and a crutch's tip come down, as a share of
 * the tread measured from its front edge back (provisional: the ball over the
 * tread's rear part, the toes inside its front edge).
 */
const ON: number = 0.7;
