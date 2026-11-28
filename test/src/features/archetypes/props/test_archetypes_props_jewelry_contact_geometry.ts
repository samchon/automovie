import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeMedal,
  AutoMovieArchetypeNecklace,
} from "@automovie/archetypes";
import {
  AutoMovieEnginePhysics,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type { IAutoMovieRigidTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/**
 * Jewelry contacts follow the ribbon material and the selected loop length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the medal's ribbon pinch, stationary wear socket and necklace perimeter constraint.
 * @evidence contracts/development/testing.md#behavioral-verification Measures the medal's signed ribbon and disc distances, and sums the necklace's 24 rendered segments across saved and seedless recipes.
 * @evidence contracts/development/testing.md#independent-expectations Uses measured ribbon thickness and disc face, the saved position of the back socket and the finite reduction from approximating an ellipse by straight chords.
 */
export function test_archetypes_props_jewelry_contact_geometry(): void {
  const identity: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const near = (label: string, actual: number, expected: number): void =>
    TestValidator.predicate(label, Math.abs(actual - expected) <= 1e-9);
  const medalCases: {
    params: AutoMovieArchetypeMedal.IParams;
    seed?: number;
  }[] = [{ params: {} }, { params: {}, seed: 31 }];
  for (const ribbon of [0.4, 0.5])
    for (const diameter of [0.07, 0.085])
      medalCases.push({ params: { ribbon, diameter } });

  for (const { params, seed } of medalCases) {
    const medal = AutoMovieArchetypeMedal.create(params, seed);
    const grip = medal.affordance("hold");
    const socket = medal.affordance("wear");
    const shapes = medal.shapes();
    const ribbon = shapes.find(({ id }) => id === "ribbon")!;
    const disc = shapes.find(({ id }) => id === "disc")!;
    const ribbonThickness = archetypeExtent(shapes, "z", ["ribbon"]).size;
    const ribbonBottom = archetypeExtent(shapes, "y", ["ribbon"]).low;
    const gripPoint = grip.frame.translation;
    near(
      "grip aperture equals ribbon thickness",
      grip.aperture!,
      ribbonThickness,
    );
    near("grip lies above the ribbon end", gripPoint.y - ribbonBottom, 0.02);
    near(
      "grip lies at ribbon mid-thickness",
      AutoMovieEnginePhysics.physicalShapeSegmentDistance(
        identity,
        ribbon,
        gripPoint,
        gripPoint,
      ),
      -ribbonThickness / 2,
    );
    near(
      "grip clears the medal disc",
      AutoMovieEnginePhysics.physicalShapeSegmentDistance(
        identity,
        disc,
        gripPoint,
        gripPoint,
      ),
      0.02,
    );
    near(
      "wear site stays on the disc rear",
      socket.frame.translation.z,
      archetypeExtent(shapes, "z", ["disc"]).low,
    );
    near(
      "wear site stays at disc center",
      socket.frame.translation.y,
      -medal.dimensions.ribbon! - medal.dimensions.diameter! / 2,
    );
    near(
      "wear points rearward",
      AutoMovieEngineVector3.distance(
        AutoMovieArchetypeFrame.axis(socket.frame, "y"),
        { x: 0, y: 0, z: -1 },
      ),
      0,
    );
  }

  const saved: AutoMovieArchetypeNecklace.IParams = JSON.parse(
    '{"kind":"chain","id":"archive-chain","length":0.6604,"breadth":0.22}',
  );
  const shallow = AutoMovieArchetypeNecklace.create(saved);
  TestValidator.equals("archived chain ID", shallow.id, "archive-chain");
  near("archived breadth", shallow.dimensions.breadth!, 0.22);
  near("archived length", shallow.dimensions.length!, 0.6604);
  near(
    "direct depth keeps its historical floor",
    AutoMovieArchetypeNecklace.depth(0.6604, 0.11),
    0.11,
  );
  const opening = shallow.affordance("opening");
  TestValidator.predicate(
    "short wide chain yields a shallow physical opening",
    opening.width! > opening.height!,
  );

  const necklaces = [
    shallow,
    AutoMovieArchetypeNecklace.create(),
    AutoMovieArchetypeNecklace.create({}, 31),
    AutoMovieArchetypeNecklace.create({ kind: "ribbon" }),
  ];
  for (const length of [0.6604, 0.762])
    for (const breadth of [0.2, 0.22])
      necklaces.push(AutoMovieArchetypeNecklace.create({ length, breadth }));

  for (const model of necklaces) {
    const segments = model.parts.filter(({ id }) => id.startsWith("loop"));
    TestValidator.equals("loop has 24 straight segments", segments.length, 24);
    const chordLength = segments.reduce((sum, { geometry }): number => {
      if (geometry.type !== "primitive" || geometry.shape.type !== "cylinder")
        throw new Error("Expected a cylindrical loop segment.");
      return sum + geometry.shape.height;
    }, 0);
    const relativeReduction =
      (model.dimensions.length! - chordLength) / model.dimensions.length!;
    TestValidator.predicate(
      "faceting reduces perimeter by under 0.4 percent",
      relativeReduction > 0 && 0.004 > relativeReduction,
    );
  }
}
