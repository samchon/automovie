import { AutoMovieArchetypeEquine, AutoMovieArchetypeEquineCare, AutoMovieArchetypeEquineExpression, type AutoMovieArchetypeEquineExpressionCue, AutoMovieArchetypeEquineSaddleProp, AutoMovieArchetypeEquineStance, type AutoMovieArchetypeRide, AutoMovieArchetypeHorseRide, AutoMovieArchetypeHalter, AutoMovieArchetypeGroomingBrush, AutoMovieArchetypeHorse } from "@automovie/archetypes";
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
  AutoMovieMotionHumanMount,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { equineLeadOut } from "./equineLeadOut";

/**
 * The staged handler-and-horse takes of `test_motion_mount_equestrian_handler`, one short take per task, each starting where its acceptance begins: leading the horse in, brushing it with a picked-up brush, putting the halter on, saddling it, and holding a lifted hoof through the horse's weight shift and startle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each take stages and who reads it.
 * @evidence contracts/development/design.md#principled-representation A scene name, a take record and its builder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace equestrianHandlerTake {
  /**
   * The horse producer's model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it names.
   * @evidence contracts/development/design.md#principled-representation The producer's record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Horse = ReturnType<typeof AutoMovieArchetypeHorse.create>;

  /**
   * A horse ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it names.
   * @evidence contracts/development/design.md#principled-representation The producer's record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Ride = AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >;

  /**
   * One short take: leading in, brushing, putting the halter on, saddling, or holding a lifted hoof.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each take.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `take` stages.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Scene = "lead" | "brush" | "headgear" | "saddle" | "hoof";

  /**
   * The horse prop's model and readers for one displayed ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it names.
   * @evidence contracts/development/design.md#principled-representation The take's own record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStagedHorse {
    /** The prop model: the horse's contacts and its care points. */
    model: IAutoMovieMotionHumanObject.IModel;

    /** The horse's world placement at a take second. */
    place: (at: number) => IAutoMovieRigidTransform;

    /** A contact's world frame at a take second. */
    part: (id: string, at: number) => IAutoMovieTransform;
  }

  /**
   * One staged take: the film, the horse's displayed ride on the take's clock and its care points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it names.
   * @evidence contracts/development/design.md#principled-representation The take's own record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the handler test.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITake {
    /** The handler's performance. */
    film: HumanPerformance;

    /** The horse as displayed, on the take's clock. */
    horse: (
      at: number,
    ) => AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >;

    /** The horse's contact frames, care points included, at a take second. */
    part: (id: string, at: number) => IAutoMovieTransform;

    /** The horse prop's contacts at rest, care points included. */
    affordances: readonly IAutoMovieAffordance[];

    /** The halter fitted to the horse. */
    halter: ReturnType<typeof AutoMovieArchetypeHalter.create>;

    /** Where the halter hangs before it is taken. */
    hook: IAutoMovieVector3;

    /** Where the saddle's origin rests before it is taken. */
    rack: IAutoMovieVector3;
  }

  /** The body brush the handler grooms with. */
  export const BRUSH: ReturnType<typeof AutoMovieArchetypeGroomingBrush.create> =
    AutoMovieArchetypeGroomingBrush.create();

  /**
   * Stage one short take.
   *
   * @param body The handler's body.
   * @param brushPoint The horse's care point the brush strokes.
   * @param scene The take.
   * @returns The staged take.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the take returned.
   * @evidence contracts/development/implementation.md#principled-implementation The lead-in matches the horse's approach to a rehearsal of the handler's walk; every other take starts with the horse halted, the take's clock offset to the halt, and the hoof take rehearses the handler's crouch to lay the horse's weight shift, lift and startle on its clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shared staging, one chain per scene, at most one rehearsal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each take builds only its own short performance, and a rehearsal only where its clock needs one.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The props and placements serve every scene.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The take holds its performance and ride for the caller.
   */
  export function take(
    body: IAutoMovieMotionHumanBody,
    brushPoint: string,
    scene: Scene,
  ): ITake {
    // A bareback horse is saddled from a saddle made of the same horse's own saddle parts.
    const horse: Horse = AutoMovieArchetypeHorse.create(
      { tack: "bareback", withersHeight: 1.6, tempo: 0 },
      5,
    );
    const saddle: ReturnType<typeof AutoMovieArchetypeEquineSaddleProp.of> =
      AutoMovieArchetypeEquineSaddleProp.of(
        AutoMovieArchetypeHorse.create({ tack: "saddle", withersHeight: 1.6, tempo: 0 }, 5),
        horse,
      );
    // The handler leads the horse in on a straight approach; its progress is matched to the handler's walk in the lead-in.
    const approach = (course: equineLeadOut.IMatchedCourse): Ride =>
      AutoMovieArchetypeHorseRide.ride(
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
    const care: AutoMovieArchetypeEquineCare.IPoints =
      AutoMovieArchetypeEquineCare.of(horse);
    const halt: AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
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

    // The brush waits on a shelf at the handler's right front, an arm's reach out from the hip, its back up.
    const shelf: IAutoMovieVector3 = {
      x: spot.x - 0.2,
      y: 1,
      z: spot.z - 0.4,
    };
    // The halter, fitted to this horse's head, hangs on a hook at the handler's left front.
    const headPart: IAutoMovieModelPart = horse.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === "head",
    )!;
    const halter: ReturnType<typeof AutoMovieArchetypeHalter.create> = AutoMovieArchetypeHalter.create({
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

    // Each take starts where its task does: the lead-in at the horse's head, the brush, halter and saddle at the girth, the hoof beside the foreleg.
    const where: IAutoMovieVector3 =
      scene === "lead" ? handlerStart : scene === "hoof" ? beside : spot;
    const performer: IAutoMovieMotionHumanPerformer = {
      subject: "handler",
      body,
      at: where,
      yaw: scene === "lead" ? 0 : -90,
      proficiency: { level: "trained" },
    };
    const handler: IAutoMovieMotionHumanChain = HumanChain.subject("handler");
    const chain = (leading: number | null): IAutoMovieMotionHumanChain => {
      if (scene === "lead") {
        const walked: IAutoMovieMotionHumanChain = handler.walk({
          to: { ...handlerStart, z: handlerStart.z + LEAD },
          face: 0,
        });
        return leading === null
          ? walked
          : walked.over(
              (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
                hand.registered("leadHorse", {
                  on: "horse",
                  hand: "right",
                  duration: 0.79 * leading,
                  transition: 0.1 * leading,
                }),
            );
      }
      if (scene === "brush")
        return handler
          .pickUp({ prop: "brush", handle: "grip", hand: "right" })
          .stand({ hold: 4 })
          .over(
            (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
              hand.registered("tendHorse", {
                on: "horse",
                side: "right",
                point: brushPoint,
                task: "brush",
                duration: 3.6,
                transition: 0.6,
                stroke: 0.3,
                tool: { prop: "brush", face: "face" },
              }),
          )
          .putDown({ prop: "brush", hand: "right", to: shelf });
      if (scene === "headgear")
        return handler
          .pickUp({ prop: "halter", handle: "grip", hand: "right" })
          .putDown({
            prop: "halter",
            hand: "right",
            onto: { prop: "horse", point: "headgear", via: "seat" },
          })
          .stand({ hold: 1 });
      if (scene === "saddle")
        return handler
          .pickUp({ prop: "saddle", handle: "grip", hand: "right" })
          .walk({ to: { ...spot, x: girth.translation.x + 0.2 }, face: -90 })
          .putDown({
            prop: "saddle",
            hand: "right",
            onto: { prop: "horse", point: "saddle", via: "seat" },
          })
          .stand({ hold: 1 });
      return handler.crouch({ depth: "full", hold: 4 }, "low").over(
        (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
          hand.registered("tendHorse", {
            on: "horse",
            side: "right",
            point: "leftForeHoof",
            task: "hoof",
            duration: 3.4,
            transition: 0.6,
          }),
      );
    };
    const prop = (shown: Ride, offset: number): IStagedHorse => {
      const model: IAutoMovieMotionHumanObject.IModel = {
        affordances: [...horse.affordances, ...care.affordances],
        shapes: (): ReturnType<Horse["shapes"]> => horse.shapes(),
        hasArticulations: false,
      };
      const place = (at: number): IAutoMovieRigidTransform => {
        const frame: IAutoMovieTransform = shown.at(at + offset).placement;
        return { position: frame.translation, rotation: frame.rotation };
      };
      const part = (id: string, at: number): IAutoMovieTransform =>
        care.affordances.some((a: IAutoMovieAffordance): boolean => a.id === id)
          ? care.frame(shown.at(at + offset), id)
          : shown.frame(id as AutoMovieArchetypeEquine.Affordance, at + offset);
      return { model, place, part };
    };
    const stage = (
      shown: Ride,
      offset: number,
      leading: number | null,
    ): HumanPerformance => {
      const { model, place, part } = prop(shown, offset);
      return new HumanPerformance({
        seed: "equine-handler",
        performers: [performer],
        laws: [
          AutoMovieMotionHumanMount.tendHorse,
          AutoMovieMotionHumanMount.leadHorse,
        ],
        props: [
          HumanObject.prop("horse", model, place(0), place, part),
          HumanObject.prop("brush", BRUSH, { at: shelf, yaw: 0, fixed: false }),
          HumanObject.prop("halter", halter, { at: hook, yaw: 0 }),
          HumanObject.prop("saddle", saddle, { at: rack, yaw: 0 }),
        ],
        composition: chain(leading).node,
      });
    };
    const finish = (
      shown: Ride,
      offset: number,
      film: HumanPerformance,
    ): ITake => ({
      film,
      horse: (
        at: number,
      ): AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      > => shown.at(at + offset),
      part: prop(shown, offset).part,
      affordances: [...horse.affordances, ...care.affordances],
      halter,
      hook,
      rack,
    });

    // The lead-in: a rehearsal of the handler's walk fixes the clock the horse's approach is matched to.
    if (scene === "lead") {
      const rehearsal: HumanPerformance = stage(ride, 0, null);
      const walking: IAutoMovieMotionHumanSegment =
        rehearsal.segments("handler")[0]!;
      const span: number = walking.end - walking.start;
      const hips = (at: number): number =>
        rehearsal.bones("handler", at).get("hips")!.worldPosition.z;
      const step: number = span / equineLeadOut.SAMPLES;
      const progress: readonly number[] = Array.from(
        { length: equineLeadOut.SAMPLES + 1 },
        (_: unknown, i: number): number =>
          hips(walking.start + i * step) - hips(walking.start),
      );
      ride = approach(equineLeadOut.match(progress, step));
      return finish(ride, 0, stage(ride, 0, span));
    }

    // Every other take starts with the horse halted, its clock running from the halt; the headgear take starts once the horse has lowered its head, and the hoof take once the horse has stood long enough to shift its weight before the handler holds the hoof.
    const offset: number =
      ride.duration +
      (scene === "headgear" ? LOWERED : scene === "hoof" ? SHIFT : 0);
    if (scene !== "hoof") {
      // While the handler puts the halter on, the horse holds its head lowered to the handler's chest.
      const shown: Ride =
        scene === "headgear"
          ? AutoMovieArchetypeEquineExpression.layer(horse, ride, [
              lowered(ride.duration, spot),
            ])
          : ride;
      return finish(shown, offset, stage(shown, offset, null));
    }

    // The hoof: a rehearsal fixes when the handler holds the hoof, and the horse shifts its weight, lifts it, puts it down and startles on that clock.
    const rehearsal: HumanPerformance = stage(ride, offset, null);
    const hold: IAutoMovieMotionHumanSegment =
      rehearsal.overlays("handler")[0]!;
    const stance: Ride = AutoMovieArchetypeEquineStance.after(horse, ride, [
      {
        kind: "hoof",
        limb: "leftFore",
        from: offset + hold.start - 1.2,
        entry: 1.4,
        hold: hold.end - hold.start - 0.6,
        exit: 1,
      },
      {
        kind: "startle",
        from: offset + hold.end + 1.5,
        entry: 0.15,
        hold: 0.5,
        exit: 0.8,
      },
    ]);
    const shown: Ride = AutoMovieArchetypeEquineExpression.layer(
      horse,
      stance,
      [
        {
          kind: "ear",
          side: "left",
          carriage: "lateral",
          from: offset + hold.start,
          to: offset + hold.end,
          ease: 0.3,
        },
        {
          kind: "ear",
          side: "right",
          carriage: "forward",
          from: offset + hold.end + 1.4,
          to: offset + hold.end + 3,
          ease: 0.2,
        },
      ],
    );
    return finish(shown, offset, stage(shown, offset, null));
  }

  /** The horse's head lowered to the handler's chest from just after the halt, for the halter. */
  function lowered(
    halt: number,
    spot: IAutoMovieVector3,
  ): AutoMovieArchetypeEquineExpressionCue.IReach {
    return {
      kind: "reach",
      act: "sniff",
      from: halt + 0.2,
      to: halt + HEAD_DOWN,
      ease: 0.9,
      target: { kind: "point", point: { x: spot.x - 0.3, y: 0.8, z: spot.z } },
      gap: 0.12,
    };
  }

  /** Seconds after the halt the horse keeps its head lowered to the handler: long enough to put the halter on. */
  const HEAD_DOWN: number = 12;

  /** Seconds after the halt the headgear take starts: once the lowered head has settled. */
  const LOWERED: number = 1.5;

  /** Seconds after the halt the hoof take starts: the horse's weight shift before the lift takes 1.2 s. */
  const SHIFT: number = 1.2;

  /** Metres the handler leads the horse in. */
  const LEAD: number = 3;
}
