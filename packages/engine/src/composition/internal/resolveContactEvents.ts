import type {
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

import { firstContactImpact } from "./firstContactImpact";
import { sampleContactWeapon } from "./sampleContactWeapon";

/*
 * The contacts of several moving weapons with several bodies that may each
 * carry one of those weapons, resolved together and in time order: who meets
 * what, and when.
 *
 * Every weapon is a sphere whose centre moves on its free path (the path it
 * takes until it meets something), or a capsule, a segment swept by that
 * radius, when it also gives the axis's other end: a shin, a forearm, any limb
 * segment that strikes along its length, so another body crossing the segment
 * between its ends is met, not passed between sparse points; a tapered
 * capsule's radius runs linearly from one end to the other, as a limb narrows
 * from one joint to the next. Every body is a signed distance at a second, from
 * a point and, for capsule weapons, from a segment (the least signed distance
 * over the segment's points). Both may depend on which weapons have already
 * stopped, because a stopped weapon changes the pose of the body that carries
 * it. The method is the event loop of impulse-based simulation (Mirtich 1996,
 * Impulse-based Dynamic Simulation of Rigid Body Systems, ch. 3) with
 * continuous collision detection for each candidate (Redon, Kheddar and
 * Coquillart 2002): find every moving weapon's first time of impact against the
 * bodies it does not belong to, stop only the earliest, and re-evaluate every
 * other weapon against the poses that stop produces, until no weapon meets
 * anything. Each first impact is found by a fixed-step scan of the signed gap
 * and a bracketed root search of the first crossing to a nanosecond
 * (`firstContactImpact`), so the result is deterministic; a contact
 * shorter than one step (a weapon and a body passing through each other within
 * it) is the scan's stated blind spot, so the step must stay below the time
 * either needs to cross the other's thickness. A weapon that states the span it
 * is live in (`from`, `to`) is scanned only on the scan's own steps that reach
 * into that span, since outside it the weapon meets nothing; the steps are the
 * same as a scan of the whole span, so the result is too, and a performance of
 * many strikes scans each strike over its own window instead of over the whole
 * performance. Since only the earliest impact is stopped, each round reads the
 * moving weapons' scans together, one grid step at a time and in the order the
 * weapons become live: the step at which a first scan finds a contact ends the
 * round, so no weapon is read past the earliest impact, and one that becomes
 * live after it cannot be earlier. Ties in time are broken by the weapons' ids,
 * and a weapon that touches the moment another stops is stopped at that same
 * second, so the result does not depend on the order the weapons are listed
 * in.
 *
 * A weapon may produce both endpoints together through `sample`; this replaces
 * its separate endpoint calls for that exact query. The declared presence of
 * `tail` still fixes its sphere or capsule kind. Samples are recomputed at
 * every query and after each committed stop, including when two events share
 * the same second.
 *
 * Initial penetration or touch is a contact. A body may explicitly certify that
 * this initial episode was resolved and is departing: either no new entry
 * occurs in this search, or a finite positive-gap witness precedes any new
 * entry. Only that pair is deferred until its witness; the scan clock, other
 * bodies and later entry remain unchanged. Unknown departure retains initial
 * reporting. The body's physical model owns this information because signed
 * distance alone cannot establish it.
 *
 * A contact is mutual. A weapon and the body that carries it are two measures
 * of one limb (a capsule and that body's signed distance), and they need not
 * agree to the millimetre, so of two limbs swung into each other one weapon
 * touches the other body before the other weapon touches back. When the part a
 * weapon meets carries a weapon of its own that is still moving (the body says
 * so through `carried`), that weapon stops at the same second against the
 * striker's body: neither limb is driven on into the one that has already
 * stopped on it.
 *
 * Weapons may be the capsules of one rigid part (`group`): an arm's upper arm,
 * forearm and fist. The part stops where any of its capsules first meets a
 * body, so once one stops, the others are scanned no more and give no event:
 * what they touch afterwards is the stopped part resting on the body it met,
 * not a second strike.
 *
 * This resolves simultaneous strikes consistently: two fists crossing each
 * other's arms, two shins meeting, a block that arrives first. It is a
 * kinematic resolution of contact times, not a force simulation.
 * Parameter input: The weapons, the bodies and the span.
 * Returns: The stops, in time order.
 * When the span or the step is not positive, the span or step
 * is not finite or the scan grid's step count over the span is not a safe
 * integer (a RangeError from the scan), a weapon id repeats, a weapon's live
 * span is not finite or ends before it begins, a tail radius is given without
 * a tail or is not a finite non-negative length, a sample changes its
 * declared sphere/capsule kind, a capsule weapon meets a body that measures
 * no segment, a departure witness is invalid, or a body names a carried
 * weapon that is not its own.
 */
export function resolveContactEvents(
  input: IAutoMovieResolveContactEvents.IInput,
): IAutoMovieResolveContactEvents.IEvent[] {
  if (!(input.to > input.from))
    throw new Error("A contact span ends after it begins");
  if (!(input.step > 0)) throw new Error("A contact scan step is positive");
  const ids: Set<string> = new Set();
  for (const w of input.weapons) {
    if (ids.has(w.id)) throw new Error(`Repeated contact weapon ${w.id}`);
    ids.add(w.id);
    if (w.from !== undefined && w.to !== undefined && w.to < w.from)
      throw new Error(
        `Contact weapon ${w.id} has a live span that ends before it begins`,
      );
    if (
      w.tailRadius !== undefined &&
      (w.tail === undefined || w.tailRadius < 0)
    )
      throw new Error(
        `Contact weapon ${w.id} has a tail radius without a tail, or one that is not a finite non-negative length`,
      );
  }
  const stopped: Map<string, number> = new Map();

  // Groups whose part has stopped: their remaining weapons meet nothing more,
  // and they are not added to the stops, which name only weapons that met.
  const halted: Set<string> = new Set();
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

    // The moving weapons' scans of this search, read together a grid step at
    // a time: every scan reads the same seconds, a contact found at a step
    // lies in the bracket that step closes, and a scan still clear there can
    // only meet something later. So the step at which the first scan finds a
    // contact ends the search for all, and no weapon is read past the
    // earliest contact. A weapon that becomes live after the earliest contact
    // found so far cannot be earlier, and is not read.
    const scans: IScanned[] = [];
    for (const weapon of weapons) {
      if (
        stopped.has(weapon.id) ||
        (weapon.group !== undefined && halted.has(weapon.group))
      )
        continue;
      if (best !== undefined && (weapon.from ?? -Infinity) > best.seconds)
        break;
      const scan: firstContactImpact.IScan =
        firstContactImpact.scan(
          weapon,
          input,
          stopped,
          Math.max(input.from, after),
        );
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
    const striker: IAutoMovieResolveContactEvents.IWeapon = weapons.find(
      (w: IAutoMovieResolveContactEvents.IWeapon): boolean =>
        w.id === best!.weapon,
    )!;
    const frame: IAutoMovieResolveContactEvents.IWeaponFrame | undefined =
      striker.sample === undefined
        ? undefined
        : sampleContactWeapon(striker, best.seconds, stopped);
    const p: IAutoMovieVector3 =
      frame === undefined
        ? striker.position(best.seconds, stopped)
        : frame.position;
    const own: string | undefined = input.bodies
      .find(
        (b: IAutoMovieResolveContactEvents.IBody): boolean =>
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
    const carried: IAutoMovieResolveContactEvents.IWeapon | undefined =
      weapons.find(
        (w: IAutoMovieResolveContactEvents.IWeapon): boolean =>
          w.id === own && w.owner === best!.against,
      );
    if (carried === undefined)
      throw new Error(`Body ${best.against} carries no contact weapon ${own}`);
    if (
      stopped.has(own) ||
      (carried.group !== undefined && halted.has(carried.group))
    )
      continue;
    stopped.set(own, best.seconds);
    events.push({ weapon: own, against: striker.owner, seconds: best.seconds });
    if (carried.group !== undefined) halted.add(carried.group);
  }
}

/*
 * One moving weapon with its scan of the current search.
 */
interface IScanned {
  /*
   * The weapon.
   */
  weapon: IAutoMovieResolveContactEvents.IWeapon;

  /*
   * Its scan.
   */
  scan: firstContactImpact.IScan;
}

/*
 * The earlier of the contact found so far and a weapon's own, when it has one:
 * the lesser second, then the lesser weapon id.
 */
function earlier(
  best: IAutoMovieResolveContactEvents.IEvent | undefined,
  weapon: IAutoMovieResolveContactEvents.IWeapon,
  hit: { against: string; seconds: number } | undefined,
): IAutoMovieResolveContactEvents.IEvent | undefined {
  return hit !== undefined &&
    (best === undefined ||
      hit.seconds < best.seconds ||
      (hit.seconds === best.seconds && weapon.id < best.weapon))
    ? { weapon: weapon.id, ...hit }
    : best;
}
