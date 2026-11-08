import {
  type AutoMovieConstructionRealization,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

type V3 = [number, number, number];

/**
 * A view part closed at both ends realizes as a closed G2 dome at each
 * pole: an ellipsoid drawn from its four outlines lies on the ellipsoid
 * everywhere, poles included, within its splines' error bounds, and its skin
 * has no open edge.
 *
 * Scenarios:
 * 1. An ellipsoid of half axes 0.03, 0.02 and 0.05 m from 17 stations, poles at both ends: every skin vertex it owns stands from the closed-form ellipsoid by no more than the outline spline's bound in the pole parameter plus the section spline's bound, and every directed edge of its skin has its reverse.
 * 2. Red: its vertices moved 1 mm outward read past the bound, and its skin with one triangle dropped reads an open edge.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the ellipsoid alone with `realizeAutoMovieConstruction` and reads its skin's positions and triangles. It catches a dome that is pointed, flattened or off the ellipsoid near its pole (the outline not splined in the pole parameter, a ring not closed to its pole), and a pole left open; any construction that follows the ellipsoid's outlines to their poles within the splines' error passes.
 * @evidence contracts/development/testing.md#independent-expectations The ellipsoid's closed form `x^2 / a^2 + y^2 / b^2 + s^2 / c^2 = 1`; the kernel's published pole rule (an outline splined in `sigma = acos(-s / c)`, where the ellipsoid's outline is `a sin(sigma)` with exact natural ends), whose natural cubic spline errs by at most `h^4 a / 384` per span; the periodic cubic section through `order` points, at most `5 (2 pi / n)^4 a / 384`. Oracle limit: the bound adds the two errors, the conic guides' own error (about 5e-6 of the radius) folded under the section spline's.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: the closed ellipsoid. Negative: the moved vertices and the dropped triangle. The touch at the guides belongs to `test_construction_view_touch`; a missing zero knot to `test_construction_diagnostics`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_view_pole`; it realizes made trees in process and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An ellipsoid of half axes 0.03, 0.02 and 0.05 m from 17 stations, poles at both ends: every skin vertex it owns stands from the...).
 */
export function test_construction_view_pole(): void {
  const failures: string[] = [];
  const frame: ConstructionShapes.IFrame = ConstructionShapes.DOWN;
  const [a, b, c]: [number, number, number] = [0.03, 0.02, 0.05];
  const egg: IAutoMovieConstructionView = ConstructionShapes.ellipsoid(
    "egg",
    frame,
    a,
    b,
    c,
  );
  const real: AutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction({ name: "made", root: egg }, { chord: 1e-4 });
  if (real.diagnostics.length !== 0)
    failures.push(`diagnostics: ${ConstructionRead.diagnostics(real)}`);

  const points: V3[] = Array.from(
    { length: real.mesh.positions.length / 3 },
    (_: unknown, v: number): V3 => [
      real.mesh.positions[3 * v]!,
      real.mesh.positions[3 * v + 1]!,
      real.mesh.positions[3 * v + 2]!,
    ],
  );
  const bound: number =
    ConstructionChecks.poleSpline(Math.max(a, b), c, egg.stations) +
    ConstructionChecks.polarSpline(a, b, egg.order) +
    1e-9 * c;
  const off: number = ConstructionChecks.ellipsoid(points, frame, a, b, c);
  if (!(off <= bound)) {
    // The worst vertex's place on its face, so the failure names where the skin leaves the ellipsoid.
    let worst: number = 0;
    points.forEach((p: V3, v: number): void => {
      if (
        ConstructionChecks.ellipsoid([p], frame, a, b, c) >
        ConstructionChecks.ellipsoid([points[worst]!], frame, a, b, c)
      )
        worst = v;
    });
    const at: number[] = real.mesh.coordinates.slice(3 * worst, 3 * worst + 3);
    failures.push(
      `the skin stands ${off} m from the ellipsoid, over the bound ${bound} m, at vertex ${worst} (station ${at[1]} mm, phase ${at[2]} on ${real.mesh.owners[at[0]!] ?? "a pole"})`,
    );
  }
  failures.push(...closed(real.mesh.indices));

  // Red: vertices pushed 1 mm outward, and a triangle dropped.
  const pushed: V3[] = points.map((p: V3): V3 => {
    const l: number = Math.hypot(...p);
    return l > 0
      ? [p[0] * (1 + 0.001 / l), p[1] * (1 + 0.001 / l), p[2] * (1 + 0.001 / l)]
      : p;
  });
  if (!(ConstructionChecks.ellipsoid(pushed, frame, a, b, c) > bound))
    failures.push("proof: vertices pushed 1 mm outward stay inside the bound");
  if (closed(real.mesh.indices.slice(3)).length === 0)
    failures.push("proof: a skin with a dropped triangle reads closed");

  if (failures.length !== 0)
    throw new Error(
      `${failures.length} pole failures:\n${failures.join("\n")}`,
    );
}

/** Directed edges of a triangle list without their reverse: an open skin. */
function closed(indices: readonly number[]): string[] {
  const edges: Set<string> = new Set();
  for (let t: number = 0; t + 2 < indices.length; t += 3)
    for (let k: number = 0; k < 3; k++)
      edges.add(`${indices[t + k]},${indices[t + ((k + 1) % 3)]}`);
  const out: string[] = [];
  for (const e of edges) {
    const [p, q]: string[] = e.split(",");
    if (!edges.has(`${q},${p}`)) out.push(`open edge ${e}`);
  }
  return out.slice(0, 5);
}
