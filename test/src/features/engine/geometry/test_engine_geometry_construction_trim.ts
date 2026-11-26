
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A trim realizes its opening as a loop in its face's chart whose knots are its
 * landmarks' feet.
 *
 * Fixture: a cylinder of radius 0.02 m (stations along -z) and eight landmarks
 * round station 0.05 m, phase 0, at the section's knot phases 0 and plus or
 * minus one knot step, lifted 0.5 mm along the radius. A foot is then straight
 * under its landmark, r (cos phi, sin phi) at its own height: at a knot phase
 * the periodic cubic section meets the circle and its normal is the radius, so
 * this closed form is exact. Limit: twice the feet's solve tolerance, the chord
 * over 1000 (1e-7 m at the 1e-4 m chord), in millimetres.
 *
 * Scenarios:
 *
 * 1. No diagnostic; the loop at each knot evaluates on the cylinder to the
 *    landmark's foot within the limit.
 * 2. The feet shifted 1 mm along the cylinder miss the loop.
 */
export function test_engine_geometry_construction_trim(): void {
  const r: number = 0.02;
  const tube: IAutoMovieConstructionView = ConstructionShapes.cylinder(
    "tube",
    ConstructionShapes.DOWN,
    r,
    0.1,
  );
  const angles: number[] = Array.from(
    { length: 8 },
    (_: unknown, m: number): number => (2 * Math.PI * m) / 8,
  );
  const steps: number[] = [1, 1, 0, -1, -1, -1, 0, 1];
  const at = (m: number): [number, number] => [
    0.05 + 0.01 * Math.sin(angles[m]!),
    (steps[m]! * 2 * Math.PI) / tube.order,
  ];
  const landmarks: IAutoMovieVector3[] = angles.map(
    (_: number, m: number): IAutoMovieVector3 => {
      const [s, phi]: [number, number] = at(m);
      return {
        x: (r + 0.0005) * Math.cos(phi),
        y: (r + 0.0005) * Math.sin(phi),
        z: -s,
      };
    },
  );
  const real: IAutoMovieConstructionRealization.IWithoutSkin =
    AutoMovieEngineConstruction.realize(
      {
        name: "made",
        root: {
          type: "trim",
          name: "slot",
          host: tube,
          face: "tube",
          landmarks,
          guesses: angles.map((_: number, m: number): [number, number] => [
            at(m)[0] + 0.001,
            at(m)[1] + 0.01,
          ]),
        },
      },
      { chord: 1e-4, skin: false },
    );
  const foot =
    (shift: number) =>
    (m: number): V3 => {
      const [s, phi]: [number, number] = at(m);
      return [
        1000 * r * Math.cos(phi),
        1000 * r * Math.sin(phi),
        1000 * (-s - shift),
      ];
    };
  const limit: number = 2 * 1000 * (1e-4 / 1000);
  const feet = (shift: number): string[] =>
    ConstructionChecks.feet(
      ConstructionRead.trim(real, "tube"),
      ConstructionRead.surface(real, "tube"),
      foot(shift),
      limit,
    );

  // 1.
  TestValidator.equals("diagnostics", real.diagnostics, []);
  TestValidator.equals("feet", feet(0), []);

  // 2.
  TestValidator.predicate("shifted feet miss", feet(0.001).length !== 0);
}
