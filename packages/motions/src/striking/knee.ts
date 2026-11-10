import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "./StrikingBody";
import type { StrikingReach } from "./StrikingReach";
import { StrikingRecord } from "./StrikingRecord";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingStroke } from "./StrikingStroke";
import { StrikingTarget } from "./StrikingTarget";

/**
 * A knee strike: the knee driven up and forward onto the target while the
 * hands hold the opponent's head or neck (the clinch) or stay at the guard.
 *
 * The knee is the weapon, and the thigh carries it on a circle about the
 * hip: the front of the knee lies one thigh plus one patella depth from the
 * hip along the thigh. The hips square to the thigh's heading, the support
 * foot pivoting on its ball with them, and the thigh rises to the elevation whose circle meets
 * the target's height, bounded by the hip's flexion range (120 degrees in
 * `DEFAULT_HUMANOID_ROM`, kept a tenth inside, less the back lean that tips
 * the pelvis); the pelvis then travels horizontally along the line toward
 * the target until the knee's front is on it, forward (the hip thrust of the
 * clinch knee) or back (the hips drawn back to make room when the opponent is
 * chest to chest), by at most {@link TRAVEL} of a stance length. A target above or
 * below the thigh's range or needing more travel forward is the declared miss
 * at maximum reach (`short`), and one closer than the hips can withdraw is
 * `jammed`: the knee lands
 * where it first meets the body. The shank folds back under the knee with
 * the knee flexed about 120 degrees (provisional reading of coaching
 * photographs), and the trunk leans back slightly to keep the centre of mass
 * over the pivoting support foot.
 *
 * The thigh and the shank are offered to the performance's joint contact
 * resolution as capsules on the shown leg, so the knee stops where any part
 * of the leg first meets the other body; it holds for the contact dwell and
 * withdraws along the way it came, as the kick does.
 *
 * Timing (kickboxing research of #3201): the knee rises through the round
 * kick's chamber only, so it lands at the chamber key (preparation 0.074 s
 * plus 14 % of the 1.02 s execution) and recoils over the kick's 0.65 s;
 * skill scales them like the kick's. With a person target, both hands reach
 * the other's nape for the clinch; GLORY allows one knee per clinch, which
 * the kickboxing rules check.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the thigh's circle, the hip's range, the travel and its statuses, the contact and withdrawal, and the timing, with provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, an empty cancel table, parameters, a solved knee in world metres and a pure plan of postures in seconds with capsule weapons.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the named constants, the solve and the plan the law table dispatches through and the tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target, posture, plan, weapon and reach-status types; every length comes from the striking body's measure.
 */
export namespace knee {
  /** The action's name. */
  export const name: HumanActionName = "knee";

  /** Cancel table: none; a knee runs to its replant. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The interface's motion target and a closed union of legs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the plan and the kickboxing rules read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union.
   */
  export interface IParams {
    /** What it strikes. */
    at: AutoMovieMotionTarget;

    /** Which leg: lead or rear; rear when absent. */
    leg?: "lead" | "rear";
  }

  /** Knee flexion while driven, degrees (provisional). */
  export const FLEXION: number = 120;

  /** Back lean at contact, degrees (provisional). */
  export const LEAN: number = 10;

  /** The hip's flexion range used, degrees: `DEFAULT_HUMANOID_ROM`'s 120 kept a tenth inside. */
  export const HIP_FLEXION: number = 108;

  /** The lowest thigh elevation below the horizontal, degrees: a knee to the thigh (provisional). */
  export const LOWEST: number = 45;

  /**
   * The pelvis's longest travel along the line, as a share of the stance
   * length: a rear knee squares the hips until the rear hip is level with
   * the lead (support) foot, half a stance; a lead knee drives the lead hip a
   * quarter. Provisional readings of the clinch knee's hip drive.
   */
  export const TRAVEL: Readonly<Record<"lead" | "rear", number>> = {
    lead: 0.25,
    rear: 0.5,
  };

  /**
   * A solved knee: where its joint, ankle and pelvis go at the contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation World points for the knee and the ankle, a world displacement for the pelvis, a horizontal unit heading and the shared reach status.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the plan poses and records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the reach status union.
   */
  export interface ISolution {
    /** The knee joint, world metres. */
    knee: IAutoMovieVector3;

    /** The ankle folded under it, world metres. */
    ankle: IAutoMovieVector3;

    /** The pelvis's horizontal travel, world metres. */
    thrust: IAutoMovieVector3;

    /** The horizontal unit direction the thigh points in. */
    heading: IAutoMovieVector3;

    /** Whether the knee's front reaches the target, falls short, or is jammed. */
    status: StrikingReach.ISolution["status"];
  }

  /**
   * Solve the knee for a hip and a target.
   *
   * @param hip The kicking hip at the entry, world metres.
   * @param target The target point, world metres.
   * @param thigh The thigh length, metres.
   * @param patella The knee's front from its joint, metres.
   * @param shank The shank length, metres.
   * @param travel The pelvis's longest travel, metres.
   * @param fallback A horizontal unit direction for a target straight above or below the hip.
   * @returns The solution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States every input's frame and unit and the fallback's use; the comments derive the elevation and the travel.
   * @evidence contracts/development/implementation.md#principled-implementation The thigh's elevation from the arcsine of the target's height over the thigh-plus-patella radius, bounded by the hip's flexion range less the lean; then the horizontal travel that closes the remaining distance, bounded by the travel limit; the shank folded by the knee's flexion in the thigh's vertical plane.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Elevation, travel and status, then the joints, in one closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target outside the thigh's range or travel is reported short or jammed rather than reached by a stretched leg; 1e-9 tolerances only absorb rounding at the bounds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function solve(
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
    thigh: number,
    patella: number,
    shank: number,
    travel: number,
    fallback: IAutoMovieVector3,
  ): ISolution {
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const radius: number = thigh + patella;

    // The elevation whose circle meets the target's height, bounded by the
    // hip's flexion (the thigh at the horizontal is 90 degrees of flexion,
    // and the back lean tips the pelvis by its own angle).
    const highest: number = HIP_FLEXION - 90 + LEAN;
    const wanted: number =
      (Math.asin(Math.max(-1, Math.min(1, (target.y - hip.y) / radius))) *
        180) /
      Math.PI;
    const elevation: number =
      (Math.max(-LOWEST, Math.min(highest, wanted)) * Math.PI) / 180;

    // The horizontal travel that puts the knee's front on the target.
    const flat: IAutoMovieVector3 = {
      x: target.x - hip.x,
      y: 0,
      z: target.z - hip.z,
    };
    const distance: number = Vector3.length(flat);
    const heading: IAutoMovieVector3 =
      distance > 1e-6 ? Vector3.scale(flat, 1 / distance) : fallback;
    const want: number = distance - radius * Math.cos(elevation);
    const moved: number = Math.max(-travel, Math.min(travel, want));
    const status: StrikingReach.ISolution["status"] =
      wanted > highest + 1e-9 || wanted < -LOWEST - 1e-9 || want > travel + 1e-9
        ? "short"
        : want < -travel - 1e-9
          ? "jammed"
          : "reached";
    const thrust: IAutoMovieVector3 = Vector3.scale(heading, moved);

    // The thigh along its elevation, the shank folded back and down in the
    // same vertical plane by the knee's flexion.
    const along: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(heading, Math.cos(elevation)),
      Vector3.scale(up, Math.sin(elevation)),
    );
    const below: IAutoMovieVector3 = Vector3.subtract(
      Vector3.scale(heading, Math.sin(elevation)),
      Vector3.scale(up, Math.cos(elevation)),
    );
    const flexion: number = (FLEXION * Math.PI) / 180;
    const knee: IAutoMovieVector3 = Vector3.add(
      Vector3.add(hip, thrust),
      Vector3.scale(along, thigh),
    );
    const fold: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(along, Math.cos(flexion)),
      Vector3.scale(below, Math.sin(flexion)),
    );
    return {
      knee,
      ankle: Vector3.add(knee, Vector3.scale(fold, shank)),
      thrust,
      heading,
      status,
    };
  }

  /**
   * Plan a knee strike.
   *
   * @param context The action's context.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input and its plan; the namespace states the method.
   * @evidence contracts/development/implementation.md#principled-implementation The knee solved from the squared hip, a minimum-jerk out-and-back course to it, the performance's joint contact resolution of the thigh and shank capsules for the stop, and a withdrawal retracing the course.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The geometry solved once on first use; each posture is the free course, or its reversal after a stop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The record reports the solve's own status and the shown knee, so a miss is never reported as a hit; provisional constants are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two closed-form solves once; per posture, constant work beyond the limb fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The solve is built once per plan and dropped on settle; the committed stop is kept until the resolution commits another.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one solve and one stop second, released with the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const side: "left" | "right" =
      (p.leg ?? "rear") === "lead" ? lead : StrikingStance.rear({ lead });
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const slow: number = StrikingSkill.recovery(context.skill);
    const prep: number = StrikingSkill.KICK_PREPARATION;
    const impact: number = prep + StrikingSkill.KICK_CHAMBER * slow;
    const duration: number = impact + StrikingSkill.KICK_RECOIL * slow;
    const entry: IHumanPosture = context.entry.posture;
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const t0: number = context.start;
    const leg: "leftLeg" | "rightLeg" =
      side === "left" ? "leftLeg" : "rightLeg";

    // The solve from the hip as the squared pelvis carries it: the hips turn
    // to the thigh's heading about the root's vertical axis (a bladed stance
    // turns them away from the target, and the thigh cannot point across the
    // pelvis within the hip's range), so the heading is found from the entry
    // hip and the knee solved again from the turned one.
    let built:
      | (ISolution & { target: IAutoMovieVector3; turn: number })
      | undefined;
    const geometry = (): ISolution & {
      target: IAutoMovieVector3;
      turn: number;
    } => {
      if (built !== undefined) return built;
      const target: IAutoMovieVector3 = StrikingTarget.aim(
        context,
        p.at,
        t0 - StrikingTarget.LOOK,
        (): number => 0.8 * m.thigh,
      );
      const line: IAutoMovieVector3 = StrikingTarget.line(
        entry.root,
        target,
        entry.yaw,
      );
      const patella: number = Vector3.length(
        body.surfaces.regions[side === "left" ? "kneeLeft" : "kneeRight"].point,
      );
      const travel: number =
        TRAVEL[p.leg ?? "rear"] * StrikingStance.length(body);
      const hip0: IAutoMovieVector3 = StrikingBody.trunk(body, entry).get(
        `${side}UpperLeg` as AutoMovieHumanoidBone,
      )!.worldPosition;
      const first: ISolution = solve(
        hip0,
        target,
        m.thigh,
        patella,
        m.shank,
        travel,
        line,
      );
      const turn: number =
        ((((StrikingTarget.heading(first.heading) - entry.yaw + 180) % 360) +
          360) %
          360) -
        180;
      const r: number = (turn * Math.PI) / 180;
      const dx: number = hip0.x - entry.root.x;
      const dz: number = hip0.z - entry.root.z;
      const hip: IAutoMovieVector3 = {
        x: entry.root.x + dx * Math.cos(r) + dz * Math.sin(r),
        y: hip0.y,
        z: entry.root.z - dx * Math.sin(r) + dz * Math.cos(r),
      };
      built = {
        ...solve(hip, target, m.thigh, patella, m.shank, travel, line),
        target,
        turn,
      };
      return built;
    };
    const events: IAutoMovieMotionEvent[] = [
      { name: "launch", share: prep / duration },
      { name: "impact", share: impact / duration },
      { name: "replant", share: 1 },
    ];
    const contacts: IHumanContactWindow[] = [
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 0,
        to: prep / duration,
        support: { kind: "ground" },
      },
      {
        part: `${side}Foot`,
        kind: "plant",
        from: 1,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: `${support}Foot`,
        kind: "pivot",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ];

    // The knee on its free course at a clock second (as if it met nothing),
    // the clinching hands reading the other's nape at the film second.
    const free = (clock: number, seconds: number): IHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, clock));
      const g = geometry();
      const out: number = minimumJerk((t - prep) / (impact - prep)).s;
      const back: number = minimumJerk((t - impact) / (duration - impact)).s;
      const w: number = out - back;

      // The hips square on the knee's profile, and the support foot turns
      // with them on its ball so the support hip keeps its twist.
      const turn: number = g.turn;
      const supportFoot: HumanFoot.IPlacement = StrikingTarget.pivot(
        body,
        support,
        feet[support],
        turn * w,
        15 * w,
      );
      const placed: Record<"left" | "right", HumanFoot.IPlacement> =
        side === "left"
          ? { left: feet.left, right: supportFoot }
          : { left: supportFoot, right: feet.right };
      const posture: IHumanPosture = {
        root: Vector3.add(entry.root, Vector3.scale(g.thrust, w)),
        yaw: entry.yaw + turn * w,
        pitch: entry.pitch - LEAN * w,
        roll: entry.roll,
        joints: { ...entry.joints, ...StrikingStance.joints() },
        limbs: StrikingStance.legs(body, placed, {
          left: side !== "left",
          right: side !== "right",
        }),
      };
      const rest: IAutoMovieVector3 = feet[side].ankle;
      const ankle: IAutoMovieVector3 = Vector3.lerp(
        Vector3.lerp(rest, g.ankle, out),
        rest,
        back,
      );
      const kneeHint: IAutoMovieVector3 = Vector3.add(
        Vector3.lerp(Vector3.add(rest, Vector3.scale(up, m.shank)), g.knee, w),
        Vector3.scale(g.heading, 0.1),
      );
      const hands = StrikingStance.guard(body, posture, { lead });
      if (p.at.kind === "person") {
        const nape: IAutoMovieVector3 = context
          .performer(p.at.subject)
          .bones(seconds - StrikingTarget.LOOK)
          .get("neck")!.worldPosition;
        for (const arm of ["leftArm", "rightArm"] as const) {
          const g0: IHumanPosture.IGoal | undefined = hands[arm];
          if (g0 === undefined) continue;
          const hold: IAutoMovieVector3 = Vector3.add(
            nape,
            Vector3.scale(g.heading, 0.03),
          );
          hands[arm] = {
            ...g0,
            point: Vector3.lerp(g0.point, hold, Math.min(1, 2 * w)),
          };
        }
      }
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          ...hands,
          [leg]: {
            point: ankle,
            bend: kneeHint,
            rotation: feet[side].rotation,
            ...(t <= prep || t >= duration - 1e-9 ? { planted: true } : {}),
          },
        },
      };
    };

    // The knee's contact is the performance's joint resolution of the leg's
    // capsules (null: it met nothing); until it is committed the knee is shown
    // on its free course, as the resolution assumes.
    let fixed: number | null = null;
    const stop = (seconds: number): number | undefined =>
      fixed !== null && fixed <= seconds ? fixed : undefined;

    // The leg as the performer shows it at a film second: the hip, the knee
    // and the ankle, the ends of the thigh's and the shank's capsules.
    const shown = (seconds: number): IAutoMovieVector3[] => {
      const bones = context.performer(context.subject).bones(seconds);
      return [`${side}UpperLeg`, `${side}LowerLeg`, `${side}Foot`].map(
        (b: string): IAutoMovieVector3 =>
          bones.get(b as AutoMovieHumanoidBone)!.worldPosition,
      );
    };
    const out: IHumanActionPlan = {
      duration,
      events,
      contacts,
      contact: impact,
      settle: (): void => {
        built = undefined;
      },
      ...(p.at.kind === "person"
        ? {
            weapons: (["thigh", "shin"] as const).map(
              (id, i: number): IHumanActionPlan.IWeapon => ({
                id,
                limb: leg,
                radius: i === 0 ? m.thighRadius : m.shankRadius,
                from: t0 + prep,
                to: t0 + impact + 0.1,
                path: (seconds: number): IAutoMovieVector3 =>
                  shown(seconds)[i]!,
                tail: (seconds: number): IAutoMovieVector3 =>
                  shown(seconds)[i + 1]!,
              }),
            ),
            stop: (found: readonly IHumanActionPlan.IContactEvent[]): void => {
              fixed =
                found.length === 0
                  ? null
                  : Math.min(...found.map((e) => e.seconds));
            },
          }
        : {}),
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const at: number | undefined = stop(t0 + t);
        if (at === undefined || t <= at - t0) return free(t, t0 + t);

        // Held for the dwell, then the free course played back from the stop
        // to the start on a minimum-jerk clock: the way in was clear of the
        // body up to its first contact, so the way out is too.
        const s: number = at - t0;
        const w: number = minimumJerk(
          (t - s - StrikingStroke.DWELL) /
            Math.max(1e-3, duration - s - StrikingStroke.DWELL),
        ).s;
        return free(s * (1 - w), t0 + t);
      },
    };
    StrikingRecord.register(out, (): StrikingRecord.IRecord => {
      // The knee's front where the shown leg puts it at the planned impact,
      // with the solve's own status.
      const g = geometry();
      const bones = context.performer(context.subject).bones(t0 + impact);
      const reached: IAutoMovieVector3 = StrikingBody.region(
        body,
        bones,
        side === "left" ? "kneeLeft" : "kneeRight",
      ).point;
      return {
        offset: { x: 0, y: 0, z: 0 },
        planned: g.target,
        reached,
        status: g.status,
        stop,
      };
    });
    return out;
  }
}
