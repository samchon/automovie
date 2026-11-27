import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { standUpright } from "../../actions/internal/standUpright";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { seated } from "../../everyday/internal/seated";
import { HumanMount } from "./HumanMount";

/**
 * The course's reader.
 *
 * @param c The climb.
 * @returns The frame at a second of the climb.
 */
export function HumanMountOnFrame(
  c: HumanMountOnFrame.IClimb,
): (t: number) => HumanMountOnFrame.Frame {
  const {
    body,
    seat,
    start,
    goal,
    climb,
    hop,
    final,
  }: HumanMountOnFrame.IClimb = c;
  const relaxed: IAutoMovieMotionHumanPosture["joints"] = {
    ...stand.relaxed(body),
    ...standUpright(body).joints,
  };
  const finish: [AutoMovieHumanoidBone, readonly [number, number, number]][] =
    Object.entries(final.joints) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][];
  const across: readonly [number, number] = HumanMountOnFrame.crossing(
    climb,
    seat.astride === true,
  );
  return (t: number): HumanMountOnFrame.Frame => {
    const crossed: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      (t - across[0]) / (across[1] - across[0]),
    );
    const socket: IAutoMovieVector3 = {
      x: start.x + (goal.x - start.x) * crossed,
      y:
        start.y +
        (goal.y + hop - start.y) *
          AutoMovieEngineMotionSampling.minimumJerkShare((t - 0.1 * climb) / (0.45 * climb)) -
        hop * AutoMovieEngineMotionSampling.minimumJerkShare((t - 0.55 * climb) / (0.25 * climb)),
      z: start.z + (goal.z - start.z) * crossed,
    };
    const settle: number = AutoMovieEngineMotionSampling.minimumJerkShare((t - 0.6 * climb) / (0.4 * climb));
    const lean: number =
      t < 0.6 * climb
        ? HumanMount.LEAN * AutoMovieEngineMotionSampling.minimumJerkShare(t / (0.4 * climb))
        : HumanMount.LEAN + (final.pitch - HumanMount.LEAN) * settle;
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...relaxed };
    for (const [bone, a] of finish) {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [
        was[0] + a[0] * settle,
        was[1] + a[1] * settle,
        was[2] + a[2] * settle,
      ];
    }
    // The hanging arms open out while the legs climb, clear of a thigh
    // the leading leg lifts, and close again as the body settles.
    const open: number =
      HumanMount.OPEN * AutoMovieEngineMotionSampling.minimumJerkShare(t / (0.3 * climb)) * (1 - settle);
    for (const side of ["left", "right"] as const) {
      const arm: readonly [number, number, number] = joints[
        `${side}UpperArm`
      ] ?? [0, 0, 0];
      joints[`${side}UpperArm`] = [arm[0], arm[1] + open, arm[2]];
    }
    const tilt: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      joints,
      lean,
    );
    const yaw: number = c.yaw + c.turn * crossed;
    // A tipped or tilted seat, as a saddle on a grade, tips the pelvis with it as the body crosses onto it.
    const pitch: number = tilt.pitch + (seat.pitch ?? 0) * crossed;
    const roll: number = (seat.roll ?? 0) * crossed;
    return {
      root: seated.root(body, socket, { yaw, pitch, roll }),
      yaw,
      pitch,
      roll,
      joints: tilt.joints,
    };
  };
}

/**
 * The pelvis's and the trunk's course in getting onto a high seat
 * (`HumanMountOn`): the seat socket travels up from 10 % of the climb, passes
 * `HumanMount.HOP` above the seat and sets down on it at 80 %, the contact; it
 * crosses to a seat sat on with the legs ahead over the first 70 %, and to one
 * sat astride from 30 % to the contact. The trunk leans forward
 * `HumanMount.LEAN` degrees at 40 % and settles to the seated pitch from 60 %,
 * the seated joints coming in with it, and the hanging arms open out while the
 * legs climb.
 */
export namespace HumanMountOnFrame {
  /**
   * Where the pelvis is at an instant of getting on: the root, the heading, the
   * pelvis pitch and the set joints.
   */
  export type Frame = Pick<IAutoMovieMotionHumanPosture, Frame2>;

  /** The climb the course is read over. */
  export interface IClimb {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The seat. */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /** The seat socket where the climb starts, world metres. */
    start: IAutoMovieVector3;

    /** The seat socket on the seat, world metres. */
    goal: IAutoMovieVector3;

    /** The climb's seconds. */
    climb: number;

    /** How far above the seat the socket passes, metres. */
    hop: number;

    /** The heading at the start, degrees. */
    yaw: number;

    /** How far the pelvis turns onto the seat, degrees. */
    turn: number;

    /** The seated pitch and joints the climb ends in. */
    final: IFinal;
  }

  /** The seated end a climb settles into. */
  export interface IFinal {
    /** The seated trunk pitch, degrees. */
    pitch: number;

    /** The seated joints, clinical degrees. */
    joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >;
  }

  /**
   * The seconds the pelvis crosses to the seat over: late astride, after the
   * far leg has left the floor, to the contact at 80 % of the climb; from the
   * start onto a seat sat with the legs ahead.
   *
   * @param climb The climb's seconds.
   * @param astride Whether the seat is sat astride.
   * @returns The crossing's first and last seconds.
   */
  export function crossing(
    climb: number,
    astride: boolean,
  ): readonly [number, number] {
    return astride ? [0.3 * climb, 0.8 * climb] : [0, 0.7 * climb];
  }
}

/** The alternatives of `Frame2`'s site. */
type Frame2 = "root" | "yaw" | "pitch" | "roll" | "joints";
