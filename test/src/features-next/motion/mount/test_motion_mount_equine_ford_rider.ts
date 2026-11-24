import { AutoMovieArchetypeFrame } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieCapsuleShape,
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { equineFordRider } from "../../../features/internal/equineFordRider";
import { equineRiderContacts } from "../../../features/internal/equineRiderContacts";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/** Seconds a figure change takes: the stirrups let go at the float and retaken at the landing. */
const TRANSFER: number = 0.6;

/** The rider's head region kept over the water: the head bone's centre at least this far above it, metres, an authored margin for the jaw below the head joint. */
const HEAD: number = 0.12;

/**
 * A rider stays seated on a horse wading a ford, swimming it with the feet out of the stirrups, and taking the stirrups back as the horse lands on the far shelf.
 *
 * Scenarios:
 * 1. While wading and after the landing, the rider's seat socket stays within 10 mm of the saddle's seat, the left wrist holds the mane (within 0.7 hand lengths of it, slipping less than 10 mm, the vault spec's handle criterion), and the right palm stays within 10 mm of its rein's skin. While the horse swims, the seat and both holds stay, the feet are out of the stirrups (a swimming horse's rider takes them out, so a rolling horse cannot trap them; scenario 2), and the head bone's centre is at least 0.12 m above the water. At every read instant each ankle lies outside the horse's barrel (its trunk capsule).
 * 2. The mounted law's stirrup windows close at the float, stay closed through the swim and reopen within the landing figure's transfer, held to the halt.
 * 3. The take passes the shipped take verdicts: no tangle, jump, turn, reversal, skate, floor or unloaded fault.
 * The far bank's unreachable shelf is refused by the crossing itself, pinned by test_archetype_equine_ford; the floating crossing belongs to test_archetype_equine_ford_float and the mounted climb out with the lead-out to test_archetype_equine_ford_leadout.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted laws on the public crossing and reads the displayed seat, palms, feet and head against the horse's moving saddle, mane, rein, stirrups and the authored water; a rider left behind at a cut, a hand off its hold or a submerged head fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm tolerance is the seated rider specs'; contacts are the horse's own affordances on the posed horse; the water is the stage's authored height.
 * @evidence contracts/development/testing.md#distinguishing-cases Wading, swimming and landing figures on one clock; the horse's own crossing belongs to test_archetype_equine_ford.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_motion_mount_equine_ford_rider(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const staged: equineFordRider.IStage = equineFordRider.stage();
  const { float, land, halt } = staged;
  const settled: number = equineFordRider.settled(staged, body);
  const film: HumanPerformance = equineFordRider.perform(
    staged,
    body,
    equineFordRider.mount(staged, [
      {
        seat: "entered",
        transfer: 0.4,
        hold: float - settled - 0.4,
        supports: equineFordRider.WADING,
      },
      {
        seat: "entered",
        transfer: TRANSFER,
        hold: land - float - TRANSFER,
        supports: equineFordRider.SWIMMING,
      },
      {
        seat: "entered",
        transfer: TRANSFER,
        hold: halt - land - TRANSFER,
        supports: equineFordRider.WADING,
      },
    ]),
  );
  const issues: string[] = [];

  // The horse's barrel: its trunk capsule carried by its placement.
  const trunk: IAutoMovieModelPart = staged.horse.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "trunk",
  )!;
  const geometry: IAutoMovieModelPart["geometry"] = trunk.geometry;
  if (geometry.type !== "primitive" || geometry.shape.type !== "capsule")
    throw new Error("The horse's trunk is a capsule");
  const capsule: IAutoMovieCapsuleShape = geometry.shape;
  const barrel = (point: IAutoMovieVector3, at: number): number => {
    const placed: IAutoMovieRigidTransform = staged.place(at);
    const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
      {
        translation: placed.position,
        rotation: placed.rotation,
        scale: AutoMovieArchetypeFrame.UNIT,
      },
      trunk.transform!,
    );
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(point, frame.translation),
    );
    const along: number = Math.max(
      -capsule.height / 2,
      Math.min(capsule.height / 2, local.y),
    );
    return Math.hypot(local.x, local.y - along, local.z) - capsule.radius;
  };

  // 1. Seated through the crossing.
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  let grasped: IAutoMovieVector3 | undefined;
  const instants: readonly [number, string][] = [
    [float - 1.5, "wading"],
    [float + 1.5, "swimming"],
    [land - 1, "swimming"],
    [land + TRANSFER + 0.3, "climbing"],
  ];
  for (const [at, phase] of instants) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("rider", at);
    const saddle: IAutoMovieTransform = staged.part("seat", at);
    const seat: number = Math.abs(
      Quaternion.rotateVector(
        Quaternion.inverse(saddle.rotation),
        Vector3.subtract(
          HumanSignature.region(reader, "seat", at),
          saddle.translation,
        ),
      ).y,
    );
    if (!(seat <= TOLERANCE))
      issues.push(
        `${phase} ${at.toFixed(2)}: seat ${(seat * 1000).toFixed(1)} mm from the saddle`,
      );
    // The mane is held as the vault spec holds a handle: the wrist within 0.7 hand lengths of it, not slipping.
    const mane: IAutoMovieTransform = staged.part("mane", at);
    const wrist: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(mane.rotation),
      Vector3.subtract(bones.get("leftHand")!.worldPosition, mane.translation),
    );
    grasped ??= wrist;
    const slip: number =
      Vector3.length(wrist) > 0.7 * body.measure.hand
        ? Infinity
        : Vector3.distance(wrist, grasped);
    if (!(slip <= TOLERANCE))
      issues.push(
        `${phase} ${at.toFixed(2)}: left hand ${slip} m off the mane`,
      );
    const held: number = equineRiderContacts.rein(
      body,
      bones,
      "right",
      staged.part("rightRein", at),
      equineFordRider.affordance(staged, "rightRein"),
    );
    if (!(held <= TOLERANCE))
      issues.push(
        `${phase} ${at.toFixed(2)}: right palm ${(held * 1000).toFixed(1)} mm from rightRein`,
      );
    for (const side of ["left", "right"] as const) {
      const ankle: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
      if (!(barrel(ankle, at) > 0))
        issues.push(
          `${phase} ${at.toFixed(2)}: the ${side} ankle is inside the horse's barrel`,
        );
    }
    if (phase !== "swimming") continue;
    const head: number =
      bones.get("head")!.worldPosition.y - equineFordRider.WATER;
    if (!(head >= HEAD))
      issues.push(
        `${phase} ${at.toFixed(2)}: head only ${head} m above the water`,
      );
  }

  // 2. The stirrup windows: closed through the swim, reopened at the landing's seat-in.
  const mounted: IAutoMovieMotionHumanSegment = film
    .segments("rider")
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.law.name === "mounted",
    )!;
  const span: number = mounted.end - mounted.start;
  for (const side of ["left", "right"] as const) {
    const windows: readonly [number, number][] = mounted.plan.contacts
      .filter(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.part === `${side}Foot` && contact.support.kind === "prop",
      )
      .map((contact: IAutoMovieMotionHumanContactWindow): [number, number] => [
        mounted.start + contact.from * span,
        mounted.start + contact.to * span,
      ]);
    if (
      windows.some(
        ([from, to]: [number, number]): boolean =>
          from < land && to > float + TRANSFER,
      )
    )
      issues.push(`the ${side} stirrup window stays open through the swim`);
    if (
      !windows.some(
        ([from, to]: [number, number]): boolean =>
          from >= land && from <= land + TRANSFER && to >= halt - TRANSFER,
      )
    )
      issues.push(
        `the ${side} stirrup window does not reopen at the landing's seat-in`,
      );
  }
  TestValidator.equals(
    "the rider crosses seated with the head out of the water",
    issues,
    [],
  );

  // 3. The take's verdicts.
  assertTakeClean("the seated crossing", film);
}
