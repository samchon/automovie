import { createScenicStandard } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { nclose } from "../internal/nclose";

/** The positioned-contact tolerance of #3368, metres. */
const MILLIMETRE: number = 0.001;

/**
 * Both scenic standard silhouettes provide a shaft contact the film's
 * human-motion input can use.
 *
 * Scenarios:
 * 1. With fixed dimensions, measure the emitted pole and head. The grip must
 *    fit the measured shaft below the head and the face site must sit on the
 *    head's measured front.
 * 2. Build the same seeded banner twice and compare the emitted colliders.
 *    A nonpositive head dimension is independently outside the supported set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometric oracle and how it distinguishes either form.
 * @evidence contracts/development/testing.md#behavioral-verification Reads collider extents and motion prop sites from the public producers.
 * @evidence contracts/development/testing.md#independent-expectations Author dimensions and measured shape faces pin the outputs independently of the helper's placement formulas.
 * @evidence contracts/development/testing.md#distinguishing-cases Both outlines, reproducible seeded generation and one invalid dimension.
 * @evidence contracts/development/testing.md#execution-ownership Discovered in-memory specification with no viewer, capture, or performer plan.
 */
export function test_archetype_scenic_standard(): void {
  const close = (actual: number, expected: number): boolean =>
    nclose(actual, expected, MILLIMETRE);
  for (const kind of ["banner", "roundel"] as const) {
    const model: ReturnType<typeof createScenicStandard> = createScenicStandard(
      {
        kind,
        length: 1.7,
        shaftDiameter: 0.036,
        headSpan: 0.53,
        faceDepth: 0.016,
      },
    );
    const shaft: ReturnType<typeof archetypeExtent> = archetypeExtent(
      model,
      "y",
      ["shaft"],
    );
    const panel: ReturnType<typeof archetypeExtent> = archetypeExtent(
      model,
      "y",
      ["panel"],
    );
    const grip: IAutoMovieAffordance = model.affordance("grip");
    const face: IAutoMovieAffordance = model.affordance("face");
    TestValidator.predicate(
      `${kind} is grounded and has the authored dimensions`,
      (): boolean =>
        close(shaft.low, 0) &&
        close(shaft.high, 1.7) &&
        close(archetypeExtent(model, "x", ["shaft"]).size, 0.036) &&
        close(archetypeExtent(model, "x", ["panel"]).size, 0.53) &&
        close(archetypeExtent(model, "z", ["panel"]).size, 0.016),
    );
    TestValidator.predicate(
      `${kind} grip spans the clear shaft below the head`,
      (): boolean =>
        grip.kind === "handle" &&
        close(grip.aperture!, 0.036) &&
        close(grip.frame.translation.y - grip.length! / 2, shaft.low) &&
        close(grip.frame.translation.y + grip.length! / 2, panel.low),
    );
    const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
      "standard",
      model,
      {
        at: { x: 2, y: 0, z: 3 },
        yaw: 90,
      },
    );
    TestValidator.predicate(
      `${kind} exposes the grip and a physical front to motion`,
      (): boolean =>
        prop.points.grip !== undefined &&
        close(prop.points.grip.point.y, grip.frame.translation.y) &&
        close(prop.points.grip.normal!.z, -1) &&
        close(
          prop.points.face!.point.z,
          archetypeExtent(model, "z", ["panel"]).high,
        ) &&
        close(prop.points.face!.normal!.z, 1) &&
        face.kind === "surface",
    );
  }
  TestValidator.equals(
    "the same seed returns the same visible geometry",
    JSON.stringify(
      createScenicStandard({ kind: "banner" }, "village").shapes(),
    ),
    JSON.stringify(
      createScenicStandard({ kind: "banner" }, "village").shapes(),
    ),
  );
  TestValidator.error("head size must be positive", () =>
    createScenicStandard({ kind: "roundel", headSpan: 0 }),
  );
}
