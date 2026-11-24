import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeUnits,
  createCart,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A wagon and a carriage stand on their sources' running gear, and towed through a turn their front axle turns with the pole while the rear axle tracks inside it.
 *
 * Scenarios:
 * 1. The wagon's hind wheels are 58 in and its front wheels 46 in across, a 60 in track apart, the front axle's pivot 73 in ahead of the hind axle, and its tongue's end 128 in from the front axle hanging 24 in above the ground (the Army's specification of 1882); its `bed` is its body's inside 120 by 42 in.
 * 2. A carriage at four seeds has its doors' hinges and openings on both sides, its `box` over the front axle, and every measured dimension inside its museum band.
 * 3. Towed by its `coupling` with `front` set to its pivot and `frontAxle`, through a straight, a quarter turn of 10 m radius and a straight, the wagon keeps its coupling on the hitch within 1e-6 m at every second read, its front axle turned to the left through the turn and back within a degree of straight twenty metres into the straight after it, and its hind axle nearer the turn's centre than its front axle's pivot through the turn's second half.
 * 4. A turn tighter than the front axle's lock is refused when the ride is made, naming the lock.
 */
export function test_unit_archetypes_core_ride_towed_wagon(): void {
  const findings: string[] = [];
  const close = (a: number, b: number, tolerance: number = 1e-9): boolean =>
    Math.abs(a - b) <= tolerance;
  const gap = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));
  const wagon: AutoMovieArchetype<createCart.Affordance, createCart.Dimension> =
    createCart({ kind: "wagon" });
  const at = (
    cart: AutoMovieArchetype<createCart.Affordance, createCart.Dimension>,
    id: createCart.Affordance,
  ): IAutoMovieVector3 => cart.affordance(id).frame.translation;

  // The wagon's running gear and body.
  const pivot: IAutoMovieVector3 = at(wagon, "frontAxle");
  if (
    !close(at(wagon, "rearLeftSpin").y, 29 * AutoMovieArchetypeUnits.INCH) ||
    !close(at(wagon, "frontLeftSpin").y, 23 * AutoMovieArchetypeUnits.INCH)
  )
    findings.push("the wagon's wheels are not the specification's");
  if (
    !close(
      at(wagon, "rearLeftSpin").x - at(wagon, "rearRightSpin").x,
      60 * AutoMovieArchetypeUnits.INCH,
    )
  )
    findings.push("the wagon's track is not 5 ft");
  if (!close(pivot.z, 73 * AutoMovieArchetypeUnits.INCH))
    findings.push(
      `the wagon's pivot is ${pivot.z / AutoMovieArchetypeUnits.INCH} in ahead of the hind axle`,
    );
  const tip: IAutoMovieVector3 = at(wagon, "coupling");
  if (
    !close(tip.y, 24 * AutoMovieArchetypeUnits.INCH) ||
    !close(gap(tip, pivot), 128 * AutoMovieArchetypeUnits.INCH)
  )
    findings.push("the wagon's tongue is not 10 ft 8 in hanging to 2 ft");
  const bed: IAutoMovieAffordance = wagon.affordance("bed");
  if (
    !close(bed.depth!, 120 * AutoMovieArchetypeUnits.INCH) ||
    !close(bed.width!, 42 * AutoMovieArchetypeUnits.INCH)
  )
    findings.push("the wagon's bed is not the body's inside");

  // The carriage.
  for (const seed of [0, 3, 7, 12]) {
    const carriage: AutoMovieArchetype<
      createCart.Affordance,
      createCart.Dimension
    > = createCart({ kind: "carriage" }, seed);
    for (const id of [
      "leftDoor",
      "rightDoor",
      "leftAperture",
      "rightAperture",
      "seat",
    ] as const)
      if (
        carriage.affordances.every((a: { id: string }): boolean => a.id !== id)
      )
        findings.push(`carriage@${seed}: no ${id}`);
    if (!close(at(carriage, "box").z - 0.225, carriage.dimensions.wheelbase!))
      findings.push(`carriage@${seed}: the box is not over the front axle`);
    for (const [dimension, band] of Object.entries(createCart.BANDS.carriage)) {
      const value: number =
        carriage.dimensions[dimension as createCart.Dimension]!;
      if (
        band !== undefined &&
        !(value >= band.minimum && value <= band.maximum)
      )
        findings.push(`carriage@${seed}: ${dimension} outside its band`);
    }
  }

  // Towed through a quarter turn.
  const course: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 20 },
      { kind: "turn", radius: 10, angle: 90 },
      { kind: "straight", length: 40 },
    ],
    cruise: 2,
    acceleration: 1,
    deceleration: 1,
  };
  const leader: AutoMovieArchetypeRide.IRide<"hitch", never> =
    AutoMovieArchetypeRide.along(hitched(), course);
  const towed: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "hitch", wagon, "coupling", {
    support: createCart.towing(wagon),
    front: { pivot, turn: "frontAxle" },
  });
  const centre: IAutoMovieVector3 = Vector3.create(10, 0, 20);
  const flat = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.create(p.x, 0, p.z);
  let turned: number = 0;
  let inside: number = 0;
  let outside: number = 0;
  let straight: number = Number.POSITIVE_INFINITY;
  for (let seconds: number = 0; seconds <= towed.duration; seconds += 0.5) {
    const sample: AutoMovieArchetypeRide.ISample<
      createCart.Affordance,
      createCart.Dimension
    > = towed.at(seconds);
    if (
      gap(
        towed.frame("coupling", seconds).translation,
        leader.frame("hitch", seconds).translation,
      ) > 1e-6
    )
      findings.push(`the coupling leaves the hitch at ${seconds} s`);
    const angle: number = sample.archetype.travel("frontAxle");
    turned = Math.max(turned, angle);
    const hitch: IAutoMovieVector3 = leader.frame("hitch", seconds).translation;
    const placement: IAutoMovieTransform = sample.placement;
    const rear: IAutoMovieVector3 = placement.translation;
    const front: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
      placement,
      AutoMovieArchetypeFrame.upright(pivot),
    ).translation;
    const progress: number = sample.course.distance;
    if (
      progress > 20 + (Math.PI * 10) / 4 &&
      progress < 20 + (Math.PI * 10) / 2
    ) {
      if (gap(flat(rear), centre) < gap(flat(front), centre)) inside++;
      else outside++;
    }
    if (hitch.x > 10 + 20) straight = Math.min(straight, -Math.abs(angle));
  }
  if (!(turned > 1))
    findings.push(
      `the front axle turned at most ${turned} degrees through the turn`,
    );
  if (!(inside > 0 && outside === 0))
    findings.push(
      `the hind axle ran inside the front axle at ${inside} reads and outside at ${outside}`,
    );
  if (!(-straight < 1))
    findings.push(
      `the front axle is still ${-straight} degrees over on the straight after`,
    );

  // An over-tight turn.
  try {
    AutoMovieArchetypeRide.towed(
      AutoMovieArchetypeRide.along(hitched(), {
        ...course,
        legs: [
          { kind: "straight", length: 5 },
          { kind: "turn", radius: 1, angle: 180 },
        ],
      }),
      "hitch",
      wagon,
      "coupling",
      {
        front: { pivot, turn: "frontAxle" },
        support: createCart.towing(wagon),
      },
    );
    findings.push("a turn past the lock was admitted");
  } catch (error) {
    if (
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.axis !== "front" ||
      error.feasible?.kind !== "range" ||
      error.feasible.maximum !== createCart.WAGON.lock
    )
      findings.push(`a turn past the lock failed otherwise: ${String(error)}`);
  }
  TestValidator.equals(
    "the four-wheelers stand and trail as their gear makes them",
    findings,
    [],
  );
}

/**
 * A leader: a box on the floor with a hitch ahead of it.
 *
 * @returns The leader.
 */
function hitched(): AutoMovieArchetype<"hitch", never> {
  return new AutoMovieArchetypeBuilder<"hitch", never>({
    material: "steel",
    name: "leader",
    draw: new AutoMovieArchetypeDrawSession<never>("fixture", {}, undefined),
  })
    .box("body", Vector3.create(1, 1, 1), Vector3.create(0, 0.5, 0))
    .affordance({
      id: "hitch",
      kind: "hook",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 1, -1)),
      extent: null,
    })
    .build(500);
}
