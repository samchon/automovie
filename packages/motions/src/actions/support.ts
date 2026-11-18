import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { crawl } from "../floor/crawl";
import { getUp } from "../floor/getUp";
import { HumanBound } from "../law/HumanBound";
import { prepareSupportHelperGrip } from "./prepareSupportHelperGrip";
import { supportBalance } from "./supportBalance";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { prepareSupportFloor } from "./prepareSupportFloor";
import { prepareSupportInterval } from "./prepareSupportInterval";
import { supportAssist } from "./supportAssist";
import { supportContact } from "./supportContact";
import { supportKey } from "./supportKey";
import { supportWindows } from "./supportWindows";

/** Offset decay time of a cut from a support sequence into standing, seconds (provisional: no study of the transition was located). */
const BLEND: number = 0.3;

/** A support point in world metres, or an unnamed floor place. */
type Point = IAutoMovieVector3 | null;

/** A key's fixed contact lookup. */
type Place = (contact: IAutoMovieMotionHumanSupport.IContact) => Point;

/**
 * Moving the body's weight across a sequence of supports: each stance's
 * contacts (`HumanSupport.IStance`) solved into one static key posture, and
 * the body carried from key to key with every new contact placed and
 * bearing before any contact the next stance lacks lets go.
 *
 * A key posture is the static multi-contact posture nearest the posture the
 * body enters with that puts every contact on its target and keeps every
 * joint in its range (HumanBodyFit, Bouyarmane and Kheddar 2010, Escande et al. 2013).
 * An explicit positive balance request uses the fitted world contacts and
 * the selected part on the prepared clock. Each new key is solved from the key before it, as a planner grows its next
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
 * made again. Along the joint-space course the root keeps the first common
 * contact on its point, and every held hand and foot is then fitted by its
 * own two-bone chain to where the two keys hold it (`prepareSupportInterval`);
 * a held knee or trunk contact rides the root pin and the floor bound alone.
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
  export const name: AutoMovieMotionHumanActionName = "support";

  /** Cancel table: a support sequence stands up from any stance it holds on its feet. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: BLEND }],
  };

  /** Seconds a move into a stance takes (provisional). */
  export const SECONDS: number = 1;

  /** How far a contact may miss its target, millimetres: the give of a pressed skin the audits read a contact with (`AutoMovieMotionHumanAuditSkin.BUILT`). */
  export const MISS: number = AutoMovieMotionHumanAuditSkin.BUILT * 1000;

  /**
   * Plan a support sequence.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When there is no stance, a stance's seconds are not positive, or a key posture leaves a contact more than `MISS` off its target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each key is the whole-body fit on its contacts, seeded from the key before; a transition key holds both stances' contacts at once; the course between keys is a minimum-jerk blend of each joint on its range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keys are solved once and each fixed interval is prepared, then a posture reads its surrounding keys and that interval's actual interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact the fit misses is refused, never left where the fit stopped.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most two fits per stance after the first, three for a step, run once at plan time. A query finds its active interval in O(log K) for K ordered keys, keeping the last-equal boundary rule; fixed pairs/common pin/source point prepare once, while current ROM interpolation, achieved-point solve and floor reading remain.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Solved keys and contact order define immutable interval geometry; entry-target/source-point observations share only within one schedule generation and settle clears them. Current posture calls forward parent FK/ROM loans to actual contact/floor observations, with every current solve retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns keys and one finite preparation per adjacent interval until release. Intervals retain fixed endpoint metadata and at most one source/target record until settle, without current poses, queried times or borrowed FK/ROM workspaces.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    // Each contact marked by the stance it was set down in.
    const authored: readonly IAutoMovieMotionHumanSupport.IStance[] = context.params.stances;
    const stances: readonly IAutoMovieMotionHumanSupport.IStance[] = supportContact.placements(
      context.params.assist === undefined || authored.length === 0
        ? authored
        : [...authored.slice(0, -1), { ...authored.at(-1)!, prefer: getUp.quiet(body) }],
    );
    if (stances.length === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "stances",
        value: 0,
        reason: "a support sequence needs at least one stance",
        fix: "give the stances the body rests on, in order",
      });

    // A move takes time: a key reached in no time would carry the body
    // between postures at an unbounded speed.
    for (const stance of stances)
      if (stance.seconds !== undefined)
        HumanBound.above("seconds", stance.seconds, 0, "s");

    // The posture the body enters with, by its joint angles: the preference
    // every key stays nearest to.
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const preferred: IAutoMovieMotionHumanPosture = {
      root: entry.root,
      yaw: entry.yaw,
      pitch: entry.pitch,
      roll: entry.roll,
      joints: Object.fromEntries(
        context.entry.pose.joints.map(
          (j: IAutoMovieJointPose): [AutoMovieHumanoidBone, readonly [number, number, number]] => [
            j.bone,
            [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0],
          ],
        ),
      ),
      limbs: {},
    };

    // Each contact's target, read once at the start.
    const at: Place = (c: IAutoMovieMotionHumanSupport.IContact): Point => {
      if (c.target === undefined) return null;
      if (c.target !== "on") return context.aim(c.target, context.start).point;
      const on: IAutoMovieMotionTarget | undefined = context.params.on;
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

    const paired: ReturnType<typeof supportAssist.of> = supportAssist.of(context);
    const { inherited, laid, recordFloors } = prepareSupportFloor(
      body, context.entry, stances[0]!.contacts,
      (c: IAutoMovieMotionHumanSupport.IContact): Point => paired?.(c, 0) ?? at(c),
      context,
    );
    const locate: (phase: number) => Place = (phase: number): Place =>
      (c: IAutoMovieMotionHumanSupport.IContact): Point => paired?.(c, phase) ?? at(c) ?? laid.get(supportContact.id(c)) ?? null;

    // A stance's preferred posture (`supportKey.preferred`).
    const preference: (
      stance: IAutoMovieMotionHumanSupport.IStance,
      from: IAutoMovieMotionHumanPosture,
      place: Place,
    ) => IAutoMovieMotionHumanPosture = (
      stance: IAutoMovieMotionHumanSupport.IStance,
      from: IAutoMovieMotionHumanPosture,
      place: Place,
    ): IAutoMovieMotionHumanPosture =>
      supportKey.preferred(body, preferred, stance, from, place);

    // The plan's contact forms, so a stepping foot's quiet-stance normal is
    // measured once for every swing.
    const form: ReturnType<typeof supportContact.prepareForm> =
      supportContact.prepareForm(body);

    // A key's solve starts from the nearest posture that already bears on
    // its contacts: an l1 penalty method started from a far parent can stop
    // at a stationary point of the violation (Nocedal and Wright 2006,
    // chapter 17). The first stance starts from its stated posture, else
    // the entry; every later key from the key before, which bears on all its
    // contacts but the one being set down.
    const seed: (
      stance: IAutoMovieMotionHumanSupport.IStance,
      from: IAutoMovieMotionHumanPosture,
      place: Place,
    ) => IAutoMovieMotionHumanPosture = (
      stance: IAutoMovieMotionHumanSupport.IStance,
      from: IAutoMovieMotionHumanPosture,
      place: Place,
    ): IAutoMovieMotionHumanPosture =>
      stance.prefer === undefined ? from : preference(stance, from, place);

    // Each key: one fit on its contacts, whose seed is selected by constraint violation.
    const keys: IKey[] = [
      { posture: preferred, seconds: 0, name: "start", contacts: inherited, place: locate(0) },
    ];
    const push: (key: IKey) => void = (key: IKey): void => {
      keys.push(key);
      recordFloors(key.posture, key.contacts);
    };
    let seconds: number = 0;
    stances.forEach((stance: IAutoMovieMotionHumanSupport.IStance, i: number): void => {
      const move: number = stance.seconds ?? SECONDS;
      const place: Place = locate(i);
      const before: IAutoMovieMotionHumanPosture = keys[keys.length - 1]!.posture;
      const previous: readonly IAutoMovieMotionHumanSupport.IContact[] =
        i === 0 ? [] : stances[i - 1]!.contacts;
      const added: IAutoMovieMotionHumanSupport.IContact[] = stance.contacts.filter(
        (c: IAutoMovieMotionHumanSupport.IContact): boolean =>
          !previous.some((p: IAutoMovieMotionHumanSupport.IContact): boolean =>
            supportContact.same(p, c),
          ),
      );
      // A limb set down anew (another target, a foot to its knee, a `step`)
      // lets go, swings over the middle of its step clear of the surface and
      // sets down while the rest bear: a contact broken, then made (Escande,
      // Kheddar and Miossec 2013); a limb never bears in two places at once.
      const left: (p: IAutoMovieMotionHumanSupport.IContact) => boolean = (
        p: IAutoMovieMotionHumanSupport.IContact,
      ): boolean =>
        !stance.contacts.some((s: IAutoMovieMotionHumanSupport.IContact): boolean =>
          supportContact.same(s, p),
        );
      const from: (
        m: IAutoMovieMotionHumanSupport.IContact,
      ) => IAutoMovieMotionHumanSupport.IContact | undefined = (
        m: IAutoMovieMotionHumanSupport.IContact,
      ): IAutoMovieMotionHumanSupport.IContact | undefined =>
        previous.find(
          (p: IAutoMovieMotionHumanSupport.IContact): boolean =>
            left(p) &&
            supportContact.limb(p.part) === supportContact.limb(m.part),
        );
      const moved: IAutoMovieMotionHumanSupport.IContact[] = added.filter(
        (c: IAutoMovieMotionHumanSupport.IContact): boolean => from(c) !== undefined,
      );
      const kept: IAutoMovieMotionHumanSupport.IContact[] = previous.filter(
        (p: IAutoMovieMotionHumanSupport.IContact): boolean =>
          !(
            left(p) &&
            moved.some(
              (m: IAutoMovieMotionHumanSupport.IContact): boolean =>
                supportContact.limb(m.part) === supportContact.limb(p.part),
            )
          ),
      );
      if (i > 0 && moved.length > 0) {
        // The lift still stands in the stance it leaves: it keeps that
        // stance's posture and starts from the key before; the set-down
        // places the limb where the stance it arrives at lays it, from the
        // lift, which holds every support but the swinging limb's.
        const leaving: IAutoMovieMotionHumanSupport.IStance = stances[i - 1]!;
        const oldPlace: Place = keys.at(-1)!.place;
        seconds += move / 3;
        push({
          posture: supportKey.solved(
            body,
            preference(leaving, before, oldPlace),
            before,
            kept,
            oldPlace,
            `lift${i}`,
            MISS,
            moved.flatMap(
              (m: IAutoMovieMotionHumanSupport.IContact): IAutoMovieMotionHumanBodyFitTypes.ITarget[] => {
                const was: IAutoMovieMotionHumanSupport.IContact = from(m)!;

                const top: IAutoMovieMotionHumanBodyFitTypes.ITarget | null = supportContact.swing(
                  form,
                  m,
                  oldPlace(was),
                  place(m),
                  crawl.LIFT,
                );
                if (top === null) return [];
                if (!m.part.endsWith("Foot")) return [top];
                // The toe joint's elevation alone leaves the ankle free to
                // point the heel into the floor. Level the rigid hindfoot
                // beneath the raised toe, preserving its free heading.
                const heel: IAutoMovieHumanoidSurfaces.IFrame =
                  body.surfaces.sockets[m.part === "leftFoot" ? "heelLeft" : "heelRight"];
                return [top, {
                  bone: heel.bone,
                  axes: [],
                  goal: top.goal,
                  normal: { local: heel.normal, world: { x: 0, y: -1, z: 0 } },
                }];
              },
            ),
          ),
          seconds,
          name: `lift${i}`,
          contacts: kept,
          place: oldPlace,
        });
        seconds += move / 3;
        const union: IAutoMovieMotionHumanSupport.IContact[] = [...kept, ...added];
        push({
          posture: supportKey.solved(
            body,
            preference(stance, keys[keys.length - 1]!.posture, place),
            keys[keys.length - 1]!.posture,
            union,
            place,
            `bear${i}`,
            MISS,
            [],
          ),
          seconds,
          name: `bear${i}`,
          contacts: union,
          place,
        });
        seconds += move / 3;
      } else if (i > 0 && (added.length > 0 || (paired !== undefined && i === 1))) {
        const union: IAutoMovieMotionHumanSupport.IContact[] = [...previous, ...added];
        // The helped performer sets the feet down halfway from take to seat.
        // The helper needs the same grip key to follow the same timed course.
        const midway: Place = paired !== undefined && i === 1 ? locate(i - 0.5) : place;
        seconds += move / 2;
        push({
          posture: supportKey.solved(
            body,
            preference(stance, before, midway),
            before,
            union,
            midway,
            `bear${i}`,
            MISS,
            [],
          ),
          seconds,
          name: `bear${i}`,
          contacts: union,
          place: midway,
        });
        seconds += move / 2;
      } else seconds += move;
      push({
        posture: supportKey.solved(
          body,
          preference(stance, keys[keys.length - 1]!.posture, place),
          i === 0
            ? seed(stance, keys[keys.length - 1]!.posture, place)
            : keys[keys.length - 1]!.posture,
          stance.contacts,
          place,
          `stance${i}`,
          MISS,
          [],
        ),
        seconds,
        name: stance.event ?? `stance${i}`,
        contacts: stance.contacts,
        place,
      });
    });
    const duration: number = seconds;
    const contacts: IAutoMovieMotionHumanActionPlan["contacts"] = supportWindows.of(context, keys, duration);
    const follow: ReturnType<typeof prepareSupportHelperGrip> = prepareSupportHelperGrip(context, contacts, duration);
    const intervals: ReturnType<typeof prepareSupportInterval>[] = keys
      .slice(0, Math.max(1, keys.length - 1))
      .map(
        (key: IKey, i: number): ReturnType<typeof prepareSupportInterval> =>
          prepareSupportInterval(
            body,
            key,
            keys[Math.min(i + 1, keys.length - 1)]!,
            key.place,
          ),
      );

    return supportBalance(context, {
      duration,
      events: keys.slice(1).map((k: IKey): { name: string; share: number } => ({
        name: k.name,
        share: k.seconds / duration,
      })),
      contacts,
      settle: (): void => {
        for (const interval of intervals) interval.settle();
      },
      posture: (
        t: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
        projection?: ReturnType<typeof prepareHumanPostureProjection>,
      ): IAutoMovieMotionHumanPosture => {
        const s: number = Math.min(duration, Math.max(0, t));
        let k: number = 0;
        let hi: number = keys.length - 2;
        while (k < hi) {
          const mid: number = Math.ceil((k + hi) / 2);
          if (keys[mid]!.seconds <= s) k = mid;
          else hi = mid - 1;
        }
        const a: IKey = keys[k]!;
        const b: IKey = keys[Math.min(k + 1, keys.length - 1)]!;
        const span: number = b.seconds - a.seconds;
        const w: number =
          span > 0 ? minimumJerk.share((s - a.seconds) / span) : 1;
        if (w === 0) return k === 0 ? entry : a.posture;
        if (w === 1) return b.posture;

        // Between keys the root pins one common contact and each held hand
        // and foot is fitted to where the keys hold it. Floor contacts rest
        // on their colliders; raised contacts keep their world height,
        // bounded by floor nonpenetration.
        const posed: IAutoMovieMotionHumanPosture = intervals[k]!.write(w, resolution, projection);
        return follow?.(posed, s, _channels) ?? posed;
      },
    });
  }

  /** A key posture of the plan. */
  interface IKey {
    /** The posture, by joint angles alone. */
    posture: IAutoMovieMotionHumanPosture;

    /** When it is reached, seconds since the action's start. */
    seconds: number;

    /** Its event's name. */
    name: string;

    /** The contacts it rests on. */
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[];

    /** The contact positions used to form this key's goals. */
    place: Place;
  }
}
