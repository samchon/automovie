import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  type IAutoMovieSchedule,
  clampPose,
  inertializePose,
  resolvePose,
  samplePoseVelocity,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePose } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import type { IHumanInterruptRow } from "../law/IHumanInterruptRow";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanSkill } from "../skill/HumanSkill";
import type { IHumanPerformer } from "./IHumanPerformer";

/**
 * One placed action of one person, and how a person's displayed pose is
 * evaluated from their placed actions.
 *
 * The displayed pose at a second is, in order (the transition order of the
 * campaign): the active action's posture resolved to a pose; the decaying
 * inertialization offset from the action it interrupted, captured as both
 * actions' pose and velocity at the cut (`inertializePose`, Bollo 2018);
 * every planted or gripping limb re-solved onto its posture goal, so a contact
 * is never moved by the offset (Holden, Dead Blending); and the range-of-motion
 * clamp. A redirect transition adds no offset: its law continues the source's
 * state by construction. Before a person's first action the standing posture
 * at their starting place is shown.
 */
export namespace HumanSegment {
  /** One person's state in a performance. */
  export interface IPerson {
    /** The performer. */
    performer: IHumanPerformer;

    /** The resolved skill. */
    skill: HumanSkill.ISkill;

    /** Placed actions, in film order. */
    segments: ISegment[];

    /** The standing posture before the first action. */
    initial: IHumanPosture;

    /** Displayed poses already evaluated, by film second; bounded to 4096 entries. */
    cache: Map<number, IAutoMoviePose>;

    /** Whether the schedule is still being resolved: nothing is cached meanwhile, because another person's actions may not be placed yet. */
    resolving: boolean;

    /** Additive layers over every action, in order. */
    layers: readonly IHumanLayer[];

    /** What a layer can read. */
    layer: IHumanLayer.IContext;
  }

  /** One placed action. */
  export interface ISegment {
    /** Order within the person's actions. */
    index: number;

    /** The schedule entry's walk-order index. */
    entry: number;

    /** The action's stable id: its anchor or its name. */
    id: string;

    /** The action. */
    name: HumanActionName;

    /** Its parameters. */
    params: object;

    /** Its law. */
    law: IHumanActionLaw<never>;

    /** The context it was planned in. */
    context: IHumanActionContext<never>;

    /** Its plan. */
    plan: IHumanActionPlan;

    /** Film second of the law's time zero. */
    start: number;

    /** Film second it becomes active. */
    entryTime: number;

    /** Film second it stops: its cut or its end. */
    end: number;

    /** The transition that entered it, when it follows another action. */
    transition?: {
      /** Transition kind. */
      kind: IHumanInterruptRow["kind"];
      /** Offset decay time, seconds. */
      blend: number;
      /** The action it follows. */
      source: ISegment;
      /** Film second of the cut. */
      cut: number;
      /** The offset, captured on first use. */
      offset?: (elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose;
    };
  }

  /**
   * The interrupt row that legalises entering an action at a second, or
   * undefined when nothing is interrupted.
   *
   * @param subject The person, for messages.
   * @param previous The person's previous action.
   * @param before Its schedule entry.
   * @param name The action entered.
   * @param start The entry second.
   * @returns The row, or undefined for a first action, a gap or a natural end.
   * @throws {Error} When the previous action is cut outside every legal window, listing them.
   */
  export function row(
    subject: string,
    previous: ISegment | undefined,
    before: IAutoMovieSchedule.IEntry | undefined,
    name: HumanActionName,
    start: number,
  ): IHumanInterruptRow | undefined {
    if (previous === undefined || before === undefined || before.cut === undefined || Math.abs(before.end - start) > 1e-9)
      return undefined;
    const D: number = previous.plan.duration;
    const share: number = (previous.end - previous.start) / D;
    const rows: readonly IHumanInterruptRow[] = previous.law.interrupts[name] ?? [];
    const found: IHumanInterruptRow | undefined = rows.find((r: IHumanInterruptRow): boolean => {
      const [a, b] = r.window.map((w: number | string): number => HumanSegment.share(w, previous.plan));
      return share >= a! - 1e-9 && share <= b! + 1e-9;
    });
    if (found !== undefined) return found;
    const legal: string =
      rows.length === 0
        ? "none declared"
        : rows.map((r: IHumanInterruptRow): string => `[${r.window.join(", ")}] (${r.kind})`).join(", ");
    throw new Error(`${subject}: ${previous.name} cannot be cut into ${name} at share ${share.toFixed(3)}; legal windows: ${legal}`);
  }

  /**
   * A share of a plan from a share or one of its event names.
   *
   * @param at A share or an event name.
   * @param plan The plan.
   * @returns The share.
   */
  export function share(at: number | string, plan: IHumanActionPlan): number {
    if (typeof at === "number") return at;
    const event = plan.events.find((e) => e.name === at);
    if (event === undefined) throw new Error(`No event ${at}; events are ${plan.events.map((e) => e.name).join(", ") || "none"}`);
    return event.share;
  }

  /**
   * The state a person enters an action from at a second.
   *
   * @param person The person.
   * @param previous Their previous action, if any.
   * @param seconds The entry second.
   * @returns The entry state.
   */
  export function entry(person: IPerson, previous: ISegment | undefined, seconds: number): IHumanEntryState {
    const body = person.performer.body;
    const shown = (t: number): IAutoMoviePose => (previous === undefined ? initial(person) : of(person, previous, t));
    const state: samplePoseVelocity.IState = samplePoseVelocity(shown, seconds);
    const posture: IHumanPosture =
      previous === undefined
        ? person.initial
        : layered(person, previous.plan.posture(Math.min(previous.plan.duration, Math.max(0, seconds - previous.start))), seconds);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      resolvePose(state.pose, body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map((r): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r]),
    );
    const planted = (part: "leftFoot" | "rightFoot"): boolean => {
      if (previous === undefined) return true;
      const u: number = Math.min(1, Math.max(0, (seconds - previous.start) / previous.plan.duration));
      return previous.plan.contacts.some(
        (c: IHumanContactWindow): boolean => c.part === part && (c.kind === "plant" || c.kind === "pivot") && u >= c.from - 1e-9 && u <= c.to + 1e-9,
      );
    };
    const foot = (side: "left" | "right"): IHumanEntryState.IFoot => ({
      ankle: bones.get(`${side}Foot`)!.worldPosition,
      rotation: bones.get(`${side}Foot`)!.worldRotation,
      planted: planted(`${side}Foot`),
    });
    return {
      seconds,
      pose: state.pose,
      velocity: state.velocity,
      posture,
      feet: { left: foot("left"), right: foot("right") },
      ...(previous === undefined
        ? {}
        : {
            from: {
              name: previous.name,
              params: previous.params,
              plan: previous.plan,
              start: previous.start,
              share: Math.min(1, Math.max(0, (seconds - previous.start) / previous.plan.duration)),
            },
          }),
    };
  }

  /**
   * A person's displayed pose at a film second.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  export function displayed(person: IPerson, seconds: number): IAutoMoviePose {
    const cached: IAutoMoviePose | undefined = person.resolving ? undefined : person.cache.get(seconds);
    if (cached !== undefined) return cached;
    let active: ISegment | undefined;
    for (const s of person.segments) if (s.entryTime <= seconds + 1e-12) active = s;
    const pose: IAutoMoviePose = active === undefined ? initial(person) : of(person, active, seconds);
    if (person.resolving) return pose;
    if (person.cache.size >= 4096) person.cache.delete(person.cache.keys().next().value!);
    person.cache.set(seconds, pose);
    return pose;
  }

  /**
   * One action's displayed pose at a film second, whether or not it is the
   * active one: its posture, its entering offset, its re-planted contacts and
   * the range-of-motion clamp.
   *
   * @param person The person.
   * @param segment The action.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  export function of(person: IPerson, segment: ISegment, seconds: number): IAutoMoviePose {
    const body = person.performer.body;
    const local: number = Math.min(segment.plan.duration, Math.max(0, seconds - segment.start));
    const posture: IHumanPosture = layered(person, segment.plan.posture(local), seconds);
    let pose: IAutoMoviePose = resolveHumanPosture(body, posture);
    const transition = segment.transition;
    if (transition !== undefined && transition.kind !== "redirect" && seconds - transition.cut < transition.blend) {
      transition.offset ??= inertializePose(
        samplePoseVelocity((t: number): IAutoMoviePose => of(person, transition.source, t), transition.cut),
        samplePoseVelocity(
          (t: number): IAutoMoviePose =>
            resolveHumanPosture(body, layered(person, segment.plan.posture(Math.min(segment.plan.duration, Math.max(0, t - segment.start))), t)),
          transition.cut,
        ),
        transition.blend,
      );
      pose = transition.offset(Math.max(0, seconds - transition.cut), pose);
      for (const limb of ["leftLeg", "rightLeg", "leftArm", "rightArm"] as const) {
        const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
        if (goal?.planted === true) pose = resolveHumanPosture.limb(body, pose, limb, goal);
      }
    }
    return clampPose(pose, body.skeleton);
  }

  /**
   * Forget every evaluated pose and transition offset, once every person's
   * actions are placed, so nothing evaluated against a half-placed
   * performance survives.
   *
   * @param person The person.
   */
  export function settle(person: IPerson): void {
    for (const segment of person.segments) {
      segment.plan.settle?.();
      if (segment.transition !== undefined) delete segment.transition.offset;
    }
    person.cache.clear();
    person.resolving = false;
  }

  /** A posture with the person's layers added in order. */
  function layered(person: IPerson, posture: IHumanPosture, seconds: number): IHumanPosture {
    return person.layers.reduce((p: IHumanPosture, layer: IHumanLayer): IHumanPosture => layer.apply(p, seconds, person.layer), posture);
  }

  /** The standing pose before a person's first action. */
  function initial(person: IPerson): IAutoMoviePose {
    return resolveHumanPosture(person.performer.body, person.initial);
  }
}
