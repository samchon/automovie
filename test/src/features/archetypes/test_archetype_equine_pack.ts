import {
  type AutoMovieArchetype,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquinePackLoad,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A loaded pack horse carries a box against each pad, held on the pack saddle's load contacts through a walk, outside the barrel, and a load that overhangs its pad is refused.
 *
 * Scenarios:
 * 1. At every sampled second of a walk, each box's inner face centre, read from the emitted box's own transform and size, lies on the posed pack contact's origin, and the box's outward axis is the contact's `+Y`.
 * 2. Every corner of each box's inner face stands outside the actual trunk capsule: its distance from the capsule's axis is at least the capsule's radius.
 * 3. A box longer along the back than the pad's declared width, a box taller than its declared depth, and a horse without a pack saddle are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Rides a public pack horse and reads its posed contacts, its trunk capsule and the emitted loads; a load that drifts from its pad, faces into the body or sinks into the barrel is caught.
 * @evidence contracts/development/testing.md#independent-expectations The face centre is derived from the emitted box's transform and its declared thickness; the barrel from the trunk part's own primitive; the pad extents from the contact's declared width and depth.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides through a walk, a fitting load against two overhanging ones, and a pack horse against a saddle horse; the draft take belongs to test_archetype_equine_draft.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_pack(): void {
  const horse: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = createHorse({ tack: "pack", withersHeight: 1.6, tempo: 0 }, 2);
  const load: AutoMovieArchetypeEquinePackLoad.ILoad = {
    length: 0.4,
    height: 0.3,
    thickness: 0.25,
    mass: 35,
  };
  const loads: AutoMovieArchetypeEquinePackLoad.IPrepared =
    AutoMovieArchetypeEquinePackLoad(horse, load);
  const ride: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 6 }],
    cruise: 1.3,
    acceleration: 0.6,
    deceleration: 0.6,
  });
  const issues: string[] = [];
  for (let seconds: number = 0; seconds <= ride.duration; seconds += 0.4) {
    const sample: AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    > = ride.at(seconds);
    const placed: Record<
      AutoMovieArchetypeEquinePackLoad.Side,
      IAutoMovieTransform
    > = loads.at(sample);
    const trunk: IAutoMovieModelPart = sample.archetype.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "trunk",
    )!;
    if (
      trunk.geometry.type !== "primitive" ||
      trunk.geometry.shape.type !== "capsule"
    )
      throw new Error("The pack horse's trunk is not its capsule");
    const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
      sample.placement,
      trunk.transform!,
    );
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: trunk.geometry.shape.height / 2,
      z: 0,
    });
    const radius: number = trunk.geometry.shape.radius;
    for (const side of ["leftLoad", "rightLoad"] as const) {
      const contact: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
        sample.placement,
        sample.archetype.affordance(side).frame,
      );
      const box: IAutoMovieModelPart = loads.models[side].parts[0]!;
      if (
        box.geometry.type !== "primitive" ||
        box.geometry.shape.type !== "box"
      )
        throw new Error("A pack load is not its box");
      const world: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
        placed[side],
        box.transform!,
      );
      const out: IAutoMovieVector3 = Quaternion.rotateVector(world.rotation, {
        x: 0,
        y: 1,
        z: 0,
      });
      const face: IAutoMovieVector3 = Vector3.subtract(
        world.translation,
        Vector3.scale(out, box.geometry.shape.height / 2),
      );
      if (Vector3.distance(face, contact.translation) > 1e-9)
        issues.push(
          `${seconds} s: the ${side} box's face is ${Vector3.distance(face, contact.translation)} m off its pad`,
        );
      if (
        Vector3.distance(out, AutoMovieArchetypeFrame.axis(contact, "y")) > 1e-9
      )
        issues.push(
          `${seconds} s: the ${side} box does not face out of its pad`,
        );
      const along: IAutoMovieVector3 = Quaternion.rotateVector(world.rotation, {
        x: box.geometry.shape.width / 2,
        y: 0,
        z: 0,
      });
      const down: IAutoMovieVector3 = Quaternion.rotateVector(world.rotation, {
        x: 0,
        y: 0,
        z: box.geometry.shape.depth / 2,
      });
      for (const a of [-1, 1])
        for (const b of [-1, 1]) {
          const corner: IAutoMovieVector3 = Vector3.add(
            face,
            Vector3.add(Vector3.scale(along, a), Vector3.scale(down, b)),
          );
          if (
            segment(
              corner,
              Vector3.subtract(frame.translation, axis),
              Vector3.add(frame.translation, axis),
            ) <
            radius - 1e-9
          )
            issues.push(`${seconds} s: a ${side} box corner enters the barrel`);
        }
    }
  }

  const pad: IAutoMovieAffordance = horse.affordance("leftLoad");
  refuses("too long", "load.length", () =>
    AutoMovieArchetypeEquinePackLoad(horse, {
      ...load,
      length: pad.width! + 0.01,
    }),
  );
  refuses("too tall", "load.height", () =>
    AutoMovieArchetypeEquinePackLoad(horse, {
      ...load,
      height: pad.depth! + 0.01,
    }),
  );
  refuses("no pack saddle", "tack", () =>
    AutoMovieArchetypeEquinePackLoad(
      createHorse({ tack: "saddle", withersHeight: 1.6 }, 2),
      load,
    ),
  );
  TestValidator.equals("the pack loads sit on their pads", issues, []);

  /** A typed refusal on the named axis. */
  function refuses(label: string, axis: string, build: () => unknown): void {
    let error: unknown = null;
    try {
      build();
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof AutoMovieArchetypeRefusal && error.axis === axis))
      issues.push(
        `${label}: expected a refusal on ${axis}, got ${String(error)}`,
      );
  }
}

/** The distance from a point to a segment. */
function segment(
  p: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
  const t: number = Math.max(
    0,
    Math.min(1, Vector3.dot(Vector3.subtract(p, a), ab) / Vector3.dot(ab, ab)),
  );
  return Vector3.distance(p, Vector3.add(a, Vector3.scale(ab, t)));
}
