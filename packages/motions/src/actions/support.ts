import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import type { IHumanBody } from "../body/IHumanBody";
import { crawl } from "../floor/crawl";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanSupport } from "../law/HumanSupport";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanBodyFit } from "../posture/HumanBodyFit";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareSupportInterval } from "./prepareSupportInterval";
import { supportContact } from "./supportContact";
import { supportKey } from "./supportKey";
import { supportWindows } from "./supportWindows";

/**
 * Moving the body's weight across a sequence of supports: each stance's
 * contacts (`HumanSupport.IStance`) solved into one static key posture, and
 * the body carried from key to key with every new contact placed and
 * bearing before any contact the next stance lacks lets go.
 *
 * A key posture is the static multi-contact posture nearest the posture the
 * body enters with that puts every contact on its target, keeps the centre
 * of mass over the hull of the bearing contacts and every joint in its range
 * (`HumanBodyFit`, Bouyarmane and Kheddar 2010; Escande, Kheddar and
 * Miossec 2013), solved from the key before it, as a planner grows its next
 * stance from its parent. Between two stances the planner solves a third key
 * on the union of both stances' contacts, so the new contacts bear before
 * the old ones release (Escande et al.'s transition configurations, in
 * both stances at once), and the body moves between keys on a minimum-jerk
 * course in joint space (Flash and Hogan 1985), each joint on its own range
 * (`blendHumanJoint`). A part that bears in two stances in a row on
 * different targets steps: the planner first solves a key without its old
 * contact, the part over the middle of its step lifted a stepping limb's
 * rise (`crawl.LIFT`) clear of the higher end and bearing on nothing, then
 * the transition key with it set down, so a contact is broken before it is
 * made again. The joint-space course currently pins one common contact;
 * it does not yet enforce all of the other held contacts between keys.
 * A contact no key
 * posture reaches is refused with the contact, its stance and the miss.
 *
 * A bearing foot lies on the floor at its toes' joint with its toes flat; a
 * bearing hand lies on its palm laid flat on the surface; on the floor a
 * knee bears on its shin and the trunk on its colliders, resting on their
 * lowest points, and on a raised surface each lays its own skin flat on it
 * (the knee, the seat, the upper back or the abdomen); a contact held across
 * stances without a place stays where it was first laid; a gripping hand
 * closes on its target at its grip. Each move
 * takes `SECONDS` (provisional: no study of the timing of a general support
 * sequence was located) or its stance's own, a step's third of it each to
 * lift, to set down and to settle. Events: `lift<i>` when the move into
 * stance `i` has its stepping parts at the top of their swing, `bear<i>`
 * when it has placed its new contacts, `stance<i>` (or the stance's own
 * event) when stance `i` is held alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the key postures with their sources, the transition keys, the course between keys, the refusal, the contacts' forms, the timing and the events.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of key postures solved once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the move's time and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each key is the shared whole-body fit's; no posture is typed for any stance.
 */
export namespace support {
  /** The action's name. */
  export const name: HumanActionName = "support";

  /** Cancel table: a support sequence stands up from any stance it holds on its feet. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The stances in order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One member read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is typed.
   */
  export interface IParams {
    /** The stances, in order; the body enters the first from where it stands. */
    stances: readonly HumanSupport.IStance[];

    /** The surface a row's `on` contacts touch: a box's top to vault, a ledge to scramble onto, a table's edge to slide off; refused where a contact names `on` and this is absent. */
    on?: AutoMovieMotionTarget;
  }

  /** Seconds a move into a stance takes (provisional). */
  export const SECONDS: number = 1;

  /** How far a contact may miss its target, millimetres: the give of a pressed skin the audits read a contact with (`AutoMovieMotionHumanAuditSkin.BUILT`). */
  export const MISS: number = AutoMovieMotionHumanAuditSkin.BUILT * 1000;

  /**
   * Plan a support sequence.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When there is no stance, or a key posture leaves a contact more than `MISS` off its target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each key is the whole-body fit on its contacts, seeded from the key before; a transition key holds both stances' contacts at once; the course between keys is a minimum-jerk blend of each joint on its range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keys are solved once and each fixed interval is prepared, then a posture reads its surrounding keys and that interval's actual interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact the fit misses is refused, never left where the fit stopped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two fits per stance after the first, three for a step, remain once at plan time; each fixed interval prepares its joint pairs/common pin and measures its fixed source point once, while every posture retains current ROM interpolation, achieved-point solve and floor reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Solved keys, contact order and completed entry-time contact places define immutable interval geometry; prepared intervals share only those fixed inputs and source-point measurements, with no current pose or floor-result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its keys and one finite preparation per adjacent interval until release; those intervals retain fixed endpoint metadata/source points but no queried time, current pose or FK workspace.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    // Each contact marked by the stance it was set down in.
    const stances: readonly HumanSupport.IStance[] = supportContact.placements(
      context.params.stances,
    );
    if (stances.length === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "stances",
        value: 0,
        reason: "a support sequence needs at least one stance",
        fix: "give the stances the body rests on, in order",
      });

    // The posture the body enters with, by its joint angles: the preference
    // every key stays nearest to.
    const entry: IHumanPosture = context.entry.posture;
    const preferred: IHumanPosture = {
      root: entry.root,
      yaw: entry.yaw,
      pitch: entry.pitch,
      roll: entry.roll,
      joints: Object.fromEntries(
        context.entry.pose.joints.map(
          (j): [AutoMovieHumanoidBone, readonly [number, number, number]] => [
            j.bone,
            [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0],
          ],
        ),
      ),
      limbs: {},
    };

    // Each contact's target, read once at the start.
    const at = (c: HumanSupport.IContact): IAutoMovieVector3 | null => {
      if (c.target === undefined) return null;
      if (c.target !== "on") return context.aim(c.target, context.start).point;
      const on: AutoMovieMotionTarget | undefined = context.params.on;
      if (on === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "on",
          value: c.part,
          reason: `the ${c.part} is placed on the action's surface, and none is given`,
          fix: "give the surface the row's contacts touch as `on`",
        });
      return supportContact.onSurface(
        body,
        c,
        context.aim(on, context.start).point,
        entry.yaw,
      );
    };

    // A bearing support held across stances does not slide: one without a
    // place keeps where its first key laid it, or its entry place for a part
    // the body already rests on as it enters.
    const laid: Map<string, IAutoMovieVector3> = new Map();
    /** Read each newly held floor datum once on this exact key, preserving first contact identity. */
    const recordFloors: (
      posture: IHumanPosture,
      contacts: readonly HumanSupport.IContact[],
    ) => void = (
      posture: IHumanPosture,
      contacts: readonly HumanSupport.IContact[],
    ): void => {
      const pending: Set<string> = new Set();
      const added: { id: string; part: HumanSupport.Part }[] = [];
      for (const contact of contacts) {
        if (contact.target !== undefined) continue;
        const id: string = supportContact.id(contact);
        if (laid.has(id) || pending.has(id)) continue;
        pending.add(id);
        added.push({ id, part: contact.part });
      }
      const points: IAutoMovieVector3[] = supportContact.onFloors(
        body,
        posture,
        added.map(
          (item: (typeof added)[number]): HumanSupport.Part => item.part,
        ),
      );
      for (let i: number = 0; i < added.length; ++i)
        laid.set(added[i]!.id, points[i]!);
    };
    recordFloors(
      entry,
      stances[0]!.contacts.filter((contact: HumanSupport.IContact): boolean =>
        context.entry.supports.some(
          (support: { part: string }): boolean =>
            support.part === supportContact.window(contact.part),
        ),
      ),
    );
    const place = (c: HumanSupport.IContact): IAutoMovieVector3 | null =>
      at(c) ?? laid.get(supportContact.id(c)) ?? null;

    // A stance's preferred posture (`supportKey.preferred`).
    const preference = (
      stance: HumanSupport.IStance,
      from: IHumanPosture,
    ): IHumanPosture =>
      supportKey.preferred(body, preferred, stance, from, place);

    // A key's solve starts from the nearest posture that already bears on
    // its contacts: an l1 penalty method started from a far parent can stop
    // at a stationary point of the violation (Nocedal and Wright 2006,
    // chapter 17). The first stance starts from its stated posture, else
    // the entry; every later key from the key before, which bears on all its
    // contacts but the one being set down.
    const seed = (
      stance: HumanSupport.IStance,
      from: IHumanPosture,
    ): IHumanPosture =>
      stance.prefer === undefined ? from : preference(stance, from);

    // Each key: one fit on its contacts, whose seed is selected by constraint violation.
    const keys: IKey[] = [
      { posture: preferred, seconds: 0, name: "start", contacts: [] },
    ];
    const push = (key: IKey): void => {
      keys.push(key);
      recordFloors(key.posture, key.contacts);
    };
    let seconds: number = 0;
    stances.forEach((stance: HumanSupport.IStance, i: number): void => {
      const move: number = stance.seconds ?? SECONDS;
      const before: IHumanPosture = keys[keys.length - 1]!.posture;
      const previous: readonly HumanSupport.IContact[] =
        i === 0 ? [] : stances[i - 1]!.contacts;
      const added: HumanSupport.IContact[] = stance.contacts.filter(
        (c: HumanSupport.IContact): boolean =>
          !previous.some((p: HumanSupport.IContact): boolean =>
            supportContact.same(p, c),
          ),
      );
      // A limb set down anew (another target, a foot to its knee, a `step`)
      // lets go, swings over the middle of its step clear of the surface and
      // sets down while the rest bear: a contact broken, then made (Escande,
      // Kheddar and Miossec 2013); a limb never bears in two places at once.
      const left = (p: HumanSupport.IContact): boolean =>
        !stance.contacts.some((s: HumanSupport.IContact): boolean =>
          supportContact.same(s, p),
        );
      const from = (
        m: HumanSupport.IContact,
      ): HumanSupport.IContact | undefined =>
        previous.find(
          (p: HumanSupport.IContact): boolean =>
            left(p) &&
            supportContact.limb(p.part) === supportContact.limb(m.part),
        );
      const moved: HumanSupport.IContact[] = added.filter(
        (c: HumanSupport.IContact): boolean => from(c) !== undefined,
      );
      const kept: HumanSupport.IContact[] = previous.filter(
        (p: HumanSupport.IContact): boolean =>
          !(
            left(p) &&
            moved.some(
              (m: HumanSupport.IContact): boolean =>
                supportContact.limb(m.part) === supportContact.limb(p.part),
            )
          ),
      );
      if (i > 0 && moved.length > 0) {
        // The lift still stands in the stance it leaves: it keeps that
        // stance's posture and starts from the key before; the set-down
        // places the limb where the stance it arrives at lays it, from the
        // lift, which holds every support but the swinging limb's.
        const leaving: HumanSupport.IStance = stances[i - 1]!;
        seconds += move / 3;
        push({
          posture: supportKey.solved(
            body,
            preference(leaving, before),
            before,
            kept,
            place,
            `lift${i}`,
            MISS,
            moved.flatMap(
              (m: HumanSupport.IContact): HumanBodyFit.ITarget[] => {
                const was: HumanSupport.IContact = from(m)!;

                const top: HumanBodyFit.ITarget | null = supportContact.swing(
                  body,
                  m,
                  place(was),
                  place(m),
                  crawl.LIFT,
                );
                return top === null ? [] : [top];
              },
            ),
          ),
          seconds,
          name: `lift${i}`,
          contacts: kept,
        });
        seconds += move / 3;
        const union: HumanSupport.IContact[] = [...kept, ...added];
        push({
          posture: supportKey.solved(
            body,
            preference(stance, keys[keys.length - 1]!.posture),
            keys[keys.length - 1]!.posture,
            union,
            place,
            `bear${i}`,
            MISS,
          ),
          seconds,
          name: `bear${i}`,
          contacts: union,
        });
        seconds += move / 3;
      } else if (i > 0 && added.length > 0) {
        const union: HumanSupport.IContact[] = [...previous, ...added];
        seconds += move / 2;
        push({
          posture: supportKey.solved(
            body,
            preference(stance, before),
            before,
            union,
            place,
            `bear${i}`,
            MISS,
          ),
          seconds,
          name: `bear${i}`,
          contacts: union,
        });
        seconds += move / 2;
      } else seconds += move;
      push({
        posture: supportKey.solved(
          body,
          preference(stance, keys[keys.length - 1]!.posture),
          i === 0
            ? seed(stance, keys[keys.length - 1]!.posture)
            : keys[keys.length - 1]!.posture,
          stance.contacts,
          place,
          `stance${i}`,
          MISS,
        ),
        seconds,
        name: stance.event ?? `stance${i}`,
        contacts: stance.contacts,
      });
    });
    const duration: number = seconds;
    const intervals: ReturnType<typeof prepareSupportInterval>[] = keys
      .slice(0, Math.max(1, keys.length - 1))
      .map(
        (key: IKey, i: number): ReturnType<typeof prepareSupportInterval> =>
          prepareSupportInterval(
            body,
            key,
            keys[Math.min(i + 1, keys.length - 1)]!,
            place,
          ),
      );

    return {
      duration,
      events: keys.slice(1).map((k: IKey): { name: string; share: number } => ({
        name: k.name,
        share: k.seconds / duration,
      })),
      contacts: supportWindows.of(context, stances, keys, duration),
      posture: (t: number): IHumanPosture => {
        const s: number = Math.min(duration, Math.max(0, t));
        let k: number = 0;
        while (k + 1 < keys.length - 1 && keys[k + 1]!.seconds <= s) k++;
        const a: IKey = keys[k]!;
        const b: IKey = keys[Math.min(k + 1, keys.length - 1)]!;
        const span: number = b.seconds - a.seconds;
        const w: number =
          span > 0 ? minimumJerk.share((s - a.seconds) / span) : 1;
        if (w === 0) return k === 0 ? entry : a.posture;
        if (w === 1) return b.posture;

        // Between keys one common effector is pinned. Floor contacts rest
        // on their colliders; raised contacts keep their world height,
        // bounded by floor nonpenetration. This single pivot does not
        // constrain every other held contact along the course.
        return intervals[k]!(w);
      },
    };
  }

  /** A key posture of the plan. */
  interface IKey {
    /** The posture, by joint angles alone. */
    posture: IHumanPosture;

    /** When it is reached, seconds since the action's start. */
    seconds: number;

    /** Its event's name. */
    name: string;

    /** The contacts it rests on. */
    contacts: readonly HumanSupport.IContact[];
  }
}
