import {
  type AutoMovieConstructionRealization,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * A continuation realizes its part's end on its host's end: the two faces
 * share one ring, and the skin runs across it C2.
 *
 * Scenarios:
 * 1. A cylinder of radius 0.02 m continued at its top by a narrower cylinder of radius 0.015 m at its bottom: no diagnostic, and at 64 phases the part's first section equals the host's last, with the station slope equal and the station curvature equal, each within 1e-9 of the host's size.
 * 2. Red: the part's first section read against the host's middle station differs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the continuation with `realizeAutoMovieConstruction` and reads both faces' surfaces at their shared ends through `ConstructionChecks.shared`. It catches a part that keeps its own end section (a step where the host's end stands), a ring copied without its station derivatives (a crease or a curvature step across it), and a derivative copied without its sign into the part's station direction; any continuation that copies the host's end layer passes.
 * @evidence contracts/development/testing.md#independent-expectations The continuation's contract (`IAutoMovieConstructionContinuation`): the part face's end layer is the host face's end layer, its section and both station derivatives, signed into the part's station direction, so a top continued by a bottom keeps the first derivative's sign and the second unchanged. Limit 1e-9 of the host's size, the copy being exact to rounding. Oracle limit: the part's own outlines away from its end are its own and are not read.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: a top continued by a bottom of another radius. Negative: the shared ring read against the host's middle. A pole end or a mismatched order belongs to `test_construction_diagnostics`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_continuation`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A cylinder of radius 0.02 m continued at its top by a narrower cylinder of radius 0.015 m at its bottom: no diagnostic, and at 64 phases...).
 */
export function test_construction_continuation(): void {
  const failures: string[] = [];

  // The host's stations run down from z = 0 to z = -0.1 m; the part starts where the host ends and runs on down.
  const host: AutoMovieConstructionNode = ConstructionShapes.cylinder(
    "trunk",
    ConstructionShapes.DOWN,
    0.02,
    0.1,
  );
  const part: AutoMovieConstructionNode = ConstructionShapes.cylinder(
    "neck",
    { ...ConstructionShapes.DOWN, origin: { x: 0, y: 0, z: -0.1 } },
    0.015,
    0.06,
  );
  const tree: AutoMovieConstructionNode = {
    type: "continue",
    name: "join.neck",
    host,
    hostFace: "trunk",
    hostEnd: "top",
    part,
    partFace: "neck",
    partEnd: "bottom",
  };
  const real: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "made", root: tree }, { chord: 1e-4 });
  if (real.diagnostics.length !== 0)
    failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);

  // Surfaces and stations are in the kernel's millimetres.
  const trunk: IAutoMovieSolidSurface = ConstructionRead.surface(real, "trunk");
  const neck: IAutoMovieSolidSurface = ConstructionRead.surface(real, "neck");
  failures.push(
    ...ConstructionChecks.shared(trunk, 100, neck, 0, 1, 64, 1e-9 * 20),
  );

  // Red: the neck's first section against the trunk's middle.
  if (
    ConstructionChecks.shared(trunk, 50, neck, 0, 1, 64, 1e-9 * 20).length === 0
  )
    failures.push(
      "proof: the neck's end reads equal to the trunk's middle section",
    );
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} continuation failures:\n${failures.join("\n")}`,
    );
}
