import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { DefenceOutcome } from "./DefenceOutcome";
import { StrikingBody } from "./StrikingBody";
import { StrikingQuality } from "./StrikingQuality";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import type { kick } from "./kick";
import type { punch } from "./punch";

/**
 * A defence against one placed strike: a glove, forearm or shin brought to
 * where the incoming weapon will be, or the head moved off its line.
 *
 * When the defence starts comes from the defence outcome law
 * ({@link DefenceOutcome}): the defender reacts to the strike's launch after a
 * seeded reaction time, earlier by the anticipation lead the strike's
 * preparation allows (its telegraph), and the author may force the outcome
 * (in time, late or fail), which the law realises with plausible timing.
 * Where it goes comes from what the defender sees at that start: the
 * attacker's moving limb (the hand or foot whose velocity points most toward
 * the struck region) and the line from it to the region on the defender's own
 * body. Nothing about contact is decided here: the strike stops on the first
 * surface it meets, so an in-time cover is struck on the glove, a late one is
 * struck through, and a slip that moved the head off the line in time is
 * missed (the strike's tracking cannot follow a move that starts within one
 * correction latency of its contact).
 *
 * Kinds (IBA coaching manual pp. 57 to 67; kickboxing research of #3201,
 * defence table):
 *
 * - `cover`: the glove on the attacked side over the attacked head region,
 *   palm toward the incoming line, elbow down (both gloves for a central
 *   region).
 * - `parry`: the glove opposite the punching hand meets the fist on the line
 *   a forearm's length ahead of the region and turns it aside.
 * - `elbowBlock`: the elbow on the attacked side dropped over the attacked
 *   body region, the glove kept at the jaw.
 * - `highBlock`: the forearm on the attacked side braced beside the head,
 *   the glove above the temple.
 * - `slip`: the head moved off the line by its own radius, the fist's and a
 *   margin, through the knees and a trunk lean, outside the punching arm.
 * - `roll`: the head dropped under the line by two head radii through bent
 *   knees and a forward lean, then up.
 * - `sway`: the upper body leaned back over the rear foot until the head
 *   clears the line.
 * - `check`: the leg on the attacked side lifted, knee up and out, shin
 *   turned into the kick, the foot dorsiflexed (the toes-up variant).
 *
 * The defence holds until just after the strike's contact and returns to the
 * guard over one hand recovery.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when the defence starts, where it goes, each kind with its coaching source, and that contact is left to the strike.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table, parameters with a closed union of kinds, and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the plan, and the telegraph and decision queries the outcome law's audits and tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, placed-action and outcome types; the strike is named by its anchor, not by a production's scene.
 */
export namespace defend {
  /** The action's name. */
  export const name: HumanActionName = "defend";

  /** Cancel table: a defence flows into a counter punch or another defence once the strike has passed. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    punch: [
      { window: ["contact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
    defend: [
      { window: ["contact", 1], kind: "inertialize", entry: 0, blend: 0.12 },
    ],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the kind, the answered strike's anchor and the outcome's default.
   * @evidence contracts/development/design.md#principled-representation A closed union of defence kinds, the strike as its anchor (checked when planning to strike this performer) and an optional forced outcome.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the outcome union.
   */
  export interface IParams {
    /** The defence. */
    kind:
      | "cover"
      | "parry"
      | "elbowBlock"
      | "highBlock"
      | "slip"
      | "roll"
      | "sway"
      | "check";

    /** The anchor of the strike it answers. */
    against: string;

    /** The forced outcome; drawn from the defender's skill when absent. */
    outcome?: DefenceOutcome.Outcome;
  }

  /**
   * How much of a strike its preparation shows, in [0, 1]: provisional
   * readings of how visible each technique's preparation is, with no
   * located study measuring it per technique. A round kick's chamber shows
   * most (1.0), a push kick or knee 0.8, a rear-hand punch's turn 0.6 and a
   * jab 0.4.
   *
   * @param attack The placed strike.
   * @returns The telegraph.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the range, each technique's value and that the values are provisional for want of a study.
   * @evidence contracts/development/implementation.md#principled-implementation A lookup of the provisional visibility by technique and hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per strike family.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The placed strike's parameters are read through the strike laws' own parameter types, by its action name; values are named provisional readings.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function telegraph(attack: IHumanActionContext.IPlaced): number {
    if (attack.name === "kick")
      return (attack.params as kick.IParams).technique === "round" ? 1 : 0.8;
    if (attack.name === "punch") {
      const p: punch.IParams = attack.params as punch.IParams;
      return p.technique === "straight" && (p.hand ?? "lead") === "lead"
        ? 0.4
        : 0.6;
    }
    return 0.8;
  }

  /** Every planned defence's decision, for audits. */
  const DECISIONS: WeakMap<IHumanActionPlan, DefenceOutcome.IDecision> =
    new WeakMap();

  /**
   * The outcome decision of a planned defence.
   *
   * @param plan A defence's plan.
   * @returns Its decision, or undefined for another action's plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the meaning of undefined.
   * @evidence contracts/development/implementation.md#principled-implementation A lookup in the weak map the plan registered its decision in.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads a stored decision.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Decisions are keyed weakly by their plans, so each is released with its plan.
   */
  export function decision(
    plan: IHumanActionPlan,
  ): DefenceOutcome.IDecision | undefined {
    return DECISIONS.get(plan);
  }

  /**
   * Plan a defence.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the answered strike has no contact or shown peak, or does not strike this performer at a region.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The outcome law times the start from the strike's launch and contact; the goal is built from what the defender sees at that read second, the guard held before it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Decides the timing once, builds the geometry on first use after the read, and evaluates each posture from it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A strike that cannot be defended throws; nothing about contact is decided here, so no outcome is faked geometrically.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond the limb fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The decision is made once per plan and the geometry built once, dropped on settle when the strike may have changed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one geometry, cleared by settle, and one decision keyed weakly by the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const attack: IHumanActionContext.IPlaced = context.action(p.against);

    // A feint has no contact: the defender bites on its shown peak instead,
    // which is how a defence started too early leaves the real strike open.
    const shown: number | undefined = attack.plan.events.find(
      (e) => e.name === "shown" || e.name === "chamber",
    )?.share;
    const decisive: number | undefined =
      attack.plan.contact ??
      (shown === undefined ? undefined : shown * attack.plan.duration);
    if (decisive === undefined)
      throw new Error(
        `${p.against} has no contact or shown peak to defend against`,
      );
    const at = (
      attack.params as {
        at?: {
          kind: string;
          subject?: string;
          region?: AutoMovieHumanoidRegion;
        };
      }
    ).at;
    if (
      at === undefined ||
      at.kind !== "person" ||
      at.subject !== context.subject ||
      at.region === undefined
    )
      throw new Error(`${p.against} does not strike ${context.subject}`);
    const region: AutoMovieHumanoidRegion = at.region;
    const launch: number =
      attack.start +
      (attack.plan.events.find((e) => e.name === "launch")?.share ?? 0) *
        attack.plan.duration;
    const hit: number = attack.start + decisive;
    const movement: number = StrikingSkill.defence(context.skill);
    const decided: DefenceOutcome.IDecision = DefenceOutcome.decide(
      {
        launch,
        hit,
        telegraph: telegraph(attack),
        movement,
        skill: context.skill,
      },
      context.random("defence"),
      p.outcome,
    );
    const begin: number = Math.max(0, decided.start - context.start);
    const contact: number = hit - context.start;
    const hold: number = Math.max(begin + movement, contact + 0.05);
    const recovery: number =
      StrikingSkill.HAND_RECOVERY * StrikingSkill.recovery(context.skill);
    const duration: number = hold + recovery;
    const events: IAutoMovieMotionEvent[] = [
      { name: "read", share: begin / duration },
      { name: "set", share: Math.min(1, (begin + movement) / duration) },
      { name: "contact", share: Math.min(1, Math.max(0, contact / duration)) },
      { name: "recovered", share: 1 },
    ];
    const timing: ITiming = {
      region,
      attack,
      begin,
      movement,
      hold,
      recovery,
      duration,
      read: Math.max(context.start, decided.start),
    };
    // Before the read the defender only holds the guard, and nothing reads
    // the attacker: every read of another performer then looks back in time,
    // so two performers reading each other never recurse at one instant.
    let built: IGeometry | undefined;
    let building: boolean = false;
    const geometry = (): IGeometry => {
      if (built !== undefined) return built;
      if (building)
        throw new Error(
          `${context.subject}: the defence against ${p.against} was read back while it was being planned`,
        );
      building = true;
      try {
        built = build(context, timing);
      } finally {
        building = false;
      }
      return built;
    };
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const contacts: IHumanContactWindow[] = windows(
      p.kind === "check" ? attacked(region, lead) : undefined,
      timing,
    );
    const out: IHumanActionPlan = {
      duration,
      events,
      contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        return t <= begin + 1e-9 ? idle(context, lead) : geometry().posture(t);
      },
      settle: (): void => {
        built = undefined;
      },
    };
    DECISIONS.set(out, decided);
    return out;
  }

  /** A defence's timing, seconds from its start unless stated. */
  interface ITiming {
    /** The struck region. */
    region: AutoMovieHumanoidRegion;
    /** The strike. */
    attack: IHumanActionContext.IPlaced;
    /** The movement's start. */
    begin: number;
    /** The movement's duration. */
    movement: number;
    /** When the return starts. */
    hold: number;
    /** The return's duration. */
    recovery: number;
    /** The whole defence. */
    duration: number;
    /** Film second the defender reads the strike. */
    read: number;
  }

  /** A built defence. */
  interface IGeometry {
    /** The posture at seconds since the start. */
    posture(seconds: number): IHumanPosture;
    /** The feet's contact windows. */
    contacts: IHumanContactWindow[];
  }

  /** Build a defence's geometry from what the defender sees at its read second. */
  function build(
    context: IHumanActionContext<IParams>,
    timing: ITiming,
  ): IGeometry {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const entry: IHumanPosture = context.entry.posture;
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);

    // What the defender sees: the attacker's limb moving most toward the
    // struck region, and the line from it to the region.
    const own = StrikingBody.trunk(body, entry);
    const regionAt = StrikingBody.region(body, own, timing.region);
    const attacker: IHumanActionContext.IPerformer = context.performer(
      timing.attack.subject,
    );
    const now = attacker.bones(timing.read);
    const before = attacker.bones(timing.read - 1 / 24);
    const limbs: AutoMovieHumanoidBone[] =
      timing.attack.name === "punch"
        ? ["leftHand", "rightHand"]
        : timing.attack.name === "kick"
          ? ["leftFoot", "rightFoot"]
          : ["leftLowerLeg", "rightLowerLeg"];
    let weapon: IAutoMovieVector3 = now.get(limbs[0]!)!.worldPosition;
    let best: number = -Infinity;
    for (const bone of limbs) {
      const at: IAutoMovieVector3 = now.get(bone)!.worldPosition;
      const velocity: IAutoMovieVector3 = Vector3.subtract(
        at,
        before.get(bone)!.worldPosition,
      );
      const toward: number = Vector3.dot(
        velocity,
        Vector3.normalize(Vector3.subtract(regionAt.point, at)),
      );
      if (toward > best) {
        best = toward;
        weapon = at;
      }
    }
    const incoming: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(regionAt.point, weapon),
    );
    const across: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(up, incoming),
    );
    const outside: number =
      Vector3.dot(Vector3.subtract(weapon, regionAt.point), across) > 0
        ? -1
        : 1;
    const attackedSide: "left" | "right" = attacked(timing.region, lead);
    const fist: number = StrikingQuality.fist(m.hand);

    // The movement's share in, and out again after the strike has passed.
    const w = (t: number): number =>
      minimumJerk((t - timing.begin) / timing.movement).s -
      minimumJerk((t - timing.hold) / timing.recovery).s;

    // Whole-body evasions: the head's displacement in the trunk's lean and
    // the root's dip and shift.
    const trunkLength: number = m.eyeHeight - m.hipHeight;
    const clear: number = m.headRadius + fist + 0.04;
    const tilt = (lateral: number): number =>
      (Math.asin(Math.min(0.9, lateral / trunkLength)) * 180) / Math.PI;
    let shift: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let roll: number = 0;
    let pitch: number = 0;
    if (p.kind === "slip") {
      shift = Vector3.add(Vector3.scale(across, outside * 0.3 * clear), {
        x: 0,
        y: -0.02 * m.stature,
        z: 0,
      });
      roll =
        sideRoll(entry.yaw, Vector3.scale(across, outside)) * tilt(0.7 * clear);
    } else if (p.kind === "roll") {
      shift = Vector3.add(Vector3.scale(across, outside * 0.3 * clear), {
        x: 0,
        y: -2 * m.headRadius,
        z: 0,
      });
      pitch = 15;
      roll =
        sideRoll(entry.yaw, Vector3.scale(across, outside)) * tilt(0.5 * clear);
    } else if (p.kind === "sway") {
      shift = Vector3.scale(
        { x: incoming.x, y: 0, z: incoming.z },
        0.3 * clear,
      );
      pitch = -tilt(0.7 * clear * 1.5);
    }

    // Arms and the checking leg as goals on the defender's own body.
    const goals = (posture: IHumanPosture): Partial<IHumanPosture["limbs"]> => {
      const bones = StrikingBody.trunk(body, posture);
      const region = StrikingBody.region(body, bones, timing.region);
      const glove = (
        side: "left" | "right",
        at: IAutoMovieVector3,
        elbow: IAutoMovieVector3,
      ): IHumanPosture.IGoal => StrikingStance.glove(body, side, at, elbow);
      const shoulder = (side: "left" | "right"): IAutoMovieVector3 =>
        bones.get(`${side}UpperArm` as AutoMovieHumanoidBone)!.worldPosition;
      const toward: IAutoMovieVector3 = Vector3.normalize({
        x: -incoming.x,
        y: 0,
        z: -incoming.z,
      });
      const low = (side: "left" | "right"): IAutoMovieVector3 =>
        Vector3.add(
          shoulder(side),
          Vector3.add(
            Vector3.scale(up, -0.8 * m.upperArm),
            Vector3.scale(toward, 0.5 * m.upperArm),
          ),
        );
      const out: Partial<IHumanPosture["limbs"]> = {};
      const arm = (side: "left" | "right"): "leftArm" | "rightArm" =>
        side === "left" ? "leftArm" : "rightArm";
      const cover = (side: "left" | "right"): void => {
        // The glove on the incoming line just in front of the region, where
        // the weapon will pass, not merely on the region's own normal.
        const at: IAutoMovieVector3 = Vector3.subtract(
          region.point,
          Vector3.scale(incoming, m.forearmRadius + 2 * fist),
        );
        out[arm(side)] = glove(side, at, low(side));
      };
      switch (p.kind) {
        case "cover":
          if (/Left$|Right$/.test(timing.region)) cover(attackedSide);
          else {
            cover("left");
            cover("right");
          }
          break;
        case "parry": {
          const side: "left" | "right" = outside > 0 ? "left" : "right";
          const meet: IAutoMovieVector3 = Vector3.add(
            Vector3.subtract(
              region.point,
              Vector3.scale(incoming, 0.6 * m.forearm),
            ),
            Vector3.scale(across, -outside * 0.5 * fist),
          );
          out[arm(side)] = glove(side, meet, low(side));
          break;
        }
        case "elbowBlock": {
          const jaw = StrikingBody.region(
            body,
            bones,
            attackedSide === "left" ? "jawLeft" : "jawRight",
          );
          const at: IAutoMovieVector3 = Vector3.add(
            jaw.point,
            Vector3.scale(jaw.normal, 2 * m.forearmRadius),
          );
          out[arm(attackedSide)] = glove(
            attackedSide,
            at,
            Vector3.add(
              region.point,
              Vector3.scale(region.normal, 0.5 * m.upperArm),
            ),
          );
          break;
        }
        case "highBlock": {
          const temple = StrikingBody.region(
            body,
            bones,
            attackedSide === "left" ? "templeLeft" : "templeRight",
          );
          const at: IAutoMovieVector3 = Vector3.add(
            Vector3.add(
              temple.point,
              Vector3.scale(temple.normal, 2 * m.forearmRadius),
            ),
            Vector3.scale(up, 0.3 * m.forearm),
          );
          const elbow: IAutoMovieVector3 = Vector3.add(
            shoulder(attackedSide),
            Vector3.add(
              Vector3.scale(temple.normal, m.upperArm),
              Vector3.scale(Vector3.scale(incoming, -1), 0.3 * m.upperArm),
            ),
          );
          out[arm(attackedSide)] = glove(attackedSide, at, elbow);
          break;
        }
        case "check": {
          const hip: IAutoMovieVector3 = bones.get(
            `${attackedSide}UpperLeg` as AutoMovieHumanoidBone,
          )!.worldPosition;
          const forward: IAutoMovieVector3 = {
            x: -incoming.x,
            y: 0,
            z: -incoming.z,
          };
          const sideways: IAutoMovieVector3 = Vector3.scale(across, outside);
          const knee: IAutoMovieVector3 = Vector3.add(
            hip,
            Vector3.scale(
              Vector3.normalize(
                Vector3.add(
                  Vector3.add(
                    Vector3.scale(Vector3.normalize(forward), -0.55),
                    Vector3.scale(up, 0.7),
                  ),
                  Vector3.scale(sideways, -0.35),
                ),
              ),
              m.thigh,
            ),
          );
          const ankle: IAutoMovieVector3 = Vector3.add(
            knee,
            Vector3.scale(
              Vector3.normalize(
                Vector3.add(
                  Vector3.scale(up, -0.9),
                  Vector3.scale(Vector3.normalize(forward), -0.2),
                ),
              ),
              m.shank,
            ),
          );
          const rotation: IAutoMovieQuaternion = StrikingBody.foot(
            Vector3.normalize(
              Vector3.add(
                Vector3.scale(Vector3.normalize(forward), -0.6),
                Vector3.scale(up, 0.8),
              ),
            ),
            Vector3.normalize(forward),
          );
          out[attackedSide === "left" ? "leftLeg" : "rightLeg"] = {
            point: ankle,
            bend: Vector3.add(
              knee,
              Vector3.scale(Vector3.normalize(forward), -0.2),
            ),
            rotation,
          };
          break;
        }
        case "slip":
        case "roll":
        case "sway":
          // Evasions move the whole body; the gloves keep their guard.
          break;
      }
      return out;
    };

    // The stance legs, with the checking leg's foot leaving the floor.
    const checking: "left" | "right" | undefined =
      p.kind === "check" ? attackedSide : undefined;
    const base = (t: number): IHumanPosture => {
      const k: number = w(t);
      const support: IAutoMovieVector3 | undefined =
        checking === undefined
          ? undefined
          : feet[checking === "left" ? "right" : "left"].ankle;
      const over: IAutoMovieVector3 =
        support === undefined
          ? { x: 0, y: 0, z: 0 }
          : Vector3.scale(
              {
                x: support.x - entry.root.x,
                y: 0,
                z: support.z - entry.root.z,
              },
              0.6,
            );
      return {
        root: Vector3.add(
          entry.root,
          Vector3.scale(Vector3.add(shift, over), k),
        ),
        yaw: entry.yaw,
        pitch: entry.pitch + pitch * k,
        roll: entry.roll + roll * k,
        joints: { ...entry.joints, ...StrikingStance.joints() },
        limbs: StrikingStance.legs(body, feet, {
          left: checking !== "left",
          right: checking !== "right",
        }),
      };
    };
    return {
      contacts: windows(checking, timing),
      posture: (t: number): IHumanPosture => {
        const k: number = w(t);
        const posture: IHumanPosture = base(t);
        const guard = StrikingStance.guard(body, posture, { lead });
        const target = goals(posture);
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs, ...guard };
        for (const limb of [
          "leftArm",
          "rightArm",
          "leftLeg",
          "rightLeg",
        ] as const) {
          const goal: IHumanPosture.IGoal | undefined = target[limb];
          const from: IHumanPosture.IGoal | undefined = limbs[limb];
          if (goal === undefined || from === undefined) continue;
          limbs[limb] = {
            point: Vector3.lerp(from.point, goal.point, k),
            bend: Vector3.lerp(from.bend, goal.bend, k),
            ...(from.rotation !== undefined && goal.rotation !== undefined
              ? { rotation: Quaternion.slerp(from.rotation, goal.rotation, k) }
              : {}),
            ...(k <= 1e-9 && from.planted === true ? { planted: true } : {}),
          };
        }
        return { ...posture, limbs };
      },
    };
  }

  /** The defender's side a region lies on: its own side, or the lead side for a central region. */
  function attacked(
    region: AutoMovieHumanoidRegion,
    lead: "left" | "right",
  ): "left" | "right" {
    return /Left$/.test(region)
      ? "left"
      : /Right$/.test(region)
        ? "right"
        : lead;
  }

  /** The feet's windows: both planted, except a checking leg off the floor from its read to its end. */
  function windows(
    checking: "left" | "right" | undefined,
    timing: Pick<ITiming, "begin" | "duration">,
  ): IHumanContactWindow[] {
    return (["left", "right"] as const).flatMap(
      (side): IHumanContactWindow[] =>
        side === checking
          ? [
              {
                part: `${side}Foot`,
                kind: "plant",
                from: 0,
                to: timing.begin / timing.duration,
                support: { kind: "ground" },
              },
              {
                part: `${side}Foot`,
                kind: "plant",
                from: 1,
                to: 1,
                support: { kind: "ground" },
              },
            ]
          : [
              {
                part: `${side}Foot`,
                kind: "plant",
                from: 0,
                to: 1,
                support: { kind: "ground" },
              },
            ],
    );
  }

  /** The guard held while waiting for the read: the entry's feet planted and the gloves up. */
  function idle(
    context: IHumanActionContext<IParams>,
    lead: "left" | "right",
  ): IHumanPosture {
    const entry: IHumanPosture = context.entry.posture;
    const posture: IHumanPosture = {
      ...entry,
      joints: { ...entry.joints, ...StrikingStance.joints() },
      limbs: StrikingStance.legs(
        context.body,
        StrikingTarget.feet(context.entry),
      ),
    };
    return {
      ...posture,
      limbs: {
        ...posture.limbs,
        ...StrikingStance.guard(context.body, posture, { lead }),
      },
    };
  }

  /** The roll sign that tips the body toward a horizontal direction: +1 when it lies on the body's right. */
  function sideRoll(yaw: number, direction: IAutoMovieVector3): number {
    const r: number = (yaw * Math.PI) / 180;
    const left: IAutoMovieVector3 = { x: Math.cos(r), y: 0, z: -Math.sin(r) };
    return Vector3.dot(direction, left) > 0 ? -1 : 1;
  }
}
