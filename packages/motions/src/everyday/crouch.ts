import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrouch,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { walkRoot } from "../actions/walkRoot";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanTrunk } from "./HumanTrunk";
import { bendLower } from "./bendLower";
import { braceOnThigh } from "./braceOnThigh";
import { prepareHumanTrunkBalance } from "./prepareHumanTrunkBalance";

/**
 * A crouch or a squat held in place: the hips sink over the planted feet to a
 * knee flexion the depth names, the trunk inclines over the feet, the hands
 * come to rest on the thighs above the knees, the body holds, then stands
 * again.
 *
 * The depth is a knee flexion, not a height, so one depth fits every body:
 * `partial` is the parallel squat of about 100 degrees (Escamilla 2001, Med Sci
 * Sports Exerc 33:127) and `full` the deep squat at the knee's range end of 150
 * degrees, inside the 141.6 degrees measured in kneeling (Acker et al. 2011, J
 * Arthroplasty 26:319) and below the 157 +- 6 degrees of a heels-up squat
 * (Hemmerich et al. 2006, J Orthop Res 24:770), which the range table does not
 * reach. The shank tilts forward by the crouching ankle's dorsiflexion
 * (`ANKLE`, within the range table's), plus the heel lift when the heels are up
 * (the foot pivots about its toes' joint, which stays on the floor), and the
 * thigh takes the rest of the knee flexion, so the hip joint's place over the
 * ankle follows from the leg's two lengths. On the way down the shank and the
 * thigh tilt together, each by the descent's share of its own tilt, so the hips
 * follow the leg's arc and the ankle never passes its range: the heel stays
 * down until the ankle reaches the range and then rises by the rest, the
 * heel-off of a range-limited ankle. A depth whose thigh angle and the hip's
 * flexion range leave no room for the trunk is refused with the deepest knee
 * flexion the heels allow: a full squat with flat heels leaves the thigh past
 * the hip's range at the crouching ankle, so it asks for `heels: "up"`.
 *
 * The trunk inclines to the squat's measured key (`INCLINE`) by the same share
 * as the legs. When the caller opts into balance, the lumbar joint turns the
 * trunk by the nearest angle that brings the centre of mass over the measured
 * soles. One rigid rotation describes the changed mass points. See Hof,
 * Gazendam and Sinke (2005) for the static support criterion. The inclination
 * is shared by the lumbopelvic rhythm: the pelvis tilts about the hips as far
 * as the folded thighs leave the hip room and the spine flexes for the rest,
 * the rounded back of a deep squat (`HumanTrunk.incline`); the hands rest on
 * the thighs just above the knees, as people support the trunk on the thighs
 * (Kingma, Faber and van Dieen 2016, J Biomech 49:881). The descent takes 1.0 s
 * for a partial squat (half a self-paced repetition, Hannan and King 2022) and
 * that times the square root of the full squat's greater knee travel, about
 * 1.22 s, for a full one (`DESCENT`) at the reference hip (`REFERENCE_HIP`)
 * height, scaled by the square root of the hip height (dynamic similarity,
 * Alexander 1984) and by the manner's tempo, the hold `hold` seconds and the
 * rise as long as the descent. Events: `descend` at the start, `lowest`,
 * `ascend`.
 */
export namespace crouch {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "crouch";

  /**
   * Cancel table: a crouch stands up at any time, and kneels or handles a low
   * thing from its lowest pose.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: [0, 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    crouch: [{ window: ["ascend", 1], kind: "inertialize", entry: 0 }],
    kneel: [
      {
        window: ["lowest", "ascend"],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    pickUp: [
      {
        window: ["lowest", "ascend"],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    putDown: [
      {
        window: ["lowest", "ascend"],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /**
   * Knee flexion at the lowest pose by depth, degrees (Escamilla 2001; the
   * range table's end for `full`).
   */
  export const KNEE: Readonly<
    Record<IAutoMovieMotionHumanCrouch.Depth, number>
  > = {
    partial: 100,
    full: 150,
  };

  /**
   * Forward inclination at the lowest pose, degrees from standing. The parallel
   * squat takes the measured 34.7° mean at 107.2° knee flexion (Kasahara et al.
   * 2024, doi:10.5114/jhk/183066). The deep squat takes the 33.2° and 32.6°
   * bilateral means of the C7–L5 segment (Endo, Miura and Sakamoto 2020, Table
   * 1, doi:10.1589/jpts.32.391), used as a key for the rig's deeper heels-up
   * squat.
   */
  const INCLINE: Readonly<Record<IAutoMovieMotionHumanCrouch.Depth, number>> = {
    partial: 34.7,
    full: (33.2 + 32.6) / 2,
  };

  /**
   * The ankle's dorsiflexion in a crouch, degrees: `bendLower.ANKLE`, the most
   * measured while crouching (Hyodo et al. 2017).
   */
  export const ANKLE: number = bendLower.ANKLE;

  /**
   * The heel lift of `heels: "up"`, degrees about the toes' joint: the bend
   * law's squat lift (`bendLower.HEEL.squat`, no source found).
   */
  export const HEEL: number = bendLower.HEEL.squat;

  /**
   * Kasahara et al. (2024) observed the trunk's inclination peaking near the
   * deepest posture. Use the trunk alone while the low pose is held.
   */
  export const balance: IAutoMovieMotionHumanBalance = {
    by: "trunk",
    from: { event: "lowest" },
    to: { event: "ascend" },
  };

  /**
   * Descent seconds by depth for a `REFERENCE_HIP` hip height: a partial
   * squat's half of a self-paced bodyweight squat, 1.92 +- 0.27 s a repetition
   * (Hannan and King 2022, Int J Sports Phys Ther 17:1075), so about 1 s down;
   * a full squat's from it by the square root of the knee's travel, the time of
   * a minimum-jerk movement of bounded peak acceleration growing with the
   * square root of its amplitude (peak acceleration `5.77 D / T^2`, Flash and
   * Hogan 1985).
   */
  export const DESCENT: Readonly<
    Record<IAutoMovieMotionHumanCrouch.Depth, number>
  > = {
    partial: 1.0,
    full: 1.0 * Math.sqrt(KNEE.full / KNEE.partial),
  };

  /**
   * The hip height `DESCENT` is stated for, metres, from which other bodies'
   * descents scale by its square root: the walk law's reference hip
   * (`walkRoot.REFERENCE_HIP`), the one every dynamically similar timing is
   * stated at.
   */
  export const REFERENCE_HIP: number = walkRoot.REFERENCE_HIP;

  /**
   * Plan a crouch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative, or the depth leaves the
   *   hip's flexion range no room with the heels asked for.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrouch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const depth: IAutoMovieMotionHumanCrouch.Depth =
      context.params.depth ?? "partial";
    const heels: IAutoMovieMotionHumanCrouch.Heels =
      context.params.heels ?? (depth === "full" ? "up" : "flat");
    const hold: number = context.params.hold ?? 1;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);

    // The leg's angles: the shank tilts by the crouching ankle plus the heel
    // lift, the thigh takes the rest of the knee flexion.
    const dorsiflexion: number = Math.min(
      ANKLE,
      AutoMovieMotionHumanRange.limit("leftFoot", "flexion") ?? 0,
    );
    const hipRange: number =
      AutoMovieMotionHumanRange.limit("leftUpperLeg", "flexion") ?? 0;
    const heel: number = heels === "up" ? HEEL : 0;
    const shankTilt: number = dorsiflexion + heel;
    const knee: number = KNEE[depth];
    const thighTilt: number = knee - shankTilt;
    if (thighTilt >= hipRange)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "depth",
        value: depth,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: hipRange + shankTilt,
          unit: "degrees",
          open: "maximum",
        },
        reason: `a ${depth} crouch with the heels ${heels} needs ${thighTilt.toFixed(0)} degrees of hip flexion before the trunk inclines, past the ${hipRange} degree range; with these heels the knee flexion must stay under ${(hipRange + shankTilt).toFixed(0)} degrees${heels === "flat" ? ", or raise the heels" : ""}`,
        fix: `choose a shallower depth${heels === "flat" ? ", or raise the heels" : ""}`,
      });

    // The clock: descent, hold, rise.
    const down: number =
      DESCENT[depth] * Math.sqrt(m.hipHeight / REFERENCE_HIP);
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence([
        { name: "descend", seconds: down },
        { name: "lowest", seconds: hold },
        { name: "ascend", seconds: down },
      ]),
      modifiers,
      { holds: ["lowest"] },
    );
    const duration: number = clock.duration;
    const window: HumanPhysics.Window = HumanPhysics.prepare(
      context.params,
      crouch,
      context.start,
      { duration, events: clock.events() },
      context.instant,
    );
    if (window !== null && window.by !== "trunk")
      throw new HumanRefusal({
        kind: "parameter",
        axis: "balance.by",
        value: window.by,
        reason:
          "a crouch corrects its centre through the lumbar joint above its planted legs",
        fix: "give trunk for balance.by",
      });
    const base: IAutoMovieMotionHumanActionPlan = stand.plan({
      ...context,
      params: { hold: duration },
    });
    const standing: IAutoMovieMotionHumanPosture = base.posture(0);
    const yaw: number = standing.yaw;
    const share: (seconds: number) => number =
      AutoMovieMotionClock.prepareEnvelope(
        clock,
        ["descend", "lowest"],
        ["ascend", "end"],
      );

    // The leg's angles move together over the descent, the shank's tilt and
    // the thigh's each by its share, so the ankle never passes the crouching
    // ankle: it takes the shank's tilt until it reaches it, and the heel rises
    // about the toes' joint by the rest.
    const lift: (s: number) => number = (s: number): number =>
      Math.max(0, shankTilt * s - dorsiflexion);

    // The feet at a share of the descent: each pivots about its toes' joint
    // by the heel's lift there.
    const placements: (
      posture: IAutoMovieMotionHumanPosture,
      s: number,
    ) => Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> = (
      posture: IAutoMovieMotionHumanPosture,
      s: number,
    ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> => {
      const foot: (
        side: AutoMovieHumanSide,
      ) => IAutoMovieMotionHumanFoot.IPlacement = (
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanFoot.IPlacement => {
        const goal: IAutoMovieHumanLimbGoal = posture.limbs[`${side}Leg`]!;
        const flat: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: goal.point,
          rotation: goal.rotation ?? HumanFrame.turn(yaw),
        };
        return heel === 0
          ? flat
          : HumanFoot.pivot(
              body,
              side,
              "mtp",
              HumanFoot.point(body, side, "mtp", flat),
              HumanFoot.heading(flat.rotation),
              -lift(s),
            );
      };
      return { left: foot("left"), right: foot("right") };
    };
    const feet: (
      posture: IAutoMovieMotionHumanPosture,
      placed: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    ) => IAutoMovieMotionHumanPosture["limbs"] = (
      posture: IAutoMovieMotionHumanPosture,
      placed: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    ): IAutoMovieMotionHumanPosture["limbs"] => {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const side of ["left", "right"] as const)
        limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          side,
          placed[side],
          true,
        );
      return limbs;
    };

    // The hip joints over each ankle at a share, from the leg's two lengths
    // at the share's tilts, averaged over the two legs. The standing legs
    // stand a little off the straight vertical leg this places at the start;
    // that difference is carried in by the share, so the root starts where
    // the standing posture puts it and ends where the leg's geometry does.
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const rad: (deg: number) => number = (deg: number): number =>
      (deg * Math.PI) / 180;
    const joints: ReturnType<typeof hipJoints> = hipJoints(
      body,
      standing.root,
      HumanFrame.turn(yaw),
    );
    const over: (
      s: number,
      placed?: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    ) => IAutoMovieVector3 = (
      s: number,
      placed: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanFoot.IPlacement
      > = placements(standing, s),
    ): IAutoMovieVector3 => {
      let out: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const side of ["left", "right"] as const) {
        const hip: IAutoMovieVector3 = Vector3.add(
          Vector3.add(placed[side].ankle, {
            x: 0,
            y:
              m.shank * Math.cos(rad(shankTilt * s)) +
              m.thigh * Math.cos(rad(thighTilt * s)),
            z: 0,
          }),
          Vector3.scale(
            forward,
            m.shank * Math.sin(rad(shankTilt * s)) -
              m.thigh * Math.sin(rad(thighTilt * s)),
          ),
        );
        out = Vector3.add(
          out,
          Vector3.scale(Vector3.subtract(hip, joints[side]), 0.5),
        );
      }
      return out;
    };
    const start: IAutoMovieVector3 = over(0);
    const move: (
      s: number,
      placed?: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    ) => IAutoMovieVector3 = (
      s: number,
      placed?: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    ): IAutoMovieVector3 =>
      Vector3.add(
        Vector3.subtract(over(s, placed), start),
        Vector3.scale(start, s),
      );

    /**
     * Bind fixed raw geometry for one share; every inclination still tips the
     * trunk and writes actual current-root knee goals.
     */
    function atShare(
      posture: IAutoMovieMotionHumanPosture,
      s: number,
    ): (
      inclination: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ) => IAutoMovieMotionHumanPosture {
      // Moving and tipping the root leave these raw leg goals unchanged.
      // Share only their current placements, rebuilding the actual knees below.
      const placed: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanFoot.IPlacement
      > = placements(posture, s);
      const moved: IAutoMovieMotionHumanPosture = {
        ...posture,
        root: Vector3.add(
          posture.root,
          move(s, posture === standing ? placed : undefined),
        ),
      };
      const limit: number = HumanTrunk.pelvisLimit(body, moved.root, yaw, {
        left: placed.left.ankle,
        right: placed.right.ankle,
      });
      return (
        inclination: number,
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      ): IAutoMovieMotionHumanPosture => {
        const inclined: ReturnType<typeof HumanTrunk.incline> =
          HumanTrunk.incline(moved.joints, inclination, limit);
        const tipped: IAutoMovieMotionHumanPosture =
          AutoMovieMotionHumanLean.tip(
            body,
            { ...moved, joints: inclined.joints },
            inclined.pitch,
            0,
          );
        const toes: readonly [number, number, number] = [
          heel === 0 ? 0 : lift(s),
          0,
          0,
        ];
        return lowerHumanPosture(
          body,
          {
            ...tipped,
            joints:
              heel === 0
                ? tipped.joints
                : { ...tipped.joints, leftToes: toes, rightToes: [...toes] },
            limbs: feet(tipped, placed),
          },
          undefined,
          resolution,
        );
      };
    }

    // The measured key applies as far as the lumbar spine can incline
    // when the pelvis has no room for another turn.
    const most: number =
      ((AutoMovieMotionHumanRange.limit("spine", "flexion") ?? 0) *
        (HumanTrunk.RHYTHM.lumbar + HumanTrunk.RHYTHM.thorax)) /
      HumanTrunk.RHYTHM.lumbar;
    const key: number = Math.min(most, INCLINE[depth]);
    type Correction = ReturnType<typeof prepareHumanTrunkBalance> | undefined;
    // The trunk's balance is prepared with the plan when a window can apply it.
    const correct: Correction =
      window === null ? undefined : prepareHumanTrunkBalance(body);

    const sink: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      reads: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const read: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(resolution);
        const s: number = share(seconds);
        const placed: IAutoMovieMotionHumanPosture = atShare(posture, s)(
          key * s,
          read,
        );
        const weight: number = HumanPhysics.weightAt(window, seconds);
        return weight === 0 || correct === undefined
          ? placed
          : correct(placed, weight, read, projection);
      },
    };
    const armSpan: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: clock.at("descend"),
      ready: clock.at("lowest"),
      relax: clock.at("ascend"),
      end: duration,
    };
    const arms: IAutoMovieMotionHumanArmPlanned.ITogether =
      AutoMovieMotionHumanArm.together(context.handover, true, context.tempo);
    const rest = (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive =>
      braceOnThigh(
        body,
        side,
        AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        duration,
        share,
        armSpan,
        arms,
      );

    // The hands open onto the thighs as the palms come to them: an open
    // hand lies on the thigh where the standing hand's curled thumb and
    // fingers went into it.
    const open = (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanHand.shape({
        side,
        shape: "flat",
        from: 0,
        to: duration,
        weight: share,
      });

    return {
      ...composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "lowest",
        primitives: [
          sink,
          rest("left"),
          rest("right"),
          open("left"),
          open("right"),
        ],
      }),
      ...HumanPhysics.declared(context.params, window),
      base: { kind: "standing" },
      // The feet carry the body, leaving the resting arms and head to overlays.
      yields: ["head", "leftHand", "rightHand", "leftArm", "rightArm"],
    };
  }
}
