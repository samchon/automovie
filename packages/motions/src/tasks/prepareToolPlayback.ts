import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";

/** The record of `IPrepareToolPlaybackProps`'s site. */
type IPrepareToolPlaybackProps = {
  plan: IAutoMovieMotionHumanActionPlan;
  body: IAutoMovieMotionHumanBody;
  side: AutoMovieHumanSide;
  entry: IAutoMovieMotionHumanPosture;
  ready: number;
  recover: number;
  target: (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    bends?: ReturnType<typeof AutoMovieMotionHumanBend.prepare>,
  ) => IAutoMovieMotionHumanArmTarget.ITarget;
  compose: (
    target: IAutoMovieMotionHumanArmTarget.Frame,
  ) => IAutoMovieMotionHumanActionPlan;
  finish: (
    posture: IAutoMovieMotionHumanPosture,
  ) => IAutoMovieMotionHumanPosture;
};

/**
 * Bind an uncarried tool's exact wrist trajectory to its fixed trunk. The
 * approach and return meet the same wrist target. Work in between uses the
 * actual swivel sweep on the same prepared trunk.
 */
export function prepareToolPlayback(props: IPrepareToolPlaybackProps): void {
  const { plan, body, side, entry, ready, recover, target, compose, finish } =
    props;
  const root: IAutoMovieVector3 = { ...entry.root };
  const frame: IAutoMovieMotionHumanPosture = { ...entry, root };
  const sameFrame = (posture: IAutoMovieMotionHumanPosture): boolean =>
    Object.is(posture.root.x, root.x) &&
    Object.is(posture.root.y, root.y) &&
    Object.is(posture.root.z, root.z) &&
    Object.is(posture.yaw, frame.yaw) &&
    Object.is(posture.pitch, frame.pitch) &&
    Object.is(posture.roll, frame.roll);
  const profile: typeof body.profile = body.profile;
  const upperArm: number = body.measure.upperArm;
  const shoulder: IAutoMovieVector3 | undefined = body.rest.get(
    `${side}UpperArm`,
  );
  if (shoulder === undefined) return;
  const rest: IAutoMovieVector3 = { ...shoulder };

  let bends: ReturnType<typeof AutoMovieMotionHumanBend.prepare> | undefined;
  let fixed: IAutoMovieMotionHumanArmTarget.ITarget | undefined;
  const prepared: IAutoMovieMotionHumanActionPlan = compose(
    (posture, seconds) => {
      if (!sameFrame(posture)) return target(posture, seconds);
      if ((seconds <= ready || seconds >= recover) && fixed !== undefined)
        return {
          ...fixed,
          point: { ...fixed.point },
          rotation: { ...fixed.rotation },
          bend: { ...fixed.bend },
        };
      return target(posture, seconds, bends);
    },
  );
  /** The public writer reads all authored channels before retaining digits. */
  const sample: IAutoMovieMotionHumanPlayback.IPhase["sample"] = (...args) => {
    const current: IAutoMovieVector3 | undefined = body.rest.get(
      `${side}UpperArm`,
    );
    if (
      body.profile !== profile ||
      !Object.is(body.measure.upperArm, upperArm) ||
      current === undefined ||
      !Object.is(current.x, rest.x) ||
      !Object.is(current.y, rest.y) ||
      !Object.is(current.z, rest.z)
    )
      return undefined;
    return {
      posture: finish(prepared.posture(args[0], undefined, args[2], args[3])),
    };
  };
  HumanPreparedPlayback.attach(plan, body, {
    mode: "posture",
    prepare: (): void => {
      bends = AutoMovieMotionHumanBend.prepare({ body, posture: frame, side });
      fixed = target(frame, ready, bends);
    },
    phases: [
      { from: 0, to: ready, sample },
      { from: ready, to: recover, sample },
      { from: recover, to: plan.duration, sample },
    ],
  });
}
