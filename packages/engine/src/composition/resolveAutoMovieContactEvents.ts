import type { IAutoMovieVector3 } from "@automovie/interface";

import { firstAutoMovieContactImpact } from "./firstAutoMovieContactImpact";
import { sampleAutoMovieContactWeapon } from "./sampleAutoMovieContactWeapon";

/**
 * The contacts of several moving weapons with several bodies that may each
 * carry one of those weapons, resolved together and in time order: who
 * meets what, and when.
 *
 * Every weapon is a sphere whose centre moves on its free path (the path it
 * takes until it meets something), or a capsule, a segment swept by that
 * radius, when it also gives the axis's other end: a shin, a forearm, any
 * limb segment that strikes along its length, so another body crossing the
 * segment between its ends is met, not passed between sparse points; a
 * tapered capsule's radius runs linearly from one end to the other, as a
 * limb narrows from one joint to the next. Every
 * body is a signed distance at a second, from a point and, for capsule
 * weapons, from a segment (the least signed distance over the segment's
 * points). Both may depend on which weapons have already stopped, because a
 * stopped weapon changes the pose of the body that carries it. The method is
 * the event loop of impulse-based simulation (Mirtich 1996, Impulse-based
 * Dynamic Simulation of Rigid Body Systems, ch. 3) with continuous collision
 * detection for each candidate (Redon, Kheddar and Coquillart 2002): find
 * every moving weapon's first time of impact against the bodies it does not
 * belong to, stop only the earliest, and re-evaluate every other weapon
 * against the poses that stop produces, until no weapon meets anything.
 * Each first impact is found by a fixed-step scan of the signed gap and a
 * bracketed root search of the first crossing to a nanosecond
 * (`firstAutoMovieContactImpact`), so the result is deterministic; a
 * contact shorter than one step (a weapon and a body passing through each
 * other within it) is the scan's stated blind spot, so the step must stay
 * below the time either needs to cross the other's thickness. A weapon
 * that states the span it is live in (`from`, `to`) is scanned only on the
 * scan's own steps that reach into that span, since outside it the weapon
 * meets nothing; the steps are the same as a scan of the whole span, so the
 * result is too, and a performance of many strikes scans each strike over
 * its own window instead of over the whole performance. Since only the
 * earliest impact is stopped, each round reads the moving weapons' scans
 * together, one grid step at a time and in the order the weapons become
 * live: the step at which a first scan finds a contact ends the round, so
 * no weapon is read past the earliest impact, and one that becomes live
 * after it cannot be earlier. Ties in
 * time are broken by the weapons' ids, and a weapon that touches the moment
 * another stops is stopped at that same second, so the result does not
 * depend on the order the weapons are listed in.
 *
 * A weapon may produce both endpoints together through `sample`; this
 * replaces its separate endpoint calls for that exact query. The declared
 * presence of `tail` still fixes its sphere or capsule kind. Samples are
 * recomputed at every query and after each committed stop, including when
 * two events share the same second.
 *
 * Initial penetration or touch is a contact. A body may explicitly certify
 * that this initial episode was resolved and is departing: either no new
 * entry occurs in this search, or a finite positive-gap witness precedes any
 * new entry. Only that pair is deferred until its witness; the scan clock,
 * other bodies and later entry remain unchanged. Unknown departure retains
 * initial reporting. The body's physical model owns this information because
 * signed distance alone cannot establish it.
 *
 * A contact is mutual. A weapon and the body that carries it are two
 * measures of one limb (a capsule and that body's signed distance), and they
 * need not agree to the millimetre, so of two limbs swung into each other
 * one weapon touches the other body before the other weapon touches back.
 * When the part a weapon meets carries a weapon of its own that is still
 * moving (the body says so through `carried`), that weapon stops at the same
 * second against the striker's body: neither limb is driven on into the one
 * that has already stopped on it.
 *
 * Weapons may be the capsules of one rigid part (`group`): an arm's upper
 * arm, forearm and fist. The part stops where any of its capsules first
 * meets a body, so once one stops, the others are scanned no more and give
 * no event: what they touch afterwards is the stopped part resting on the
 * body it met, not a second strike.
 *
 * This resolves simultaneous strikes consistently: two fists crossing each
 * other's arms, two shins meeting, a block that arrives first. It is a
 * kinematic resolution of contact times, not a force simulation.
 *
 * @param input The weapons, the bodies and the span.
 * @returns The stops, in time order.
 * @throws {Error} When the span or the step is not positive, a weapon id repeats, a weapon's live span is not finite or ends before it begins, a tail radius is given without a tail or is not a finite non-negative length, a sample changes its declared sphere/capsule kind, a capsule weapon meets a body that measures no segment, a departure witness is invalid, or a body names a carried weapon that is not its own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, its determinism, its tie rule, the rigid-part group rule and what it does not model.
 * @evidence contracts/development/implementation.md#principled-implementation The time-ordered event loop of impulse-based simulation over continuous first-impact times.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop orders events; firstAutoMovieContactImpact owns the single first-impact scan, pair distances and departure admission, and each round reads the weapons' scans in step. sampleAutoMovieContactWeapon owns optional combined endpoint production for the scan and mutual-contact queries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid spans, steps and repeated ids throw, and a capsule weapon is never reduced to its end points when a body cannot measure a segment: that throws. Initial overlap remains a contact unless explicit physical departure is certified; a witness must have finite positive actual clearance. No clock nudge or permanent collider exclusion is used.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each event re-scans the remaining weapons, each over samples inside its own live span, all a grid step at a time, so that no weapon is sampled past the step in which the round's earliest impact is found; the other weapons of a stopped group are not scanned again. Each initially contacting pair may additionally invoke its physical departure model once and validate one witness. Sequential strikes avoid scanning every weapon over the whole performance after every event.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All sphere/capsule/tapered pair measurements and first-impact scans share firstAutoMovieContactImpact; stop-dependent certificates are rebuilt for each search rather than reused after the pose changes. Combined endpoints share only one actual producer invocation within a query, with no time or stop-state cache. Legacy mutual-contact tail demand remains conditional on a carried query.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function resolveAutoMovieContactEvents(
  input: resolveAutoMovieContactEvents.IInput,
): resolveAutoMovieContactEvents.IEvent[] {
  if (!(input.to > input.from))
    throw new Error("A contact span ends after it begins");
  if (!(input.step > 0)) throw new Error("A contact scan step is positive");
  const ids: Set<string> = new Set();
  for (const w of input.weapons) {
    if (ids.has(w.id)) throw new Error(`Repeated contact weapon ${w.id}`);
    ids.add(w.id);
    if (
      (w.from !== undefined && !Number.isFinite(w.from)) ||
      (w.to !== undefined && !Number.isFinite(w.to)) ||
      (w.from !== undefined && w.to !== undefined && w.to < w.from)
    )
      throw new Error(
        `Contact weapon ${w.id} has a live span that is not finite or ends before it begins`,
      );
    if (
      w.tailRadius !== undefined &&
      (w.tail === undefined ||
        !Number.isFinite(w.tailRadius) ||
        w.tailRadius < 0)
    )
      throw new Error(
        `Contact weapon ${w.id} has a tail radius without a tail, or one that is not a finite non-negative length`,
      );
  }
  const stopped: Map<string, number> = new Map();

  // Groups whose part has stopped: their remaining weapons meet nothing more,
  // and they are not added to the stops, which name only weapons that met.
  const halted: Set<string> = new Set();
  const events: resolveAutoMovieContactEvents.IEvent[] = [];
  // In the order the weapons become live, so the earliest impact is found
  // early and bounds the scans after it; ties in time go to the lesser id.
  const weapons: resolveAutoMovieContactEvents.IWeapon[] = [
    ...input.weapons,
  ].sort(
    (
      a: resolveAutoMovieContactEvents.IWeapon,
      b: resolveAutoMovieContactEvents.IWeapon,
    ): number =>
      (a.from ?? -Infinity) - (b.from ?? -Infinity) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  for (;;) {
    let best: resolveAutoMovieContactEvents.IEvent | undefined;
    const after: number = events.at(-1)?.seconds ?? input.from;

    // The moving weapons' scans of this search, read together a grid step at
    // a time: every scan reads the same seconds, a contact found at a step
    // lies in the bracket that step closes, and a scan still clear there can
    // only meet something later. So the step at which the first scan finds a
    // contact ends the search for all, and no weapon is read past the
    // earliest contact. A weapon that becomes live after the earliest contact
    // found so far cannot be earlier, and is not read.
    const scans: IScanned[] = [];
    for (const weapon of weapons) {
      if (stopped.has(weapon.id) || (weapon.group !== undefined && halted.has(weapon.group)))
        continue;
      if (best !== undefined && (weapon.from ?? -Infinity) > best.seconds)
        break;
      const scan: firstAutoMovieContactImpact.IScan =
        firstAutoMovieContactImpact.scan(weapon, input, stopped, Math.max(input.from, after));
      scans.push({ weapon, scan });
      best = earlier(best, weapon, scan.start());
    }
    while (best === undefined) {
      let step: number = Infinity;
      for (const { scan } of scans) step = Math.min(step, scan.step());
      if (step === Infinity) break;
      for (const { weapon, scan } of scans) {
        if (best !== undefined && (weapon.from ?? -Infinity) > best.seconds)
          break;
        if (scan.step() === step) best = earlier(best, weapon, scan.advance());
      }
    }
    if (best === undefined) return events;

    // The contact is mutual: when the part met carries a weapon of its own
    // that is still moving, that weapon has met the striker in the same
    // touch and stops at the same second.
    const striker: resolveAutoMovieContactEvents.IWeapon = weapons.find(
      (w: resolveAutoMovieContactEvents.IWeapon): boolean =>
        w.id === best!.weapon,
    )!;
    const frame: resolveAutoMovieContactEvents.IWeaponFrame | undefined =
      striker.sample === undefined
        ? undefined
        : sampleAutoMovieContactWeapon(striker, best.seconds, stopped);
    const p: IAutoMovieVector3 =
      frame === undefined
        ? striker.position(best.seconds, stopped)
        : frame.position;
    const own: string | undefined = input.bodies
      .find(
        (b: resolveAutoMovieContactEvents.IBody): boolean =>
          b.id === best!.against,
      )
      ?.carried?.(
        p,
        frame === undefined
          ? (striker.tail?.(best.seconds, stopped) ?? p)
          : (frame.tail ?? p),
        best.seconds,
        stopped,
        striker.owner,
      );
    stopped.set(best.weapon, best.seconds);
    events.push(best);
    if (striker.group !== undefined) halted.add(striker.group);
    if (own === undefined) continue;
    const carried: resolveAutoMovieContactEvents.IWeapon | undefined = weapons.find(
      (w: resolveAutoMovieContactEvents.IWeapon): boolean =>
        w.id === own && w.owner === best!.against,
    );
    if (carried === undefined)
      throw new Error(`Body ${best.against} carries no contact weapon ${own}`);
    if (stopped.has(own) || (carried.group !== undefined && halted.has(carried.group)))
      continue;
    stopped.set(own, best.seconds);
    events.push({ weapon: own, against: striker.owner, seconds: best.seconds });
    if (carried.group !== undefined) halted.add(carried.group);
  }
}

/** One moving weapon with its scan of the current search. */
interface IScanned {
  /** The weapon. */
  weapon: resolveAutoMovieContactEvents.IWeapon;

  /** Its scan. */
  scan: firstAutoMovieContactImpact.IScan;
}

/** The earlier of the contact found so far and a weapon's own, when it has one: the lesser second, then the lesser weapon id. */
function earlier(
  best: resolveAutoMovieContactEvents.IEvent | undefined,
  weapon: resolveAutoMovieContactEvents.IWeapon,
  hit: { against: string; seconds: number } | undefined,
): resolveAutoMovieContactEvents.IEvent | undefined {
  return hit !== undefined &&
    (best === undefined ||
      hit.seconds < best.seconds ||
      (hit.seconds === best.seconds && weapon.id < best.weapon))
    ? { weapon: weapon.id, ...hit }
    : best;
}

/**
 * Companion types of {@link resolveAutoMovieContactEvents}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation Weapons are moving spheres or capsules (an optional axis end, and an optional radius there for a tapered one), bodies signed distances from a point and optionally from a segment, both functions of seconds and of the stops so far. A combined frame carries actual world-metre endpoints from one exact query; the endpoint reader validates agreement with the declared sphere/capsule kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Resolver-owned inputs, events and actual weapon frames serve the first-impact scan, departure witnesses, mutual-contact query and Motion's combined endpoint producers. The optional sampler replaces existing endpoint computations without exposing cache metadata.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector. The optional frame tail expresses the existing sphere/capsule alternatives, and a runtime kind check prevents a sampler from changing that declaration.
 */
export namespace resolveAutoMovieContactEvents {
  /** The stops so far: each stopped weapon's id with its contact second. */
  export type IStops = ReadonlyMap<string, number>;

  /** Actual geometry for one exact second and current stop context; never a retained time-cache entry. */
  export interface IWeaponFrame {
    /** Sphere centre or capsule axis's first end, world metres. */
    position: IAutoMovieVector3;

    /** Capsule axis's other end, world metres; absent exactly when the declared weapon has no tail. */
    tail?: IAutoMovieVector3;
  }

  /** Actual initial pair state, with an ungated reader of its signed gap. */
  export interface IInitialContact {
    /** The sphere or capsule whose already-present contact is being classified. */
    weapon: IWeapon;

    /** Initial search second, in the weapon's clock. */
    from: number;

    /** Search end, clipped to the weapon's live end. */
    to: number;

    /** Current stops, unchanged during this first-impact search. */
    stops: IStops;

    /** Measured initial pair gap, metres; zero or negative. */
    gap: number;

    /** Actual pair gap at a second, before departure eligibility is applied. */
    at(seconds: number): number;
  }

  /** Physical knowledge of this initial episode; absence keeps initial reporting. */
  export type Departure =
    | {
        /** No new entry occurs before this genuinely separated instant. */
        kind: "clearance";

        /** Strictly later in-span second whose actual pair gap is positive. */
        seconds: number;
      }
    | {
        /** The physical model rules out a new entry over this search span. */
        kind: "no-entry";
      };

  /** One moving weapon. */
  export interface IWeapon {
    /** Unique id. */
    id: string;

    /** The body carrying it, whose own distance it ignores. */
    owner: string;

    /** The sphere's radius, metres; a capsule's radius at `position`. */
    radius: number;

    /**
     * A tapered capsule's radius at `tail`, metres: the capsule then narrows
     * (or widens) linearly from `radius` at `position` to this, the round
     * cone of a limb whose girth changes from one joint to the next. Absent
     * for a sphere and for a capsule of one radius.
     */
    tailRadius?: number;

    /** When the weapon starts to be live, seconds, finite; it meets nothing before, whatever its path says. The span's start when absent. */
    from?: number;

    /** When it stops being live, seconds, finite and not before `from`; it meets nothing after, whatever its path says. The span's end when absent. */
    to?: number;

    /**
     * The rigid part this weapon is one capsule of, such as the three
     * capsules of one striking arm: when any weapon of a group stops, the
     * part stops as a whole, so the group's other weapons meet nothing after
     * that second and produce no event of their own. Absent, the weapon stops
     * alone.
     */
    group?: string;

    /**
     * The sphere's centre on its free path at a second, world metres.
     *
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns The centre.
     */
    position(seconds: number, stops: IStops): IAutoMovieVector3;

    /**
     * The other end of a capsule weapon's axis on its free path at a second,
     * world metres; absent for a sphere. The weapon is then every point of
     * the segment from `position` to `tail` swept by `radius`.
     *
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns The axis's other end.
     */
    tail?(seconds: number, stops: IStops): IAutoMovieVector3;

    /**
     * Produce the actual endpoints together for this exact second and current
     * stops. When present, replaces position and tail calls for a geometry
     * query; tail presence must agree with the weapon's declared kind. The
     * resolver retains no sample across queries or changes to stops.
     */
    sample?(seconds: number, stops: IStops): IWeaponFrame;
  }

  /** One body the weapons may meet. */
  export interface IBody {
    /** Its id, matching the `owner` of the weapons it carries. */
    id: string;

    /**
     * Certify departure of an already-present pair only when its physical
     * model establishes that phase. A clearance must have no new entry before
     * it; no-entry covers only this search span. Undefined or absent keeps
     * the original initial overlap/touch report. Opaque distance samples alone
     * do not justify a certificate. The resolver validates clearance against
     * at(seconds), and every other body keeps its original eligibility.
     */
    departure?(contact: IInitialContact): Departure | undefined;

    /**
     * The signed distance from a point to the body's surface at a second,
     * metres: positive outside.
     *
     * @param point World metres.
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns Metres.
     */
    distance(point: IAutoMovieVector3, seconds: number, stops: IStops): number;

    /**
     * The signed distance from a segment to the body's surface at a second,
     * metres: the least signed distance over the segment's points, positive
     * when the whole segment is outside. Required to meet capsule weapons.
     * Given a taper, the segment is widened by a radius running linearly
     * from its first end's to its other end's, and the distance is that
     * tapered capsule's: the least over its points of the distance less the
     * radius there.
     *
     * @param a The segment's first end, world metres.
     * @param b Its other end, world metres.
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @param taper The radii at `a` and at `b`, metres, for a tapered capsule weapon.
     * @returns Metres.
     */
    axis?(
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
      stops: IStops,
      taper?: readonly [number, number],
    ): number;

    /**
     * The body's own weapon carried by the part a striking weapon met, when
     * that weapon is still on its free path at the second: the contact is
     * mutual, so it stops with the striker. Absent, or undefined, when the
     * part met carries none.
     *
     * @param a The striking weapon's centre, or its axis's first end, world metres.
     * @param b The axis's other end; the centre again for a sphere.
     * @param seconds The contact second.
     * @param stops The stops before this contact.
     * @param by The id of the body carrying the striking weapon.
     * @returns The id of one of this body's weapons, or undefined.
     */
    carried?(
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
      stops: IStops,
      by: string,
    ): string | undefined;
  }

  /** The input. */
  export interface IInput {
    /** The weapons. */
    weapons: readonly IWeapon[];

    /** The bodies. */
    bodies: readonly IBody[];

    /** Span start, seconds. */
    from: number;

    /** Span end, seconds. */
    to: number;

    /** Scan step, seconds; positive. */
    step: number;
  }

  /** One stop. */
  export interface IEvent {
    /** The weapon that stopped. */
    weapon: string;

    /** The body it met. */
    against: string;

    /** The contact second. */
    seconds: number;
  }
}
