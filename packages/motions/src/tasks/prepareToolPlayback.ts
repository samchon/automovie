import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanBody } from "../body/createHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { prepareHumanPostureRigCheck } from "../posture/prepareHumanPostureRigCheck";

/**
 * Bind an uncarried tool's exact wrist trajectory to its fixed trunk. The
 * approach and return meet the same wrist target. Work in between uses the
 * actual swivel sweep on the same prepared trunk.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Local seconds select the tool's wrist and its original target solve. Rig or frame changes revert to original authoring.
 * @evidence contracts/development/implementation.md#principled-implementation One held trunk keeps the arm-chain and collider frames fixed across the cycle; only the two constant-wrist intervals reuse the same chosen bend.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The tool law supplies its original target and transport, this helper supplies the fixed-input check and event binding.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each changing target keeps the same sweep, reach fallback, timing and wrist transform; it is never inferred from a neighbor.
 * @evidence contracts/development/implementation.md#efficient-algorithms Prepare one chain and one fixed target after placement. Each work sample evaluates one current sweep, while approach and return use the original time-dependent arm move with its fixed target.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact XYZ and orientation admit the fixed tool trunk; the native plan checks live rig, profile and fallback shoulder dependencies.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One fixed trunk context and fixed wrist goal are owned by the native plan, with fresh target fields on return and no per-query records.
 */
export function prepareToolPlayback(props: {
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
}): void {
  const { plan, body, side, entry, ready, recover, target, compose, finish } =
    props;
  if (!createHumanBody.owns(body)) return;
  const root: IAutoMovieVector3 = { ...entry.root };
  const frame: IAutoMovieMotionHumanPosture = { ...entry, root };
  const sameFrame = (posture: IAutoMovieMotionHumanPosture): boolean =>
    Object.is(posture.root.x, root.x) &&
    Object.is(posture.root.y, root.y) &&
    Object.is(posture.root.z, root.z) &&
    Object.is(posture.yaw, frame.yaw) &&
    Object.is(posture.pitch, frame.pitch) &&
    Object.is(posture.roll, frame.roll);
  let rig: (() => boolean) | undefined;
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
      !createHumanBody.owns(body) ||
      !Object.is(body.measure.upperArm, upperArm) ||
      current === undefined ||
      !Object.is(current.x, rest.x) ||
      !Object.is(current.y, rest.y) ||
      !Object.is(current.z, rest.z) ||
      rig?.() !== true
    )
      return undefined;
    return {
      posture: finish(prepared.posture(args[0], undefined, args[2], args[3])),
    };
  };
  HumanPreparedPlayback.attach(plan, body, {
    mode: "posture",
    prepare: (): void => {
      rig = prepareHumanPostureRigCheck(body);
      if (rig === undefined) return;
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
