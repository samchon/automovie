import {
  resolveAutoMovieContactEvents,
  segmentSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanSegment } from "./HumanSegment";

/**
 * What the placed performance does to itself: the holds a grip starts and
 * an action takes over or ends, and the contacts between people resolved
 * into the stops and reactions of those they land on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two things the functions resolve.
 * @evidence contracts/development/design.md#principled-representation Contacts are resolved on the whole placed performance by the engine's contact events, and applied as stops on the plans.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The contact resolution and the hold bookkeeping (#3399).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A hand that holds a prop and is driven elsewhere is refused.
 */
export namespace HumanPerformanceContacts {
  /**
   * Settle what a newly planned action does to the props its performer
   * holds, whether it carries the body or rides a carrier: a grip window on
   * a held prop takes that hand over from the hold, any other use of a
   * holding hand is refused, and the props the action leaves held become
   * holds of its own.
   */
  export function hold(
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
    riding: boolean,
  ): void {
    const plan: IHumanActionPlan = segment.plan;
    for (const held of person.holds) {
      if (held.until !== Infinity) continue;
      const take: IHumanActionPlan["contacts"][number] | undefined =
        plan.contacts.find(
          (c: IHumanActionPlan["contacts"][number]): boolean =>
            c.part === `${held.side}Hand` &&
            c.kind === "grip" &&
            c.support.kind === "prop" &&
            c.support.subject === held.prop,
        );
      if (take !== undefined) {
        held.until = Math.max(
          held.from,
          segment.start + take.from * plan.duration,
        );
        if (riding) held.riding = true;
      } else if (HumanSegment.drives(plan, held.side))
        throw new HumanRefusal({
          kind: "affordance",
          axis: "hand",
          value: held.side,
          feasible: {
            kind: "alternatives",
            values: person.holds.some(
              (h: HumanSegment.IHeld): boolean =>
                h.until === Infinity && h.side !== held.side,
            )
              ? []
              : [held.side === "left" ? "right" : "left"],
          },
          reason: `${segment.name} needs the ${held.side} hand, which holds ${held.prop} since ${held.source.name} (${held.source.id})`,
          fix: `put ${held.prop} down or hand it over first, or perform ${segment.name} with the free hand`,
        });
    }
    for (const hold of plan.holds ?? [])
      person.holds.push({
        side: hold.side,
        prop: hold.prop,
        fingers: hold.fingers ?? {},
        source: segment,
        from: segment.start + hold.from * plan.duration,
        until: Infinity,
      });
  }

  /**
   * Resolve every weapon's first contact at once, in time order, each later
   * weapon seeing the earlier stops as they will be shown: a plan that takes
   * its stops is handed each one as it is committed and settled, so its own
   * dwell and recoil are what later weapons meet; a plan that does not is
   * shown with that limb frozen at the stop. Weapons are live only inside
   * their window clipped to their action's span, which they declare, so
   * each is scanned over that window alone; bodies are the other
   * people's colliders, and the person a stop met is the nearest of them.
   * A contact is mutual: when the limb a weapon meets is striking too, its
   * capsule nearest the striker stops at the same second.
   */
  export function contacts(self: HumanPerformanceState): void {
    const weapons: resolveAutoMovieContactEvents.IWeapon[] = [];
    const owners: Map<
      string,
      {
        person: HumanSegment.IPerson;
        segment: HumanSegment.ISegment;
        id: string;
        limb: IHumanActionPlan.IWeapon["limb"];
        from: number;
        to: number;
      }
    > = new Map();
    const far: IAutoMovieVector3 = { x: 1e6, y: 1e6, z: 1e6 };
    let from: number = Infinity;
    let to: number = -Infinity;
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
          });
          const tail = w.tail;
          weapons.push({
            id: key,
            owner: person.performer.subject,
            radius: w.radius,
            from: a,
            to: b,
            position: (t: number) => (t < a || t > b ? far : w.path(t)),
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
    const paths: Map<
      string,
      (t: number) => [IAutoMovieVector3, IAutoMovieVector3]
    > = new Map(
      weapons.map((w) => [
        w.id,
        (t: number): [IAutoMovieVector3, IAutoMovieVector3] => {
          const p: IAutoMovieVector3 = w.position(t, new Map());
          return [p, w.tail?.(t, new Map()) ?? p];
        },
      ]),
    );
    const met: Map<string, IHumanActionPlan.IContactEvent & { key: string }> =
      new Map();
    let applied: string = "";
    const apply = (stops: resolveAutoMovieContactEvents.IStops): void => {
      const signature: string = [...stops]
        .map(([k, s]) => `${k}@${s}`)
        .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
        .join(";");
      if (signature === applied) return;
      applied = signature;
      for (const person of self.people.values()) person.stops.clear();
      const changed: Set<HumanSegment.ISegment> = new Set();
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
      // showing, so everyone's memos go, not the owner's alone.
      for (const person of self.people.values()) HumanSegment.forget(person);
    };
    const nearest = (
      owner: HumanSegment.IPerson,
      [point, end]: [IAutoMovieVector3, IAutoMovieVector3],
      seconds: number,
    ): string => {
      let best: { subject: string; distance: number } = {
        subject: "",
        distance: Infinity,
      };
      for (const person of self.people.values()) {
        if (person === owner) continue;
        const d: number = HumanColliders.distanceToSegment(
          person.performer.body,
          HumanPerformanceRead.bones(self, person.performer.subject, seconds),
          point,
          end,
        ).distance;
        if (d < best.distance)
          best = { subject: person.performer.subject, distance: d };
      }
      return best.subject;
    };
    const events: resolveAutoMovieContactEvents.IEvent[] =
      resolveAutoMovieContactEvents({
        weapons,
        bodies: [...self.people.values()].map(
          (person: HumanSegment.IPerson) => ({
            id: person.performer.subject,
            distance: (
              point: IAutoMovieVector3,
              seconds: number,
              stops: resolveAutoMovieContactEvents.IStops,
            ): number => {
              apply(stops);
              return HumanColliders.distance(
                person.performer.body,
                HumanPerformanceRead.bones(
                  self,
                  person.performer.subject,
                  seconds,
                ),
                point,
              ).distance;
            },
            axis: (
              a: IAutoMovieVector3,
              b: IAutoMovieVector3,
              seconds: number,
              stops: resolveAutoMovieContactEvents.IStops,
              taper?: readonly [number, number],
            ): number => {
              apply(stops);
              return HumanColliders.distanceToSegment(
                person.performer.body,
                HumanPerformanceRead.bones(
                  self,
                  person.performer.subject,
                  seconds,
                ),
                a,
                b,
                taper,
              ).distance;
            },

            // The limb a weapon met may be striking too. Its capsule and the
            // collider the striker measured are two measures of that one
            // limb, so the capsule nearest the striker's axis stops with it.
            carried: (
              a: IAutoMovieVector3,
              b: IAutoMovieVector3,
              seconds: number,
              stops: resolveAutoMovieContactEvents.IStops,
            ): string | undefined => {
              apply(stops);
              const bone: AutoMovieHumanoidBone =
                HumanColliders.distanceToSegment(
                  person.performer.body,
                  HumanPerformanceRead.bones(
                    self,
                    person.performer.subject,
                    seconds,
                  ),
                  a,
                  b,
                ).bone;
              const part: RegExpExecArray | null =
                /^(left|right)(?:(UpperLeg|LowerLeg|Foot|Toes)|(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little))/.exec(
                  bone,
                );
              if (part === null) return undefined;
              const limb: string = `${part[1]}${part[2] === undefined ? "Arm" : "Leg"}`;
              let best: { key: string; distance: number } | undefined;
              for (const [key, owner] of owners) {
                if (
                  owner.person !== person ||
                  owner.limb !== limb ||
                  stops.has(key) ||
                  seconds < owner.from ||
                  seconds > owner.to
                )
                  continue;
                const [p, q] = paths.get(key)!(seconds);
                const distance: number = segmentSegmentDistance(a, b, p, q);
                if (best === undefined || distance < best.distance)
                  best = { key, distance };
              }
              return best?.key;
            },
          }),
        ),
        from,
        to,
        step: 1 / 120,
      });
    apply(new Map(events.map((e): [string, number] => [e.weapon, e.seconds])));
    const plans: Map<HumanSegment.ISegment, IHumanActionPlan.IContactEvent[]> =
      new Map();
    for (const owner of owners.values()) plans.set(owner.segment, []);
    for (const e of events) {
      const owner = owners.get(e.weapon)!;
      plans
        .get(owner.segment)!
        .push({ weapon: owner.id, against: e.against, seconds: e.seconds });
    }
    for (const [segment, own] of plans) segment.plan.stop?.(own);
  }
}
