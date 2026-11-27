import { AutoMovieArchetypeScenicStandard } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { nclose, vclose } from "../../internal/predicates";

/** The positioned-contact tolerance of #3368, metres. */
const MILLIMETRE: number = 0.001;

/**
 * Both scenic standard silhouettes provide a shaft contact the film's
 * human-motion input can use.
 *
 * Scenarios:
 *
 * 1. With fixed dimensions, measure the pole and square or circular head. The grip
 *    must fit the measured shaft below the head and the face site must sit on
 *    the head's measured front.
 * 2. Build the same seeded banner twice and compare the emitted colliders. A
 *    nonpositive head dimension is independently outside the supported set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometric oracle and how it distinguishes either form.
 * @evidence contracts/development/testing.md#behavioral-verification Reads collider extents and motion prop sites from the public producers.
 * @evidence contracts/development/testing.md#independent-expectations Author dimensions and measured shape faces pin the outputs independently of the helper's placement formulas.
 * @evidence contracts/development/testing.md#distinguishing-cases The rectangular banner and roundel emit distinct head solids. Same-seed replay covers free dimensions and a zero head span is refused.
 * @evidence contracts/development/testing.md#execution-ownership Discovered in-memory specification with no viewer, capture, or performer plan.
 */
export function test_archetype_scenic_standard(): void {
  /** Compare positioned contacts within the stage's millimetre tolerance. */
  const close = (actual: number, expected: number): boolean =>
    nclose(actual, expected, MILLIMETRE);
  for (const kind of ["banner", "roundel"] as const) {
    const model: ReturnType<typeof AutoMovieArchetypeScenicStandard.create> = AutoMovieArchetypeScenicStandard.create(
      {
        kind,
        length: 1.7,
        shaftDiameter: 0.036,
        headSpan: 0.53,
        faceDepth: 0.016,
      },
    );
    const shapes: IAutoMoviePhysicalShape[] = model.shapes();
    const shaft: ReturnType<typeof archetypeExtent> = archetypeExtent(
      shapes,
      "y",
      ["shaft"],
    );
    const panel: ReturnType<typeof archetypeExtent> = archetypeExtent(
      shapes,
      "y",
      ["panel"],
    );
    const head: IAutoMoviePhysicalShape | undefined = shapes.find(
      (shape: IAutoMoviePhysicalShape): boolean => shape.id === "panel",
    );
    const shaftWidth: number = archetypeExtent(shapes, "x", ["shaft"]).size;
    const panelDepth: ReturnType<typeof archetypeExtent> = archetypeExtent(
      shapes,
      "z",
      ["panel"],
    );
    const grip: IAutoMovieAffordance = model.affordance("grip");
    const face: IAutoMovieAffordance = model.affordance("face");
    TestValidator.predicate(
      `${kind} is grounded and has the authored dimensions`,
      (): boolean =>
        head?.kind === (kind === "banner" ? "box" : "hull") &&
        close(panel.size, 0.53) &&
        close(shaft.low, 0) &&
        close(shaft.high, 1.7) &&
        close(shaftWidth, 0.036) &&
        close(archetypeExtent(shapes, "x", ["panel"]).size, 0.53) &&
        close(panelDepth.size, 0.016),
    );
    TestValidator.predicate(
      `${kind} grip spans the clear shaft below the head`,
      (): boolean =>
        grip.kind === "handle" &&
        close(grip.aperture!, shaftWidth) &&
        close(grip.frame.translation.y - grip.length! / 2, shaft.low) &&
        close(grip.frame.translation.y + grip.length! / 2, panel.low),
    );
    const prop: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
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
        vclose(
          prop.points.grip!.point,
          {
            x: 0,
            y: (shaft.low + panel.low) / 2,
            z: 0,
          },
          MILLIMETRE,
        ) &&
        vclose(prop.points.grip!.normal!, { x: 0, y: 0, z: -1 }, MILLIMETRE) &&
        vclose(
          prop.points.face!.point,
          {
            x: 0,
            y: (panel.low + panel.high) / 2,
            z: panelDepth.high,
          },
          MILLIMETRE,
        ) &&
        vclose(prop.points.face!.normal!, { x: 0, y: 0, z: 1 }, MILLIMETRE) &&
        face.kind === "surface",
    );
  }
  TestValidator.equals(
    "the same seed returns the same visible geometry",
    JSON.stringify(AutoMovieArchetypeScenicStandard.create({ kind: "banner" }, 1009).shapes()),
    JSON.stringify(AutoMovieArchetypeScenicStandard.create({ kind: "banner" }, 1009).shapes()),
  );
  TestValidator.error("head size must be positive", () =>
    AutoMovieArchetypeScenicStandard.create({ kind: "roundel", headSpan: 0 }),
  );
}
