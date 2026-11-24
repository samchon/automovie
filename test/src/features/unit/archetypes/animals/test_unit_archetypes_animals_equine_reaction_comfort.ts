import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineComfort,
  type AutoMovieArchetypeEquineComfortCue,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equineExpressionObservation as Look } from "../../../internal/equineExpressionObservation";

/** The horse producer's model. */
type Horse = ReturnType<typeof createHorse>;

/** A horse ride. */
type Ride = AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
>;

/** A sample of a horse ride. */
type Sample = AutoMovieArchetypeRide.ISample<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
>;

/**
 * The standing horse's whole-body comfort acts over a real halt: the standing rest, pawing, a stamp, a cow-kick, a shake and the camped-out stance.
 *
 * Scenarios:
 * 1. In the standing rest the resting hind hoof bears on its toe only (its terminal bar's lower end 20 degrees behind vertical, its rim's lowest point ahead of its endpoint, on the floor), the other three hooves keep their halt places on the floor, and the hips tilt the rest's authored 3 degrees down to the resting side.
 * 2. While pawing, the pawing hoof meets the floor in every stroke's scrape and clears it in every swing, and the planted hooves do not slide; nor do they through the stamp or the shake.
 * 3. A stamp lifts its hoof and sets it back on its own place; a cow-kick swings the hind hoof forward off the floor.
 * 4. Urination camps both hind hooves back and raises the tail.
 * 5. The saddle stays fixed on the trunk and the lead rope's end on the halter throughout; between acts the horse is exactly its neutral halt.
 * 6. An act asked for while the horse walks refuses.
 */
export function test_unit_archetypes_animals_equine_reaction_comfort(): void {
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
      legs: [{ kind: "straight", length: 2 }],
    },
    "walk",
  );
  const t: number = ride.duration + 0.5;
  const acts: readonly AutoMovieArchetypeEquineComfortCue.Act[] = [
    { kind: "rest", side: "left", from: t, seconds: 6 },
    { kind: "paw", side: "right", strokes: 3, from: t + 7, seconds: 3 },
    { kind: "stamp", limb: "leftFore", from: t + 11, seconds: 0.8 },
    { kind: "cowKick", side: "right", from: t + 13, seconds: 1 },
    { kind: "shake", from: t + 15, seconds: 2 },
    { kind: "urinate", from: t + 18, seconds: 3 },
  ];
  const comfort: Ride = AutoMovieArchetypeEquineComfort.after(
    horse,
    ride,
    acts,
  );
  const halt: Sample = ride.at(ride.duration);
  const terminal = (limb: AutoMovieArchetypeQuadrupedBody.Limb): string =>
    AutoMovieArchetypeQuadrupedBody.BONES[limb][3];
  const radius = (
    sample: Sample,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): number => {
    const part: IAutoMovieModelPart = sample.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean =>
        candidate.id === terminal(limb),
    )!;
    return part.geometry.type === "primitive" &&
      (part.geometry.shape.type === "cylinder" ||
        part.geometry.shape.type === "capsule")
      ? part.geometry.shape.radius
      : NaN;
  };
  const cylinder: boolean = halt.archetype.parts.some(
    (part: IAutoMovieModelPart): boolean =>
      part.id === terminal("leftHind") &&
      part.geometry.type === "primitive" &&
      part.geometry.shape.type === "cylinder",
  );

  /** The terminal bar's lowest rim point. */
  const lowest = (
    sample: Sample,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): IAutoMovieVector3 => {
    const bar: Look.IBar = Look.bar(sample, terminal(limb));
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(bar.to, bar.from),
    );
    const end: IAutoMovieVector3 = bar.to.y <= bar.from.y ? bar.to : bar.from;
    if (!cylinder) return Vector3.add(end, { x: 0, y: -bar.radius, z: 0 });
    const down: IAutoMovieVector3 = Vector3.addScaled(
      { x: 0, y: -1, z: 0 },
      axis,
      axis.y,
    );
    const across: number = Vector3.length(down);
    return across < 1e-12
      ? end
      : Vector3.addScaled(end, down, radius(sample, limb) / across);
  };
  const sole = (
    sample: Sample,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): number => lowest(sample, limb).y;
  const place = (
    sample: Sample,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
  ): IAutoMovieVector3 => Look.bar(sample, terminal(limb)).to;
  const hip = (sample: Sample, side: "left" | "right"): number =>
    Look.bar(sample, AutoMovieArchetypeQuadrupedBody.BONES[`${side}Hind`][0])
      .from.y;
  const planted = (
    sample: Sample,
    limbs: readonly AutoMovieArchetypeQuadrupedBody.Limb[],
  ): boolean =>
    limbs.every(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
        Vector3.distance(place(sample, limb), place(halt, limb)) <= 1e-6 &&
        Math.abs(sole(sample, limb)) <= 1e-6,
    );

  // 1. The standing rest; the hips' lateral span is read at the halt.
  const span: number = Math.abs(
    Look.bar(halt, AutoMovieArchetypeQuadrupedBody.BONES.leftHind[0]).from.x -
      Look.bar(halt, AutoMovieArchetypeQuadrupedBody.BONES.rightHind[0]).from.x,
  );
  const resting: Sample = comfort.at(t + 3);
  const lowPoint: IAutoMovieVector3 = lowest(resting, "leftHind");
  TestValidator.predicate(
    "the resting hind bears on the floor",
    Math.abs(lowPoint.y) <= 1e-6,
  );
  TestValidator.predicate(
    "the resting hind's terminal bar points 20 degrees behind vertical",
    Math.abs(
      Look.degrees(Look.axis(resting, terminal("leftHind")), {
        x: 0,
        y: -1,
        z: 0,
      }) - 20,
    ) <= 1e-6 && Look.axis(resting, terminal("leftHind")).z < 0,
  );
  if (cylinder)
    TestValidator.predicate(
      "the resting hind touches only at its toe, ahead of its endpoint",
      lowPoint.z - place(resting, "leftHind").z >
        0.5 * radius(resting, "leftHind"),
    );
  TestValidator.predicate(
    "the other three hooves keep their places in the rest",
    planted(resting, ["leftFore", "rightFore", "rightHind"]),
  );
  TestValidator.predicate(
    "the hips tilt 3 degrees down to the resting side",
    Math.abs(
      hip(resting, "left") -
        hip(resting, "right") -
        (hip(halt, "left") - hip(halt, "right")) +
        span * Math.sin((3 * Math.PI) / 180),
    ) <= 2e-3,
  );

  // 2. Pawing: three strokes over the 1.8 s hold after a 0.6 s entry.
  const stroke: number = 1.8 / 3;
  for (let k: number = 0; k < 3; k++) {
    const swing: Sample = comfort.at(t + 7 + 0.6 + (k + 0.25) * stroke);
    const scrape: Sample = comfort.at(t + 7 + 0.6 + (k + 0.75) * stroke);
    TestValidator.predicate(
      `paw stroke ${k} clears the floor in its swing`,
      sole(swing, "rightFore") > 0.05,
    );
    TestValidator.predicate(
      `paw stroke ${k} meets the floor in its scrape`,
      Math.abs(sole(scrape, "rightFore")) <= 1e-6,
    );
    for (const shown of [swing, scrape])
      TestValidator.predicate(
        `the planted hooves do not slide in paw stroke ${k}`,
        planted(shown, ["leftFore", "leftHind", "rightHind"]),
      );
  }

  // 3. The stamp and the cow-kick.
  const stamped: Sample = comfort.at(t + 11 + 0.44);
  TestValidator.predicate(
    "the stamp lifts its hoof",
    sole(stamped, "leftFore") > 0.1 &&
      planted(stamped, ["rightFore", "leftHind", "rightHind"]),
  );
  TestValidator.predicate(
    "the stamp sets the hoof back on its place",
    planted(
      comfort.at(t + 11 + 0.8 + 0.05),
      AutoMovieArchetypeQuadrupedBody.LIMBS,
    ),
  );
  const kicked: Sample = comfort.at(t + 13 + 0.5);
  TestValidator.predicate(
    "the cow-kick swings the hind hoof forward off the floor",
    sole(kicked, "rightHind") > 0.1 &&
      place(kicked, "rightHind").z > place(halt, "rightHind").z + 0.05,
  );

  // The shake rolls the trunk over four planted hooves.
  const shaking: readonly Sample[] = [0.6, 0.85, 1.1, 1.35].map(
    (s: number): Sample => comfort.at(t + 15 + s),
  );
  TestValidator.predicate(
    "the shake rolls the hips",
    shaking.some(
      (shown: Sample): boolean =>
        Math.abs(
          hip(shown, "left") -
            hip(shown, "right") -
            (hip(halt, "left") - hip(halt, "right")),
        ) > 0.01,
    ),
  );
  for (const shown of shaking)
    TestValidator.predicate(
      "the hooves stay planted through the shake",
      planted(shown, AutoMovieArchetypeQuadrupedBody.LIMBS),
    );

  // 4. Urination.
  const camped: Sample = comfort.at(t + 18 + 1.5);
  for (const limb of ["leftHind", "rightHind"] as const)
    TestValidator.predicate(
      `the ${limb} is camped back on the floor`,
      place(camped, limb).z < place(halt, limb).z - 0.15 &&
        Math.abs(sole(camped, limb)) <= 1e-6,
    );
  TestValidator.predicate(
    "urination raises the tail",
    Look.axis(camped, "tail").y > Look.axis(halt, "tail").y + 0.2,
  );

  // 5. Tack and lead stay attached; between acts the horse is its neutral halt.
  const relative = (
    carrier: IAutoMovieTransform,
    carried: IAutoMovieTransform,
  ): IAutoMovieTransform => {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(carrier.rotation);
    return {
      ...carried,
      rotation: Quaternion.multiply(inverse, carried.rotation),
      translation: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(carried.translation, carrier.translation),
      ),
    };
  };
  const saddle = (sample: Sample): IAutoMovieTransform =>
    relative(Look.frame(sample, "trunk"), Look.frame(sample, "saddle"));
  // The lead rope's halter end, the end of its bar nearer the head, read in the head's frame.
  const halter = (sample: Sample): IAutoMovieVector3 => {
    const rope: Look.IBar = Look.bar(sample, "lead");
    const head: IAutoMovieTransform = Look.frame(sample, "head");
    const end: IAutoMovieVector3 =
      Vector3.distance(rope.to, head.translation) <
      Vector3.distance(rope.from, head.translation)
        ? rope.to
        : rope.from;
    return relative(head, { ...head, translation: end }).translation;
  };
  for (const shown of [resting, stamped, kicked, camped, ...shaking]) {
    TestValidator.predicate(
      "the saddle stays on the trunk",
      Vector3.distance(saddle(shown).translation, saddle(halt).translation) <=
        1e-9 &&
        Quaternion.angle(saddle(shown).rotation, saddle(halt).rotation) <= 1e-9,
    );
    TestValidator.predicate(
      "the lead rope stays on the halter",
      Vector3.distance(halter(shown), halter(halt)) <= 1e-9,
    );
  }
  for (const gap of [t + 6.5, t + 10.5, t + 17.5, t + 21.5])
    TestValidator.equals(
      `the horse is neutral at ${gap}`,
      JSON.stringify(comfort.at(gap).archetype.parts),
      JSON.stringify(ride.at(gap).archetype.parts),
    );

  // 6. Refusal while moving.
  let caught: unknown = null;
  try {
    AutoMovieArchetypeEquineComfort.after(horse, ride, [
      {
        kind: "paw",
        side: "left",
        strokes: 2,
        from: ride.duration / 2,
        seconds: 2,
      },
    ]);
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "pawing at a walk refuses",
    caught instanceof AutoMovieArchetypeRefusal && caught.axis === "from",
  );
}
