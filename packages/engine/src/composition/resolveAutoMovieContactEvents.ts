import type { IAutoMovieResolveContactEvents, IAutoMovieVector3 } from "@automovie/interface";


import { firstAutoMovieContactImpact } from "./firstAutoMovieContactImpact";

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
 * Each first impact is found by a fixed-step scan of the signed gap and 24
 * bisections of the first crossing, so the result is deterministic; a
 * contact shorter than one step (a weapon and a body passing through each
 * other within it) is the scan's stated blind spot, so the step must stay
 * below the time either needs to cross the other's thickness. A weapon
 * that states the span it is live in (`from`, `to`) is scanned only on the
 * scan's own steps that reach into that span, since outside it the weapon
 * meets nothing; the steps are the same as a scan of the whole span, so the
 * result is too, and a performance of many strikes scans each strike over
 * its own window instead of over the whole performance. Since only the
 * earliest impact is stopped, each round scans the weapons in the order
 * they become live and no weapon past the earliest impact found so far: one
 * that becomes live after it cannot be earlier. Ties in
 * time are broken by the weapons' ids, and a weapon that touches the moment
 * another stops is stopped at that same second, so the result does not
 * depend on the order the weapons are listed in.
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
 * This resolves simultaneous strikes consistently: two fists crossing each
 * other's arms, two shins meeting, a block that arrives first. It is a
 * kinematic resolution of contact times, not a force simulation.
 *
 * @param input The weapons, the bodies and the span.
 * @returns The stops, in time order.
 * @throws {Error} When the span or the step is not positive, a weapon id repeats, a weapon's live span is not finite or ends before it begins, a tail radius is given without a tail or is not a finite non-negative length, a capsule weapon meets a body that measures no segment, a departure witness is invalid, or a body names a carried weapon that is not its own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, its determinism, its tie rule and what it does not model.
 * @evidence contracts/development/implementation.md#principled-implementation The time-ordered event loop of impulse-based simulation over continuous first-impact times.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop orders events; firstAutoMovieContactImpact owns the single first-impact search, pair distances and departure admission.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid spans, steps and repeated ids throw, and a capsule weapon is never reduced to its end points when a body cannot measure a segment: that throws. Initial overlap remains a contact unless explicit physical departure is certified; a witness must have finite positive actual clearance. No clock nudge or permanent collider exclusion is used.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each event re-scans the remaining weapons, each over samples inside its own live span and no later than the earliest impact already found. Each initially contacting pair may additionally invoke its physical departure model once and validate one witness. Sequential strikes avoid scanning every weapon over the whole performance after every event.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All sphere/capsule/tapered pair measurements and first-impact scans share firstAutoMovieContactImpact; stop-dependent certificates are rebuilt for each search rather than reused after the pose changes.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function resolveAutoMovieContactEvents(
  input: IAutoMovieResolveContactEvents.IInput,
): IAutoMovieResolveContactEvents.IEvent[] {
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
  const events: IAutoMovieResolveContactEvents.IEvent[] = [];
  // In the order the weapons become live, so the earliest impact is found
  // early and bounds the scans after it; ties in time go to the lesser id.
  const weapons: IAutoMovieResolveContactEvents.IWeapon[] = [
    ...input.weapons,
  ].sort(
    (
      a: IAutoMovieResolveContactEvents.IWeapon,
      b: IAutoMovieResolveContactEvents.IWeapon,
    ): number =>
      (a.from ?? -Infinity) - (b.from ?? -Infinity) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  for (;;) {
    let best: IAutoMovieResolveContactEvents.IEvent | undefined;
    const after: number = events.at(-1)?.seconds ?? input.from;
    for (const weapon of weapons) {
      if (stopped.has(weapon.id)) continue;
      if (best !== undefined && (weapon.from ?? -Infinity) > best.seconds)
        break;
      const hit: { against: string; seconds: number } | undefined =
        firstAutoMovieContactImpact(
          weapon,
          input,
          stopped,
          Math.max(input.from, after),
          best?.seconds ?? Infinity,
        );
      if (
        hit !== undefined &&
        (best === undefined ||
          hit.seconds < best.seconds ||
          (hit.seconds === best.seconds && weapon.id < best.weapon))
      )
        best = { weapon: weapon.id, ...hit };
    }
    if (best === undefined) return events;

    // The contact is mutual: when the part met carries a weapon of its own
    // that is still moving, that weapon has met the striker in the same
    // touch and stops at the same second.
    const striker: IAutoMovieResolveContactEvents.IWeapon = weapons.find(
      (w: IAutoMovieResolveContactEvents.IWeapon): boolean =>
        w.id === best!.weapon,
    )!;
    const p: IAutoMovieVector3 = striker.position(best.seconds, stopped);
    const own: string | undefined = input.bodies
      .find(
        (b: IAutoMovieResolveContactEvents.IBody): boolean =>
          b.id === best!.against,
      )
      ?.carried?.(
        p,
        striker.tail?.(best.seconds, stopped) ?? p,
        best.seconds,
        stopped,
        striker.owner,
      );
    stopped.set(best.weapon, best.seconds);
    events.push(best);
    if (own === undefined) continue;
    if (
      !weapons.some(
        (w: IAutoMovieResolveContactEvents.IWeapon): boolean =>
          w.id === own && w.owner === best!.against,
      )
    )
      throw new Error(`Body ${best.against} carries no contact weapon ${own}`);
    if (stopped.has(own)) continue;
    stopped.set(own, best.seconds);
    events.push({ weapon: own, against: striker.owner, seconds: best.seconds });
  }
}
