import { AutoMovieArchetypeScenicParadeBanner } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * One banner exposes two separate carrier sites on the real pole geometry.
 *
 * Scenarios:
 *
 * 1. Build a fixed banner. Measure the panel and each pole from the colliders and
 *    check that the grips lie on opposite panel edges over the exposed poles.
 * 2. Adapt the banner to one human-motion prop. Both grip points and the front
 *    marker remain addressable in the prop's local frame.
 * 3. Repeat one seed and refuse a pole height that would bury the grips.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the dimensions, collider measurements and two motion sites.
 * @evidence contracts/development/testing.md#behavioral-verification Reads physical collider extents and checks the sites through the motion prop adapter.
 * @evidence contracts/development/testing.md#independent-expectations Uses authored dimensions and measured collider edges as the geometry and grip oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite panel edges distinguish the grips. Same-seed and invalid-dimension cases pin draw behavior.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory specification discovered with the archetype tests.
 */
export function test_archetype_scenic_parade_banner(): void {
  /** Compare positioned contacts within the stage's millimetre tolerance. */
  const close = (actual: number, expected: number): boolean =>
    nclose(actual, expected, 0.001);
  const model: ReturnType<typeof AutoMovieArchetypeScenicParadeBanner.create> =
    AutoMovieArchetypeScenicParadeBanner.create({
      width: 1.8,
      panelHeight: 0.5,
      depth: 0.012,
      poleHeight: 1.4,
      poleDiameter: 0.034,
    });
  const shapes: IAutoMoviePhysicalShape[] = model.shapes();
  const panelX: ReturnType<typeof archetypeExtent> = archetypeExtent(
    shapes,
    "x",
    ["panel"],
  );
  const panelY: ReturnType<typeof archetypeExtent> = archetypeExtent(
    shapes,
    "y",
    ["panel"],
  );
  const panelZ: ReturnType<typeof archetypeExtent> = archetypeExtent(
    shapes,
    "z",
    ["panel"],
  );
  TestValidator.predicate(
    "panel follows the authored width, height and depth",
    close(panelX.size, 1.8) &&
      close(panelY.size, 0.5) &&
      close(panelZ.size, 0.012),
  );

  const prop: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "parade-banner",
    model,
    {
      at: { x: 2, y: 0.5, z: 3 },
      yaw: 90,
    },
  );
  for (const [pole, site, edge] of [
    ["leftPole", "leftGrip", panelX.low],
    ["rightPole", "rightGrip", panelX.high],
  ] as const) {
    const poleX: ReturnType<typeof archetypeExtent> = archetypeExtent(
      shapes,
      "x",
      [pole],
    );
    const poleY: ReturnType<typeof archetypeExtent> = archetypeExtent(
      shapes,
      "y",
      [pole],
    );
    const grip: IAutoMovieAffordance = model.affordance(site);
    TestValidator.predicate(
      site,
      grip.kind === "handle" &&
        close(poleX.size, 0.034) &&
        close((poleX.low + poleX.high) / 2, edge) &&
        close(poleY.low, 0) &&
        close(poleY.high, 1.4) &&
        close(grip.frame.translation.x, edge) &&
        close(grip.frame.translation.z, 0) &&
        close(panelY.high, poleY.high) &&
        close(grip.aperture!, poleX.size) &&
        close(grip.frame.translation.y - grip.length! / 2, poleY.low) &&
        close(grip.frame.translation.y + grip.length! / 2, panelY.low) &&
        vclose(prop.points[site]!.point, {
          x: edge,
          y: (poleY.low + panelY.low) / 2,
          z: 0,
        }) &&
        vclose(prop.points[site]!.normal!, { x: 0, y: 0, z: -1 }),
    );
  }
  TestValidator.predicate(
    "the face marker is centered on the panel front",
    model.affordance("face").kind === "surface" &&
      vclose(prop.points.face!.point, {
        x: (panelX.low + panelX.high) / 2,
        y: (panelY.low + panelY.high) / 2,
        z: panelZ.high,
      }) &&
      vclose(prop.points.face!.normal!, { x: 0, y: 0, z: 1 }),
  );
  TestValidator.equals(
    "one seed repeats the banner geometry",
    JSON.stringify(AutoMovieArchetypeScenicParadeBanner.create({}, 1008).shapes()),
    JSON.stringify(AutoMovieArchetypeScenicParadeBanner.create({}, 1008).shapes()),
  );
  TestValidator.error("a pole shorter than the panel is refused", () =>
    AutoMovieArchetypeScenicParadeBanner.create({ poleHeight: 0.4, panelHeight: 0.5 }),
  );
}
