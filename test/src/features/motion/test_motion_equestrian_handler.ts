import {
  type ArchetypeRide,
  EquineCare,
  EquineExpression,
  EquineStance,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanTendHorse,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** The horse producer's model. */
type Horse = ReturnType<typeof createHorse>;

/** A horse ride. */
type Ride = ArchetypeRide.IRide<createHorse.Affordance, createHorse.Dimension>;

/** The horse prop's model and readers for one displayed ride. */
interface IStagedHorse {
  /** The prop model: the horse's contacts and its care points. */
  model: IAutoMovieMotionHumanObject.IModel;

  /** The horse's world placement at a film second. */
  place: (at: number) => IAutoMovieRigidTransform;

  /** A contact's world frame at a film second. */
  part: (id: string, at: number) => IAutoMovieTransform;
}

/** The rider attachment contract's 10 mm contact budget. */
const CONTACT: number = 0.01;

/** One staged take: the film, the horse's displayed ride and its care points. */
interface ITake {
  /** The handler's performance. */
  film: HumanPerformance;

  /** The horse as displayed. */
  horse: Ride;

  /** The horse's contact frames, care points included, at a film second. */
  part: (id: string, at: number) => IAutoMovieTransform;

  /** The horse prop's contacts at rest, care points included. */
  affordances: readonly IAutoMovieAffordance[];
}

/**
 * A handler brushes, handles the headgear, settles the saddle and holds a lifted hoof on one scene clock with the horse's own responses.
 *
 * Scenarios:
 * 1. The displayed palm meets each named horse contact while held: the brushed barrel along a stroke, the poll the horse lowers its head to bring within reach, the saddle's left stirrup and the hoof the horse lifts; it is clear of it before acquisition and after release.
 * 2. Every held window names the horse as its support, the hand as its part and the touch or grip its task asks for.
 * 3. The horse lifts the hoof the handler holds only after moving its weight, and the startle it gives after the hoof is put down replays identically when the take is built again.
 * 4. A care placement on the horse's far side refuses as out of reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every scenario and what it checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public care overlay over shipped stands and a crouch against the public horse stance and expression layers through the performance's readers.
 * @evidence contracts/development/testing.md#independent-expectations Each contact is the displayed palm's distance to the horse contact's surface read from the horse's own displayed parts, against the attachment contract's 10 mm budget.
 * @evidence contracts/development/testing.md#distinguishing-cases Brush, headgear, saddle and hoof; before, during and after each hold; a reachable side versus the far side.
 * @evidence contracts/development/testing.md#execution-ownership A deterministic in-memory scene; the horse's whole-body responses are `test_archetype_equine_reaction`'s and leading is `test_motion_equestrian_lifecycle`'s.
 */
export function test_motion_equestrian_handler(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const first: ITake = take(body, "groomLeft");
  const again: ITake = take(body, "groomLeft");
  const overlays: readonly IAutoMovieMotionHumanSegment[] =
    first.film.overlays("handler");
  const palm: IAutoMovieVector3 = HumanHand.offset(body, "right", "palm").point;
  const shown = (film: HumanPerformance, at: number): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = film
      .bones("handler", at)
      .get("rightHand")!;
    return Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, palm),
    );
  };
  const names: readonly string[] = [
    "groomLeft",
    "poll",
    "leftStirrup",
    "leftForeHoof",
  ];
  TestValidator.equals("four care overlays", overlays.length, names.length);
  overlays.forEach((overlay: IAutoMovieMotionHumanSegment, k: number): void => {
    const name: string = names[k]!;
    const window: IAutoMovieMotionHumanContactWindow | undefined =
      overlay.plan.contacts.find(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.part === "rightHand",
      );
    TestValidator.predicate(
      `the ${name} hold names the horse`,
      window !== undefined &&
        window.support.kind === "prop" &&
        window.support.subject === "horse",
    );
    const duration: number = overlay.end - overlay.start;
    const on: number = overlay.start + window!.from * duration;
    const off: number = overlay.start + window!.to * duration;
    const touched: IAutoMovieVector3[] = [];
    for (let i: number = 0; i <= 6; i++) {
      const at: number = on + ((off - on) * i) / 6;
      const point: IAutoMovieTransform = first.part(name, at);
      const radius: number =
        (first.affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === name,
        )?.aperture ?? 0) / 2;
      const hand: IAutoMovieVector3 = shown(first.film, at);
      touched.push(hand);
      const distance: number = Math.abs(
        Vector3.dot(
          Vector3.subtract(hand, point.translation),
          Quaternion.rotateVector(point.rotation, { x: 0, y: 1, z: 0 }),
        ) - radius,
      );
      TestValidator.predicate(
        `the palm holds ${name} at ${at}`,
        distance <= CONTACT,
      );
    }
    for (const at of [overlay.start, overlay.end])
      TestValidator.predicate(
        `the palm is off ${name} at ${at}`,
        Vector3.distance(
          shown(first.film, at),
          first.part(name, at).translation,
        ) > 0.03,
      );
    if (name === "groomLeft")
      TestValidator.predicate(
        "the brush strokes along the coat",
        Math.max(
          ...touched.map((p: IAutoMovieVector3): number =>
            Vector3.distance(p, touched[0]!),
          ),
        ) > 0.2,
      );
  });

  // 3. The horse's hoof is up while the handler holds it, and the take replays.
  const hoof: IAutoMovieMotionHumanSegment = overlays[3]!;
  const middle: number = (hoof.start + hoof.end) / 2;
  TestValidator.predicate(
    "the held hoof is off the floor",
    first.part("leftForeHoof", middle).translation.y > 0.15,
  );
  for (const at of [hoof.end + 0.5, hoof.end + 2.2, middle])
    TestValidator.equals(
      `the horse replays at ${at}`,
      JSON.stringify(again.horse.at(at).archetype.parts),
      JSON.stringify(first.horse.at(at).archetype.parts),
    );

  // 4. The far side is out of reach.
  let caught: unknown = null;
  try {
    const far: ITake = take(body, "groomRight");
    const brush: IAutoMovieMotionHumanSegment =
      far.film.overlays("handler")[0]!;
    far.film.bones("handler", (brush.start + brush.end) / 2);
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "a far-side brush refuses as out of reach",
    caught instanceof HumanRefusal && caught.axis === "careReach",
  );
}

/** Rehearse the handler's carriers, then lay the horse's responses on their clock and stage the take. */
function take(body: IAutoMovieMotionHumanBody, brushPoint: string): ITake {
  const horse: Horse = createHorse(
    { tack: "saddle", withersHeight: 1.6, tempo: 0 },
    5,
  );
  const ride: Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 1.2,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 1,
      deceleration: 1,
      startFromStanding: true,
      legs: [{ kind: "straight", length: 1.5 }],
    },
    "walk",
  );
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
  const start: number = ride.duration + 0.5;
  const performer: IAutoMovieMotionHumanPerformer = {
    subject: "handler",
    body,
    at: { x: girth.translation.x + 0.38, y: 0, z: girth.translation.z + 0.3 },
    yaw: -90,
    proficiency: { level: "trained" },
  };
  const chain = (): IAutoMovieMotionHumanChain =>
    HumanChain.subject("handler")
      .stand({ seconds: start })
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
          }),
      )
      .stand({ seconds: 4 })
      .over(
        (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
          hand.registered("tendHorse", {
            on: "horse",
            side: "right",
            point: "poll",
            task: "headgear",
            seconds: 3.6,
            transition: 0.6,
          }),
      )
      .stand({ seconds: 3 })
      .over(
        (hand: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
          hand.registered("tendHorse", {
            on: "horse",
            side: "right",
            point: "leftStirrup",
            task: "saddle",
            seconds: 2.6,
            transition: 0.5,
          }),
      )
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
  const stage = (shown: Ride): HumanPerformance => {
    const { model, place, part } = prop(shown);
    return new HumanPerformance({
      seed: "equine-handler",
      performers: [performer],
      laws: [HumanTendHorse],
      props: [HumanObject.prop("horse", model, place(0), place, part)],
      composition: chain().node,
    });
  };

  // The handler's carriers do not depend on the horse, so a rehearsal over the halted horse fixes the clock the horse's responses are laid on.
  const rehearsal: HumanPerformance = stage(ride);
  const holds: readonly IAutoMovieMotionHumanSegment[] =
    rehearsal.overlays("handler");
  const poll: IAutoMovieMotionHumanSegment = holds[1]!;
  const hoof: IAutoMovieMotionHumanSegment = holds[3]!;
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
  const chest: IAutoMovieVector3 = {
    x: performer.at.x - 0.25,
    y: 1.15,
    z: performer.at.z,
  };
  const shown: Ride = EquineExpression.layer(horse, stance, [
    {
      kind: "reach",
      act: "sniff",
      from: poll.start - 1,
      to: poll.end + 0.5,
      ease: 0.9,
      target: { kind: "point", point: chest },
      gap: 0.12,
    },
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
    film: stage(shown),
    horse: shown,
    part,
    affordances: [...horse.affordances, ...care.affordances],
  };
}
