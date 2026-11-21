import {
  type ArchetypeRide,
  EquineCare,
  EquineExpression,
  type EquineExpressionCue,
  EquineStance,
  HorseSaddleProp,
  createGroomingBrush,
  createHalter,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanLeadHorse,
  HumanObject,
  HumanPerformance,
  HumanTendHorse,
} from "@automovie/motions";

/**
 * The staged handler-and-horse take of `test_motion_equestrian_handler`: the horse's ride, stance and expression on one clock, its care points, the brush, halter and saddle props, and the handler's chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the take stages and who reads it.
 * @evidence contracts/development/design.md#principled-representation A take record and its builder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace equestrianHandlerTake {
  /**
   * The horse producer's model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it names.
   * @evidence contracts/development/design.md#principled-representation The producer's or the take's own record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Horse = ReturnType<typeof createHorse>;

  /**
   * A horse ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it names.
   * @evidence contracts/development/design.md#principled-representation The producer's or the take's own record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Ride = ArchetypeRide.IRide<
    createHorse.Affordance,
    createHorse.Dimension
  >;

  /**
   * The horse prop's model and readers for one displayed ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it names.
   * @evidence contracts/development/design.md#principled-representation The producer's or the take's own record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStagedHorse {
    /** The prop model: the horse's contacts and its care points. */
    model: IAutoMovieMotionHumanObject.IModel;

    /** The horse's world placement at a film second. */
    place: (at: number) => IAutoMovieRigidTransform;

    /** A contact's world frame at a film second. */
    part: (id: string, at: number) => IAutoMovieTransform;
  }

  /**
   * One staged take: the film, the horse's displayed ride and its care points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it names.
   * @evidence contracts/development/design.md#principled-representation The producer's or the take's own record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITake {
    /** The handler's performance. */
    film: HumanPerformance;

    /** The horse as displayed. */
    horse: Ride;

    /** The horse's contact frames, care points included, at a film second. */
    part: (id: string, at: number) => IAutoMovieTransform;

    /** The horse prop's contacts at rest, care points included. */
    affordances: readonly IAutoMovieAffordance[];

    /** The halter fitted to the horse. */
    halter: ReturnType<typeof createHalter>;

    /** Where the halter hangs before it is taken. */
    hook: IAutoMovieVector3;

    /** Where the saddle's origin rests before it is taken. */
    rack: IAutoMovieVector3;
  }

  /** The body brush the handler grooms with. */
  export const BRUSH: ReturnType<typeof createGroomingBrush> =
    createGroomingBrush();

  /**
   * Rehearse the handler's carriers, then lay the horse's responses on their clock and stage the take.
   *
   * @param body The handler's body.
   * @param brushPoint The horse's care point the brush strokes.
   * @returns The staged take.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the take returned.
   * @evidence contracts/development/implementation.md#principled-implementation The handler's carriers do not depend on the horse, so one rehearsal over the halted horse fixes the clock the horse's stance and expression cues are laid on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Ride, props, chain, rehearsal, horse cues, final performance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two performances are built; sampling is the caller's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The chain and prop builders serve both performances.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The take holds its performance and rides for the caller.
   */
  export function take(
    body: IAutoMovieMotionHumanBody,
    brushPoint: string,
  ): ITake {
    // A bareback horse is saddled from a saddle made of the same horse's own saddle parts.
    const horse: Horse = createHorse(
      { tack: "bareback", withersHeight: 1.6, tempo: 0 },
      5,
    );
    const saddle: ReturnType<typeof HorseSaddleProp.of> = HorseSaddleProp.of(
      createHorse({ tack: "saddle", withersHeight: 1.6, tempo: 0 }, 5),
      horse,
    );
    // The handler leads the horse in on a straight approach; its progress is later matched to the handler's walk.
    const approach = (course: IMatchedCourse): Ride =>
      rideHorse(
        horse,
        {
          start: { x: 0, z: 0, heading: 0 },
          cruise: course.cruise,
          startSpeed: 0,
          endSpeed: 0,
          acceleration: course.acceleration,
          deceleration: course.deceleration,
          startFromStanding: true,
          legs: [{ kind: "straight", length: LEAD }],
        },
        "walk",
      );
    let ride: Ride = approach({
      length: LEAD,
      cruise: 1.2,
      acceleration: 1,
      deceleration: 1,
    });
    const care: EquineCare.IPoints = EquineCare.of(horse);
    const halt: ArchetypeRide.ISample<
      createHorse.Affordance,
      createHorse.Dimension
    > = ride.at(ride.duration);
    const girth: IAutoMovieTransform = care.frame(halt, "groomLeft");
    const hoofAt: IAutoMovieVector3 = care.frame(
      halt,
      "leftForeHoof",
    ).translation;
    const beside: IAutoMovieVector3 = {
      x: hoofAt.x + 0.32,
      y: 0,
      z: hoofAt.z - 0.2,
    };
    const leadAt: IAutoMovieVector3 =
      horse.affordance("lead").frame.translation;
    const handlerStart: IAutoMovieVector3 = {
      x: leadAt.x + 0.35,
      y: 0,
      z: leadAt.z - 0.15,
    };
    const spot: IAutoMovieVector3 = {
      x: girth.translation.x + 0.38,
      y: 0,
      z: girth.translation.z + 0.3,
    };

    // The brush waits on a shelf at the handler's right front, its back up.
    const shelf: IAutoMovieVector3 = {
      x: girth.translation.x + 0.23,
      y: 1,
      z: girth.translation.z + 0.05,
    };
    // The halter, fitted to this horse's head, hangs on a hook at the handler's left front.
    const headPart: IAutoMovieModelPart = horse.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === "head",
    )!;
    const halter: ReturnType<typeof createHalter> = createHalter({
      length:
        headPart.geometry.type === "primitive" &&
        headPart.geometry.shape.type === "capsule"
          ? headPart.geometry.shape.height
          : NaN,
      radius:
        headPart.geometry.type === "primitive" &&
        headPart.geometry.shape.type === "capsule"
          ? headPart.geometry.shape.radius
          : NaN,
    });
    const hook: IAutoMovieVector3 = {
      x: girth.translation.x + 0.2,
      y: 1.25,
      z: girth.translation.z + 0.65,
    };
    // The saddle rests on a rack at the handler's left front with its pommel about 1.05 m up; its origin is the saddled model's.
    const pommel: IAutoMovieVector3 =
      saddle.affordance("grip").frame.translation;
    const rack: IAutoMovieVector3 = {
      x: spot.x - 0.25 - pommel.x,
      y: 1.05 - pommel.y,
      z: spot.z + 0.25 - pommel.z,
    };
    const performer: IAutoMovieMotionHumanPerformer = {
      subject: "handler",
      body,
      at: handlerStart,
      yaw: 0,
      proficiency: { level: "trained" },
    };
    const walked: IAutoMovieMotionHumanChain = HumanChain.subject(
      "handler",
    ).walk({
      to: { ...handlerStart, z: handlerStart.z + LEAD },
      face: 0,
    });
    const chain = (leading: number | null): IAutoMovieMotionHumanChain =>
      (leading === null
        ? walked
        : walked.over(
            (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
              hand.registered("leadHorse", {
                on: "horse",
                side: "right",
                seconds: 0.79 * leading,
                transition: 0.1 * leading,
              }),
          )
      )
        .walk({ to: spot, face: -90 })
        .pickUp({ prop: "brush", handle: "grip", hand: "right" })
        .stand({ seconds: 4 })
        .over(
          (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            hand.registered("tendHorse", {
              on: "horse",
              side: "right",
              point: brushPoint,
              task: "brush",
              seconds: 3.6,
              transition: 0.6,
              stroke: 0.3,
              tool: { prop: "brush", face: "face" },
            }),
        )
        .putDown({ prop: "brush", hand: "right", at: shelf })
        .pickUp({ prop: "halter", handle: "grip", hand: "right" })
        .putDown({
          prop: "halter",
          hand: "right",
          onto: { prop: "horse", point: "headgear", via: "seat" },
        })
        .pickUp({ prop: "saddle", handle: "grip", hand: "right" })
        .walk({ to: { ...spot, x: girth.translation.x + 0.2 }, face: -90 })
        .putDown({
          prop: "saddle",
          hand: "right",
          onto: { prop: "horse", point: "saddle", via: "seat" },
        })
        .walk({ to: beside, face: -90 })
        .crouch({ depth: "full", hold: 4 }, "low")
        .over(
          (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            hand.registered("tendHorse", {
              on: "horse",
              side: "right",
              point: "leftForeHoof",
              task: "hoof",
              seconds: 3.4,
              transition: 0.6,
            }),
        );
    const prop = (shown: Ride): IStagedHorse => {
      const model: IAutoMovieMotionHumanObject.IModel = {
        affordances: [...horse.affordances, ...care.affordances],
        shapes: (): ReturnType<Horse["shapes"]> => horse.shapes(),
        hasArticulations: false,
      };
      const place = (at: number): IAutoMovieRigidTransform => {
        const frame: IAutoMovieTransform = shown.at(at).placement;
        return { position: frame.translation, rotation: frame.rotation };
      };
      const part = (id: string, at: number): IAutoMovieTransform =>
        care.affordances.some((a: IAutoMovieAffordance): boolean => a.id === id)
          ? care.frame(shown.at(at), id)
          : shown.frame(id as createHorse.Affordance, at);
      return { model, place, part };
    };
    const stage = (shown: Ride, leading: number | null): HumanPerformance => {
      const { model, place, part } = prop(shown);
      return new HumanPerformance({
        seed: "equine-handler",
        performers: [performer],
        laws: [HumanTendHorse, HumanLeadHorse],
        props: [
          HumanObject.prop("horse", model, place(0), place, part),
          HumanObject.prop("brush", BRUSH, { at: shelf, yaw: 0, fixed: false }),
          HumanObject.prop("halter", halter, { at: hook, yaw: 0 }),
          HumanObject.prop("saddle", saddle, { at: rack, yaw: 0 }),
        ],
        composition: chain(leading).node,
      });
    };

    // The handler's carriers do not depend on the horse, so a rehearsal fixes the clock the horse's course and responses are laid on: the approach is matched to the hips' displayed progress through the leading walk.
    // While the handler tends it, the halted horse holds its head lowered to the handler's chest, so the halter can be put on.
    const chest: IAutoMovieVector3 = { x: spot.x - 0.3, y: 0.8, z: spot.z };
    const lowered: EquineExpressionCue.IReach = {
      kind: "reach",
      act: "sniff",
      from: ride.duration + 0.5,
      to: ride.duration + HEAD_DOWN,
      ease: 0.9,
      target: { kind: "point", point: chest },
      gap: 0.12,
    };
    const rehearsal: HumanPerformance = stage(
      EquineExpression.layer(horse, ride, [lowered]),
      null,
    );
    const walking: IAutoMovieMotionHumanSegment =
      rehearsal.segments("handler")[0]!;
    const span: number = walking.end - walking.start;
    const hips = (at: number): number =>
      rehearsal.bones("handler", at).get("hips")!.worldPosition.z;
    const step: number = span / PROGRESS_SAMPLES;
    const progress: readonly number[] = Array.from(
      { length: PROGRESS_SAMPLES + 1 },
      (_: unknown, i: number): number =>
        hips(walking.start + i * step) - hips(walking.start),
    );
    ride = approach(matchCourse(progress, step));
    lowered.from = ride.duration + 0.5;
    lowered.to = ride.duration + HEAD_DOWN;
    const holds: readonly IAutoMovieMotionHumanSegment[] =
      rehearsal.overlays("handler");
    const hoof: IAutoMovieMotionHumanSegment = holds[1]!;
    const leading: number = span;
    const stance: Ride = EquineStance.after(horse, ride, [
      {
        kind: "hoof",
        limb: "leftFore",
        from: hoof.start - 1.2,
        entry: 1.4,
        hold: hoof.end - hoof.start - 0.6,
        exit: 1,
      },
      {
        kind: "startle",
        from: hoof.end + 1.5,
        entry: 0.15,
        hold: 0.5,
        exit: 0.8,
      },
    ]);
    const shown: Ride = EquineExpression.layer(horse, stance, [
      lowered,
      {
        kind: "ear",
        side: "left",
        carriage: "lateral",
        from: hoof.start,
        to: hoof.end,
        ease: 0.3,
      },
      {
        kind: "ear",
        side: "right",
        carriage: "forward",
        from: hoof.end + 1.4,
        to: hoof.end + 3,
        ease: 0.2,
      },
    ]);
    const { part } = prop(shown);
    return {
      film: stage(shown, leading),
      horse: shown,
      part,
      affordances: [...horse.affordances, ...care.affordances],
      halter,
      hook,
      rack,
    };
  }

  /** Seconds after the halt the horse keeps its head lowered to the handler: long enough for the brushing, the halter and the saddle. */
  const HEAD_DOWN: number = 28;

  /** Metres the handler leads the horse in. */
  const LEAD: number = 3;

  /** Samples of the rehearsed walk's progress the approach is matched to. */
  const PROGRESS_SAMPLES: number = 120;

  /**
   * A straight approach whose progress follows a walker's rehearsed progress.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation The length and the trapezoidal speed profile.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the approach course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IMatchedCourse {
    /** Metres walked. */
    length: number;

    /** The walker's steady speed, m/s. */
    cruise: number;

    /** The start's acceleration whose distance lag equals the walker's, m/s². */
    acceleration: number;

    /** The stop's deceleration whose distance lag equals the walker's, m/s². */
    deceleration: number;
  }

  /** Match a trapezoidal course to a walker's displayed progress: a steady walk is the line `p(t) = v t - lag`, and a trapezoid reaching `v` at constant acceleration `a` lags its own steady line by `v² / 2a`, so equal lags give equal steady progress; the stop is matched the same way from the walk's end. */
  function matchCourse(
    progress: readonly number[],
    step: number,
  ): IMatchedCourse {
    const count: number = progress.length - 1;
    const from: number = Math.floor(count / 4);
    const to: number = Math.ceil((3 * count) / 4);
    let st: number = 0;
    let sp: number = 0;
    let stt: number = 0;
    let stp: number = 0;
    for (let i: number = from; i <= to; i++) {
      const t: number = i * step;
      st += t;
      sp += progress[i]!;
      stt += t * t;
      stp += t * progress[i]!;
    }
    const n: number = to - from + 1;
    const cruise: number = (n * stp - st * sp) / (n * stt - st * st);
    const startLag: number = (cruise * st - sp) / n;
    const length: number = progress[count]!;
    const stopLag: number = cruise * count * step - length - startLag;
    if (!(cruise > 0 && startLag > 0 && stopLag > 0))
      throw new Error("The rehearsed walk has no steady stretch to match");
    return {
      length,
      cruise,
      acceleration: (cruise * cruise) / (2 * startLag),
      deceleration: (cruise * cruise) / (2 * stopLag),
    };
  }
}
