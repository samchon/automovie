import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The contacts of several moving weapons with several bodies that may each
 * carry one of those weapons, resolved together and in time order: who
 * meets what, and when.
 *
 * Every weapon is a sphere whose centre moves on its free path (the path it
 * takes until it meets something), or a capsule, a segment swept by that
 * radius, when it also gives the axis's other end: a shin, a forearm, any
 * limb segment that strikes along its length, so another body crossing the
 * segment between its ends is met, not passed between sparse points. Every
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
 * Each first impact is found by a fixed-step scan of the signed gap and 24
 * bisections of the first crossing, so the result is deterministic; a
 * contact shorter than one step (a weapon and a body passing through each
 * other within it) is the scan's stated blind spot, so the step must stay
 * below the time either needs to cross the other's thickness. Ties in
 * time are broken by the weapons' ids, and a weapon that touches the moment
 * another stops is stopped at that same second, so the result does not
 * depend on the order the weapons are listed in.
 *
 * This resolves simultaneous strikes consistently: two fists crossing each
 * other's arms, two shins meeting, a block that arrives first. It is a
 * kinematic resolution of contact times, not a force simulation.
 *
 * @param input The weapons, the bodies and the span.
 * @returns The stops, in time order.
 * @throws {Error} When the span or the step is not positive, a weapon id repeats, or a capsule weapon meets a body that measures no segment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, its determinism, its tie rule and what it does not model.
 * @evidence contracts/development/implementation.md#principled-implementation The time-ordered event loop of impulse-based simulation over continuous first-impact times.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over events and one first-impact search.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid spans, steps and repeated ids throw, and a capsule weapon is never reduced to its end points when a body cannot measure a segment: that throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each event re-scans the remaining weapons: quadratic in weapons times the scan's samples, for the handful of weapons one exchange holds.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input; callers memoise.
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
  }
  const stopped: Map<string, number> = new Map();
  const events: resolveAutoMovieContactEvents.IEvent[] = [];
  const weapons = [...input.weapons].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  for (;;) {
    let best: resolveAutoMovieContactEvents.IEvent | undefined;
    const after: number = events.at(-1)?.seconds ?? input.from;
    for (const weapon of weapons) {
      if (stopped.has(weapon.id)) continue;
      const hit = firstImpact(
        weapon,
        input,
        stopped,
        Math.max(input.from, after),
      );
      if (
        hit !== undefined &&
        (best === undefined || hit.seconds < best.seconds)
      )
        best = { weapon: weapon.id, ...hit };
    }
    if (best === undefined) return events;
    stopped.set(best.weapon, best.seconds);
    events.push(best);
  }
}

/**
 * Companion types of {@link resolveAutoMovieContactEvents}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation Weapons are moving spheres or capsules (an optional axis end), bodies signed distances from a point and optionally from a segment, both functions of seconds and of the stops so far.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What callers provide and read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
 */
export namespace resolveAutoMovieContactEvents {
  /** The stops so far: each stopped weapon's id with its contact second. */
  export type IStops = ReadonlyMap<string, number>;

  /** One moving weapon. */
  export interface IWeapon {
    /** Unique id. */
    id: string;

    /** The body carrying it, whose own distance it ignores. */
    owner: string;

    /** The sphere's radius, metres. */
    radius: number;

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
  }

  /** One body the weapons may meet. */
  export interface IBody {
    /** Its id, matching the `owner` of the weapons it carries. */
    id: string;

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
     *
     * @param a The segment's first end, world metres.
     * @param b Its other end, world metres.
     * @param seconds Seconds.
     * @param stops The stops so far.
     * @returns Metres.
     */
    axis?(
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      seconds: number,
      stops: IStops,
    ): number;
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

/** A weapon's first impact from a second on, against the bodies it does not belong to. */
function firstImpact(
  weapon: resolveAutoMovieContactEvents.IWeapon,
  input: resolveAutoMovieContactEvents.IInput,
  stops: resolveAutoMovieContactEvents.IStops,
  from: number,
): { against: string; seconds: number } | undefined {
  const gap = (t: number): { distance: number; against: string } => {
    const p: IAutoMovieVector3 = weapon.position(t, stops);
    const q: IAutoMovieVector3 | undefined = weapon.tail?.(t, stops);
    let best: { distance: number; against: string } = {
      distance: Infinity,
      against: "",
    };
    for (const body of input.bodies) {
      if (body.id === weapon.owner) continue;

      // A capsule is measured along its whole axis; a body that cannot
      // measure a segment would see only its ends, the tunnelling this
      // representation exists to remove.
      if (q !== undefined && body.axis === undefined)
        throw new Error(
          `Body ${body.id} measures no segment for capsule weapon ${weapon.id}`,
        );
      const d: number =
        (q === undefined
          ? body.distance(p, t, stops)
          : body.axis!(p, q, t, stops)) - weapon.radius;
      if (d < best.distance) best = { distance: d, against: body.id };
    }
    return best;
  };
  const start = gap(from);
  if (start.distance <= 0) return { against: start.against, seconds: from };
  let previous: number = from;
  for (let k: number = 1; ; k++) {
    const t: number = Math.min(input.to, from + k * input.step);
    if (gap(t).distance <= 0) {
      let lo: number = previous;
      let hi: number = t;
      for (let i: number = 0; i < 24; i++) {
        const mid: number = (lo + hi) / 2;
        if (gap(mid).distance <= 0) hi = mid;
        else lo = mid;
      }
      return { against: gap(hi).against, seconds: hi };
    }
    if (t >= input.to) return undefined;
    previous = t;
  }
}
