import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanInterruptRow,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanSegmentCut } from "./HumanSegmentCut";
import { HumanSegmentEntry } from "./HumanSegmentEntry";
import { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/** The alternatives of `ShareAt`'s site. */
type ShareAt = number | string;

/**
 * One placed action of one person, and how a person's displayed pose is
 * evaluated from their placed actions.
 *
 * The displayed pose at a second is, in order (the transition order of the
 * campaign): the active action's posture resolved to a pose; the decaying
 * inertialization offset from the action it interrupted, captured as both
 * actions' pose and velocity at the cut (`inertializePose`, Bollo 2018); every
 * planted or gripping limb re-solved onto its posture goal, so a contact is
 * never moved by the offset (Holden, Dead Blending); and the range-of-motion
 * clamp. A redirect transition adds no offset: its law continues the source's
 * state by construction. A prop an earlier action left held is carried by an
 * action that does not drive that hand: the hand rides the chest with the
 * offset it had when the holding action ended, the trunk-relative goal of
 * carrying an object, its fingers keep their grip, and it is re-solved like a
 * planted limb. Before a person's first action the standing posture at their
 * starting place is shown.
 *
 * The records and the small readers live here; the evaluation is split by
 * responsibility: the cut's legality (`HumanSegmentCut`), the entry state
 * (`HumanSegmentEntry`), the displayed pose (`HumanSegmentPose`), the overlays
 * (`HumanSegmentOverlay`) and a held prop's carry (`HumanSegmentCarry`). `row`,
 * `entry` and `displayed` are kept here by name and pass straight to their
 * owners.
 */
export namespace HumanSegment {
  /** The interface contract (`IAutoMovieMotionHumanSegment.IShown`). */
  export type IShown = IAutoMovieMotionHumanSegment.IShown;

  /**
   * A weapon's key among its person's stops.
   *
   * @param segment The action.
   * @param id The weapon's id within its plan.
   * @returns The key.
   */
  export function weapon(
    segment: IAutoMovieMotionHumanSegment,
    id: string,
  ): string {
    return `${segment.index}:${id}`;
  }

  /**
   * Whether a plan drives a hand: it has a contact window on it or names it.
   *
   * @param plan The plan.
   * @param side The hand.
   * @returns Whether it drives the hand.
   */
  export function drives(
    plan: IAutoMovieMotionHumanActionPlan,
    side: AutoMovieHumanSide,
  ): boolean {
    return (
      plan.contacts.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === `${side}Hand`,
      ) || (plan.hands ?? []).includes(side)
    );
  }

  /**
   * How long an overlay takes to come in over its carrier and to give its
   * channels back, seconds (provisional, the voluntary blend of a cancel row
   * doubled so both ends fit a short gesture).
   */
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
   * @throws {Error} When the previous action is cut outside every legal window,
   *   listing them.
   */
  export function row(
    subject: string,
    previous: IAutoMovieMotionHumanSegment | undefined,
    before: IAutoMovieScheduleEntry | undefined,
    name: AutoMovieMotionHumanActionKey,
    start: number,
    accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {},
    family: AutoMovieMotionHumanActionKey = name,
  ): IAutoMovieMotionHumanInterruptRow | undefined {
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
  export function share(
    at: ShareAt,
    plan: IAutoMovieMotionHumanActionPlan,
  ): number {
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
   * @param blend The inertialization the cut into the action decays over,
   *   seconds; absent for an action entered over another.
   * @returns The entry state.
   */
  export function entry(
    person: IAutoMovieMotionHumanSegment.IPerson,
    previous: IAutoMovieMotionHumanSegment | undefined,
    seconds: number,
    blend?: number,
  ): IAutoMovieMotionHumanEntryState {
    return HumanSegmentEntry.entry(person, previous, seconds, blend);
  }

  /**
   * A person's displayed pose at a film second.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @returns The pose.
   */
  export function displayed(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose {
    return HumanSegmentPose.displayed(person, seconds, requested, prepared);
  }

  /**
   * Forget everything a person's plans and transitions evaluated: each plan's
   * own memo, every transition offset, every held hand's carry, every anchor's
   * fits and every displayed pose. What they read may have changed since
   * (another person was placed, a contact was committed), and each is rebuilt
   * on its next read.
   *
   * @param person The person.
   */
  export function forget(person: IAutoMovieMotionHumanSegment.IPerson): void {
    for (const segment of person.segments) {
      segment.plan.settle?.();
      HumanPreparedPlayback.forget(segment.plan);
      if (segment.transition !== undefined) delete segment.transition.offset;
      delete segment.incumbents;
      delete segment.legs;
      delete segment.anchors;
    }
    for (const overlay of person.overlays) {
      overlay.plan.settle?.();
      HumanPreparedPlayback.forget(overlay.plan);
    }
    for (const held of person.holds) delete held.carry;
    person.cache.clear();
  }

  /**
   * Run one action's planning with the placed people's displayed poses shared
   * between its readers. While the schedule is being resolved no pose is kept
   * from one placement to the next, since each placement changes what later
   * actions read; but within the planning of one action nothing is placed, and
   * its planner reads the same people at the same seconds again and again (a
   * partner's pose at every instant of an arm's course, for every candidate it
   * lays). A nested planning runs with its own poses and leaves the outer one
   * none, and a placement inside clears them (`placed`), so no pose outlives
   * the placed state it was read in.
   *
   * @param people Every person of the performance.
   * @param run The planning.
   * @returns What the planning returns.
   */
  export function planning<T>(
    people: Iterable<IAutoMovieMotionHumanSegment.IPerson>,
    run: () => T,
  ): T {
    const all: IAutoMovieMotionHumanSegment.IPerson[] = [...people];
    const nested: boolean[] = all.map(
      (person: IAutoMovieMotionHumanSegment.IPerson): boolean =>
        person.planning !== undefined,
    );
    for (const person of all) person.planning = new Map();
    try {
      return run();
    } finally {
      all.forEach(
        (person: IAutoMovieMotionHumanSegment.IPerson, i: number): void => {
          if (nested[i]) person.planning = new Map();
          else delete person.planning;
        },
      );
    }
  }

  /**
   * Drop the poses a planning shares, after anything is placed: an action, an
   * overlay or a hold changes what every later read shows. The anchor fits of
   * every action (`IAutoMovieMotionHumanSegment.anchors`) go too, since an
   * anchor read now would show the new placement, so no read continues a fit
   * depending on whether its anchor was read before it.
   *
   * @param people Every person of the performance.
   */
  export function placed(
    people: Iterable<IAutoMovieMotionHumanSegment.IPerson>,
  ): void {
    for (const person of people) {
      person.planning?.clear();
      for (const segment of person.segments) delete segment.anchors;
    }
  }

  /**
   * Forget every evaluated pose and transition offset, once every person's
   * actions are placed, so nothing evaluated against a half-placed performance
   * survives, and let displayed poses be kept from here on. Whatever later
   * changes what a person shows (a contact stop committed or withdrawn) must
   * {@link forget} everyone again; the poses kept in between are then exactly
   * those of the state they were read in.
   *
   * @param person The person.
   */
  export function settle(person: IAutoMovieMotionHumanSegment.IPerson): void {
    forget(person);
    person.resolving = false;
  }
}
