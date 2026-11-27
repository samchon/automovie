import { AutoMovieEngineCompositionContact } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionWeaponContact,
  IAutoMovieMotionWeaponPath,
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { StrikingWeapon } from "../../striking/internal/StrikingWeapon";
import { HumanPerformanceContactBodies } from "./HumanPerformanceContactBodies";
import { HumanPerformanceContactSpeed } from "./HumanPerformanceContactSpeed";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanSegment } from "./HumanSegment";
import { prepareHumanPerformancePlans } from "./prepareHumanPerformancePlans";

/*
 * What the placed performance does to itself: the holds a grip starts and an
 * action takes over or ends, and the contacts between people resolved into the
 * stops and reactions of those they land on.
 */
export namespace HumanPerformanceContacts {
  /*
   * The contact scan's step, seconds: a 120th, so a strike of at most a few
   * metres a second moves a few centimetres between samples.
   */
  export const STEP: number = 1 / 120;

  /*
   * Settle what a newly planned action does to the props its performer holds,
   * whether it carries the body or rides a carrier: a grip window on a held
   * prop takes that hand over from the hold, any other use of a holding hand is
   * refused, and the props the action leaves held become holds of its own.
   */
  export function hold(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    riding: boolean,
  ): void {
    const plan: IAutoMovieMotionHumanActionPlan = segment.plan;
    for (const held of person.holds) {
      if (held.until !== Infinity) continue;
      const take:
        | IAutoMovieMotionHumanActionPlan["contacts"][number]
        | undefined = plan.contacts.find(
        (c: IAutoMovieMotionHumanActionPlan["contacts"][number]): boolean =>
          c.part === `${held.side}Hand` &&
          c.kind === "grip" &&
          c.support.kind === "prop" &&
          c.support.carries !== false &&
          c.support.subject === held.prop &&
          segment.start + c.from * plan.duration <= segment.end + 1e-9 &&
          segment.start + c.to * plan.duration >= segment.entryTime - 1e-9,
      );
      if (take !== undefined) {
        held.until = Math.max(
          held.from,
          segment.entryTime,
          segment.start + take.from * plan.duration,
        );
        // A closed hold names the action that took it over, for cut rollback.
        held.takenBy = segment.entry;
        if (riding) held.riding = true;
      } else if (HumanSegment.drives(plan, held.side))
        throw new AutoMovieMotionHumanRefusal({
          kind: "affordance",
          axis: "hand",
          value: held.side,
          feasible: {
            kind: "alternatives",
            values: person.holds.some(
              (h: IAutoMovieMotionHumanSegment.IHeld): boolean =>
                h.until === Infinity && h.side !== held.side,
            )
              ? []
              : [held.side === "left" ? "right" : "left"],
          },
          reason: `${segment.name} needs the ${held.side} hand, which holds ${held.prop} since ${held.source.name} (${held.source.id})`,
          fix: `put ${held.prop} down or hand it over first, or perform ${segment.name} with the free hand`,
        });
    }
    for (const hold of plan.holds ?? []) {
      const from: number = segment.start + hold.from * plan.duration;
      if (
        from > segment.end + 1e-9 ||
        (hold.capture !== undefined && from < segment.entryTime - 1e-9)
      )
        continue;
      person.holds.push({
        side: hold.side,
        prop: hold.prop,
        fingers: hold.fingers ?? {},
        source: segment,
        ...(hold.use === undefined ? {} : { use: hold.use }),
        from,
        ...(hold.capture === undefined ? {} : { capture: hold.capture }),
        until: Infinity,
      });
    }
  }

  /*
   * Roll back holds and takeovers in the part of an action removed by a cut.
   * Parameter person: The performer whose action was cut.
   * Parameter entry: The cut action's schedule index.
   * Parameter end: The inclusive film second where that action now ends.
   */
  export function cutHolds(
    person: IAutoMovieMotionHumanSegment.IPerson,
    entry: number,
    end: number,
  ): void {
    let next: number = 0;
    for (const held of person.holds) {
      if (held.source.entry === entry && held.from > end + 1e-9) continue;
      if (held.until > end + 1e-9 && held.takenBy === entry) {
        held.until = Infinity;
        delete held.riding;
        delete held.takenBy;
      }
      person.holds[next++] = held;
    }
    person.holds.length = next;
  }

  /*
   * Resolve every weapon's first contact at once, in time order, each later
   * weapon seeing the earlier stops as they will be shown: a plan that takes
   * its stops is handed each one as it is committed and settled, so its own
   * dwell and recoil are what later weapons meet; a plan that does not is shown
   * with that limb frozen at the stop. Weapons are live only inside their
   * window clipped to their action's span, which they declare, so each is
   * scanned over that window alone; bodies are the other people's colliders,
   * and the person a stop met is the nearest of them. A contact is mutual: when
   * the limb a weapon meets is striking too, its capsule nearest the striker
   * stops at the same second. The capsules on one limb of one action are one
   * part (the engine's weapon `group`): the first of them to meet a body stops
   * the limb, and the others give no stop or hit of their own, as a striking
   * law keeps only its chain's first contact. Each weapon states its bound on a
   * search's grid from its own path and each person 0 where its shown pose
   * provably holds still (`HumanPerformanceContactSpeed`, `HumanSegmentStill`),
   * so the scan reads no grid second a clear gap rules out.
   */
  export function contacts(self: IAutoMovieMotionHumanPerformanceState): void {
    const weapons: IAutoMovieResolveContactEvents.IWeapon[] = [];
    const owners: Map<string, HumanPerformanceContactBodies.IOwner> = new Map();
    const far: IAutoMovieVector3 = { x: 1e6, y: 1e6, z: 1e6 };
    let from: number = Infinity;
    let to: number = -Infinity;

    // Under one installed set of stops a weapon's axis is a pure function of
    // the second, as a person's bones are: the grid bound's reads and the
    // scan's share each, and the capsules of one limb of one action share
    // their chain's evaluation. `apply` clears this with the bones.
    const limbs: Map<string, ILimbsItemEntry[]> = new Map();
    const axes: Map<
      number,
      Map<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis>
    > = new Map();
    const axis = (
      weapon: IAutoMovieMotionWeaponPath,
      limb: string,
      t: number,
    ): StrikingWeapon.IAxis => {
      let known:
        | Map<IAutoMovieMotionWeaponPath, StrikingWeapon.IAxis>
        | undefined = axes.get(t);
      if (known === undefined) {
        known = new Map();
        axes.set(t, known);
      }
      const found: StrikingWeapon.IAxis | undefined = known.get(weapon);
      if (found !== undefined) return found;
      const live: IAutoMovieMotionWeaponPath[] = limbs
        .get(limb)!
        .filter((w: IAxisLiveW): boolean => !(t < w.from || t > w.to))
        .map((w: IAxisLiveW2): IAutoMovieMotionWeaponPath => w.weapon);
      for (const [w, a] of StrikingWeapon.sample(live, t)) known.set(w, a);
      return known.get(weapon)!;
    };
    for (const person of self.people.values())
      for (const segment of person.segments)
        for (const w of segment.plan.weapons ?? []) {
          const a: number = Math.max(w.from, segment.entryTime);
          const b: number = Math.min(w.to, segment.end);
          if (!(b > a)) continue;
          const key: string = `${person.performer.subject}|${HumanSegment.weapon(segment, w.id)}`;
          owners.set(key, {
            person,
            segment,
            id: w.id,
            limb: w.limb,
            from: a,
            to: b,
            weapon: w,
          });
          const tail = w.tail;
          const group: string = `${person.performer.subject}|${segment.index}:${w.limb}`;
          const siblings: IContactsSiblingsItem[] = limbs.get(group) ?? [];
          siblings.push({ weapon: w, from: a, to: b });
          limbs.set(group, siblings);
          weapons.push({
            id: key,
            owner: person.performer.subject,

            // A stop freezes the weapon's whole limb (`HumanSegmentStop`) and a
            // striking law keeps its chain's first contact, so the capsules on
            // one limb of one action stop together as one part.
            group,
            radius: w.radius,
            from: a,
            to: b,
            position: (t: number) => (t < a || t > b ? far : w.path(t)),
            sample: (
              t: number,
            ): IAutoMovieResolveContactEvents.IWeaponFrame => {
              if (t < a || t > b)
                return {
                  position: far,
                  ...(tail === undefined ? {} : { tail: far }),
                };
              const [position, end]: StrikingWeapon.IAxis = axis(w, group, t);
              return { position, ...(end === undefined ? {} : { tail: end }) };
            },

            // Its own path on the search's grid, read under the search's stops.
            speed: (
              grid: IAutoMovieResolveContactEvents.IGrid,
              stops: IAutoMovieResolveContactEvents.IStops,
            ): IAutoMovieResolveContactEvents.Speed => {
              apply(stops);
              return HumanPerformanceContactSpeed.weapon(
                (t: number): StrikingWeapon.IAxis => axis(w, group, t),
                a,
                b,
                grid,
              );
            },
            ...(tail === undefined
              ? {}
              : {
                  tail: (t: number) => (t < a || t > b ? far : tail(t)),
                  ...(w.tailRadius === undefined
                    ? {}
                    : { tailRadius: w.tailRadius }),
                }),
          });
          from = Math.min(from, a);
          to = Math.max(to, b);
        }
    if (weapons.length === 0) return;
    // HumanPerformanceState fixes this ordered cast in its constructor; mutable
    // person records remain live and every current pose is still queried.
    const people: readonly IAutoMovieMotionHumanSegment.IPerson[] = [
      ...self.people.values(),
    ];
    const readers: Map<
      IAutoMovieMotionHumanSegment.IPerson,
      ReturnType<typeof HumanPerformanceRead.prepareBones>
    > = new Map();

    // Under one installed set of stops a person's pose is a pure function of
    // the second, and every weapon's scan reads the same seconds: each is read
    // once. `apply` clears this whenever what a person shows may change.
    const shown: Map<
      IAutoMovieMotionHumanSegment.IPerson,
      Map<number, ReturnType<typeof HumanPerformanceRead.bones>>
    > = new Map();
    const readBones = (
      person: IAutoMovieMotionHumanSegment.IPerson,
      seconds: number,
    ): ReturnType<typeof HumanPerformanceRead.bones> => {
      let known:
        | Map<number, ReturnType<typeof HumanPerformanceRead.bones>>
        | undefined = shown.get(person);
      if (known === undefined) {
        known = new Map();
        shown.set(person, known);
      }
      let bones: ReturnType<typeof HumanPerformanceRead.bones> | undefined =
        known.get(seconds);
      if (bones !== undefined) return bones;
      let read:
        | ReturnType<typeof HumanPerformanceRead.prepareBones>
        | undefined = readers.get(person);
      if (read === undefined) {
        read = HumanPerformanceRead.prepareBones(
          self,
          person.performer.subject,
          HumanColliders.bones(person.performer.body),
        );
        readers.set(person, read);
      }
      bones = read(seconds);
      known.set(seconds, bones);
      return bones;
    };
    const paths: Map<
      string,
      (t: number) => [IAutoMovieVector3, IAutoMovieVector3]
    > = new Map(
      weapons.map((w) => [
        w.id,
        (t: number): [IAutoMovieVector3, IAutoMovieVector3] => {
          const frame: IAutoMovieResolveContactEvents.IWeaponFrame = w.sample!(
            t,
            new Map(),
          );
          return [frame.position, frame.tail ?? frame.position];
        },
      ]),
    );
    const met: Map<string, IAutoMovieMotionWeaponContact & IContactsMetEntry> =
      new Map();
    let applied: string = "";
    let installed: IContactsInstalled | undefined;
    const apply = (stops: IAutoMovieResolveContactEvents.IStops): void => {
      // The sole live producer below owns a native Map and only adds fresh
      // weapon ids; neither existing times nor keys change or disappear.
      // The explicit final Map has another identity and still gets the full
      // content comparison. This shares stop installation, never pose reads.
      if (installed?.stops === stops && installed.size === stops.size) return;
      installed = { stops, size: stops.size };
      const signature: string = [...stops]
        .map(([k, s]) => `${k}@${s}`)
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .join(";");
      if (signature === applied) return;
      applied = signature;
      shown.clear();
      axes.clear();
      for (const person of people) person.stops.clear();
      const changed: Set<IAutoMovieMotionHumanSegment> = new Set();
      for (const [key, seconds] of stops) {
        const owner = owners.get(key)!;
        owner.person.stops.set(
          HumanSegment.weapon(owner.segment, owner.id),
          seconds,
        );
        if (met.get(key)?.seconds !== seconds) {
          met.set(key, {
            key,
            weapon: owner.id,
            against: nearest(owner.person, paths.get(key)!(seconds), seconds),
            seconds,
          });
          changed.add(owner.segment);
        }
      }
      for (const [key, event] of [...met])
        if (!stops.has(key)) {
          met.delete(key);
          changed.add(owners.get(event.key)!.segment);
        }
      for (const segment of changed) {
        if (segment.plan.stop === undefined) continue;
        segment.plan.stop(
          [...met.values()]
            .filter((e) => owners.get(e.key)!.segment === segment)
            .map(({ weapon, against, seconds }) => ({
              weapon,
              against,
              seconds,
            })),
        );
      }

      // A stop changes what its owner shows, and whoever reads the owner (a
      // strike aimed at it, a guard watching it) planned against the earlier
      // showing, so every plan solves again on the stops now installed, in
      // dependency order.
      prepareHumanPerformancePlans(self);
      shown.clear();
      axes.clear();
    };
    const nearest = (
      owner: IAutoMovieMotionHumanSegment.IPerson,
      [point, end]: [IAutoMovieVector3, IAutoMovieVector3],
      seconds: number,
    ): string => {
      let best: IContactsNearestBest = {
        subject: "",
        distance: Infinity,
      };
      for (const person of people) {
        if (person === owner) continue;
        const d: number = HumanColliders.distanceToSegment(
          person.performer.body,
          readBones(person, seconds),
          point,
          end,
        ).distance;
        if (d < best.distance)
          best = { subject: person.performer.subject, distance: d };
      }
      return best.subject;
    };
    const events: IAutoMovieResolveContactEvents.IEvent[] =
      AutoMovieEngineCompositionContact.resolveEvents({
        weapons,
        bodies: HumanPerformanceContactBodies({
          people,
          owners,
          readBones,
          apply,
        }),
        from,
        to,
        step: HumanPerformanceContacts.STEP,
      });
    apply(new Map(events.map((e): [string, number] => [e.weapon, e.seconds])));
    const plans: Map<
      IAutoMovieMotionHumanSegment,
      IAutoMovieMotionWeaponContact[]
    > = new Map();
    for (const owner of owners.values()) plans.set(owner.segment, []);
    for (const e of events) {
      const owner = owners.get(e.weapon)!;
      plans
        .get(owner.segment)!
        .push({ weapon: owner.id, against: e.against, seconds: e.seconds });

      // Each stop is a hit on the person it met (`HumanPerformanceHits`).
      self.strikes.push({
        subject: owner.person.performer.subject,
        segment: owner.segment,
        weapon: owner.weapon,
        against: e.against,
        seconds: e.seconds,
      });
    }
    for (const [segment, own] of plans) segment.plan.stop?.(own);
  }
}

/*
 * The record of `IContactsNearestBest`'s site.
 */
type IContactsNearestBest = { subject: string; distance: number };

/*
 * The record of `IContactsInstalled`'s site.
 */
type IContactsInstalled = {
  stops: IAutoMovieResolveContactEvents.IStops;
  size: number;
};

/*
 * The record of `IContactsMetEntry`'s site.
 */
type IContactsMetEntry = { key: string };

/*
 * The record of `IContactsSiblingsItem`'s site.
 */
type IContactsSiblingsItem = {
  weapon: IAutoMovieMotionWeaponPath;
  from: number;
  to: number;
};

/*
 * The record of `IAxisLiveW2`'s site.
 */
type IAxisLiveW2 = {
  weapon: IAutoMovieMotionWeaponPath;
  from: number;
  to: number;
};

/*
 * The record of `IAxisLiveW`'s site.
 */
type IAxisLiveW = {
  weapon: IAutoMovieMotionWeaponPath;
  from: number;
  to: number;
};

/*
 * The record of `ILimbsItemEntry`'s site.
 */
type ILimbsItemEntry = {
  weapon: IAutoMovieMotionWeaponPath;
  from: number;
  to: number;
};
