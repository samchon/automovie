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
   * What a flight struck.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a person's canonical bone, a prop subject and the world ground; identities refer to the placed performance.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union keeps the carrier facts required by each target kind; runtime performance readers establish that the subject and bone exist.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The sweep produces these targets and contact settlement/frame readers consume every variant.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No material, response or actor identity is inferred from the subject string; each variant carries only its carrier identity.
   */
  export type Struck =
    | { kind: "person"; subject: string; bone: AutoMovieHumanoidBone }
    | { kind: "prop"; subject: string }
    | { kind: "ground" };

  /**
   * One flight of a prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States film-absolute launch/end times, launch-relative projectile/leg clocks, source action, optional first contact and unended-flight Infinity.
   * @evidence contracts/development/design.md#principled-representation Reuses the engine projectile and continuation legs; optional contact and infinite end express an unended flight, with their consistency established by fly rather than by the record type alone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Frame and hit readers consume the launch, source, projectile, end, contact and continuation legs emitted by this owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores neither sampled frames nor a second ballistic law; source/published records are borrowed from the planned performance and returned flight records are not deeply frozen.
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
   * Where and how a flight struck.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names world-metre point/normal and incoming velocity, the carrier-relative resting offset and the declared contact outcome.
   * @evidence contracts/development/design.md#principled-representation Keeps the observed world contact separate from the prop's embedded or unembedded offset in the struck carrier's frame; supported target and outcome unions constrain their alternatives.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Flight frames use the target/offset, while hit records read the geometry, velocity and outcome.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contact data does not claim a calibrated moving-surface impulse or a coupled rigid-body solve; the existing continuation uses its fixed-surface response approximation.
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
   * @evidence contracts/development/common.md#meaningful-documentation Defines film ordering, action-window launch filtering, borrowed cached output and predecessor flights exposed during recursive construction.
   * @evidence contracts/development/implementation.md#principled-implementation Collects the prop's published launches inside their surviving action windows, stably sorts them by film time and delegates each flight to the engine-backed fly owner; recursive frame reads see only flights already built.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Collection/order, flight construction and per-performance retention stay distinct; sweep and continuation laws remain with their existing owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Existing 1e-9-second action-window and 1e-6-second grip-close margins remain explicit planning policies; no CCD time shift or producer-specific flight equation is added. Final-state cache identity does not independently detect caller mutation of performance inputs.
   * @evidence contracts/development/implementation.md#efficient-algorithms A cache hit is O(1); uncached collection scans action segments/launches and sorts L matching launches in O(L log L), then adds each flight's sweep/continuation cost and output. Missing or unlaunched props are not memoized, so those reads repeat collection work where applicable.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Placed non-resolving performances reuse results by performance identity and prop subject, relying on their plans/placements/props remaining fixed. BUILDING shares predecessor output only during one recursive construction; resolving performances do not publish final cache results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources BUILDING removes the subject in finally on success or refusal; final weak-state entries retain at most the queried launched props and their launch/contact/trajectory output until the performance is released. Returned records remain borrowed and mutable, and no host task is acquired.
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
   * @evidence contracts/development/common.md#meaningful-documentation States latest qualifying launch selection, film seconds, the grip cutoff, undefined absence and carrier-relative rest after contact.
   * @evidence contracts/development/implementation.md#principled-implementation Selects the latest launch inside the requested grip interval, samples its engine trajectory or launch-relative continuation leg, then composes a settled offset with the current struck carrier. Finite query clocks and coherent generated flight records are caller premises.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One temporal selection separates first-flight, continuation and settled-carrier frame paths, reusing the existing motion and frame owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not restart a flight at query time, clamp a bad clock or invent a rebound; no qualifying launch stays undefined, and delegated admission/refusal propagates.
   * @evidence contracts/development/implementation.md#efficient-algorithms After flight acquisition, selection scans L launches and up to K continuation legs, plus the chosen trajectory sample or carrier/FK read; it allocates no sampled-frame history.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the placed performance's flight records and engine trajectory readers; caller time alone selects a frame without replaying previous output frames.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no query or frame locally; active paths return a small frame wrapper, and an uncarried settled path borrows the cached contact offset.
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
      departing?: string,
    ): HumanPropOutcome.IMeeting | null =>
      HumanPropSweep.sweep(
        self,
        prop,
        source.subject,
        seconds + base,
        p,
        horizon - base,
        leave,
        departing,
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
