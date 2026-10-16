import {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepSection,
  rigAutoMovieSurfaceNetwork,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Parameter sections keep their Cartesian geometry through the real network.
 *
 * Scenarios:
 *
 * 1. Ordinary geometry follows its correspondence and numeric domain.
 * 2. Origin/cancellation or numeric refusal preserves the declared state.
 * 3. Registered consumers share the same admitted field.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public network sampling/rig construction on off-origin and concave polygons and a B-spline, a translating section with a legitimate averaged origin, a varying scale, actual registry-derived network curves, and the unchanged radial circle.
 * @evidence contracts/testing.md#independent-expectations A rectangle edge has section y=1 and x=2+8v; symmetric trapezoid means reproduce these affine coordinates. Convex weights keep a concave outline inside coordinate bounds. Opposite affine translations cancel exactly. Direction-correspondence circle samples retain the radius rather than Cartesian chord attenuation.
 * @evidence contracts/testing.md#distinguishing-cases The old radius/cos/sin reconstruction violates the positive coordinate bound, while applying Cartesian averaging to radial sweeps shrinks the independent circle case. The origin case rejects blanket nonzero-input positivity guards.
 * @evidence contracts/testing.md#execution-ownership Portable synchronous scenario; real compiles and public producers are inside the timed entry, without substituted internals or foreign hooks.
 */
export function test_geometry_sweep_parameter_cells(): void {
  const counts: (n: number) => IAutoMovieSurfaceNetwork.ICounts = (
    n: number,
  ): IAutoMovieSurfaceNetwork.ICounts => ({
    lowest: n,
    low: n,
    medium: n,
    high: n,
  });
  const rectangle: IAutoMovieSweepSection.IPoint[] = [
    { x: 2, y: 1 },
    { x: 4, y: 1 },
    { x: 4, y: 3 },
    { x: 2, y: 3 },
  ];
  function sweep(
    points: IAutoMovieSweepSection.IPoint[],
    other: IAutoMovieSweepSection.IPoint[] = points,
  ): IAutoMovieSweep {
    return {
      correspondence: "parameter",
      spine: {
        points: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
        normal: { x: 0, y: 0, z: 1 },
      },
      stations: [
        { at: 0, section: { type: "polygon", points } },
        { at: 1, section: { type: "polygon", points: other } },
      ],
    };
  }
  function network(
    source: IAutoMovieSweep,
    v: [number, number] = [0.05, 0.2],
    columns: number = 3,
    rows: number = 3,
  ): IAutoMovieSurfaceNetwork {
    return {
      sweeps: { tube: source },
      patches: [
        {
          type: "sweep",
          name: "tube",
          sweep: "tube",
          u: [0, 1],
          v,
          rows: counts(rows),
          columns: counts(columns),
        },
      ],
    };
  }
  const source: IAutoMovieSweep = sweep(rectangle);
  const actual: ReturnType<typeof sampleAutoMovieSurfaceNetwork> =
    sampleAutoMovieSurfaceNetwork({
      network: network(source),
      tier: "medium",
      fit: false,
    });
  let interior: number = 0;
  for (let f: number = 0; f < actual.cage.faces.length; f++)
    for (let k: number = 0; k < 4; k++) {
      const at: (typeof actual.corners)[number][number] =
        actual.corners[f]![k]!;
      if (at.s <= 0 || at.s >= 1 || at.t <= 0 || at.t >= 1) continue;
      const vertex: number = actual.cage.faces[f]![k]!;
      const v: number = 0.05 + 0.15 * at.s;
      TestValidator.predicate(
        "Cartesian affine edge survives nonzero-cell averaging",
        nclose(actual.targets[3 * vertex]!, 1, 1e-13) &&
          nclose(actual.targets[3 * vertex + 1]!, at.t, 1e-13) &&
          nclose(actual.targets[3 * vertex + 2]!, 2 + 8 * v, 1e-13),
      );
      interior++;
    }
  TestValidator.predicate(
    "interior footprint was actually checked",
    interior > 0,
  );
  const concave: IAutoMovieSweepSection.IPoint[] = [
    { x: 0.2, y: 0.1 },
    { x: 0.4, y: 0.1 },
    { x: 0.4, y: 0.2 },
    { x: 0.3, y: 0.2 },
    { x: 0.3, y: 0.4 },
    { x: 0.2, y: 0.4 },
  ];
  const outline: ReturnType<typeof sampleAutoMovieSurfaceNetwork> =
    sampleAutoMovieSurfaceNetwork({
      network: network(sweep(concave), [0, 1], 8, 2),
      tier: "medium",
      fit: false,
    });
  for (let i: number = 0; i < outline.targets.length; i += 3)
    TestValidator.predicate(
      "concave parameter curve retains its positive Cartesian bounds",
      outline.targets[i]! >= 0.1 - 1e-14 &&
        outline.targets[i]! <= 0.4 + 1e-14 &&
        outline.targets[i + 2]! >= 0.2 - 1e-14 &&
        outline.targets[i + 2]! <= 0.4 + 1e-14,
    );
  const spline: IAutoMovieSweepSection = { type: "bspline", points: rectangle };
  const splineTarget: ReturnType<typeof sampleAutoMovieSurfaceNetwork> = sampleAutoMovieSurfaceNetwork({
    network: network({ ...source, stations: [{ at: 0, section: spline }, { at: 1, section: spline }] }, [0, 1], 8, 3),
    tier: "medium", fit: false,
  });
  for (let i: number = 0; i < splineTarget.targets.length; i += 3)
    TestValidator.predicate("parameter B-spline points retain their control-hull bounds",
      splineTarget.targets[i]! >= 1 - 1e-13 && splineTarget.targets[i]! <= 3 + 1e-13 &&
      splineTarget.targets[i + 2]! >= 2 - 1e-13 && splineTarget.targets[i + 2]! <= 4 + 1e-13);
  const translated: IAutoMovieSweepSection.IPoint[] = rectangle.map(
    (point: IAutoMovieSweepSection.IPoint): IAutoMovieSweepSection.IPoint => ({
      x: point.x - 6,
      y: point.y - 2,
    }),
  );
  const crossing: ReturnType<typeof sampleAutoMovieSurfaceNetwork> =
    sampleAutoMovieSurfaceNetwork({
      network: network(sweep(rectangle, translated), [0, 0.25], 2, 2),
      tier: "medium",
      fit: false,
    });
  let origin: boolean = false;
  for (let f: number = 0; f < crossing.cage.faces.length; f++)
    for (let k: number = 0; k < 4; k++) {
      const at: (typeof crossing.corners)[number][number] =
        crossing.corners[f]![k]!;
      if (at.s !== 0.5 || at.t !== 0.5) continue;
      const index: number = crossing.cage.faces[f]![k]!;
      origin = true;
      TestValidator.predicate(
        "a valid cancelling cell may be the section origin",
        nclose(crossing.targets[3 * index]!, 0, 1e-13) &&
          nclose(crossing.targets[3 * index + 1]!, 0.5, 1e-13) &&
          nclose(crossing.targets[3 * index + 2]!, 0, 1e-13),
      );
    }
  TestValidator.predicate(
    "the origin case reaches the real cell writer",
    origin,
  );
  const scaled: ReturnType<typeof sampleAutoMovieSurfaceNetwork> =
    sampleAutoMovieSurfaceNetwork({
      network: network({
        ...source,
        scale: [
          { at: 0, value: 1 },
          { at: 1, value: 3 },
        ],
      }),
      tier: "medium",
      fit: false,
    });
  for (let f: number = 0; f < scaled.cage.faces.length; f++)
    for (let k: number = 0; k < 4; k++) {
      const at: (typeof scaled.corners)[number][number] =
        scaled.corners[f]![k]!;
      if (at.s <= 0 || at.s >= 1 || at.t <= 0 || at.t >= 1) continue;
      const i: number = scaled.cage.faces[f]![k]!,
        factor: number = 1 + 2 * at.t,
        v: number = 0.05 + 0.15 * at.s;
      TestValidator.predicate(
        "u-dependent scale stays inside the Cartesian integral",
        nclose(scaled.targets[3 * i]!, factor, 1e-13) &&
          nclose(scaled.targets[3 * i + 2]!, factor * (2 + 8 * v), 1e-13),
      );
    }
  const circle: IAutoMovieSweepSection = {
    type: "superellipse",
    right: 0.1,
    up: 0.1,
    left: 0.1,
    down: 0.1,
    exponents: [2, 2, 2, 2],
  };
  const radial: ReturnType<typeof sampleAutoMovieSurfaceNetwork> =
    sampleAutoMovieSurfaceNetwork({
      network: network(
        {
          spine: source.spine,
          stations: [
            { at: 0, section: circle },
            { at: 1, section: circle },
          ],
        },
        [0, 1],
        8,
        3,
      ),
      tier: "medium",
      fit: false,
    });
  for (let i: number = 0; i < radial.targets.length; i += 3)
    TestValidator.predicate(
      "radial cell averaging preserves a circle radius",
      nclose(
        Math.hypot(radial.targets[i]!, radial.targets[i + 2]!),
        0.1,
        1e-14,
      ),
    );
  const connected: IAutoMovieSurfaceNetwork = network(source);
  connected.nodes = {
    source: { type: "sweep", sweep: "tube", u: 1 / 3, v: 0.1 },
    end: { type: "point", position: { x: 1, y: 0.6, z: 2.8 } },
  };
  connected.curves = {
    course: {
      from: "source",
      to: "end",
      through: [{ x: 1, y: 0.45, z: 2.8 }],
      segments: counts(4),
    },
  };
  const rig: ReturnType<typeof rigAutoMovieSurfaceNetwork> =
    rigAutoMovieSurfaceNetwork({
      network: connected,
      tier: "medium",
      fit: false,
      construction: { station: 8, line: 8, feature: 8, curve: 8 },
    });
  const course: (typeof rig.construction)[number] | undefined =
    rig.construction.find(
      (entry: (typeof rig.construction)[number]): boolean =>
        entry.kind === "curve" && entry.name === "course",
    );
  TestValidator.predicate(
    "the actual registry-bound curve was inspected",
    course !== undefined,
  );
  TestValidator.predicate(
    "the curve endpoint reads its registered Cartesian field",
    nclose(course!.points[0]!, 1, 1e-13) &&
      nclose(course!.points[1]!, 1 / 3, 1e-13) &&
      nclose(course!.points[2]!, 2.8, 1e-13),
  );
}
