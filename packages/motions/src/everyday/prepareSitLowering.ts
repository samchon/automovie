import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import { seated } from "./seated";

/** The sitting law's unchanged entry, target and descent geometry. */
interface IProps {
  /** The body whose socket and planted legs are read. */
  body: IHumanBody;

  /** Initial heading, degrees about world +Y. */
  yaw: number;

  /** The sitting law's admitted heading change, degrees. */
  turn: number;

  /** Original descent and seat-contact times, seconds. */
  descent: number;

  /** Time when the seat starts bearing, seconds. */
  contact: number;

  /** Peak trunk inclination, degrees. */
  peak: number;

  /** Initial seat-socket point, world metres. */
  start: IAutoMovieVector3;

  /** Final seat-socket point, world metres. */
  goal: IAutoMovieVector3;

  /** Direct standing angles before the final-back additions. */
  joints: IHumanPosture["joints"];

  /** Final back inclination and additive clinical joint angles, degrees. */
  final: { pitch: number; joints: IHumanPosture["joints"] };

  /** Both original planted ankle points used by the pelvis limit, world metres. */
  feet: Record<"left" | "right", IAutoMovieVector3>;

  /** Actual current leg goals, including the sitting law's crossed-foot course. */
  legs(
    root: IAutoMovieVector3,
    yaw: number,
    seconds: number,
  ): IHumanPosture["limbs"];
}

/**
 * Prepare the sitting law's fixed descent intervals and ordered back-joint
 * additions. Each query retains the original socket course, lumbopelvic
 * rhythm and planted-leg root lowering; its FK source is borrowed only for
 * that query's actual raw-pelvis hip observation.
 *
 * @param props Unchanged body, entry/target geometry and authored timing.
 * @returns A current seconds/back-share posture reader, optionally borrowing synchronous FK metadata; no ROM projection is added to raw root lowering.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines world-metre sockets/feet, clinical degrees, action seconds, immutable geometry and the optional nonescaping raw-hip FK source.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the sitting law's original minimum-jerk socket travel and trunk-pitch windows, ordered additive back-joint arithmetic, HumanTrunk inclination/pelvis limit and seated socket-to-root transform before canonical planted-leg lowering.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed durations, socket deltas and joint entries are prepared once. The reader constructs the same current socket/joints, derives the current trunk/root, then delegates actual leg goals and root lowering to their owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every original timing coefficient, endpoint branch, joint addition, pelvis cap and crossed-foot callback remains; no trajectory, goal, contact tolerance, ROM policy or solved posture is substituted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Prepares O(J) final joint entries and constant fixed intervals once. Each read copies its actual baseline joints and applies J additions, followed by the original constant two-leg geometry and actual hip FK when a world plant needs lowering.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, timings, endpoints, foot datums and joint values remain unchanged for this plan. Only those prerequisites are shared; every current time/back share and actual leg callback is evaluated, with optional FK loans limited to this synchronous read.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns O(J) fixed entries, borrowed immutable geometry and its leg callback until release. Current socket/joints and the optional FK source end with each read or throw; no pose, solved goal, borrowed workspace or time history is retained.
 */
export function prepareSitLowering(
  props: IProps,
): (
  seconds: number,
  back: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
) => IHumanPosture {
  const { body, descent, contact, peak, start, goal, final, feet }: IProps =
    props;
  const finish: [AutoMovieHumanoidBone, readonly [number, number, number]][] =
    Object.entries(final.joints) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][];
  const delta: IAutoMovieVector3 = {
    x: goal.x - start.x,
    y: goal.y - start.y,
    z: goal.z - start.z,
  };
  const acrossDuration: number = 0.7 * descent;
  const downFrom: number = 0.1 * descent;
  const downDuration: number = contact - downFrom;
  const settleFrom: number = 0.6 * descent;
  const settleDuration: number = 0.4 * descent;
  const peakDuration: number = 0.45 * descent;
  return (
    t: number,
    back: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IHumanPosture => {
    const across: number = minimumJerk.share(t / acrossDuration);
    const down: number = minimumJerk.share((t - downFrom) / downDuration);
    const socket: IAutoMovieVector3 = {
      x: start.x + delta.x * back,
      y: start.y + delta.y * down,
      z: start.z + delta.z * back,
    };
    const settle: number = minimumJerk.share((t - settleFrom) / settleDuration);
    const pitch: number =
      t < settleFrom
        ? peak * minimumJerk.share(t / peakDuration)
        : peak + (final.pitch - peak) * settle;
    const yaw: number = props.yaw + props.turn * across;
    const joints: IHumanPosture["joints"] = { ...props.joints };
    for (const [bone, a] of finish) {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [
        was[0] + a[0] * settle,
        was[1] + a[1] * settle,
        was[2] + a[2] * settle,
      ];
    }
    const tilt: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      joints,
      pitch,
      HumanTrunk.pelvisLimit(
        body,
        seated.root(body, socket, { yaw, pitch: 0, roll: 0 }),
        yaw,
        feet,
      ),
    );
    const root: IAutoMovieVector3 = seated.root(body, socket, {
      yaw,
      pitch: tilt.pitch,
      roll: 0,
    });
    return resolveHumanPosture.lower(
      body,
      {
        root,
        yaw,
        pitch: tilt.pitch,
        roll: 0,
        joints: tilt.joints,
        limbs: props.legs(root, yaw, t),
      },
      undefined,
      resolution,
    );
  };
}
