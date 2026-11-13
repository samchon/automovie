import type { IAutoMovieSchedule } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import type { IHumanInterruptRow } from "../law/IHumanInterruptRow";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { HumanSkill } from "../skill/HumanSkill";
import { HumanSegmentCut } from "./HumanSegmentCut";
import { HumanSegmentEntry } from "./HumanSegmentEntry";
import { HumanSegmentPose } from "./HumanSegmentPose";
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
 *
 * The records and the small readers live here; the evaluation is split by
 * responsibility: the cut's legality (`HumanSegmentCut`), the entry state
 * (`HumanSegmentEntry`), the displayed pose (`HumanSegmentPose`), the
 * overlays (`HumanSegmentOverlay`) and a held prop's carry
 * (`HumanSegmentCarry`). `row`, `entry` and `displayed` are kept here by
 * name and pass straight to their owners.
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

    /** Actions placed over those, in placement order: each takes its claimed channels from the carrier while it runs. */
    overlays: IOverlay[];

    /** The standing posture before the first action. */
    initial: IHumanPosture;

    /** Displayed poses already evaluated, by film second; bounded to 4096 entries. */
    cache: Map<number, IAutoMoviePose>;

    /** Whether the schedule is still being resolved: nothing is cached meanwhile, because another person's actions may not be placed yet. */
    resolving: boolean;

    /** Additive layers over the person's actions, in order, each inside its window. */
    layers: ILayered[];

    /** What a layer can read. */
    layer: IHumanLayer.IContext;

    /** Props this person's actions left held, in placement order. */
    holds: IHeld[];

    /** Resolved stops of this person's weapons, film seconds, keyed by `weapon(segment, id)`. */
    stops: Map<string, number>;
  }

  /** A layer and the film seconds it runs in. */
  export interface ILayered {
    /** The layer. */
    layer: IHumanLayer;

    /** The second it starts; minus infinity for the whole film. */
    from: number;

    /** The second it ends; infinity for the whole film. */
    to: number;

    /** Seconds over which it comes in and goes out. */
    fade: number;
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

    /**
     * Whether the action that took the hand over rides a carrier. The
     * carrier is still running then, so the hold ends for it at `until`
     * too, where a hold taken over by the next action still rides every
     * action entered before the takeover.
     */
    riding?: boolean;

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
    name: HumanActionKey;

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

  /** One action placed over a carrier. */
  export interface IOverlay extends ISegment {
    /** The channels it takes from the carrier. */
    channels: readonly AutoMovieMotionHumanChannel[];
  }

  /** How long an overlay takes to come in over its carrier and to give its channels back, seconds (provisional, the voluntary blend of a cancel row doubled so both ends fit a short gesture). */
  export const FADE: number = 0.2;

  /**
   * The interrupt row that legalises entering an action at a second, or
   * undefined when nothing is interrupted.
   *
   * @param subject The person, for messages.
   * @param previous The person's previous action.
   * @param before Its schedule entry.
   * @param name The action entered.
   * @param start The entry second.
   * @param accepts The entered action's own table of what may be cut into it.
   * @returns The row, or undefined for a first action, a gap or a natural end.
   * @throws {Error} When the previous action is cut outside every legal window, listing them.
   */
  export function row(
    subject: string,
    previous: ISegment | undefined,
    before: IAutoMovieSchedule.IEntry | undefined,
    name: HumanActionKey,
    start: number,
    accepts: IHumanActionLaw["accepts"] = {},
    family: HumanActionKey = name,
  ): IHumanInterruptRow | undefined {
    return HumanSegmentCut.row(
      subject,
      previous,
      before,
      name,
      start,
      accepts,
      family,
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
      throw new HumanRefusal({
        kind: "cut",
        axis: "event",
        value: at,
        feasible: {
          kind: "alternatives",
          values: plan.events.map((e): string => e.name),
        },
        reason: `the action publishes no event named ${at}`,
        fix: "name one of the action's events, or give the instant as a share from 0 to 1",
      });
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
    return HumanSegmentEntry.entry(person, previous, seconds);
  }

  /**
   * A person's displayed pose at a film second.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  export function displayed(person: IPerson, seconds: number): IAutoMoviePose {
    return HumanSegmentPose.displayed(person, seconds);
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
    for (const overlay of person.overlays) overlay.plan.settle?.();
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
}
