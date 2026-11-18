import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
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
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import { bendLower } from "./bendLower";
import { braceOnThigh } from "./braceOnThigh";
import { prepareCrouchInclination } from "./prepareCrouchInclination";

/**
 * A crouch or a squat held in place: the hips sink over the planted feet to
 * a knee flexion the depth names, the trunk inclines until the centre of
 * mass is back over the feet, the hands come to rest on the thighs above the
 * knees, the body holds, then stands again.
 *
 * The depth is a knee flexion, not a height, so one depth fits every body:
 * `partial` is the parallel squat of about 100 degrees (Escamilla 2001, Med
 * Sci Sports Exerc 33:127) and `full` the deep squat at the knee's range end
 * of 150 degrees, inside the 141.6 degrees measured in kneeling (Acker et al.
 * 2011, J Arthroplasty 26:319) and below the 157 +- 6 degrees of a heels-up
 * squat (Hemmerich et al. 2006, J Orthop Res 24:770), which the range table
 * does not reach. The shank tilts forward by the crouching ankle's
 * dorsiflexion (`ANKLE`, within the range table's), plus the heel lift when
 * the heels are up (the foot pivots about its toes'
 * joint, which stays on the floor), and the thigh takes the rest of the knee
 * flexion, so the hip joint's place over the ankle follows from the leg's
 * two lengths. On the way down the shank and the thigh tilt together, each
 * by the descent's share of its own tilt, so the hips follow the leg's arc
 * and the ankle never passes its range: the heel stays down until the ankle
 * reaches the range and then rises by the rest, the heel-off of a
 * range-limited ankle. A depth whose thigh angle and the hip's flexion range leave
 * no room for the trunk is refused with the deepest knee flexion the heels
 * allow: a full squat with flat heels leaves the thigh past the hip's range
 * at the crouching ankle, so it asks for `heels: "up"`.
 *
 * The trunk's forward inclination is found by bisection at every eighth of
 * the descent, and by a secant search from those between them, so that the
 * whole-body centre of mass keeps a straight course over the soles, with no
 * speed to carry it off them: it stays where it stands with the heels flat,
 * or as near to that as the lumbar range brings it at the lowest pose, and
 * reaches the middle of the forefoot the body will stand on
 * (`HumanBalance.offset`, the base of support `HumanFoot.base`) by the time
 * the heels rise.
 * The inclination is shared by
 * the lumbopelvic rhythm: the pelvis tilts about the hips as far as the
 * folded thighs leave the hip room and the spine flexes for the rest, the
 * rounded back of a deep squat (`HumanTrunk.incline`); the hands rest
 * on the thighs just above the knees, as people support the trunk on the
 * thighs (Kingma, Faber and van Dieen 2016, J Biomech 49:881). The descent
 * takes 1.0 s for a partial squat (half a self-paced repetition, Hannan and
 * King 2022) and that times the square root of the full squat's greater knee
 * travel, about 1.22 s, for a full one (`DESCENT`) at the reference hip
 * (`REFERENCE_HIP`) height, scaled by the square root of the hip height
 * (dynamic similarity, Alexander 1984) and by the manner's tempo, the hold `hold`
 * seconds and the rise as long as the descent. Events: `descend` at the
 * start, `lowest`, `ascend`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the depth law with its sources, the refusal, the balance solve, the hands, the timing and the events, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core composed of part primitives over a standing base on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the depth table and the plan; the thigh brace it shares with the kneel is `braceOnThigh`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every place is read from the body's measure and the range table; no world coordinate is typed.
 */
export namespace crouch {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "crouch";

  /** Cancel table: a crouch stands up at any time, and kneels or handles a low thing from its lowest pose. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate }],
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

  /** Knee flexion at the lowest pose by depth, degrees (Escamilla 2001; the range table's end for `full`). */
  export const KNEE: Readonly<Record<IAutoMovieMotionHumanCrouch.Depth, number>> = {
    partial: 100,
    full: 150,
  };

  /** The ankle's dorsiflexion in a crouch, degrees: `bendLower.ANKLE`, the most measured while crouching (Hyodo et al. 2017). */
  export const ANKLE: number = bendLower.ANKLE;

  /** The heel lift of `heels: "up"`, degrees about the toes' joint: the bend law's squat lift (`bendLower.HEEL.squat`, no source found). */
  export const HEEL: number = bendLower.HEEL.squat;

  /** Shares of the descent at which the balancing inclination is solved. A numerical setting: eighths, so the solved course has a node about every 19 degrees of a full squat's knee, between which the secant search fills in. */
  export const SHARES: number = 8;

  /**
   * Descent seconds by depth for a `REFERENCE_HIP` hip height: a partial
   * squat's half of a self-paced bodyweight squat, 1.92 +- 0.27 s a
   * repetition (Hannan and King 2022, Int J Sports Phys Ther 17:1075), so
   * about 1 s down; a full squat's from it by the square root of the knee's
   * travel, the time of a minimum-jerk movement of bounded peak acceleration
   * growing with the square root of its amplitude (peak acceleration
   * `5.77 D / T^2`, Flash and Hogan 1985).
   */
  export const DESCENT: Readonly<Record<IAutoMovieMotionHumanCrouch.Depth, number>> = {
    partial: 1.0,
    full: 1.0 * Math.sqrt(KNEE.full / KNEE.partial),
  };

  /** The hip height `DESCENT` is stated for, metres, from which other bodies' descents scale by its square root: the walk law's reference hip (`walkRoot.REFERENCE_HIP`), the one every dynamically similar timing is stated at. */
  export const REFERENCE_HIP: number = walkRoot.REFERENCE_HIP;

  /**
   * Plan a crouch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative, or the depth leaves the hip's flexion range no room with the heels asked for.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the plan and both refusals; the namespace gives the law.
   * @evidence contracts/development/implementation.md#principled-implementation The hip's place follows from the knee flexion and the shank's tilt by the leg's two lengths, the pitch from a bisection on the centre of mass over the soles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, a standing base, one body row and two arm rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An infeasible depth throws with the feasible knee flexion instead of being clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms The inclination takes 12 bisection steps at each of `SHARES` shares at plan time; each posture costs at most six secant lowerings and one arm solve per side. The descent and rise envelope is prepared once from the clock.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The mass-name demand and the solved shares are prepared once per plan. Each share's foot placements, moved root and pelvis cap are fixed once for that share, and every inclination tried on it tips the trunk and solves the legs afresh. Planning and each posture read keep their own FK and ROM workspaces.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the solved inclinations, the body and the base until it is released; planning and per-posture workspaces end with their own call.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrouch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const depth: IAutoMovieMotionHumanCrouch.Depth = context.params.depth ?? "partial";
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
    const down: number = DESCENT[depth] * Math.sqrt(m.hipHeight / REFERENCE_HIP);
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
    const base: IAutoMovieMotionHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
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
    ) => Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = (
      posture: IAutoMovieMotionHumanPosture,
      s: number,
    ): Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> => {
      const foot: (side: "left" | "right") => IAutoMovieMotionHumanFoot.IPlacement = (
        side: "left" | "right",
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
      placed: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    ) => IAutoMovieMotionHumanPosture["limbs"] = (
      posture: IAutoMovieMotionHumanPosture,
      placed: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
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
    const rad: (deg: number) => number = (deg: number): number => (deg * Math.PI) / 180;
    const joints: ReturnType<typeof hipJoints> = hipJoints(body, standing.root, HumanFrame.turn(yaw));
    const over: (
      s: number,
      placed?: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    ) => IAutoMovieVector3 = (
      s: number,
      placed: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = placements(
        standing,
        s,
      ),
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
      placed?: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    ) => IAutoMovieVector3 = (
      s: number,
      placed?: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
    ): IAutoMovieVector3 =>
      Vector3.add(
        Vector3.subtract(over(s, placed), start),
        Vector3.scale(start, s),
      );

    /** Bind fixed raw geometry for one share; every inclination still tips the trunk and writes actual current-root knee goals. */
    function atShare(
      posture: IAutoMovieMotionHumanPosture,
      s: number,
    ): (
      inclination: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ) => IAutoMovieMotionHumanPosture {
      // Moving and tipping the root leave these raw leg goals unchanged.
      // Share only their current placements, rebuilding the actual knees below.
      const placed: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = placements(
        posture,
        s,
      );
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
        const tipped: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.tip(
          body,
          { ...moved, joints: inclined.joints },
          inclined.pitch,
          0,
        );
        return resolveHumanPosture.lower(
          body,
          {
            ...tipped,
            joints: {
              ...tipped.joints,
              ...(heel === 0
                ? {}
                : {
                    leftToes: [lift(s), 0, 0] as const,
                    rightToes: [lift(s), 0, 0] as const,
                  }),
            },
            limbs: feet(tipped, placed),
          },
          undefined,
          resolution,
        );
      };
    }

    // The inclination that keeps the centre of mass over the soles, solved
    // at each of `SHARES` shares of the descent and read linearly between
    // them, so the body is balanced on the way down and not only at the
    // bottom. The most is what the lumbar spine's range allows when the
    // pelvis takes none.
    const most: number =
      ((AutoMovieMotionHumanRange.limit("spine", "flexion") ?? 0) *
        (HumanTrunk.RHYTHM.lumbar + HumanTrunk.RHYTHM.thorax)) /
      HumanTrunk.RHYTHM.lumbar;
    // The centre keeps a straight course along the heading, read in the
    // world so the course does not turn where the base does, and has no
    // speed to carry it off the soles: with the heels flat it stays where it
    // stands, or as near to that as the most inclination brings it at the
    // lowest pose; with the heels rising it reaches the middle of the
    // forefoot (`HumanBalance.offset`) by the share the heels leave the
    // floor at, and stays over it.
    const inclination: ReturnType<typeof prepareCrouchInclination> =
      prepareCrouchInclination({
        body,
        forward,
        most,
        flat: heel === 0,
        rises: heel === 0 ? 1 : dorsiflexion / shankTilt,
        shares: SHARES,
        posture: (s: number): ReturnType<typeof atShare> =>
          atShare(standing, s),
      });

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
        const q: number = inclination(s, read, projection);
        return atShare(posture, s)(q, read);
      },
    };
    const rest: (side: "left" | "right") => IAutoMovieMotionHumanPrimitive = (side: "left" | "right"): IAutoMovieMotionHumanPrimitive =>
      braceOnThigh(
        body,
        side,
        AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        duration,
        share,
      );

    // The hands open onto the thighs as the palms come to them: an open
    // hand lies on the thigh where the standing hand's curled thumb and
    // fingers went into it.
    const open: (side: "left" | "right") => IAutoMovieMotionHumanPrimitive = (side: "left" | "right"): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanHand.shape({ side, shape: "flat", from: 0, to: duration, weight: share });

    // The crouch rises again at its end, so it leaves the body standing
    // (#3363: a base transition declares the base it ends in).
    return {
      ...composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "lowest",
        primitives: [sink, rest("left"), rest("right"), open("left"), open("right")],
      }),
      base: { kind: "standing" },
    };
  }
}
