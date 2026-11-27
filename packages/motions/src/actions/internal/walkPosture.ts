import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStandUpright,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../../compose/AutoMovieMotionHumanLean";
import { HumanTrunk } from "../../everyday/HumanTrunk";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { prepareWalkSwingSeams } from "./prepareWalkSwingSeams";
import { stand } from "./stand";
import { standUpright } from "./standUpright";
import type { walkFoot } from "./walkFoot";
import type { walkLocomoteSwings } from "./walkLocomoteSwings";
import { walkReach } from "./walkReach";

/**
 * Prepare one stepping take's standing alignment and assemble its posture
 * before arm carriage, writing only requested leg goals.
 *
 * @param body The take's fixed body.
 * @param gait Its trunk lean and arm geometry.
 * @param arms The authored and manner-scaled arm swing multiplier.
 * @param elbows The authored added shoulder abduction, degrees.
 * @param steps The take's fixed step clock and phase readers.
 * @param solve The take's same-second pelvis/foot solve, sharing the phase and
 *   amount this reader already evaluated at that exact second.
 * @param swings The scheduled transitions between stance and flight.
 * @returns A clamped action-second reader; omitted leg/channel demand writes
 *   the complete posture.
 */
export function walkPosture(
  body: IAutoMovieMotionHumanBody,
  gait: IAutoMovieMotionHumanWalkGait,
  arms: number,
  elbows: number,
  steps: IAutoMovieMotionHumanWalkSteps.IPlan,
  solve: (
    seconds: number,
    legs: readonly AutoMovieHumanSide[],
    phase: number,
    amount: number,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ) => walkPosture.ISettled,
  swings: readonly walkLocomoteSwings.ISwing[],
): (
  seconds: number,
  legs?: readonly AutoMovieHumanSide[],
  channels?: readonly AutoMovieMotionHumanChannel[],
  resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
) => IAutoMovieMotionHumanPosture {
  const upright: IAutoMovieMotionHumanStandUpright.IAlignment =
    standUpright(body);
  const relaxed: IAutoMovieMotionHumanPosture["joints"] = stand.relaxed(body);
  const abduction: number = stand.abduction(body);
  const shapes: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanPosture["joints"]
  > = {
    left: HumanHand.shape("left", "relaxed"),
    right: HumanHand.shape("right", "relaxed"),
  };
  const rest: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: body.rest.get("leftLowerLeg")!,
    right: body.rest.get("rightLowerLeg")!,
  };
  const read = (
    seconds: number,
    legs: readonly AutoMovieHumanSide[] = walkReach.SIDES,
    channels?: readonly AutoMovieMotionHumanChannel[],
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    adjust?: ReturnType<typeof prepareWalkSwingSeams>,
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.min(steps.duration, Math.max(0, seconds));
    const phase: number = steps.phase(t);
    const amount: number = steps.amount(t);
    const swing: number = Math.sin(2 * Math.PI * phase) * amount;
    const { feet, hips, settled, reached }: walkPosture.ISettled = solve(
      t,
      legs,
      phase,
      amount,
      resolution,
    );
    const root: IAutoMovieVector3 = settled.root;
    const yaw: number = settled.yaw;

    // The inclination grows and fades with the gait, leaving and joining
    // upright standing while its pelvis share turns about the fixed hips.
    const inclined: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      upright.joints,
      gait.lean * amount,
    );
    const swinging: boolean =
      channels === undefined ||
      channels.includes("leftArm") ||
      channels.includes("rightArm");
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...(swinging ? relaxed : {}),
      ...inclined.joints,
      hips,
      leftToes: [reached.left.toes, 0, 0],
      rightToes: [reached.right.toes, 0, 0],
      chest: [inclined.joints.chest?.[0] ?? 0, 0, -walkPosture.CHEST * swing],
    };
    if (swinging) {
      // The arms hang their standing clearance out from the body plus the
      // pelvis's tilt: the trunk tilts with the pelvis while the planted feet
      // hold the legs, so a stance thigh swings out toward the hanging hand by
      // up to that angle about its hip. The tilt, the authored abduction and
      // the gait's elbow come in and go with the gait, so a walk leaves and
      // joins the relaxed standing arms.
      const rest: number = abduction;
      const bent: number = relaxed.leftLowerArm![0];
      const held: number = rest + (walkPosture.PELVIS + elbows) * amount;
      const elbow: number = bent + (gait.arms.elbow - bent) * amount;
      joints.leftUpperArm = [-gait.arms.shoulder * arms * swing, held, 0];
      joints.rightUpperArm = [gait.arms.shoulder * arms * swing, held, 0];
      joints.leftLowerArm = [elbow - gait.arms.swing * arms * swing, 0, 0];
      joints.rightLowerArm = [elbow + gait.arms.swing * arms * swing, 0, 0];
    } else {
      for (const side of walkReach.SIDES)
        if (channels?.includes(`${side}Hand`))
          Object.assign(joints, shapes[side]);
    }
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const side of legs) {
      const flight: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] =
        feet[side].swing;

      // The foot has no axial joint: its own heading carries the knee's
      // bend hint even when a folded shank pitches it past vertical.
      const knee: IAutoMovieVector3 = HumanFrame.point(
        {
          origin: HumanFrame.point({ origin: root, yaw }, rest[side]),
          yaw: HumanFoot.heading(reached[side].rotation),
        },
        { x: 0, y: 0, z: 1 },
      );
      limbs[`${side}Leg`] = {
        point: reached[side].ankle,
        bend: knee,
        rotation: reached[side].rotation,
        ...(flight === undefined
          ? { planted: true, contact: settled.contacts[side] }
          : {}),
      };
      if (flight !== undefined && adjust !== undefined)
        adjust(side, flight, limbs[`${side}Leg`]!, joints);
    }
    return AutoMovieMotionHumanLean.pivot(
      body,
      { root, yaw, pitch: 0, roll: 0, joints, limbs },
      { pitch: inclined.pitch, roll: 0 },
    );
  };
  if (swings.length === 0) return read;
  const adjust: ReturnType<typeof prepareWalkSwingSeams> =
    prepareWalkSwingSeams(body, swings, (side, seconds) =>
      read(seconds, [side], [`${side}Leg`]),
    );
  return (seconds, legs, channels, resolution) =>
    read(seconds, legs, channels, resolution, adjust);
}

/**
 * The record a stepping take's solve hands the posture, and the chest's
 * counter-rotation.
 */
export namespace walkPosture {
  /** The settled feet and pelvis the gait's posture reads at one second. */
  export interface ISettled {
    /** Each foot as its schedule has it. */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>;

    /** The pelvis joint's clinical angles, degrees. */
    hips: readonly [number, number, number];

    /** The pelvis lowered onto its stances. */
    settled: walkReach.IGround;

    /** Each foot as reached from the settled pelvis. */
    reached: Record<AutoMovieHumanSide, walkFoot.IEnd>;
  }

  /**
   * The pelvis's turn and tilt with the stride, degrees either way (Perry and
   * Burnfield, normal gait kinematics: about 4° each).
   */
  export const PELVIS: number = 4;

  /**
   * The chest's counter-rotation against the stride at full gait, degrees: the
   * pelvis's own turn, mirrored. The thorax turns against the pelvis at
   * ordinary walking speeds (relative phase about -140° at 1.5 m/s, Lamoth et
   * al. 2002, Spine 27:E92); its equal amplitude, keeping the shoulders square
   * to the way, is the provisional part, no thorax amplitude having been read.
   */
  export const CHEST: number = PELVIS;
}
