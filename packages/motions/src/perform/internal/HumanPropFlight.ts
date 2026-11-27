import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionPropLaunch,
  IAutoMovieProjectile,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropCatchHands } from "./HumanPropCatchHands";
import { HumanPropFlightFrame } from "./HumanPropFlightFrame";
import { HumanPropOutcome } from "./HumanPropOutcome";
import { HumanPropSweep } from "./HumanPropSweep";
import { launchPropProjectile } from "./launchPropProjectile";

/**
 * Props that fly: every launch an action publishes
 * (`IHumanActionPlan.launches`) turns its prop into the engine's flight
 * (`projectileAt`) from the launch until the next grip or launch takes custody.
 * Its contacts against people, props and the floor use the engine's one sweep
 * (`projectileFirstContact`). A staged grip records which launch it catches.
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
 * (`IAutoMovieBody.drag`), drag-free without it. What it meets is the one
 * sweep's (`HumanPropSweep`): every person but the launcher, the props that do
 * not fly and the floor. Flights do not meet each other, and a flying prop is
 * no collider. A spherical launch evaluates its physical centre and radius, and
 * projects that centre back to the original prop frame for display and capture.
 * An optional drag-free aim is solved from the displayed release.
 *
 * At its first contact the body's flight data decide what follows
 * (`HumanPropOutcome`): it sticks embedded, passes through, bounces or rolls
 * on; a prop whose data grant none stays where it struck, on the floor, riding
 * a struck prop or a struck person's bone. A bounce or a pass is swept again,
 * contact by contact, until the prop stays, rolls to rest or stops at a staged
 * grip or the end of the film. A flight still in the air at the film's end is
 * unended.
 */
export namespace HumanPropFlight {
  /**
   * A prop's flights in film order: those the performance prepared once it was
   * placed (`IAutoMovieMotionHumanPerformanceState.flights`), or those the
   * placed performance gives now.
   *
   * @param self The performance.
   * @param subject The prop.
   * @param through Optional film second limiting a point-in-time read during
   *   placement. Full hit scans omit it, and completed performances always use
   *   the final horizon.
   * @returns The flights.
   * @throws {HumanRefusal} When the final flight does not reach a staged
   *   interception.
   */
  export function flights(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    through: number = Infinity,
  ): readonly IAutoMovieMotionHumanPropFlight.IFlight[] {
    return self.flights.get(subject) ?? sweep(self, subject, through);
  }

  /**
   * Sweep a prop's flights from the placed launches: every launch flown in film
   * order, each until the next takes custody, with the staged interceptions
   * admitted once the schedule is resolved. What the performance prepares.
   *
   * @param self The performance.
   * @param subject The prop.
   * @param through Optional film second limiting a point-in-time read during
   *   placement.
   * @returns The flights.
   */
  export function sweep(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    through: number = Infinity,
  ): readonly IAutoMovieMotionHumanPropFlight.IFlight[] {
    // A launch reading its own prop while its flights are swept sees the
    // flights before it.
    const building: IAutoMovieMotionHumanPropFlight.IFlight[] | undefined =
      self.flying.get(subject);
    if (building !== undefined) return building;
    const prop: IAutoMovieMotionHumanProp | undefined = self.props.get(subject);
    if (prop === undefined) return [];
    const launches: IFlightsLaunchesItem[] = [];
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
    if (self.resolving && through < Infinity) filmEnd = through;
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
    return out;
  }

  /** Find the latest flight still displaying this prop at the given film second. */
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
   * Read two frames of one approach, without resweeping the placed flight at
   * the earlier sample.
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
   * A prop's world frame at a film second from its latest flight launched at or
   * after `since` (the latest grip's start, which a launch after it ends), or
   * undefined when no such flight has been launched by then.
   *
   * @param self The performance.
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param since Film second before which a launch is overtaken by a later
   *   grip.
   * @returns The frame, or undefined.
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
      // The action that took the staged hold names the refusal: a stageCatch,
      // or a production's own catch law. A capture grip is that hold's.
      const held: IAutoMovieMotionHumanSegment.IHeld =
        HumanPerformanceRead.person(self, grip.subject).holds.find(
          (h: IAutoMovieMotionHumanSegment.IHeld): boolean =>
            h.prop === subject && h.from === grip.from && h.capture === capture,
        )!;
      throw new HumanRefusal({
        kind: "reach",
        performer: grip.subject,
        act: held.source.name,
        axis: "ball",
        value: subject,
        reason: `the final flight misses the staged interception at ${grip.from} s`,
        fix: "align the published launch and fit the receiving hand on an unobstructed path",
      });
    }
  }

  /**
   * Fly one launch to its first contact and on, by the outcome its body's data
   * give.
   */
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

/** The record of `IFlightsLaunchesItem`'s site. */
type IFlightsLaunchesItem = {
  seconds: number;
  source: IAutoMovieMotionHumanPropFlight.IFlight["source"];
  launch: IAutoMovieMotionPropLaunch;
};
