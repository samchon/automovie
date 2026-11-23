import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { GymnasticsFlight } from "./GymnasticsFlight";
import type { IPreparedGymnasticsFrame } from "./IPreparedGymnasticsFrame";
import type { prepareGymnasticsFrame } from "./prepareGymnasticsFrame";

/** The takeoff, key poses and world-space inputs for a high jump's flight. */
interface IHighJumpFlight {
  /** The performer. */
  body: IAutoMovieMotionHumanBody;

  /** The frozen takeoff posture that supplies the departure joints and heading. */
  from: IAutoMovieMotionHumanPosture;

  /** The arched pose at the apex. */
  arch: IAutoMovieMotionHumanExerciseKey.IKey;

  /** The pike target after the apex. */
  pike: IAutoMovieMotionHumanExerciseKey.IKey;

  /** The reader for canonical placement and floor observations. */
  prepareFrame: ReturnType<typeof prepareGymnasticsFrame>;

  /** The takeoff centre of mass, in world metres. */
  c0: IAutoMovieVector3;

  /** The takeoff velocity, in world metres per second. */
  v: IAutoMovieVector3;

  /** The time from takeoff to the apex, in seconds. */
  rising: number;

  /** The landing surface height, in world metres. */
  surface: number;

  /** The crossbar height, in world metres, for the refusal message. */
  bar: number;
}

/** The flight reader and its touchdown instant. */
interface IHighJumpAirborne {
  /**
   * Sample the posture at seconds since takeoff with optional synchronous FK
   * and projection loans.
   */
  flying: (
    seconds: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ) => IAutoMovieMotionHumanPosture;

  /** Touchdown, in seconds since takeoff. */
  down: number;
}

/**
 * Prepare the keyed Fosbury flight and solve for touchdown on the back.
 *
 * @param input The takeoff, key poses, launch and landing height.
 * @returns A flight posture reader and the time its lowest shape lands.
 * @throws {HumanRefusal} When the lowest point at the apex does not clear the
 *   landing surface.
 */
export function highJumpFlight(input: IHighJumpFlight): IHighJumpAirborne {
  const { body, from, arch, pike, prepareFrame, c0, v, rising, surface, bar } =
    input;

  // The flight posture at seconds since the take-off: the joints keyed,
  // the half turn over the rise and the somersault through the flight
  // at constant rates from the take-off, the centre on its parabola.
  const start: IAutoMovieMotionHumanExerciseKey.IKey = {
    pitch: 0,
    roll: 0,
    yaw: 0,
    lift: 0,
    joints: from.joints,
  };
  const ease: (x: number) => number = (x: number): number => {
    const u: number = Math.min(1, Math.max(0, x));
    return u * u * (3 - 2 * u);
  };
  // The somersault eases in over the first half of the rise, as the turn
  // a take-off starts is not at full rate in its first instant, then runs
  // at the constant rate that lays the body level at the apex.
  const ramp: number = 0.5 * rising;
  const spin: number = 90 / (rising - ramp / 2);
  const somersault: (t: number) => number = (t: number): number =>
    t < ramp ? (spin * t * t) / (2 * ramp) : spin * (t - ramp / 2);
  const arching: ReturnType<typeof ExerciseKey.prepareBlend> =
    ExerciseKey.prepareBlend(start, arch);
  const piking: ReturnType<typeof ExerciseKey.prepareBlend> =
    ExerciseKey.prepareBlend(arch, pike);
  const frameAt: (
    t: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ) => IPreparedGymnasticsFrame = (
    t: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IPreparedGymnasticsFrame => {
    const risingShare: number = ease(t / rising);
    const key: IAutoMovieMotionHumanExerciseKey.IKey =
      t <= rising ? arching(risingShare) : piking(ease((t - rising) / rising));
    return prepareFrame(
      {
        ...from,
        joints: key.joints,
        yaw: from.yaw + 180 * risingShare,
        pitch: -somersault(t),
      },
      GymnasticsFlight.at(c0, v, t),
      resolution,
      projection,
    );
  };
  const flying: (
    t: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ) => IAutoMovieMotionHumanPosture = (
    t: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture => frameAt(t, resolution, projection).posture;

  // The touchdown: the lowest shape meets the surface on the way down.
  const down: number = ((): number => {
    const floorResolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const floorProjection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const lowest: (t: number) => number = (t: number): number => {
      const frame: IPreparedGymnasticsFrame = frameAt(
        t,
        floorResolution,
        floorProjection,
      );
      return frame.posture.root.y - frame.floor();
    };
    const apexLowest: number = lowest(rising);
    if (!(apexLowest > surface))
      throw new HumanRefusal({
        kind: "reach",
        axis: "bar",
        value: bar,
        reason: `at the apex the body's lowest point is at ${apexLowest.toFixed(2)} m, no higher than the landing surface at ${surface.toFixed(2)} m`,
        fix: "raise the bar, or land on a lower surface",
      });
    const fallen: number = GymnasticsFlight.fall(c0.y, v.y, surface)!;
    return GymnasticsFlight.touchdown(rising, fallen, lowest, surface);
  })();

  return { flying, down };
}
