import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { crawl } from "../floor/crawl";
import { supportContact } from "./supportContact";
import { supportCourse } from "./supportCourse";
import { supportKey } from "./supportKey";
import type { supportPlan } from "./supportPlan";

/**
 * The keys of one step: the stepping limbs let go and swing while the rest
 * bear, then set down (a contact broken, then made: Escande, Kheddar and
 * Miossec 2013). A course routes a foot over its waypoints, one lift key per
 * waypoint, the lift's two thirds of the move shared evenly among the
 * stretches. A foot stepping across the floor with no course lifts clear
 * before it travels and sets down from above its new place: one lift key
 * over its old place and one over its new, each a stepping limb's rise
 * (`crawl.LIFT`) up, so its sole leaves and meets the floor vertically and
 * never travels within the floor band. A swing that only rose over the
 * middle of the step carried the sole across the floor at lift-off and
 * set-down (the staged clinch's 1.3 m/s skates). Any other step keeps the
 * single mid-step lift.
 *
 * @param props The step's limbs, places, solver and clock.
 * @returns The seconds after the set-down key.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the keys of each kind of step, the clearance and the case that showed it.
 * @evidence contracts/development/implementation.md#principled-implementation A step is break-then-make; a floor step clears the floor over both ends before and after it travels, the new end read from the set-down key's own solve.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The crossings, the lift keys, then the set-down key.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every key is the shared support solve; a contact the fit misses is refused there.
 * @evidence contracts/development/implementation.md#efficient-algorithms One solve per key; a floor step adds one key.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the swing target, the course's writers and the support key solve.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Pushes keys and retains nothing.
 */
export function supportStep(props: supportStep.IProps): number {
  const { body, keys, push, form, oldPlace, place, kept, added } = props;
  let seconds: number = props.seconds;
  const crossings: supportCourse.ICrossing[] = props.moved.map(
    (
      contact: IAutoMovieMotionHumanSupport.IContact,
    ): supportCourse.ICrossing => {
      const was: IAutoMovieMotionHumanSupport.IContact = props.from(contact)!;
      return {
        contact,
        previous: was,
        waypoints: props.course?.via?.(was, contact) ?? [],
      };
    },
  );
  // A foot stepping across the floor with no course clears it at both ends.
  const cleared: supportCourse.ICrossing[] = crossings.filter(
    (crossing: supportCourse.ICrossing): boolean => {
      const old: IAutoMovieVector3 | null = oldPlace(crossing.previous);
      return (
        crossing.waypoints.length === 0 &&
        crossing.contact.part.endsWith("Foot") &&
        old !== null &&
        supportContact.onFloorTarget(old) &&
        place(crossing.contact) === null
      );
    },
  );
  const up = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(point, { x: 0, y: crawl.LIFT, z: 0 });
  const steps: number = Math.max(
    cleared.length > 0 ? 2 : 1,
    ...crossings.map(
      (crossing: supportCourse.ICrossing): number => crossing.waypoints.length,
    ),
  );
  const interval: number =
    steps === 1 ? props.move / 3 : (2 * props.move) / (3 * (steps + 1));
  const route = (stretch: number): void => {
    const legs: supportCourse.ILeg[] = supportCourse.swings(
      props.yaw,
      crossings,
      stretch,
      steps,
      oldPlace,
      place,
    );
    if (legs.length === 0) return;
    const phase: number = keys.length - 1;
    props.routes.set(phase, [...(props.routes.get(phase) ?? []), ...legs]);
  };
  const union: IAutoMovieMotionHumanSupport.IContact[] = [...kept, ...added];
  const setDown = (
    from: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture =>
    supportKey.solved(
      body,
      props.preference(props.stance, from, place),
      from,
      union,
      place,
      `bear${props.index}`,
      props.miss,
      props.heels(union, place),
      form,
    );
  // The set-down key, solved once the first lift is known, places each
  // cleared foot's new end.
  let landed: IAutoMovieMotionHumanPosture | undefined;
  let above: Map<supportCourse.ICrossing, IAutoMovieVector3> | undefined;
  const over = (
    crossing: supportCourse.ICrossing,
    l: number,
  ): IAutoMovieVector3 | undefined => {
    if (crossing.waypoints.length > 0)
      return crossing.waypoints[Math.min(l, crossing.waypoints.length - 1)];
    if (!cleared.includes(crossing)) return undefined;
    if (l === 0) return up(oldPlace(crossing.previous)!);
    if (above === undefined) {
      landed = setDown(keys.at(-1)!.posture);
      const ends: IAutoMovieVector3[] = supportContact.points(
        body,
        landed,
        cleared.map(
          (d: supportCourse.ICrossing): supportStep.Anchor => ({
            contact: d.contact,
            at: null,
          }),
        ),
      );
      above = new Map(
        cleared.map(
          (
            c: supportCourse.ICrossing,
            k: number,
          ): [supportCourse.ICrossing, IAutoMovieVector3] => [c, up(ends[k]!)],
        ),
      );
    }
    return above.get(crossing);
  };
  for (let l: number = 0; l < steps; l++) {
    route(l);
    const start: IAutoMovieMotionHumanPosture = keys.at(-1)!.posture;
    const lift: string =
      l === 0 ? `lift${props.index}` : `lift${props.index}Via${l + 1}`;
    seconds += interval;
    push({
      posture: supportKey.solved(
        body,
        props.preference(props.leaving, start, oldPlace),
        start,
        kept,
        oldPlace,
        lift,
        props.miss,
        [
          ...props.heels(kept, oldPlace),
          ...crossings.flatMap(
            (
              crossing: supportCourse.ICrossing,
            ): IAutoMovieMotionHumanBodyFitTypes.ITarget[] => {
              const top: IAutoMovieMotionHumanBodyFitTypes.ITarget | null =
                supportContact.swing(
                  form,
                  crossing.contact,
                  oldPlace(crossing.previous),
                  place(crossing.contact),
                  crawl.LIFT,
                  over(crossing, l),
                );
              if (top === null) return [];
              if (!crossing.contact.part.endsWith("Foot")) return [top];
              // The toe joint's elevation alone leaves the ankle free to
              // point the heel into the floor; level the rigid hindfoot
              // beneath the raised toe.
              return [
                top,
                supportCourse.heel(body, crossing.contact.part, top.goal),
              ];
            },
          ),
        ],
        form,
      ),
      seconds,
      name: lift,
      contacts: kept,
      place: oldPlace,
    });
  }
  route(steps);
  seconds += interval;
  push({
    posture: landed ?? setDown(keys.at(-1)!.posture),
    seconds,
    name: `bear${props.index}`,
    contacts: union,
    place,
  });
  return seconds + props.move / 3;
}

/**
 * Companion types of {@link supportStep}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
 * @evidence contracts/development/design.md#principled-representation The step's limbs and stances, the two place lookups, the shared solver's inputs and the clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `support.plan` hands its steps.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the support law's contact, stance, key and course types.
 */
export namespace supportStep {
  /** A contact to read on a posture, with its target or null for an unnamed floor place (`supportContact.points`). */
  export type Anchor = Parameters<typeof supportContact.points>[2][number];

  /** A contact's place lookup. */
  export type Place = (
    contact: IAutoMovieMotionHumanSupport.IContact,
  ) => IAutoMovieVector3 | null;

  /** One step of the support sequence. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The stance's index. */
    index: number;

    /** The keys so far, the last the step's start. */
    keys: readonly supportPlan.IKey[];

    /** Appends a key. */
    push: (key: supportPlan.IKey) => void;

    /** The heading a course's foot keeps, degrees. */
    yaw: number;

    /** The staged route, if any. */
    course: supportCourse.ICourse | undefined;

    /** The stepping foot courses by interval, extended in place. */
    routes: Map<number, supportCourse.ILeg[]>;

    /** The contacts that set down anew. */
    moved: readonly IAutoMovieMotionHumanSupport.IContact[];

    /** The contact a moved one leaves. */
    from: (
      contact: IAutoMovieMotionHumanSupport.IContact,
    ) => IAutoMovieMotionHumanSupport.IContact | undefined;

    /** The contacts that bear through the step. */
    kept: readonly IAutoMovieMotionHumanSupport.IContact[];

    /** The stance's new contacts. */
    added: readonly IAutoMovieMotionHumanSupport.IContact[];

    /** The stance the step leaves. */
    leaving: IAutoMovieMotionHumanSupport.IStance;

    /** The stance it arrives at. */
    stance: IAutoMovieMotionHumanSupport.IStance;

    /** The places of the key before. */
    oldPlace: Place;

    /** The places of the arriving stance. */
    place: Place;

    /** The stance's preferred posture over a key, by its places. */
    preference: (
      stance: IAutoMovieMotionHumanSupport.IStance,
      from: IAutoMovieMotionHumanPosture,
      place: Place,
    ) => IAutoMovieMotionHumanPosture;

    /** The course's level-heel goals of the contacts. */
    heels: (
      contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
      place: Place,
    ) => IAutoMovieMotionHumanBodyFitTypes.ITarget[];

    /** The plan's contact forms. */
    form: ReturnType<typeof supportContact.prepareForm>;

    /** How far a contact may miss its target, millimetres. */
    miss: number;

    /** Seconds since the start at the step's start. */
    seconds: number;

    /** The move's seconds. */
    move: number;
  }
}
