import {
  type AutoMovieConstructionRealization,
  type AutoMovieSolidTrim,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieConstructionNode,
  IAutoMovieConstructionView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A trim realizes its opening as a loop in its face's chart whose knots are
 * its landmarks' feet: a slot cut in a cylinder from eight landmarks lifted
 * off it passes its loop through their radial projections.
 *
 * Scenarios:
 * 1. A cylinder of radius 0.02 m and eight landmarks round the point at station 0.05 m, phase 0, at the section's knot phases 0 and plus or minus one knot step, lifted 0.5 mm off the surface: the trim records no diagnostic and its loop at each knot evaluates on the cylinder to the landmark's foot, within twice the feet's solve tolerance.
 * 2. Red: the loop read against feet shifted 1 mm along the cylinder misses them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the trim with `realizeAutoMovieConstruction` and reads its loop (`ITrim.at`) through the face's surface. It catches a loop off its landmarks' feet, a foot found by a wrong projection, and a margin read on the wrong sheet of the periodic phase; any construction that passes the loop through the feet passes.
 * @evidence contracts/development/testing.md#independent-expectations A landmark lifted along a cylinder's radius has its foot straight under it: `r (cos phi, sin phi)` at its own height, the closed form. The realized section is the periodic cubic interpolant of the circle at the part's `order` knot phases `2 pi k / order`, which dips by about `r h^4 / 384` between them (1.29e-6 m read at `h = pi / 8`, where the old phases 0.106 and 0.15 rad read 0.83 and 1.16 micrometres); at a knot it meets the circle and, every knot being a mirror line of the interpolant, its normal is the radius, so the landmarks stand at knot phases and the closed form is exact there. Limit twice the kernel's foot tolerance, the tessellation chord over 1000 (1e-7 m at the 1e-4 m chord), read in its millimetres.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: the slot. Negative: the shifted feet. Too few landmarks and a landmark without a foot belong to `test_construction_diagnostics`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_trim`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A cylinder of radius 0.02 m and eight landmarks round the point at station 0.05 m, phase 0, at the section's knot phases 0 and plus or...).
 */
export function test_construction_trim(): void {
  const failures: string[] = [];
  const r: number = 0.02;
  const tube: IAutoMovieConstructionView = ConstructionShapes.cylinder(
    "tube",
    ConstructionShapes.DOWN,
    r,
    0.1,
  );

  // Stations run along -z, so the point at station s, phase phi is (r cos phi, r sin phi, -s).
  // Each landmark's phase is a knot of the section, where the realized cylinder is the circle.
  const angles: number[] = Array.from(
    { length: 8 },
    (_: unknown, m: number): number => (2 * Math.PI * m) / 8,
  );
  const knots: number[] = [1, 1, 0, -1, -1, -1, 0, 1];
  const at: (m: number) => [number, number] = (m: number): [number, number] => [
    0.05 + 0.01 * Math.sin(angles[m]!),
    (knots[m]! * 2 * Math.PI) / tube.order,
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
  const tree: AutoMovieConstructionNode = {
    type: "trim",
    name: "slot",
    host: tube,
    face: "tube",
    landmarks,
    guesses: angles.map((_: number, m: number): [number, number] => [
      at(m)[0] + 0.001,
      at(m)[1] + 0.01,
    ]),
  };
  const real: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "made", root: tree }, { chord: 1e-4 });
  if (real.diagnostics.length !== 0)
    failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);

  const trim: AutoMovieSolidTrim.ITrim = ConstructionRead.trim(real, "tube");
  const surface: IAutoMovieSolidSurface = ConstructionRead.surface(
    real,
    "tube",
  );
  const foot: (shift: number) => (m: number) => V3 =
    (shift: number): ((m: number) => V3) =>
    (m: number): V3 => {
      const [s, phi]: [number, number] = at(m);
      return [
        1000 * r * Math.cos(phi),
        1000 * r * Math.sin(phi),
        1000 * (-s - shift),
      ];
    };

  // The trim's chart and the face's surface are in the kernel's millimetres; its feet are solved to the chord over 1000, 1e-7 m.
  const limit: number = 1000 * (1e-4 / 1000) * 2;
  failures.push(...ConstructionChecks.feet(trim, surface, foot(0), limit));
  if (ConstructionChecks.feet(trim, surface, foot(0.001), limit).length === 0)
    failures.push("proof: feet shifted 1 mm read on the loop");
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} trim failures:\n${failures.join("\n")}`,
    );
}
