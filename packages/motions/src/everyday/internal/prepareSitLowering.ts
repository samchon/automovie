import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanTrunk } from "../HumanTrunk";
import { seated } from "./seated";
import { seatedLumbarTransfer } from "./seatedLumbarTransfer";

/** The record of `IPropsFinal`'s site. */
type IPropsFinal = {
  pitch: number;
  joints: IAutoMovieMotionHumanPosture["joints"];
};

/** The sitting law's unchanged entry, target and descent geometry. */
interface IProps {
  /** The body whose socket and planted legs are read. */
  body: IAutoMovieMotionHumanBody;

  /** Initial heading, degrees about world +Y. */
  yaw: number;

  /** The sitting law's admitted heading change, degrees. */
  turn: number;

  /** Seconds the descent takes, when the back has settled. */
  descent: number;

  /**
   * Time when the seat starts bearing, seconds; the back settles from it to
   * `descent`.
   */
  contact: number;

  /** Seconds over which the socket travels back and the heading turns. */
  across: number;

  /**
   * Time when the socket starts down, seconds; it reaches the seat at
   * `contact`.
   */
  down: number;

  /** Time when the trunk reaches its peak flexion, seconds. */
  flexed: number;

  /** Peak trunk inclination, degrees. */
  peak: number;

  /** Initial seat-socket point, world metres. */
  start: IAutoMovieVector3;

  /** Final seat-socket point, world metres. */
  goal: IAutoMovieVector3;

  /** Direct standing angles before the final-back additions. */
  joints: IAutoMovieMotionHumanPosture["joints"];

  /** Final back inclination and additive clinical joint angles, degrees. */
  final: IPropsFinal;

  /** Both original planted ankle points used by the pelvis limit, world metres. */
  feet: Record<AutoMovieHumanSide, IAutoMovieVector3>;

  /** Actual current leg goals, including the sitting law's crossed-foot course. */
  legs(
    root: IAutoMovieVector3,
    yaw: number,
    seconds: number,
  ): IAutoMovieMotionHumanPosture["limbs"];
}

/**
 * Prepare a sit's descent: the seat socket travels back on the caller's
 * balanced share and down from `down` to `contact`, the heading turns over
 * `across`, and the trunk flexes to its peak by `flexed` and holds it until the
 * seat takes the weight at `contact`, then settles with the seated back's joint
 * additions by `descent` (Kralj, Jaeger and Munih 1990). The root follows from
 * the socket and the trunk's pitch, and the planted legs lower it where they
 * cannot reach their feet.
 *
 * @param props The body, the socket's start and goal, the timing in seconds and
 *   the leg writer.
 * @returns A posture reader at a second and a back share, optionally borrowing
 *   one synchronous FK source for the hip reading of its lowering.
 */
export function prepareSitLowering(
  props: IProps,
): (
  seconds: number,
  back: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
) => IAutoMovieMotionHumanPosture {
  const {
    body,
    descent,
    contact,
    across,
    down,
    flexed,
    peak,
    start,
    goal,
    final,
    feet,
  }: IProps = props;
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
  const downDuration: number = contact - down;
  const settleDuration: number = descent - contact;
  const lower: ReturnType<typeof lowerHumanPosture.prepare> =
    lowerHumanPosture.prepare(body);
  let transfer: number = 0;
  const read = (
    t: number,
    back: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanPosture => {
    const turned: number = AutoMovieEngineMotionSampling.minimumJerkShare(t / across);
    const lowered: number = AutoMovieEngineMotionSampling.minimumJerkShare((t - down) / downDuration);
    const socket: IAutoMovieVector3 = {
      x: start.x + delta.x * back,
      y: start.y + delta.y * lowered,
      z: start.z + delta.z * back,
    };

    // The trunk flexes to its peak and holds it until the seat takes the
    // weight, then settles into the seated back (Kralj, Jaeger and Munih 1990).
    const settle: number = AutoMovieEngineMotionSampling.minimumJerkShare((t - contact) / settleDuration);
    const pitch: number =
      t < contact
        ? peak * AutoMovieEngineMotionSampling.minimumJerkShare(t / flexed)
        : peak + (final.pitch - peak) * settle;
    const yaw: number = props.yaw + props.turn * turned;
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...props.joints };
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
    // On approach the thighs come under the leaning trunk. The chest
    // takes only their impending overlap, giving the flexion back as the
    // seated back settles. This leaves the pelvis and both supports fixed.
    const moved: number = transfer * lowered * (1 - settle);
    if (moved > 0) {
      const spine: NonNullable<typeof joints.spine> = tilt.joints.spine ?? [
        0, 0, 0,
      ];
      const chest: NonNullable<typeof joints.chest> = tilt.joints.chest ?? [
        0, 0, 0,
      ];
      tilt.joints.spine = [spine[0] - moved, spine[1], spine[2]];
      tilt.joints.chest = [chest[0] + moved, chest[1], chest[2]];
    }
    return lower(
      {
        root,
        yaw,
        pitch: tilt.pitch,
        roll: 0,
        joints: tilt.joints,
        limbs: props.legs(root, yaw, t),
      },
      resolution,
    );
  };
  transfer = seatedLumbarTransfer(body, read(contact, 1));
  return read;
}
