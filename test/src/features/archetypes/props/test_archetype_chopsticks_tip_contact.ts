import {
  AutoMovieArchetypeChopsticks,
  AutoMovieArchetypeFrame,
} from "@automovie/archetypes";
import {
  AutoMovieEnginePhysics,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Equal chopstick rods meet at their tip socket only at full pinch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the equal rods, closing contact and absence of early overlap.
 * @evidence contracts/development/testing.md#behavioral-verification Decodes the saved scene ID and hinge command, poses both rods across the travel and checks their meshes, signed collider distances, fixed grip and reset.
 * @evidence contracts/development/testing.md#independent-expectations Uses the recorded length and radius, the one-third fulcrum and the physical surface requirement of zero gap at the tip socket.
 */
export function test_archetype_chopsticks_tip_contact(): void {
  const length: number = 0.24;
  const radius: number = 0.003;
  const roundoff: number = 1e-9;
  const identity: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const model = AutoMovieArchetypeChopsticks.create(
    JSON.parse('{"id":"saved-sticks"}'),
  );
  const saved = JSON.parse('{"pinch":12}') as { pinch: number };
  const grip: IAutoMovieVector3 = model.affordance("grip").frame.translation;
  const pivot: IAutoMovieVector3 = model.affordance("pinch").frame.translation;
  const tip: IAutoMovieVector3 = model.affordance("tips").frame.translation;
  TestValidator.equals("saved scene identity", model.id, "saved-sticks");
  TestValidator.equals(
    "saved hinge travel",
    model.affordance("pinch").travel,
    12,
  );

  const near = (title: string, observed: number, expected: number): void =>
    TestValidator.predicate(title, Math.abs(observed - expected) <= roundoff);

  for (let degrees: number = 0; degrees <= 12; degrees += 0.5) {
    const posed = model.articulate({ pinch: degrees });
    const shapes = posed.shapes();
    const lower = shapes.find(({ id }) => id === "lower")!;
    const upper = shapes.find(({ id }) => id === "upper")!;
    const gap: number = AutoMovieEnginePhysics.physicalShapePairDistance(
      identity,
      lower,
      identity,
      upper,
    );
    if (degrees < 12)
      TestValidator.predicate("rods stay apart before closing", gap > 0);
    else near("closed collider contact", gap, 0);
    TestValidator.equals(
      "fixed grip through pinch",
      posed.affordance("grip").frame.translation,
      grip,
    );

    for (const part of posed.parts) {
      if (
        part.transform === undefined ||
        part.transform === null ||
        part.geometry.type !== "primitive" ||
        part.geometry.shape.type !== "cylinder"
      )
        throw new Error("The fixture requires two rigid cylinders.");
      const frame: IAutoMovieTransform = part.transform;
      near("rod length", part.geometry.shape.height, length);
      near("rod radius", part.geometry.shape.radius, radius);
      if (part.id === "upper") {
        const support: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
          frame,
          {
            x: 0,
            y: -length / 6,
            z: 0,
          },
        );
        near(
          "one-third fulcrum stays on the moving rod",
          AutoMovieEngineVector3.distance(support, pivot),
          0,
        );
      }
      if (degrees === 12) {
        const relative: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
          tip,
          frame.translation,
        );
        const travel: number = AutoMovieEngineVector3.dot(
          relative,
          AutoMovieArchetypeFrame.axis(frame, "y"),
        );
        const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(frame, {
          x: 0,
          y: travel,
          z: 0,
        });
        near(
          "socket lies on each rendered rod",
          AutoMovieEngineVector3.distance(axis, tip),
          radius,
        );
        TestValidator.predicate(
          "contact is at each rod's tip",
          travel >= length / 2 - 2 * radius && travel <= length / 2,
        );
        near(
          "socket lies on each collider",
          AutoMovieEnginePhysics.physicalShapeSegmentDistance(
            identity,
            part.id === "lower" ? lower : upper,
            tip,
            tip,
          ),
          0,
        );
      }
    }
  }

  const closed = model.articulate(saved);
  TestValidator.equals(
    "omitted travel resets to the saved model rest",
    closed.articulate({}).parts,
    model.parts,
  );
  TestValidator.error("negative travel refuses", () =>
    model.articulate({ pinch: -1 }),
  );
  TestValidator.error("travel past the pinch refuses", () =>
    model.articulate({ pinch: 13 }),
  );
}
