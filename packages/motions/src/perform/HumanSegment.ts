import {
  type IAutoMovieRandom,
  type IAutoMovieResolvedBone,
  type IAutoMovieSchedule,
  Quaternion,
  Vector3,
  clampPose,
  inertializePose,
  samplePoseVelocity,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import type { IHumanInterruptRow } from "../law/IHumanInterruptRow";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSkill } from "../skill/HumanSkill";
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
 * state by construction. A prop an earlier action left held is carried by an
 * action that does not drive that hand: the hand rides the chest with the
 * offset it had when the holding action ended, the trunk-relative goal of
 * carrying an object, its fingers keep their grip, and it is re-solved like a
 * planted limb. Before a person's first action the standing posture
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

    /** Props this person's actions left held, in placement order. */
    holds: IHeld[];

    /** Resolved stops of this person's weapons, film seconds, keyed by `weapon(segment, id)`. */
    stops: Map<string, number>;
  }

  /**
   * A weapon's key among its person's stops.
   *
   * @param segment The action.
   * @param id The weapon's id within its plan.
   * @returns The key.
   */
  export function weapon(segment: ISegment, id: string): string {
    return `${segment.index}:${id}`;
  }

  /** A prop held across actions. */
  export interface IHeld {
    /** The holding hand. */
    side: "left" | "right";

    /** The prop's subject. */
    prop: string;

    /** The holding fingers' clinical angles. */
    fingers: Readonly<
      Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>>
    >;

    /** The action that took hold. */
    source: ISegment;

    /** Film second the hold starts. */
    from: number;

    /** Film second a later action takes the hand over; infinite while none has. */
    until: number;

    /** The holding arm relative to the chest, captured when the carry starts. */
    carry?: ICarry;
  }

  /**
   * A holding arm as its action left it, which the carry keeps: the hand's
   * frame and the elbow in the chest's frame, and the arm's own solution
   * (`IHumanPosture.IGoal.reference`), so the carried arm stays in the
   * configuration it took hold in.
   */
  export interface ICarry {
    /** The hand joint in the chest's frame, metres. */
    position: IAutoMovieVector3;

    /** The hand's rotation in the chest's frame. */
    rotation: IAutoMovieQuaternion;

    /** The elbow in the chest's frame, metres: the carry's bend hint. */
    elbow: IAutoMovieVector3;

    /** The arm's solution there. */
    reference: IHumanPosture.IReference;
  }

  /**
   * Whether a plan drives a hand: it has a contact window on it or names it.
   *
   * @param plan The plan.
   * @param side The hand.
   * @returns Whether it drives the hand.
   */
  export function drives(
    plan: IHumanActionPlan,
    side: "left" | "right",
  ): boolean {
    return (
      plan.contacts.some(
        (c: IHumanContactWindow): boolean => c.part === `${side}Hand`,
      ) || (plan.hands ?? []).includes(side)
    );
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
    if (
      previous === undefined ||
      before === undefined ||
      before.cut === undefined ||
      Math.abs(before.end - start) > 1e-9
    )
      return undefined;
    const D: number = previous.plan.duration;
    const share: number = (previous.end - previous.start) / D;
    const rows: readonly IHumanInterruptRow[] =
      previous.law.interrupts[name] ?? [];
    const found: IHumanInterruptRow | undefined = rows.find(
      (r: IHumanInterruptRow): boolean => {
        const [a, b] = r.window.map((w: number | string): number =>
          HumanSegment.share(w, previous.plan),
        );
        return share >= a! - 1e-9 && share <= b! + 1e-9;
      },
    );
    if (found !== undefined) return found;
    const legal: string =
      rows.length === 0
        ? "none declared"
        : rows
            .map(
              (r: IHumanInterruptRow): string =>
                `[${r.window.join(", ")}] (${r.kind})`,
            )
            .join(", ");
    throw new Error(
      `${subject}: ${previous.name} cannot be cut into ${name} at share ${share.toFixed(3)}; legal windows: ${legal}`,
    );
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
    if (event === undefined)
      throw new Error(
        `No event ${at}; events are ${plan.events.map((e) => e.name).join(", ") || "none"}`,
      );
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
  export function entry(
    person: IPerson,
    previous: ISegment | undefined,
    seconds: number,
  ): IHumanEntryState {
    const body = person.performer.body;
    const shown = (t: number): IAutoMoviePose =>
      previous === undefined ? initial(person) : of(person, previous, t);
    // What was displayed up to the entry: the motion it leaves ends here.
    const state: samplePoseVelocity.IState = samplePoseVelocity(
      shown,
      seconds,
      1e-3,
      "before",
    );
    const posture: IHumanPosture =
      previous === undefined
        ? person.initial
        : layered(
            person,
            previous.plan.posture(
              Math.min(
                previous.plan.duration,
                Math.max(0, seconds - previous.start),
              ),
            ),
            seconds,
          );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      state.pose,
    );
    const planted = (part: "leftFoot" | "rightFoot"): boolean => {
      if (previous === undefined) return true;
      const u: number = Math.min(
        1,
        Math.max(0, (seconds - previous.start) / previous.plan.duration),
      );
      return previous.plan.contacts.some(
        (c: IHumanContactWindow): boolean =>
          c.part === part &&
          (c.kind === "plant" || c.kind === "pivot") &&
          u >= c.from - 1e-9 &&
          u <= c.to + 1e-9,
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
              share: Math.min(
                1,
                Math.max(
                  0,
                  (seconds - previous.start) / previous.plan.duration,
                ),
              ),
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
    const cached: IAutoMoviePose | undefined = person.resolving
      ? undefined
      : person.cache.get(seconds);
    if (cached !== undefined) return cached;
    let active: ISegment | undefined;
    for (const s of person.segments)
      if (s.entryTime <= seconds + 1e-12) active = s;
    const pose: IAutoMoviePose =
      active === undefined ? initial(person) : of(person, active, seconds);
    if (person.resolving) return pose;
    if (person.cache.size >= 4096)
      person.cache.delete(person.cache.keys().next().value!);
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
  export function of(
    person: IPerson,
    segment: ISegment,
    seconds: number,
  ): IAutoMoviePose {
    const body = person.performer.body;
    const local: number = Math.min(
      segment.plan.duration,
      Math.max(0, seconds - segment.start),
    );
    let posture: IHumanPosture = layered(
      person,
      segment.plan.posture(local),
      seconds,
    );
    // A hold rides every action entered before its takeover, at any second:
    // an interrupted action evaluated past its cut (a transition's source, an
    // entry state) still carries what it carried when it was cut.
    const carried: IHeld[] = person.holds.filter(
      (h: IHeld): boolean =>
        h.source !== segment &&
        h.from <= seconds &&
        (seconds < h.until || segment.entryTime < h.until) &&
        !drives(segment.plan, h.side),
    );
    for (const h of carried)
      posture = { ...posture, joints: { ...posture.joints, ...h.fingers } };
    let pose: IAutoMoviePose = resolveHumanPosture(body, posture);
    if (carried.length !== 0) {
      // The carry: each held hand rides the chest with the offset it had when
      // its action ended, the trunk-relative goal of a carried object.
      const chest: IAutoMovieResolvedBone = bones(person, pose).get("chest")!;
      const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
      for (const h of carried) {
        h.carry ??= capture(person, h);
        const goal: IHumanPosture.IGoal = {
          point: Vector3.add(
            chest.worldPosition,
            Quaternion.rotateVector(chest.worldRotation, h.carry.position),
          ),
          rotation: Quaternion.normalize(
            Quaternion.multiply(chest.worldRotation, h.carry.rotation),
          ),
          bend: Vector3.add(
            chest.worldPosition,
            Quaternion.rotateVector(chest.worldRotation, h.carry.elbow),
          ),
          reference: h.carry.reference,
          planted: true,
        };
        const limb: "leftArm" | "rightArm" =
          h.side === "left" ? "leftArm" : "rightArm";
        limbs[limb] = goal;
        pose = resolveHumanPosture.limb(body, pose, limb, goal);
      }
      posture = { ...posture, limbs };
    }
    // A stopped weapon's limb holds its contact when its law does not take its
    // stops itself; a law that does shows its own dwell and recoil.
    if (segment.plan.stop === undefined)
      for (const w of segment.plan.weapons ?? []) {
        const s: number | undefined = person.stops.get(weapon(segment, w.id));
        if (s === undefined || seconds <= s) continue;
        const side: "left" | "right" = w.limb.startsWith("left")
          ? "left"
          : "right";
        const arm: boolean = w.limb.endsWith("Arm");
        const map = bones(person, of(person, segment, s));
        const effector: IAutoMovieResolvedBone = map.get(
          `${side}${arm ? "Hand" : "Foot"}`,
        )!;
        const goal: IHumanPosture.IGoal = {
          point: effector.worldPosition,
          rotation: effector.worldRotation,
          bend: map.get(`${side}${arm ? "LowerArm" : "LowerLeg"}`)!
            .worldPosition,
          planted: true,
        };
        posture = { ...posture, limbs: { ...posture.limbs, [w.limb]: goal } };
        pose = resolveHumanPosture.limb(body, pose, w.limb, goal);
      }
    const transition = segment.transition;
    if (
      transition !== undefined &&
      transition.kind !== "redirect" &&
      seconds - transition.cut < transition.blend
    ) {
      // The source is read up to the cut and the target from it on: the
      // target's law has no motion before its start to difference across.
      transition.offset ??= inertializePose(
        samplePoseVelocity(
          (t: number): IAutoMoviePose => of(person, transition.source, t),
          transition.cut,
          1e-3,
          "before",
        ),
        samplePoseVelocity(
          (t: number): IAutoMoviePose =>
            resolveHumanPosture(
              body,
              layered(
                person,
                segment.plan.posture(
                  Math.min(
                    segment.plan.duration,
                    Math.max(0, t - segment.start),
                  ),
                ),
                t,
              ),
            ),
          transition.cut,
          1e-3,
          "after",
        ),
        transition.blend,
      );
      // The offset pose is clamped first and the planted limbs re-solved last,
      // so no later step moves a plant (the limb fit keeps its own angles in range).
      pose = clampPose(
        transition.offset(Math.max(0, seconds - transition.cut), pose),
        body.skeleton,
      );
      // Attached goals are fitted after the limb they ride on (resolveHumanPosture.order).
      for (const limb of resolveHumanPosture.order(posture.limbs)) {
        const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
        if (goal?.planted === true)
          pose = resolveHumanPosture.limb(body, pose, limb, goal);
      }
      return pose;
    }
    return clampPose(pose, body.skeleton);
  }

  /**
   * Forget everything a person's plans and transitions evaluated: each
   * plan's own memo, every transition offset, every held hand's carry and
   * every displayed pose. What they read may have changed since (another
   * person was placed, a contact was committed), and each is rebuilt on its
   * next read.
   *
   * @param person The person.
   */
  export function forget(person: IPerson): void {
    for (const segment of person.segments) {
      segment.plan.settle?.();
      if (segment.transition !== undefined) delete segment.transition.offset;
    }
    for (const held of person.holds) delete held.carry;
    person.cache.clear();
  }

  /**
   * Forget every evaluated pose and transition offset, once every person's
   * actions are placed, so nothing evaluated against a half-placed
   * performance survives, and let displayed poses be kept from here on.
   * Whatever later changes what a person shows (a contact stop committed or
   * withdrawn) must {@link forget} everyone again; the poses kept in between
   * are then exactly those of the state they were read in.
   *
   * @param person The person.
   */
  export function settle(person: IPerson): void {
    forget(person);
    person.resolving = false;
  }

  /** A pose's world bones. */
  function bones(
    person: IPerson,
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(person.performer.body, pose);
  }

  /** A holding arm relative to the chest at the end of the action that took hold. */
  function capture(person: IPerson, held: IHeld): ICarry {
    const at: number = Math.max(held.from, held.source.end);
    const pose: IAutoMoviePose = of(person, held.source, at);
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      person,
      pose,
    );
    const chest: IAutoMovieResolvedBone = map.get("chest")!;
    const hand: IAutoMovieResolvedBone = map.get(`${held.side}Hand`)!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      chest.worldRotation,
    );
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, chest.worldPosition),
      );
    return {
      position: local(hand.worldPosition),
      rotation: Quaternion.normalize(
        Quaternion.multiply(inverse, hand.worldRotation),
      ),
      elbow: local(map.get(`${held.side}LowerArm`)!.worldPosition),
      reference: resolveHumanPosture.reference(
        pose,
        held.side === "left" ? "leftArm" : "rightArm",
      ),
    };
  }

  /** A posture with the person's layers added in order. */
  function layered(
    person: IPerson,
    posture: IHumanPosture,
    seconds: number,
  ): IHumanPosture {
    // Each layer draws from streams keyed by its own name, as IHumanLayer
    // documents, so two layers that name a channel alike stay independent.
    return person.layers.reduce(
      (p: IHumanPosture, layer: IHumanLayer): IHumanPosture =>
        layer.apply(p, seconds, {
          ...person.layer,
          random: (channel: string): IAutoMovieRandom =>
            HumanSkill.stream(
              person.skill,
              person.performer.subject,
              `layer:${layer.name}`,
              0,
              channel,
            ),
        }),
      posture,
    );
  }

  /** The standing pose before a person's first action. */
  function initial(person: IPerson): IAutoMoviePose {
    return resolveHumanPosture(person.performer.body, person.initial);
  }
}
