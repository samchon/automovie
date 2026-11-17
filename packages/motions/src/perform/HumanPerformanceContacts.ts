import {
  resolveAutoMovieContactEvents,
  segmentSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionWeaponContact,
  IAutoMovieMotionWeaponPath,
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { StrikingWeapon } from "../striking/StrikingWeapon";
import { HumanPerformanceContactSpeed } from "./HumanPerformanceContactSpeed";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentStill } from "./HumanSegmentStill";

/**
 * What the placed performance does to itself: the holds a grip starts and
 * an action takes over or ends, and the contacts between people resolved
 * into the stops and reactions of those they land on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States hold and contact resolution; STEP is 1/120 second, so limbs moving a few metres per second travel a few centimetres between the original scan samples.
 * @evidence contracts/development/design.md#principled-representation Contacts are resolved on the whole placed performance by the engine's contact events, and applied as stops on the plans.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The contact resolution and the hold bookkeeping (#3399).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A hand that holds a prop and is driven elsewhere is refused.
 */
export namespace HumanPerformanceContacts {
  /**
   * The contact scan's step, seconds: a 120th, so a strike of at most a few metres a second moves a few centimetres between samples.

   */
  export const STEP: number = 1 / 120;

  /**
   * Settle what a newly planned action does to the props its performer
   * holds, whether it carries the body or rides a carrier: a grip window on
   * a held prop takes that hand over from the hold, any other use of a
   * holding hand is refused, and the props the action leaves held become
   * holds of its own.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States hand takeover, held-prop transfer and refusal when a different contact drives a holding hand.
   * @evidence contracts/development/implementation.md#principled-implementation Existing hold windows determine which props the plan receives or releases, and the plan's final holds extend that state at their declared absolute times.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The existing hold takeover pass precedes insertion of the new plan's declared holds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An incompatible drive throws HumanRefusal with its hand/prop; riding keeps the declared hand-use policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans current holds and the plan's contacts/driven hands, then appends its declared holds; no geometry or fitting is introduced here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads existing plan hold/contact metadata rather than recomputing grasp geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates only the placed person's existing hold records; their windows bound activity and their lifetime remains the person's performance lifetime.
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
    for (const hold of plan.holds ?? [])
      person.holds.push({
        side: hold.side,
        prop: hold.prop,
        fingers: hold.fingers ?? {},
        source: segment,
        from: segment.start + hold.from * plan.duration,
        until: Infinity,
      });

    // A hold changes what the person shows from here on.
    person.planning?.clear();
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
   * capsule nearest the striker stops at the same second. The capsules on one
   * limb of one action are one part (the engine's weapon `group`): the first
   * of them to meet a body stops the limb, and the others give no stop or
   * hit of their own, as a striking law keeps only its chain's first contact.
   * Each weapon states its bound on a search's grid from its own path and
   * each person 0 where its shown pose provably holds still
   * (`HumanPerformanceContactSpeed`, `HumanSegmentStill`), so the scan reads no grid second a
   * clear gap rules out.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States clipped live spans, stop application, plan settling, mutual-contact selection, that one limb's capsules stop as one part and the grid bounds each side states.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates unchanged signed-distance scan and event ordering to the engine; current performance bones define actual colliders and the nearest carried capsule determines the mutual stop. The bounds are certified on the grid: a weapon's measured from its own path, a person's 0 only where its pose provably holds still.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Collects original weapons and owners, then snapshots the constructor-fixed ordered cast only when a live weapon exists; actual frame/body readers keep those mutable person records live, apply stop changes and commit events/hits.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps STEP, live clipping, every engine scan and crossing search (a grid second is left unread only where both certified bounds rule it out), taper, nearest-body decision and whole-performance invalidation on changed stops; no pose is cached by time.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains engine weapon/body/sample search cost. The actual append-only stop producer permits O(1) unchanged-installation checks per query; sorted O(S log S) signatures for S stops run only when that Map grows or the explicit final Map arrives. Each sampled capsule reads both ends once, grouped carried chains run once, and each queried actor prepares genuine profile-name demand once; under one installed stop set each actor's displayed/FK bones at an exact second are evaluated once for every weapon's scan. The capsules of one limb of one action form one engine group, so after its first contact the limb's other capsules are scanned no more. Owner metadata removes the final event weapon scan. A grid bound reads each grid second of a weapon's window once a search, shared with the scan's own reads, and lets the scan skip the bones of a still person. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The sole live stops source is the event resolver's private native Map: both writes add an id only after absence checks, so identical Map identity and size prove no entry changed during this call. A new Map or increased size still takes the original full content comparison and every changed stop forgets person memos. Chain endpoints share only one explicit query. The constructor-fixed actor/body and copied canonical profile names justify a bound query producer. Bones are shared by exact second only while one stop set is installed: the memo is cleared when the stops change, before the nearest-person reads, and again after the plans settle and every person is forgotten, so each read observes the state it was read in; weapon axes are shared the same way, and a limb's capsules share their chain's evaluation at a second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ordered cast references, at most one fixed-name query producer per actually queried actor, adapter/owner/event maps, installed-stop Map/size reference and signature last only this synchronous resolution; their stop population is bounded by input weapons. The bones memo holds one collider-bone map per actor and distinct second read under the current stop set, released at each stop change and on return, as is the axes memo of one axis per live weapon and distinct second read. Each grouped axis map ends before its callback returns. Only existing person stops, plan stops and hit records persist, without any new pose/time history.
   */
  export function contacts(self: IAutoMovieMotionHumanPerformanceState): void {
    const weapons: IAutoMovieResolveContactEvents.IWeapon[] = [];
    const owners: Map<
      string,
      {
        person: IAutoMovieMotionHumanSegment.IPerson;
        segment: IAutoMovieMotionHumanSegment;
        id: string;
        limb: IAutoMovieMotionWeaponPath["limb"];
        from: number;
        to: number;
        weapon: IAutoMovieMotionWeaponPath;
      }
    > = new Map();
    const far: IAutoMovieVector3 = { x: 1e6, y: 1e6, z: 1e6 };
    let from: number = Infinity;
    let to: number = -Infinity;

    // Under one installed set of stops a weapon's axis is a pure function of
    // the second, as a person's bones are: the grid bound's reads and the
    // scan's share each, and the capsules of one limb of one action share
    // their chain's evaluation. `apply` clears this with the bones.
    const limbs: Map<
      string,
      { weapon: IAutoMovieMotionWeaponPath; from: number; to: number }[]
    > = new Map();
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
        .filter(
          (w: {
            weapon: IAutoMovieMotionWeaponPath;
            from: number;
            to: number;
          }): boolean => !(t < w.from || t > w.to),
        )
        .map(
          (w: {
            weapon: IAutoMovieMotionWeaponPath;
            from: number;
            to: number;
          }): IAutoMovieMotionWeaponPath => w.weapon,
        );
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
          const siblings: {
            weapon: IAutoMovieMotionWeaponPath;
            from: number;
            to: number;
          }[] = limbs.get(group) ?? [];
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
    const met: Map<string, IAutoMovieMotionWeaponContact & { key: string }> =
      new Map();
    let applied: string = "";
    let installed:
      | { stops: IAutoMovieResolveContactEvents.IStops; size: number }
      | undefined;
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
      // showing, so everyone's memos go, not the owner's alone.
      for (const person of people) HumanSegment.forget(person);
      shown.clear();
      axes.clear();
    };
    const nearest = (
      owner: IAutoMovieMotionHumanSegment.IPerson,
      [point, end]: [IAutoMovieVector3, IAutoMovieVector3],
      seconds: number,
    ): string => {
      let best: { subject: string; distance: number } = {
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
      resolveAutoMovieContactEvents({
        weapons,
        bodies: people.map((person: IAutoMovieMotionHumanSegment.IPerson) => ({
          id: person.performer.subject,

          // 0 where the shown pose provably holds still, none elsewhere.
          speed: (
            _grid: IAutoMovieResolveContactEvents.IGrid,
            stops: IAutoMovieResolveContactEvents.IStops,
          ): IAutoMovieResolveContactEvents.Speed => {
            apply(stops);
            return (a: number, b: number): number | undefined =>
              HumanSegmentStill.within(person, a, b) ? 0 : undefined;
          },
          distance: (
            point: IAutoMovieVector3,
            seconds: number,
            stops: IAutoMovieResolveContactEvents.IStops,
          ): number => {
            apply(stops);
            return HumanColliders.distance(
              person.performer.body,
              readBones(person, seconds),
              point,
            ).distance;
          },
          axis: (
            a: IAutoMovieVector3,
            b: IAutoMovieVector3,
            seconds: number,
            stops: IAutoMovieResolveContactEvents.IStops,
            taper?: readonly [number, number],
          ): number => {
            apply(stops);
            return HumanColliders.distanceToSegment(
              person.performer.body,
              readBones(person, seconds),
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
            stops: IAutoMovieResolveContactEvents.IStops,
          ): string | undefined => {
            apply(stops);
            const bone: AutoMovieHumanoidBone =
              HumanColliders.distanceToSegment(
                person.performer.body,
                readBones(person, seconds),
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
            const eligible: (readonly [string, IAutoMovieMotionWeaponPath])[] =
              [];
            for (const [key, owner] of owners) {
              if (
                owner.person !== person ||
                owner.limb !== limb ||
                stops.has(key) ||
                seconds < owner.from ||
                seconds > owner.to
              )
                continue;
              eligible.push([key, owner.weapon]);
            }
            const sampled: ReadonlyMap<
              IAutoMovieMotionWeaponPath,
              StrikingWeapon.IAxis
            > = StrikingWeapon.sample(
              eligible.map(([, weapon]): IAutoMovieMotionWeaponPath => weapon),
              seconds,
            );
            for (const [key, weapon] of eligible) {
              const [p, q]: StrikingWeapon.IAxis = sampled.get(weapon)!;
              const distance: number = segmentSegmentDistance(a, b, p, q ?? p);
              if (best === undefined || distance < best.distance)
                best = { key, distance };
            }
            return best?.key;
          },
        })),
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
