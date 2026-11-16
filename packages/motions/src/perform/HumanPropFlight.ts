import {
  AutoMovieGravity,
  type IAutoMovieProjectile,
  type IAutoMovieProjectileState,
  projectileAt,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanPropFrame } from "./HumanPropFrame";
import { HumanPropOutcome } from "./HumanPropOutcome";
import { HumanPropSweep } from "./HumanPropSweep";
import type { HumanSegment } from "./HumanSegment";
import type { IHumanProp } from "./IHumanProp";

/**
 * Props that fly: every launch an action publishes (`IHumanActionPlan.launches`)
 * turns its prop into the engine's flight (`projectileAt`) from the launch
 * until the flight's first contact, against the people, the props that do
 * not fly themselves and the floor, found by the engine's one sweep
 * (`projectileFirstContact`), and then into where the flight ends.
 *
 * A launched prop leaves from its displayed frame at the launch second (the
 * hand that held it lets go there) with the launch's velocity; a prop the
 * action sets on its way without holding it (a ball in a barrel) leaves from
 * the launch's point. Its rotation is kept, turned by the launch's attitude
 * when it gives one. A prop that names a `tip` point flies as a capsule from
 * its origin to its tip, so an arrow meets a body with its head; any other
 * flies as its origin's point, so a bottle meets the floor with its base.
 *
 * The flight carries the quadratic drag its model body declares
 * (`IAutoMovieBody.drag`, #3482), drag-free without it. What it meets is the
 * one sweep's (`HumanPropSweep`): every person but the launcher, the props
 * that do not fly and the floor. Flights do not meet each other, and a
 * flying prop is no collider.
 *
 * At its first contact the body's flight data decide what follows
 * (`HumanPropOutcome`, #3479): it sticks embedded, passes through, bounces
 * or rolls on; a prop whose data grant none stays where it struck, on the
 * floor, riding a struck prop or a struck person's bone. A bounce or a pass
 * is swept again, contact by contact, until the prop stays, rolls to rest
 * or the film ends. A flight still in the air at the film's end is unended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where a flight starts, its drag, what it can meet, and how each contact ends or goes on with the outcome's source.
 * @evidence contracts/development/design.md#principled-representation A flight is its launch, its engine projectile, its first contact and the legs that follow; the prop's frame after them is a rest in the frame of what it struck.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The flights of a prop and its frame by flight; the hits they make are `HumanPerformanceHits`'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flight is the engine's, never a second closed form; the sweep is the engine's one resolver.
 */
export namespace HumanPropFlight {
  /**
   * The physical carrier of a contact: a person's canonical bone, a prop,
   * or the world ground. Subjects are the performance's authored identities.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the three contact carriers and the subject/bone identifiers used to follow a struck frame.
   * @evidence contracts/development/design.md#principled-representation A closed tagged union carries exactly the identity required by each carrier's world-frame reader.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Flight contacts and continuation meetings use this shared carrier representation; ground needs no invented subject.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Preserves actual person/bone or prop identity rather than embedding a cached world frame or an outcome decision.
   */
  export type Struck =
    | { kind: "person"; subject: string; bone: AutoMovieHumanoidBone }
    | { kind: "prop"; subject: string }
    | { kind: "ground" };

  /**
   * One authored launch and its physical continuation. Launch/end are film
   * seconds; the projectile and continuation legs use launch-relative time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines prop/source/publication provenance, film versus projectile clocks, optional first contact and later legs; member comments give units and unended meaning.
   * @evidence contracts/development/design.md#principled-representation Keeps the original launch, engine projectile and ordered contact legs together instead of reconstructing motion from sampled display frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Frame playback and hit reporting consume this same flight record; absent contact and infinite end represent a genuinely unended flight.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores actual sweep/outcome results without a second ballistic formula, fabricated contact or separate flight-success flag.
   */
  export interface IFlight {
    /** The prop. */
    prop: string;

    /** Film second of the launch. */
    launch: number;

    /** The launching action, with its performer. */
    source: HumanSegment.ISegment & { subject: string };

    /** The launch as the action published it. */
    published: IHumanActionPlan.ILaunch;

    /** The flight, its time zero at `launch`. */
    projectile: IAutoMovieProjectile;

    /** Film second of its first contact; Infinity when it is still in the air at the film's end. */
    end: number;

    /** Its first contact, absent while unended. */
    contact?: IContact;

    /** What follows the first contact, by the body's flight data: a bounce, a pass, a roll (`HumanPropOutcome`); none when it stays where it struck. */
    legs?: readonly HumanPropOutcome.ILeg[];
  }

  /**
   * A resolved contact's world geometry and the prop's frame relative to
   * its actual carrier. Velocity is metres per second; offsets use metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines struck identity, world point/normal/velocity, carrier-relative offset and the selected physical outcome.
   * @evidence contracts/development/design.md#principled-representation Separates world impact geometry from the carrier-relative rest frame so a struck bone or prop may continue moving.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Flight playback follows offset while hit reporting reads point/normal/velocity and carrier identity; outcomes use the existing closed names.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains the actual contact and outcome rather than a surrogate target or a stale posed carrier frame.
   */
  export interface IContact {
    /** What it struck. */
    struck: Struck;

    /** The contact point on the struck surface, world metres. */
    point: IAutoMovieVector3;

    /** The struck surface's outward unit normal. */
    normal: IAutoMovieVector3;

    /** The prop's velocity at contact, m/s. */
    velocity: IAutoMovieVector3;

    /** The prop's frame at contact, in the frame of what it struck (the bone, the prop, or the world); embedded by its depth where it sticks. */
    offset: IHumanProp.IFrame;

    /** What the contact does (`HumanPropOutcome.decide`); `stick` where it stays. */
    outcome: "stick" | "bounce" | "roll" | "pass";
  }

  /**
   * A prop's flights in film order, found once the performance is placed.
   *
   * @param self The performance.
   * @param subject The prop.
   * @returns The flights.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines performance/prop input and film-ordered launch results, including an empty result for a missing prop or no admitted launches.
   * @evidence contracts/development/implementation.md#principled-implementation Collects actual published launches inside their segment windows, sorts by film time and delegates each launch's sweep and continuation to the physical owners.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cache/provisional lookup precedes launch collection and one ordered construction pass; finally removes the provisional recursion entry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the existing entry-window tolerances and all launches; resolving performances never populate the completed-flight cache, and physical refusal still propagates.
   * @evidence contracts/development/implementation.md#efficient-algorithms A cold read scans published launches and sorts L matching launches in O(L log L), then pays each actual physical sweep/continuation cost. A completed cached read uses nested map lookups.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The weak performance owner shares completed flights only outside its resolving phase; a provisional same-prop list breaks recursive frame reads during the current construction.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Finally removes the provisional subject on success or refusal. Completed records retain their launch/physical data per live performance and prop; weak performance ownership releases both maps with that performance.
   */
  export function flights(
    self: HumanPerformanceState,
    subject: string,
  ): readonly IFlight[] {
    const kept: readonly IFlight[] | undefined = KEPT.get(self)?.get(subject);
    if (kept !== undefined) return kept;
    const building: IFlight[] | undefined = BUILDING.get(self)?.get(subject);
    if (building !== undefined) return building;
    const prop: IHumanProp | undefined = self.props.get(subject);
    if (prop === undefined) return [];
    const launches: {
      seconds: number;
      source: IFlight["source"];
      launch: IHumanActionPlan.ILaunch;
    }[] = [];
    for (const person of self.people.values())
      for (const segment of [...person.segments, ...person.overlays])
        for (const launch of segment.plan.launches ?? []) {
          if (launch.prop !== subject) continue;
          const seconds: number = segment.start + launch.seconds;
          if (
            seconds < segment.entryTime - 1e-9 ||
            seconds > segment.end + 1e-9
          )
            continue;
          launches.push({
            seconds,
            source: { ...segment, subject: person.performer.subject },
            launch,
          });
        }
    launches.sort((a, b): number => a.seconds - b.seconds);
    if (launches.length === 0) return [];
    const out: IFlight[] = [];
    const map: Map<string, IFlight[]> = BUILDING.get(self) ?? new Map();
    map.set(subject, out);
    BUILDING.set(self, map);
    try {
      for (const { seconds, source, launch } of launches)
        out.push(fly(self, prop, seconds, source, launch));
    } finally {
      map.delete(subject);
    }
    if (!self.resolving) {
      const done: Map<string, readonly IFlight[]> = KEPT.get(self) ?? new Map();
      done.set(subject, out);
      KEPT.set(self, done);
    }
    return out;
  }

  /**
   * A prop's world frame at a film second from its latest flight launched
   * at or after `since` (the latest grip's start, which a launch after it
   * ends), or undefined when no such flight has been launched by then.
   *
   * @param self The performance.
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param since Film second before which a launch is overtaken by a later grip.
   * @returns The frame, or undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States film-time selection, latest-grip cutoff, absent-flight result and the returned current world frame.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the engine projectile before contact, the active engine continuation leg afterward, or composes the resting offset with the actual current struck carrier.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects the latest eligible launch, follows its ordered legs, then handles world rest or a moving carrier in one final branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original projectile/continuation clock and contact frames; it neither extrapolates a frozen impact frame nor invents a flight before its launch or after a later grip.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans L cached launches and at most C continuation legs, then delegates one actual state or carrier read; a cold flights lookup additionally incurs its documented construction work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the performance's physical flight records and the engine's existing state samplers; it computes the currently requested frame without a timestamp-result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only call-local launch/contact references and returns the existing world offset or a current frame; no new query history, callback or process is retained.
   */
  export function frame(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    since: number,
  ): IHumanProp.IFrame | undefined {
    let latest: IFlight | undefined;
    for (const f of flights(self, subject))
      if (f.launch <= seconds && f.launch >= since) latest = f;
    if (latest === undefined) return undefined;
    if (seconds < latest.end) {
      const state: IAutoMovieProjectileState = projectileAt(
        latest.projectile,
        seconds - latest.launch,
      );
      return { position: state.position, rotation: state.rotation! };
    }

    // After the first contact: the leg running at that second, or the
    // contact the last one ended at.
    let contact: IContact = latest.contact!;
    const t: number = seconds - latest.launch;
    for (const leg of latest.legs ?? []) {
      if (t < leg.from) break;
      if (t < leg.end) {
        const state: IAutoMovieProjectileState = HumanPropOutcome.at(leg, t);
        return {
          position: state.position,
          rotation: state.rotation ?? contact.offset.rotation,
        };
      }
      contact = leg.contact!;
    }
    const carrier: IHumanProp.IFrame | undefined = struckFrame(
      self,
      contact.struck,
      seconds,
    );
    return carrier === undefined
      ? contact.offset
      : HumanPropFrame.compose(carrier, contact.offset);
  }

  /** Fly one launch to its first contact and on, by the outcome its body's data give. */
  function fly(
    self: HumanPerformanceState,
    prop: IHumanProp,
    seconds: number,
    source: IFlight["source"],
    launch: IHumanActionPlan.ILaunch,
  ): IFlight {
    // The prop leaves from where it is shown at the launch, when a grip
    // shows it there; a prop set on its way leaves from the launch's point.
    const held: boolean = HumanPerformanceRead.grips(self, prop.subject).some(
      (g: HumanPerformanceState.IGrip): boolean =>
        g.from < seconds && g.to >= seconds - 1e-6,
    );
    const shown: IHumanProp.IFrame = HumanPerformanceRead.prop(
      self,
      prop.subject,
      seconds,
    );
    const origin: IAutoMovieVector3 = held ? shown.position : launch.point;
    const rotation: IAutoMovieQuaternion =
      launch.rotation ?? (held ? shown.rotation : prop.frame.rotation);
    const drag: IAutoMovieProjectile.IDrag | undefined =
      HumanPropOutcome.drag(prop);
    const projectile: IAutoMovieProjectile = {
      origin,
      velocity: launch.velocity,
      gravity: AutoMovieGravity.DOWN,
      ...(drag === undefined ? {} : { drag }),
      attitude:
        launch.attitude === undefined
          ? { kind: "fixed", rotation }
          : launch.attitude.kind === "velocity"
            ? launch.attitude
            : { ...launch.attitude, rotation },
    };
    const horizon: number = self.duration - seconds;
    const flight: IFlight = {
      prop: prop.subject,
      launch: seconds,
      source,
      published: launch,
      projectile,
      end: Infinity,
    };
    if (!(horizon > 0)) return flight;
    const meet = (
      p: IAutoMovieProjectile,
      base: number,
      leave?: string,
    ): HumanPropOutcome.IMeeting | null =>
      HumanPropSweep.sweep(
        self,
        prop,
        source.subject,
        seconds + base,
        p,
        horizon - base,
        leave,
      );
    const settle = (
      m: HumanPropOutcome.IMeeting,
      p: IAutoMovieProjectile,
      base: number,
    ): IContact => contactOf(self, prop, m, p, seconds + base);
    const first: HumanPropOutcome.IMeeting | null = meet(projectile, 0);
    if (first === null) return flight;
    const legs: HumanPropOutcome.ILeg[] = HumanPropOutcome.legs({
      prop,
      projectile,
      meeting: first,
      horizon,
      meet,
      settle,
    });
    return {
      ...flight,
      end: seconds + first.hit.time,
      contact: settle(first, projectile, 0),
      ...(legs.length === 0 ? {} : { legs }),
    };
  }

  /** A meeting's contact record: where it struck, and where the prop stays in the frame of what it struck, embedded where it sticks. */
  function contactOf(
    self: HumanPerformanceState,
    prop: IHumanProp,
    meeting: HumanPropOutcome.IMeeting,
    projectile: IAutoMovieProjectile,
    zero: number,
  ): IContact {
    const state: IAutoMovieProjectileState = projectileAt(
      projectile,
      meeting.hit.time,
    );
    const at: number = zero + meeting.hit.time;
    const world: IHumanProp.IFrame = {
      position: HumanPropOutcome.rest(prop, meeting.struck, state),
      rotation: state.rotation!,
    };
    const carrier: IHumanProp.IFrame | undefined = struckFrame(
      self,
      meeting.struck,
      at,
    );
    return {
      struck: meeting.struck,
      point: meeting.hit.point,
      normal: meeting.hit.normal!,
      velocity: state.velocity,
      offset:
        carrier === undefined ? world : HumanPropFrame.relative(carrier, world),
      outcome: HumanPropOutcome.decide(prop, meeting.struck)?.kind ?? "stick",
    };
  }

  /** The world frame of what a flight struck at a second: a bone's, a prop's, or none for the floor. */
  function struckFrame(
    self: HumanPerformanceState,
    struck: Struck,
    seconds: number,
  ): IHumanProp.IFrame | undefined {
    switch (struck.kind) {
      case "person":
        return HumanPropFrame.bone(
          HumanPerformanceRead.bones(self, struck.subject, seconds).get(
            struck.bone,
          )!,
        );
      case "prop":
        return HumanPerformanceRead.prop(self, struck.subject, seconds);
      case "ground":
        return undefined;
    }
  }

  /** The flights found, per placed performance and prop. */
  const KEPT: WeakMap<
    HumanPerformanceState,
    Map<string, readonly IFlight[]>
  > = new WeakMap();

  /** The flights being found, so a launch reading its prop sees the flights before it. */
  const BUILDING: WeakMap<
    HumanPerformanceState,
    Map<string, IFlight[]>
  > = new WeakMap();
}
