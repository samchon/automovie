import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSwim,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { mixHumanPosture } from "../../posture/internal/mixHumanPosture";
import { turnHumanPosture } from "../../posture/internal/turnHumanPosture";

/*
 * Settle a change of stroke in the water around the displayed hips.
 */
export function prepareSurfaceSwimTransfer(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwim.IParams>,
  tempo: number,
): {
  entry: IAutoMovieMotionHumanPosture;
  connect(
    plan: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanActionPlan;
} {
  const { body, entry: state, params } = context;
  const previous = state.from?.family === "swim" ? state.from : undefined;
  const mode = (
    previous?.params as IAutoMovieMotionHumanSwim.IParams | undefined
  )?.kind;
  const { rotation: _turn, ...inherited } = state.posture;
  const rest: IAutoMovieVector3 = body.rest.get("hips")!;
  const displayed = state.pose.root;
  const hips: IAutoMovieVector3 =
    previous === undefined || displayed === null
      ? inherited.root
      : AutoMovieEngineVector3.add(
          displayed.translation,
          AutoMovieEngineQuaternion.rotateVector(displayed.rotation, rest),
        );
  const entry: IAutoMovieMotionHumanPosture = {
    ...inherited,
    pitch: 0,
    roll: 0,
    root: { ...inherited.root, x: hips.x, z: hips.z },
  };
  if (mode === undefined || mode === params.kind)
    return { entry, connect: (plan) => plan };

  const start: IAutoMovieMotionHumanPosture = {
    ...state.posture,
    limbs: {},
    joints: ExerciseKey.shown(state.pose).joints,
  };
  const begin = displayed?.rotation ?? turnHumanPosture(start).rotation;
  const yaw: number = start.yaw;
  const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
    humanPostureHeading({ yaw, pitch: 0, roll: 0 }),
  );
  const mouth = HumanTrunk.preparePoint(body, "mouth");
  const level: number = mouth(start).y;
  const reversing: boolean = PITCH[mode] * PITCH[params.kind] < 0;
  const turn = AutoMovieEngineQuaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });
  // Opposite horizontal headings turn on the surface and roll into the next stroke.
  const along: IAutoMovieQuaternion = reversing
    ? AutoMovieEngineQuaternion.multiply(turn(180), begin)
    : begin;

  return {
    entry,
    connect(plan) {
      const settle: number = CHANGE * Math.min(plan.duration, tempo);
      const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
        seconds,
        channels,
        resolution,
        projection,
      ) => {
        const target: IAutoMovieMotionHumanPosture = plan.posture(
          seconds,
          channels,
          resolution,
          projection,
        );
        if (seconds >= settle) return target;
        const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(seconds / settle);
        const blended = mixHumanPosture(start, target, share);
        const pointed = turnHumanPosture(target);
        const facing: IAutoMovieQuaternion = AutoMovieEngineQuaternion.slerp(
          along,
          pointed.rotation,
          share,
        );
        const aimed: IAutoMovieQuaternion = reversing
          ? AutoMovieEngineQuaternion.multiply(turn(-180 * (1 - share)), facing)
          : facing;
        const hinge: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
          hips,
          AutoMovieEngineVector3.add(
            pointed.position,
            AutoMovieEngineQuaternion.rotateVector(pointed.rotation, rest),
          ),
          share,
        );
        const root: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
          hinge,
          AutoMovieEngineQuaternion.rotateVector(aimed, rest),
        );
        const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
          aimed,
          inverse,
        );
        const projected: IAutoMovieMotionHumanPosture = {
          ...blended,
          root,
          yaw,
          pitch: 0,
          roll: 0,
          rotation: { about: root, turn: rotation },
        };
        if (seconds <= 0) return projected;
        // Carry the actual breathing line through the turn to the new stroke.
        const height: number =
          level + (mouth(target, resolution).y - level) * share;
        const lifted: IAutoMovieVector3 = {
          ...root,
          y: root.y + height - mouth(projected, resolution).y,
        };
        return {
          ...projected,
          root: lifted,
          rotation: { about: lifted, turn: rotation },
        };
      };
      return HumanPreparedPlayback.rebindPosture(
        { ...plan, posture },
        plan,
        body,
      );
    },
  };
}

/*
 * The time for a swimmer to change their surface posture, seconds.
 */
const CHANGE: number = 0.65;

/*
 * The angle of a stroke's long axis from the upright root, degrees.
 */
const PITCH: Readonly<Record<IAutoMovieMotionHumanSwim.Kind, number>> = {
  treadWater: 0,
  frontCrawl: 90,
  breaststroke: 90,
  backstroke: -90,
  float: -90,
};
