import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
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
import { getUp } from "../floor/getUp";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareSupportFloor } from "./prepareSupportFloor";
import { prepareSupportPreference } from "./prepareSupportPreference";
import { supportAssist } from "./supportAssist";
import { supportContact } from "./supportContact";
import { supportCourse } from "./supportCourse";
import { supportKey } from "./supportKey";
import { supportPlan } from "./supportPlan";
import { supportStep } from "./supportStep";

/**
 * Offset decay time of a cut from a support sequence into standing, seconds
 * (provisional: no study of the transition was located).
 */
const BLEND: number = 0.3;

/**
 * Moving the body's weight across a sequence of supports: each stance's
 * contacts (`HumanSupport.IStance`) solved into one static key posture, and the
 * body carried from key to key with every new contact placed and bearing before
 * any contact the next stance lacks lets go.
 *
 * A key posture is the static multi-contact posture nearest the posture the
 * body enters with that puts every contact on its target and keeps every joint
 * in its range (HumanBodyFit, Bouyarmane and Kheddar 2010, Escande et al.
 * 2013). An explicit positive balance request uses the fitted world contacts
 * and the selected part on the prepared clock. Each new key is solved from the
 * key before it, as a planner grows its next stance from its parent. Between
 * two stances the planner solves a third key on the union of both stances'
 * contacts, so the new contacts bear before the old ones release (Escande et
 * al.'s transition configurations, in both stances at once), except a part the
 * stance lets go free (`IStance.free`), which bears no more from the stance's
 * start and hangs as the posture carries it; the body moves between keys on a
 * minimum-jerk course in joint space (Flash and Hogan 1985), each joint on its
 * own range (`blendHumanJoint`). A part that bears in two stances in a row on
 * different targets steps: the planner first solves a key without its old
 * contact, the part over the middle of its step lifted a stepping limb's rise
 * (`crawl.LIFT`) clear of the higher end and bearing on nothing, then the
 * transition key with it set down, so a contact is broken before it is made
 * again; a foot stepping across the floor lifts over its old place and lowers
 * from over its new one instead, so it never travels within the floor band
 * (`supportStep`). Along the joint-space course the root keeps the first common
 * contact on its point, and every held hand and foot is then fitted by its own
 * two-bone chain to where the two keys hold it (`prepareSupportInterval`); a
 * held knee or trunk contact rides the root pin and the floor bound alone. A
 * staged route may add a course (`supportCourse`): a stepping foot then passes
 * the course's world waypoints over a fixture edge, one lift key per waypoint
 * and a straight toe course between them, and a foot the course names as level
 * bears flat with its heel level at every key and through every interval that
 * holds it. A contact no key posture reaches is refused with the contact, its
 * stance and the miss.
 *
 * A bearing foot lies on the floor at its toes' joint with its toes flat; a
 * bearing hand lies on its palm laid flat on the surface; on the floor a knee
 * bears on its shin and the trunk on its colliders, resting on their lowest
 * points, and on a raised surface each lays its own skin flat on it (the knee,
 * the seat, the upper back or the abdomen); a contact held across stances
 * without a place stays where it was first laid; a gripping hand closes on its
 * target at its grip. Each move takes `SECONDS` (provisional: no study of the
 * timing of a general support sequence was located) or its stance's own, a
 * step's third of it each to lift, to set down and to settle. Events: `lift<i>`
 * when the move into stance `i` has its stepping parts at the top of their
 * swing, `bear<i>` when it has placed its new contacts, `stance<i>` (or the
 * stance's own event) when stance `i` is held alone. The plan lets overlays
 * move the head and any arm and hand that have no contact window in the
 * sequence.
 */
export namespace support {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "support";

  /**
   * Cancel table: a support sequence stands up from any stance it holds on its
   * feet.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: BLEND }],
  };

  /** Seconds a move into a stance takes (provisional). */
  export const SECONDS: number = 1;

  /**
   * How far a contact may miss its target, millimetres: the give of a pressed
   * skin the audits read a contact with
   * (`AutoMovieMotionHumanAuditSkin.BUILT`).
   */
  export const MISS: number = AutoMovieMotionHumanAuditSkin.BUILT * 1000;

  /**
   * Plan a support sequence.
   *
   * @param context The action's context.
   * @param course A staged route's waypoints, level feet and window reader; the
   *   ordinary sequence when absent.
   * @returns The plan.
   * @throws {HumanRefusal} When there is no stance, a stance's seconds are not
   *   positive, or a key posture leaves a contact more than `MISS` off its
   *   target.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSupport.IParams>,
    course?: supportCourse.ICourse,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    // Each contact marked by the stance it was set down in.
    const authored: readonly IAutoMovieMotionHumanSupport.IStance[] =
      context.params.stances;
    const stances: readonly IAutoMovieMotionHumanSupport.IStance[] =
      supportContact.placements(
        context.params.assist === undefined || authored.length === 0
          ? authored
          : [
              ...authored.slice(0, -1),
              { ...authored.at(-1)!, prefer: getUp.quiet(body) },
            ],
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
          (
            j: IAutoMovieJointPose,
          ): [AutoMovieHumanoidBone, readonly [number, number, number]] => [
            j.bone,
            [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0],
          ],
        ),
      ),
      limbs: {},
    };

    // Each stance's key second: the end of its move, the instant its key is
    // solved at.
    const ends: number[] = [];
    for (const stance of stances)
      ends.push((ends.at(-1) ?? 0) + (stance.seconds ?? SECONDS));

    // Each contact's target. A prop moves on its own track, which the scene
    // knows at every second, so a contact on a prop is read where the prop
    // stands at the key that places it (a hand on a crutch the walk carries
    // forward); every other target is read once at the start, a partner's
    // pose being unsettled while the schedule is still being placed.
    const at = (
      c: IAutoMovieMotionHumanSupport.IContact,
      seconds: number = 0,
    ): Point => {
      if (c.target === undefined) return null;
      if (c.target !== "on")
        return context.aim(
          c.target,
          context.start + (c.target.kind === "prop" ? seconds : 0),
        ).point;
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
        context.aim(on, context.start + (on.kind === "prop" ? seconds : 0))
          .point,
        entry.yaw,
      );
    };

    const paired: ReturnType<typeof supportAssist> = supportAssist(context);
    const { inherited, laid, recordFloors } = prepareSupportFloor(
      body,
      context.entry,
      stances[0]!.contacts,
      (c: IAutoMovieMotionHumanSupport.IContact): Point =>
        paired?.(c, 0) ?? at(c),
      context,
    );
    const locate: (phase: number, seconds: number) => Place =
      (phase: number, seconds: number): Place =>
      (c: IAutoMovieMotionHumanSupport.IContact): Point =>
        paired?.(c, phase) ??
        at(c, seconds) ??
        laid.get(supportContact.id(c)) ??
        null;

    // Root translation may differ at the bridge and its following stance.
    // Both place the same authored angular configuration and floor shape.
    const preference: ReturnType<typeof prepareSupportPreference> =
      prepareSupportPreference(body, preferred);

    // A course's level feet keep their heels level on their fixture.
    const heels = (
      contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
      place: Place,
    ): IAutoMovieMotionHumanBodyFitTypes.ITarget[] =>
      supportCourse.levels(body, course, contacts, place);

    // Every key and swing on this body shares the same anatomical datums.
    const form: ReturnType<typeof supportContact.prepareForm> =
      supportContact.prepareForm(body);

    // A key's solve starts from the nearest posture that already bears on
    // its contacts: an l1 penalty method started from a far parent can stop
    // at a stationary point of the violation (Nocedal and Wright 2006,
    // chapter 17). The first stance starts from its stated posture, else
    // the entry; every later key from the key before, which bears on all its
    // contacts but the one being set down.
    const keys: supportPlan.IKey[] = [
      {
        posture: preferred,
        seconds: 0,
        name: "start",
        contacts: inherited,
        place: locate(0, 0),
      },
    ];
    const push: (key: supportPlan.IKey) => void = (
      key: supportPlan.IKey,
    ): void => {
      keys.push(key);
      recordFloors(key.posture, key.contacts);
    };
    // The waypoint courses of stepping feet, by the interval they span.
    const routes: Map<number, supportCourse.ILeg[]> = new Map();
    let seconds: number = 0;
    stances.forEach(
      (stance: IAutoMovieMotionHumanSupport.IStance, i: number): void => {
        const move: number = stance.seconds ?? SECONDS;
        const place: Place = locate(i, ends[i]!);
        const before: IAutoMovieMotionHumanPosture =
          keys[keys.length - 1]!.posture;
        // A part the stance lets go free bears no more from its start: it is
        // neither held through the move nor kept beside the new contacts.
        const previous: readonly IAutoMovieMotionHumanSupport.IContact[] =
          i === 0
            ? []
            : stances[i - 1]!.contacts.filter(
                (c: IAutoMovieMotionHumanSupport.IContact): boolean =>
                  stance.free?.includes(c.part) !== true,
              );
        const added: IAutoMovieMotionHumanSupport.IContact[] =
          stance.contacts.filter(
            (c: IAutoMovieMotionHumanSupport.IContact): boolean =>
              !previous.some(
                (p: IAutoMovieMotionHumanSupport.IContact): boolean =>
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
          !stance.contacts.some(
            (s: IAutoMovieMotionHumanSupport.IContact): boolean =>
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
          (c: IAutoMovieMotionHumanSupport.IContact): boolean =>
            from(c) !== undefined,
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
          seconds = supportStep({
            body,
            index: i,
            keys,
            push,
            course,
            routes,
            moved,
            from,
            kept,
            added,
            leaving: { ...stances[i - 1]!, contacts: previous },
            stance,
            oldPlace: keys.at(-1)!.place,
            place,
            preference,
            heels,
            form,
            miss: MISS,
            seconds,
            move,
          });
        } else if (
          i > 0 &&
          (added.length > 0 || (paired !== undefined && i === 1))
        ) {
          const union: IAutoMovieMotionHumanSupport.IContact[] = [
            ...previous,
            ...added,
          ];
          // The helped performer sets the feet down halfway from take to seat.
          // The helper needs the same grip key to follow the same timed course.
          const midway: Place =
            paired !== undefined && i === 1
              ? locate(i - 0.5, (ends[i - 1]! + ends[i]!) / 2)
              : place;
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
              heels(union, midway),
              form,
            ),
            seconds,
            name: `bear${i}`,
            contacts: union,
            place: midway,
          });
          seconds += move / 2;
        } else seconds += move;
        const prior: supportPlan.IKey = keys.at(-1)!;
        const arriving: IAutoMovieMotionHumanPosture = prior.posture;
        const intended: IAutoMovieMotionHumanPosture = preference(
          stance,
          arriving,
          place,
        );
        const held: boolean =
          prior.place === place &&
          prior.contacts.length === stance.contacts.length &&
          stance.contacts.every(
            (c: IAutoMovieMotionHumanSupport.IContact): boolean =>
              prior.contacts.some(
                (p: IAutoMovieMotionHumanSupport.IContact): boolean =>
                  supportContact.same(c, p),
              ),
          );
        push({
          posture: supportKey.solved(
            body,
            intended,
            i === 0 && stance.prefer !== undefined ? intended : arriving,
            stance.contacts,
            place,
            `stance${i}`,
            MISS,
            heels(stance.contacts, place),
            form,
            held,
          ),
          seconds,
          name: stance.event ?? `stance${i}`,
          contacts: stance.contacts,
          place,
        });
      },
    );
    return supportPlan(context, keys, seconds, entry, course, routes);
  }
}

/** A support point in world metres, or an unnamed floor place. */
type Point = IAutoMovieVector3 | null;

/** A key's fixed contact lookup. */
type Place = (contact: IAutoMovieMotionHumanSupport.IContact) => Point;
