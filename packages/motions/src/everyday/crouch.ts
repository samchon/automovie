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
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
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
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanTrunk } from "./HumanTrunk";
import { braceOnThigh } from "./braceOnThigh";

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
 * takes 1.0 s for a partial and 1.3 s for a full squat at a 0.93 m hip
 * height, scaled by the square root of the hip height (dynamic similarity,
 * Alexander 1984) and by the manner's tempo (provisional), the hold `hold`
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
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    crouch: [{ window: ["ascend", 1], kind: "inertialize", entry: 0 }],
    kneel: [
      {
        window: ["lowest", "ascend"],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    pickUp: [
      {
        window: ["lowest", "ascend"],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
    putDown: [
      {
        window: ["lowest", "ascend"],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
      },
    ],
  };

  /** Knee flexion at the lowest pose by depth, degrees (Escamilla 2001; the range table's end for `full`). */
  export const KNEE: Readonly<
    Record<IAutoMovieMotionHumanCrouch.Depth, number>
  > = {
    partial: 100,
    full: 150,
  };

  /** The ankle's dorsiflexion in a crouch, degrees: the most measured while crouching, 28 +- 10 at a knee flexion of 149 +- 6 (Hyodo, Masuda, Aizawa, Jinno and Morita 2017, Braz J Phys Ther 21:159, electromagnetic tracking of 26 adults), within the range table's loaded maximum. */
  export const ANKLE: number = 28;

  /** The heel lift of `heels: "up"`, degrees about the toes' joint (provisional, the bend law's squat lift). */
  export const HEEL: number = 30;

  /** Shares of the descent at which the balancing inclination is solved. */
  export const SHARES: number = 8;

  /** Descent seconds by depth for a 0.93 m hip height (provisional). */
  export const DESCENT: Readonly<
    Record<IAutoMovieMotionHumanCrouch.Depth, number>
  > = {
    partial: 1.0,
    full: 1.3,
  };

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
   * @evidence contracts/development/implementation.md#efficient-algorithms The inclination is solved once per plan in 12 bisection steps at each of 8 shares; each posture then costs at most six lowerings of the secant search and one arm solve per side.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The hip shift and the inclinations are computed once and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its solved numbers and the base.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrouch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m = body.measure;
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
        reason: `a ${depth} crouch with the heels ${heels} needs ${thighTilt.toFixed(0)} degrees of hip flexion before the trunk inclines, past the ${hipRange} degree range; the deepest knee flexion with these heels is ${(hipRange - 5 + shankTilt).toFixed(0)} degrees${heels === "flat" ? ", or raise the heels" : ""}`,
        fix: `choose a shallower depth${heels === "flat" ? ", or raise the heels" : ""}`,
      });

    // The clock: descent, hold, rise.
    const down: number = DESCENT[depth] * Math.sqrt(m.hipHeight / 0.93);
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
    const share = (seconds: number): number =>
      clock.envelope(["descend", "lowest"], ["ascend", "end"], seconds);

    // The leg's angles move together over the descent, the shank's tilt and
    // the thigh's each by its share, so the ankle never passes the crouching
    // ankle: it takes the shank's tilt until it reaches it, and the heel rises
    // about the toes' joint by the rest.
    const lift = (s: number): number =>
      Math.max(0, shankTilt * s - dorsiflexion);

    // The feet at a share of the descent: each pivots about its toes' joint
    // by the heel's lift there.
    const feet = (
      posture: IAutoMovieMotionHumanPosture,
      s: number,
    ): IAutoMovieMotionHumanPosture["limbs"] => {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const side of ["left", "right"] as const) {
        const goal: IAutoMovieHumanLimbGoal = posture.limbs[`${side}Leg`]!;
        const flat: IAutoMovieMotionHumanFoot.IPlacement = {
          ankle: goal.point,
          rotation: goal.rotation ?? HumanFrame.turn(yaw),
        };
        const placed: IAutoMovieMotionHumanFoot.IPlacement =
          heel === 0
            ? flat
            : HumanFoot.pivot(
                body,
                side,
                "mtp",
                HumanFoot.point(body, side, "mtp", flat),
                HumanFoot.heading(flat.rotation),
                -lift(s),
              );
        limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
          body,
          posture,
          side,
          placed,
          true,
        );
      }
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
    const rad = (deg: number): number => (deg * Math.PI) / 180;
    const joints = hipJoints(body, standing.root, HumanFrame.turn(yaw));
    const over = (s: number): IAutoMovieVector3 => {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = feet(standing, s);
      let out: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const side of ["left", "right"] as const) {
        const hip: IAutoMovieVector3 = Vector3.add(
          Vector3.add(limbs[`${side}Leg`]!.point, {
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
    const move = (s: number): IAutoMovieVector3 =>
      Vector3.add(Vector3.subtract(over(s), start), Vector3.scale(start, s));

    // The body at a share: root moved, trunk inclined by the lumbopelvic
    // rhythm (the pelvis about the hips as far as the folded thighs leave
    // the hip room, the spine the rest), feet lifted.
    const lowered = (
      posture: IAutoMovieMotionHumanPosture,
      s: number,
      inclination: number,
    ): IAutoMovieMotionHumanPosture => {
      const moved: IAutoMovieMotionHumanPosture = {
        ...posture,
        root: Vector3.add(posture.root, move(s)),
      };
      const stood: IAutoMovieMotionHumanPosture["limbs"] = feet(moved, s);
      const inclined = HumanTrunk.incline(
        moved.joints,
        inclination,
        HumanTrunk.pelvisLimit(body, moved.root, yaw, {
          left: stood.leftLeg!.point,
          right: stood.rightLeg!.point,
        }),
      );
      const tipped: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.tip(
        body,
        { ...moved, joints: inclined.joints },
        inclined.pitch,
        0,
      );
      return resolveHumanPosture.lower(body, {
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
        limbs: feet(tipped, s),
      });
    };

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
    const ahead = (s: number, q: number): number =>
      Vector3.dot(
        HumanBalance.support(body, lowered(standing, s, q)).centre,
        forward,
      );
    const upright: number = ahead(0, 0);
    const low: number =
      heel === 0
        ? Math.min(upright, ahead(1, most))
        : ahead(1, 0) - HumanBalance.offset(body, lowered(standing, 1, 0));
    const rises: number = heel === 0 ? 1 : dorsiflexion / shankTilt;
    const course = (s: number): number =>
      upright + (low - upright) * Math.min(1, s / rises);
    const inclinations: number[] = [0];
    for (let k: number = 1; k <= SHARES; k++) {
      const error = (q: number): number =>
        ahead(k / SHARES, q) - course(k / SHARES);
      let lo: number = 0;
      let hi: number = most;
      if (error(lo) >= 0) hi = lo;
      else if (error(hi) <= 0) lo = hi;
      else
        for (let i: number = 0; i < 12; i++) {
          const mid: number = (lo + hi) / 2;
          if (error(mid) < 0) lo = mid;
          else hi = mid;
        }
      inclinations.push((lo + hi) / 2);
    }
    // Between the shares the linear reading only starts a secant search for
    // the same course, because the pelvis's hip room turns a corner there
    // that a reading between two shares would cut with a jump in speed.
    const inclination = (s: number): number => {
      const at: number = Math.max(0, Math.min(1, s)) * SHARES;
      const k: number = Math.min(SHARES - 1, Math.floor(at));
      const within = (q: number): number => Math.max(0, Math.min(most, q));
      const error = (q: number): number =>
        ahead(at / SHARES, q) - course(at / SHARES);
      let a: number =
        inclinations[k]! + (inclinations[k + 1]! - inclinations[k]!) * (at - k);
      if (at === k || at === SHARES) return a;
      let ea: number = error(a);
      let b: number = within(a + (ea < 0 ? 0.5 : -0.5));
      for (let i: number = 0; i < 5 && b !== a; i++) {
        const eb: number = error(b);
        if (Math.abs(eb) < 1e-5 || eb === ea) break;
        const next: number = within(b - (eb * (b - a)) / (eb - ea));
        [a, ea, b] = [b, eb, next];
      }
      return b;
    };

    const sink: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const s: number = share(seconds);
        return lowered(posture, s, inclination(s));
      },
    };
    const rest = (side: "left" | "right"): IAutoMovieMotionHumanPrimitive =>
      braceOnThigh(
        body,
        side,
        AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        duration,
        share,
      );

    // The crouch ends standing (#3363). Its feet carry the body, so an
    // overlay can take either resting arm or the head independently.
    return {
      ...composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "lowest",
        primitives: [sink, rest("left"), rest("right")],
      }),
      base: { kind: "standing" },
      yields: ["head", "leftHand", "rightHand", "leftArm", "rightArm"],
    };
  }
}
