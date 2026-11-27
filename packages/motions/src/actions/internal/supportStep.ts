import { ANKLE_DORSIFLEXION, Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBodyFitTypes, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSupport, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { shankTilt } from "../../carrier/internal/shankTilt";
import { crawl } from "../../floor/internal/crawl";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { supportContact } from "./supportContact";
import { supportCourse } from "./supportCourse";
import { supportKey } from "./supportKey";
import type { supportPlan } from "./supportPlan";

/**
 * The keys of one step: the stepping limbs let go and swing while the rest
 * bear, then set down (a contact broken, then made: Escande, Kheddar and
 * Miossec 2013). A course routes a foot over its waypoints, one lift key per
 * waypoint, the lift's two thirds of the move shared evenly among the
 * stretches. A foot stepping across the floor with no course lifts clear before
 * it travels and sets down from above its new place: one lift key over its old
 * place and one over its new, each a stepping limb's rise (`crawl.LIFT`) up, so
 * its sole leaves and meets the floor vertically and never travels within the
 * floor band. Its heel leaves first, risen as far as keeps the ankle within a
 * weightless ankle's dorsiflexion, and comes down above where the set-down key
 * lays it, so the foot does not turn on the floor; a foot stepping to a named
 * floor place comes down over that place, its heel levelled beneath the raised
 * toe, and the set-down is solved from there. A swing that only rose over the
 * middle of the step carried the sole across the floor at lift-off and set-down
 * (the staged clinch's 1.3 m/s skates). Any other step keeps the single
 * mid-step lift.
 *
 * @param props The step's limbs, places, solver and clock.
 * @returns The seconds after the set-down key.
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
  // A foot stepping across the floor with no course clears it at both ends,
  // whether its new place is named on the floor (a crutch walk's footfall)
  // or left to the set-down's solve.
  const cleared: supportCourse.ICrossing[] = crossings.filter(
    (crossing: supportCourse.ICrossing): boolean => {
      const old: IAutoMovieVector3 | null = oldPlace(crossing.previous);
      const onto: IAutoMovieVector3 | null = place(crossing.contact);
      return (
        crossing.waypoints.length === 0 &&
        crossing.contact.part.endsWith("Foot") &&
        old !== null &&
        supportContact.onFloorTarget(old) &&
        (onto === null || supportContact.onFloorTarget(onto))
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
  // A stepping foot's course keeps the heading it leaves with (turned out
  // from the body's), read once from the key it leaves.
  const first: IAutoMovieMotionHumanPosture = keys.at(-1)!.posture;
  const headings: Record<AutoMovieHumanSide, number> = {
    left: supportCourse.footHeading(body, first, "left"),
    right: supportCourse.footHeading(body, first, "right"),
  };
  const leaving: (foot: AutoMovieHumanSide) => number = (
    foot: AutoMovieHumanSide,
  ): number => headings[foot];
  // A stance that names its shoulders' height holds both shoulder joints
  // there in the step's lift keys, the body hanging on its hands.
  const height: number | undefined = props.stance.shoulders;
  const shoulders: IAutoMovieMotionHumanBodyFitTypes.ITarget[] =
    height === undefined
      ? []
      : (["leftUpperArm", "rightUpperArm"] as const).map(
          (
            bone: AutoMovieHumanoidBone,
          ): IAutoMovieMotionHumanBodyFitTypes.ITarget => ({
            bone,
            goal: { x: 0, y: height, z: 0 },
            axes: ["y"],
          }),
        );
  const route = (stretch: number): void => {
    const legs: supportCourse.ILeg[] = supportCourse.swings(
      leaving,
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
    // A named place is its own new end; the set-down is then solved from
    // the lift over it, which already stands nearest to it.
    const onto: IAutoMovieVector3 | null = place(crossing.contact);
    if (onto !== null) return up(onto);
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
  // A cleared foot's heel over its old place leaves first, as the forefoot
  // rocker lifts it: risen as far as keeps its ankle within a weightless
  // ankle's dorsiflexion over the shank the foot stood on. Over its new
  // place the heel is above where the set-down key lays it, so the foot
  // lowers onto its place without turning there.
  const heelOver = (
    crossing: supportCourse.ICrossing,
    l: number,
    start: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanBodyFitTypes.ITarget => {
    const side: AutoMovieHumanSide =
      crossing.contact.part === "leftFoot" ? "left" : "right";
    const socket: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.sockets[side === "left" ? "heelLeft" : "heelRight"];
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, l === 0 ? start : landed!),
    );
    const heel: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
      socket,
      bones.get(socket.bone)!,
    );
    let rise: number = crawl.LIFT;
    if (l === 0) {
      const toe: IAutoMovieVector3 = oldPlace(crossing.previous)!;
      const facing: IAutoMovieVector3 = Vector3.normalize({
        x: toe.x - heel.x,
        y: 0,
        z: toe.z - heel.z,
      });
      const lean: number = shankTilt(
        body,
        bones.get(`${side}UpperLeg`)!.worldPosition,
        bones.get(`${side}Foot`)!.worldPosition,
        facing,
      );
      const excess: number = Math.max(
        0,
        lean - (ANKLE_DORSIFLEXION.unloaded - supportStep.DORSAL_MARGIN),
      );
      rise +=
        Math.hypot(toe.x - heel.x, toe.z - heel.z) *
        Math.sin(excess * Quaternion.DEG2RAD);
    }
    return {
      bone: socket.bone,
      point: socket.point,
      goal: { x: heel.x, y: heel.y + rise, z: heel.z },
      axes: ["x", "y", "z"],
    };
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
        // The lift shifts the body onto the supports it keeps. Until the
        // stepping limb sets down those supports alone bear, so each later
        // key of the swing prefers the body as the key before it bore and
        // only the stepping limb travels: in single support the centre of
        // mass stays over the base of support that bears (Winter 1995, Gait
        // Posture 3:193). Preferring a stance's own posture mid-swing swung
        // the trunk back toward the middle in the air (f-small's wall step,
        // 0.11 m of eye out and back within 0.1 s).
        l === 0 ? props.preference(props.leaving, start, oldPlace) : start,
        start,
        kept,
        oldPlace,
        lift,
        props.miss,
        [
          ...props.heels(kept, oldPlace),
          ...shoulders,
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
              // Over a named place no set-down is solved yet to lay the heel
              // above, so it is levelled beneath the raised toe instead.
              if (
                cleared.includes(crossing) &&
                (l === 0 || landed !== undefined)
              )
                return [top, heelOver(crossing, l, start)];
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

/** Companion types of {@link supportStep}. */
export namespace supportStep {
  /**
   * How far short of a weightless ankle's dorsiflexion a lifting foot's heel
   * rise keeps it, degrees: the closed-form shank differs from the fitted one
   * by a few degrees (provisional, as `unloadedFoot`'s margin).
   */
  export const DORSAL_MARGIN: number = 3;

  /**
   * A contact to read on a posture, with its target or null for an unnamed
   * floor place (`supportContact.points`).
   */
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
