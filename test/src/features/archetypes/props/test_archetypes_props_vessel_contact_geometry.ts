import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeVessel,
} from "@automovie/archetypes";
import {
  AutoMovieEnginePhysics,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/**
 * Vessel floors support their entire inside site and stockpot bars join their
 * walls.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the supported interior and the four physical stockpot supports.
 * @evidence contracts/development/testing.md#behavioral-verification Measures floor support throughout the declared rectangle for twenty saved model and seed cases, then checks attachment overlap and unchanged outside extents.
 * @evidence contracts/development/testing.md#independent-expectations Uses the original round floor, its actual top plane, the two unchanged handle locations and signed overlap against their physical walls and bars.
 */
export function test_archetypes_props_vessel_contact_geometry(): void {
  const recipes: AutoMovieArchetypeVessel.IParams[] = [
    { kind: "bowl", model: "ikea365" },
    { kind: "bowl", model: "sunnyDay18" },
    { kind: "bowl", model: "sunnyDayCereal" },
    { kind: "ashtray", model: "nachtmann" },
    { kind: "ashtray", model: "harris" },
    { kind: "saucepan" },
    { kind: "stockpot" },
    { kind: "vase" },
    { kind: "vase", diameter: 0.115 },
    { kind: "vase", diameter: 0.16 },
  ];
  const identity: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const near = (label: string, actual: number, expected: number): void =>
    TestValidator.predicate(label, Math.abs(actual - expected) <= 1e-9);
  const overlap = (
    shape: IAutoMoviePhysicalShape,
    other: IAutoMoviePhysicalShape,
  ): number =>
    -AutoMovieEnginePhysics.physicalShapePairDistance(
      identity,
      shape,
      identity,
      other,
    );

  for (const recipe of recipes)
    for (const seed of [undefined, 31]) {
      const vessel = AutoMovieArchetypeVessel.create(recipe, seed);
      const inside = vessel.affordance("inside");
      const rim = vessel.affordance("rim");
      const shapes = vessel.shapes();
      const floor = shapes.find((part) => part.id === "floor")!;
      const floorPart = vessel.parts.find((part) => part.id === "floor")!;
      if (
        floorPart.geometry.type !== "primitive" ||
        floorPart.geometry.shape.type !== "cylinder"
      )
        throw new Error("Expected the original round vessel floor.");
      near(
        "original floor radius",
        floorPart.geometry.shape.radius,
        vessel.dimensions.diameter! / 2,
      );
      near(
        "inside remains at the floor top",
        inside.frame.translation.y,
        0.005,
      );
      near(
        "rim height remains the drawn height",
        rim.frame.translation.y,
        vessel.dimensions.height!,
      );
      TestValidator.equals(
        "inside site declares the floor as its part",
        inside.materialPart,
        "floor",
      );
      for (const x of [-0.5, 0, 0.5])
        for (const z of [-0.5, 0, 0.5]) {
          const point = AutoMovieArchetypeFrame.point(inside.frame, {
            x: x * inside.width!,
            y: 0,
            z: z * inside.depth!,
          });
          near(
            "floor supports the center, edge and corner",
            AutoMovieEnginePhysics.physicalShapeSegmentDistance(
              identity,
              floor,
              point,
              point,
            ),
            0,
          );
        }

      if (recipe.kind !== "stockpot") continue;
      const original = shapes.filter(
        ({ id }) => !/Handle(?:Front|Back)$/.test(id),
      );
      for (const axis of ["x", "y", "z"] as const) {
        const before = archetypeExtent(original, axis);
        const after = archetypeExtent(shapes, axis);
        near("supports retain the lower outside extent", after.low, before.low);
        near(
          "supports retain the upper outside extent",
          after.high,
          before.high,
        );
      }
      for (const [id, wallId, sign] of [
        ["leftHandle", "wallLeft", 1],
        ["rightHandle", "wallRight", -1],
      ] as const) {
        const handle = vessel.affordance(id);
        near("original handle length", handle.length!, 0.1);
        near("original handle aperture", handle.aperture!, 0.025);
        near(
          "original handle center X",
          handle.frame.translation.x,
          sign * (vessel.dimensions.diameter! / 2 + 0.03),
        );
        near(
          "original handle center Y",
          handle.frame.translation.y,
          vessel.dimensions.height! - 0.025,
        );
        near(
          "original handle axis",
          AutoMovieEngineVector3.distance(
            AutoMovieArchetypeFrame.axis(handle.frame, "x"),
            { x: 0, y: 0, z: 1 },
          ),
          0,
        );
        const bar = shapes.find((part) => part.id === id)!;
        const wall = shapes.find((part) => part.id === wallId)!;
        for (const suffix of ["Front", "Back"]) {
          const arm = shapes.find((part) => part.id === id + suffix)!;
          TestValidator.predicate(
            "support penetrates the wall",
            overlap(arm, wall) > 0.0001,
          );
          TestValidator.predicate(
            "support penetrates the grip bar",
            overlap(arm, bar) > 0.0001,
          );
        }
      }
    }
}
