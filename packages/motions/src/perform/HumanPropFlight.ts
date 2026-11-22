import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropLaunch,
  IAutoMovieProjectile,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropCatchHands } from "./HumanPropCatchHands";
import { HumanPropFlightFrame } from "./HumanPropFlightFrame";
import { HumanPropOutcome } from "./HumanPropOutcome";
import { HumanPropSweep } from "./HumanPropSweep";
import { launchPropProjectile } from "./launchPropProjectile";

/**
 * Props that fly: every launch an action publishes (`IHumanActionPlan.launches`)
 * turns its prop into the engine's flight (`projectileAt`) from the launch
 * until the next grip or launch takes custody. Its contacts against people,
 * props and the floor use the engine's one sweep (`projectileFirstContact`).
 * A staged grip records which launch it catches.
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
 * A spherical launch evaluates its physical centre and radius, and projects
 * that centre back to the original prop frame for display and capture. An
 * optional drag-free aim is solved from the displayed release.
 *
 * At its first contact the body's flight data decide what follows
 * (`HumanPropOutcome`, #3479): it sticks embedded, passes through, bounces
 * or rolls on; a prop whose data grant none stays where it struck, on the
 * floor, riding a struck prop or a struck person's bone. A bounce or a pass
 * is swept again, contact by contact, until the prop stays, rolls to rest
 * or stops at a staged grip or the end of the film. A flight still in the
 * air at the film's end is unended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where a flight starts, its drag, what it can meet, and how each contact ends or goes on with the outcome's source.
 * @evidence contracts/development/design.md#principled-representation A flight is its launch, its engine projectile, its first contact and the legs that follow. A tagged grip limits collision search by launch identity and records its takeover separately from collision.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The flights of a prop and its frame by flight; the hits they make are `HumanPerformanceHits`'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flight is the engine's, never a second closed form; the sweep is the engine's one resolver.
 */
export namespace HumanPropFlight {
  /**
   * A prop's flights in film order, found once the performance is placed.
   *
   * @param self The performance.
   * @param subject The prop.
   * @param through Optional film second limiting a point-in-time read during placement. Full hit scans omit it, and completed performances always use the final horizon.
   * @returns The flights.
   * @throws {HumanRefusal} When the final flight does not reach a staged interception.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines film ordering, action-window launch filtering, the placed horizon during scheduling, borrowed cached output and predecessor flights exposed during recursive construction.
   * @evidence contracts/development/implementation.md#principled-implementation Collects the prop's published launches inside their surviving action windows and stably sorts them by film time. While scheduling, point-in-time reads include only launches and collisions through the requested second, while hit scans cover the placed horizon. Once placed, the final schedule provides the horizon. Later grips or launches limit each flight, and final capture checks require the selected flight to agree with the staged grip before caching.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Collection/order, flight construction and per-performance retention stay distinct; sweep and continuation laws remain with their existing owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Existing 1e-9-second action-window and 1e-6-second grip-close margins remain explicit planning policies; no CCD time shift or producer-specific flight equation is added. Final-state cache identity does not independently detect caller mutation of performance inputs.
   * @evidence contracts/development/implementation.md#efficient-algorithms A cache hit is O(1); uncached collection computes the provisional horizon during the existing segment/launch traversal, sorts L matching launches in O(L log L), and then adds each flight's sweep/continuation cost and output. Final capture admission walks the sorted grip and flight lists once and samples one flight per staged grip. Missing or unlaunched props are not memoized, so those reads repeat collection work where applicable.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Placed non-resolving performances reuse results by performance identity and prop subject, relying on their plans/placements/props remaining fixed. The flying map shares predecessor output only during one recursive construction; resolving performances do not publish final cache results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The flying map removes the subject in finally on success or refusal; the flight map retain at most the queried launched props and their launch/contact/trajectory output until the performance is released. Returned records remain borrowed and mutable, and no host task is acquired.
   */
  export function flights(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    through: number = Infinity,
  ): readonly IAutoMovieMotionHumanPropFlight.IFlight[] {
    const kept: readonly IAutoMovieMotionHumanPropFlight.IFlight[] | undefined =
      self.flights.get(subject);
    if (kept !== undefined) return kept;
    const building: IAutoMovieMotionHumanPropFlight.IFlight[] | undefined =
      self.flying.get(subject);
    if (building !== undefined) return building;
    const prop: IAutoMovieMotionHumanProp | undefined = self.props.get(subject);
    if (prop === undefined) return [];
    const launches: {
      seconds: number;
      source: IAutoMovieMotionHumanPropFlight.IFlight["source"];
      launch: IAutoMovieMotionPropLaunch;
    }[] = [];
    let filmEnd: number = self.resolving ? 0 : self.schedule.duration;
    for (const person of self.people.values())
      for (const segment of [...person.segments, ...person.overlays]) {
        if (self.resolving) filmEnd = Math.max(filmEnd, segment.end);
        for (const launch of segment.plan.launches ?? []) {
          if (launch.prop !== subject) continue;
          const seconds: number = segment.start + launch.seconds;
          if (
            seconds < segment.entryTime - 1e-9 ||
            seconds > segment.end + 1e-9 ||
            (self.resolving && seconds > through)
          )
            continue;
          launches.push({
            seconds,
            source: { ...segment, subject: person.performer.subject },
            launch,
          });
        }
      }

    // A point read while scheduling sweeps through the second it asks for,
    // even past the last placed action: a catch of a long pass reads its
    // flight after the thrower's own action ends. Final admission repeats
    // the sweep over the placed film.
    if (self.resolving && Number.isFinite(through)) filmEnd = through;
    launches.sort((a, b): number => a.seconds - b.seconds);
    if (launches.length === 0) {
      if (!self.resolving) admitCaptures(self, subject, []);
      return [];
    }
    const out: IAutoMovieMotionHumanPropFlight.IFlight[] = [];
    self.flying.set(subject, out);
    try {
      for (const [index, { seconds, source, launch }] of launches.entries())
        out.push(
          fly(
            self,
            prop,
            seconds,
            source,
            launch,
            filmEnd,
            launches[index + 1]?.seconds,
            launches[index + 1]?.source,
            launches[index + 1]?.launch.touching,
          ),
        );
      if (!self.resolving) admitCaptures(self, subject, out);
    } finally {
      self.flying.delete(subject);
    }
    if (!self.resolving) self.flights.set(subject, out);
    return out;
  }

  /**
   * Find the latest flight still displaying this prop at the given film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Uses film seconds and allows the outgoing flight to supply the exact grip boundary frame.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the latest launch in stable film order, excluding any flight whose custody ended before the query or that precedes the caller's grip cutoff. During scheduling it asks for collision evidence up to the query second so a later contact cannot invalidate an earlier frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares flight selection between frame sampling and catch admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses placed records and compares their clocks without shifting the boundary.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans at most the prop's launch count after acquiring its flight records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the existing flight cache and returns a borrowed record.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no query or frame.
   */
  export function active(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    since: number = -Infinity,
  ): IAutoMovieMotionHumanPropFlight.IFlight | undefined {
    const list: readonly IAutoMovieMotionHumanPropFlight.IFlight[] = flights(
      self,
      subject,
      seconds,
    );
    for (let index: number = list.length - 1; index >= 0; --index) {
      const flight: IAutoMovieMotionHumanPropFlight.IFlight = list[index]!;
      if (
        flight.launch <= seconds &&
        flight.launch >= since &&
        seconds <= (flight.supersededAt ?? Infinity)
      )
        return flight;
    }
    return undefined;
  }

  /**
   * Read two frames of one approach, without resweeping the placed flight at the earlier sample.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Selects at the interception film second and reads it and the earlier film second on that same launch.
   * @evidence contracts/development/implementation.md#principled-implementation The later instant bounds the collision horizon during placement. Earlier choices along the selected flight read its already-built trajectory and continuations.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Flight selection and frame projection stay at their existing owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The earlier sample may not precede the selected launch or follow the interception.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bounded flight acquisition and two leg and frame reads, with a reused frame for coincident samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both frames use the same flight and sweep evidence.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the original launch identity and two frames without retaining a callback or new cache.
   */
  export function approach(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    before: number,
  ): IAutoMovieMotionHumanPropReader.IFlightApproach | undefined {
    const flight: IAutoMovieMotionHumanPropFlight.IFlight | undefined = active(
      self,
      subject,
      seconds,
    );
    if (flight === undefined || before < flight.launch || before > seconds)
      return undefined;
    const frame: IAutoMovieRigidTransform = HumanPropFlightFrame.sample(
      self,
      flight,
      seconds,
    );
    return {
      launch: flight.published,
      frame,
      before:
        before === seconds
          ? frame
          : HumanPropFlightFrame.sample(self, flight, before),
    };
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
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    seconds: number,
    since: number,
  ): IAutoMovieRigidTransform | undefined {
    const latest: IAutoMovieMotionHumanPropFlight.IFlight | undefined = active(
      self,
      subject,
      seconds,
      since,
    );
    return latest === undefined
      ? undefined
      : HumanPropFlightFrame.sample(self, latest, seconds);
  }

  /** Check each staged grip against the completed, still uncached flight list. */
  function admitCaptures(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    flights: readonly IAutoMovieMotionHumanPropFlight.IFlight[],
  ): void {
    let next: number = 0;
    for (const grip of HumanPerformanceRead.grips(self, subject)) {
      const capture: typeof grip.capture = grip.capture;
      if (capture === undefined) continue;

      // Both lists are in film order. The latest launch owns a tie, and
      // an earlier launch cannot regain custody after a later launch.
      while (next < flights.length && flights[next]!.launch <= grip.from)
        ++next;
      const flight: IAutoMovieMotionHumanPropFlight.IFlight | undefined =
        flights[next - 1];
      if (
        flight?.published === capture.launch &&
        grip.from <= (flight.supersededAt ?? Infinity) &&
        flight.capturedAt === grip.from
      ) {
        const displayed: IAutoMovieRigidTransform = HumanPropFlightFrame.sample(
          self,
          flight,
          grip.from,
        );
        if (
          capture.matches(displayed) &&
          HumanPropCatchHands.closes(self, grip, displayed)
        )
          continue;
      }
      throw new HumanRefusal({
        kind: "reach",
        performer: grip.subject,
        act: "stageCatch",
        axis: "ball",
        value: subject,
        reason: `the final flight misses the staged interception at ${grip.from} s`,
        fix: "align the published launch and fit the receiving hand on an unobstructed path",
      });
    }
  }

  /** Fly one launch to its first contact and on, by the outcome its body's data give. */
  function fly(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    seconds: number,
    source: IAutoMovieMotionHumanPropFlight.IFlight["source"],
    launch: IAutoMovieMotionPropLaunch,
    filmEnd: number,
    nextLaunch: number | undefined,
    successor: IAutoMovieMotionHumanPropFlight.IFlight["source"] | undefined,
    touching: IAutoMovieMotionPropLaunch["touching"],
  ): IAutoMovieMotionHumanPropFlight.IFlight {
    // The prop leaves from where it is shown at the launch, when a grip
    // shows it there; a prop set on its way leaves from the launch's point.
    let held: boolean = false;
    let capture: number | undefined;
    let superseded: number | undefined = nextLaunch;
    const grips: readonly IAutoMovieMotionHumanPerformanceState.IGrip[] =
      HumanPerformanceRead.grips(self, prop.subject);
    for (const grip of grips) {
      if (grip.from < seconds && grip.to >= seconds - 1e-6) held = true;
      if (grip.from <= seconds) continue;
      if (
        grip.from >= (nextLaunch ?? Infinity) ||
        grip.from > (superseded ?? Infinity)
      )
        break;
      superseded = grip.from;
      if (grip.capture?.launch === launch) capture = grip.from;
    }
    const shown: IAutoMovieRigidTransform = HumanPerformanceRead.prop(
      self,
      prop.subject,
      seconds,
    );
    const origin: IAutoMovieVector3 = held ? shown.position : launch.point;
    const rotation: IAutoMovieQuaternion =
      launch.rotation ?? (held ? shown.rotation : prop.frame.rotation);
    const projectile: IAutoMovieProjectile = launchPropProjectile(
      launch,
      origin,
      rotation,
      HumanPropOutcome.drag(prop),
    );
    const supersededAt: number | undefined =
      superseded !== undefined && superseded <= filmEnd
        ? superseded
        : undefined;
    const capturedAt: number | undefined =
      supersededAt === capture ? capture : undefined;
    const through: number = (supersededAt ?? filmEnd) - seconds;
    const flight: IAutoMovieMotionHumanPropFlight.IFlight = {
      prop: prop.subject,
      launch: seconds,
      source,
      published: launch,
      projectile,
      end: Infinity,
      ...(supersededAt === undefined ? {} : { supersededAt }),
      ...(capturedAt === undefined ? {} : { capturedAt }),
    };
    if (!(through > 0)) return flight;
    const captureHands: readonly HumanPropCatchHands.IApproach[] =
      HumanPropCatchHands.forLaunch(launch, grips, capturedAt);

    // A later launch that ends this flight meets the prop by its own fit,
    // so the props its performer holds then are that launch's to meet.
    const handback: HumanPropSweep.IHandback | undefined =
      successor !== undefined &&
      nextLaunch !== undefined &&
      supersededAt === nextLaunch
        ? {
            subject: successor.subject,
            at: nextLaunch,
            from: successor.start,
            hands: touching ?? [],
          }
        : undefined;
    const friction: number | undefined = launch.sphere?.tangentialFriction;
    const outcomeProp: IAutoMovieMotionHumanProp =
      friction === undefined || prop.body === undefined
        ? prop
        : { ...prop, body: { ...prop.body, kineticFriction: friction } };
    const meet = (
      p: IAutoMovieProjectile,
      base: number,
      leave?: string,
      departing?: string,
    ): IAutoMovieMotionHumanPropOutcome.IMeeting | null => {
      const meeting: IAutoMovieMotionHumanPropOutcome.IMeeting | null =
        HumanPropSweep.sweep(
          self,
          prop,
          source.subject,
          seconds + base,
          p,
          through - base,
          leave,
          departing,
          launch.sphere?.radius,
          captureHands,
          handback,
        );
      return supersededAt !== undefined &&
        meeting !== null &&
        base + meeting.hit.time >= through
        ? null
        : meeting;
    };
    const settle = (
      m: IAutoMovieMotionHumanPropOutcome.IMeeting,
      p: IAutoMovieProjectile,
      base: number,
    ): IAutoMovieMotionHumanPropFlight.IContact =>
      HumanPropFlightFrame.contactOf(
        self,
        outcomeProp,
        m,
        p,
        seconds + base,
        launch.sphere,
      );

    // A ball that starts resting on the floor and is kicked upward is
    // departing an existing support contact. Ask the engine to certify
    // clearance from that plane while retaining its later re-entry.
    const onFloor: boolean =
      (launch.sphere !== undefined || prop.points["tip"] === undefined) &&
      projectile.origin.y === (launch.sphere?.radius ?? 0);
    const first: IAutoMovieMotionHumanPropOutcome.IMeeting | null = meet(
      projectile,
      0,
      undefined,
      onFloor && projectile.velocity.y > 0 ? "ground" : undefined,
    );
    if (first === null) return flight;
    const legs: IAutoMovieMotionHumanPropOutcome.ILeg[] = HumanPropOutcome.legs(
      {
        prop: outcomeProp,
        ...(launch.sphere === undefined
          ? {}
          : { sphereRadius: launch.sphere.radius }),
        projectile,
        meeting: first,
        horizon: through,
        meet,
        settle,
      },
    );
    return {
      ...flight,
      end: seconds + first.hit.time,
      contact: settle(first, projectile, 0),
      ...(legs.length === 0 ? {} : { legs }),
    };
  }
}
