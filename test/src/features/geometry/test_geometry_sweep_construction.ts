import {
  type IAutoMovieSurfaceConstruction,
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSurfaceRig,
  type IAutoMovieSweep,
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  frameAutoMovieSweepSpine,
  rigAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Construction observations share the generating rig's evaluators after its rest constraints.
 *
 * Scenarios:
 *
 * 1. A Coons side leaving a sweep is sampled from the actual tangent-constrained boundary: its quarter point equals the cage target and differs from the unconstrained node/through spline by more than 1 mm. Asking for observations leaves every target and control position unchanged.
 * 2. A circular tube with a held girth reports its corrected station, equal to its generating target and different from the raw uncorrected sweep.
 * 3. A bent feature's observation follows the field's smooth course rather than its input polyline; the field has its declared offset on that course.
 * 4. Without a request the construction is empty; missing, unknown and invalid counts and an unknown feature index are refused; the minimum supported counts pass. Repeated feature points collapse to a constant course.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles real network rigs with and without observations, compares curve and station observations with the actual cage targets, tests unchanged cage numbers, and reads the field on its observed course. A raw node spline, uncorrected sweep, linear feature reconstruction or topology-changing observer fails.
 * @evidence contracts/testing.md#independent-expectations Coons boundary identity and quarter-grid indexing determine the target point independently of inspection; the declared constant offset fixes the feature radius; the raw unconstrained spline and raw sweep are explicit negative controls, not expected production values.
 * @evidence contracts/testing.md#distinguishing-cases Covers constrained and unconstrained curve ends, a held girth, bent and collapsed feature courses, observation absence, invalid counts and feature lookup refusal. Existing rig tests own posing, volume preservation and general network topology.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_geometry_sweep_construction entry owns portable engine cases without a process, browser or GPU.
 */
export function test_geometry_sweep_construction(): void {
  const counts: IAutoMovieSurfaceNetwork.ICounts = {
    lowest: 8,
    low: 8,
    medium: 8,
    high: 8,
  };
  const samples: IAutoMovieSurfaceConstruction.ISamples = {
    station: 32,
    line: 32,
    feature: 32,
    curve: 64,
  };
  const section: IAutoMovieSweep.IStation["section"] = {
    type: "superellipse",
    right: 0.1,
    left: 0.1,
    up: 0.1,
    down: 0.1,
    exponents: [2, 2, 2, 2],
  };
  const sweep: IAutoMovieSweep = {
    spine: {
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      normal: { x: 0, y: 0, z: 1 },
    },
    stations: [
      { at: 0, section },
      { at: 0.5, section },
      { at: 1, section },
    ],
  };
  const raw: IAutoMovieSweepSurface = compileAutoMovieSweep(sweep);
  const from: IAutoMovieVector3 = raw.point(0.2, 0);
  const to: IAutoMovieVector3 = { x: 0.2, y: 0.7, z: 0.2 };
  const through: IAutoMovieVector3 = { x: 0.05, y: 0.35, z: 0.2 };
  function curve(from: string, to: string): IAutoMovieSurfaceNetwork.ICurve {
    return { from, to, segments: counts };
  }
  const network: IAutoMovieSurfaceNetwork = {
    sweeps: { tube: sweep },
    nodes: {
      a: { type: "sweep", sweep: "tube", u: 0.2, v: 0 },
      b: { type: "point", position: to },
      c: { type: "point", position: { x: -0.2, y: 0.7, z: 0.2 } },
      d: { type: "sweep", sweep: "tube", u: 0.2, v: 0.25 },
    },
    curves: {
      ab: { ...curve("a", "b"), through: [through] },
      bc: curve("b", "c"),
      cd: curve("c", "d"),
      da: curve("d", "a"),
    },
    patches: [
      {
        type: "coons",
        name: "patch",
        sides: ["ab", "bc", "cd", "da"].map(
          (name: string): IAutoMovieSurfaceNetwork.ICurveEdge => ({
            type: "curve",
            curve: name,
          }),
        ) as [
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
        ],
      },
    ],
  };
  const observed: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    network,
    tier: "medium",
    construction: samples,
  });
  const plain: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    network,
    tier: "medium",
  });
  function position(points: readonly number[], i: number): IAutoMovieVector3 {
    return {
      x: points[3 * i]!,
      y: points[3 * i + 1]!,
      z: points[3 * i + 2]!,
    };
  }
  function find(
    rig: IAutoMovieSurfaceRig,
    kind: IAutoMovieSurfaceConstruction["kind"],
    name: string,
  ): IAutoMovieSurfaceConstruction {
    return rig.construction.find(
      (c: IAutoMovieSurfaceConstruction): boolean =>
        c.kind === kind && c.name === name,
    )!;
  }
  const boundary: IAutoMovieSurfaceConstruction = find(observed, "curve", "ab");
  const quarter: IAutoMovieVector3 = position(boundary.points, 16);
  const vertex: number =
    observed.cage.cage.faces[observed.cage.patches[0]!.faces[2]!]![0]!;
  TestValidator.predicate(
    "the actual quarter-curve target is observed",
    vclose(quarter, position(observed.cage.targets, vertex), 1e-12),
  );
  const naive: IAutoMovieVector3 = frameAutoMovieSweepSpine({
    points: [from, through, to],
    normal: { x: 0.3, y: 0.5, z: 0.81 },
  }).point(0.25);
  TestValidator.predicate(
    "raw node/through reconstruction differs",
    Math.hypot(quarter.x - naive.x, quarter.y - naive.y, quarter.z - naive.z) >
      0.001,
  );
  TestValidator.predicate(
    "observation leaves every target and control unchanged",
    observed.cage.targets.every((x: number, i: number): boolean =>
      nclose(x, plain.cage.targets[i]!, 0),
    ) &&
      observed.cage.cage.positions.every((x: number, i: number): boolean =>
        nclose(x, plain.cage.cage.positions[i]!, 0),
      ),
  );
  TestValidator.equals(
    "no implicit observations",
    plain.construction.length,
    0,
  );

  const ring: IAutoMovieSurfaceNetwork.IRing = {
    name: "girth",
    perimeter: 0.7,
    edges: [
      {
        type: "sweep",
        sweep: "tube",
        from: { u: 0.5, v: 0 },
        to: { u: 0.5, v: 1 },
        segments: counts,
      },
    ],
  };
  const held: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    network: {
      sweeps: { tube: sweep },
      patches: [
        {
          type: "sweep",
          name: "tube",
          sweep: "tube",
          u: [0, 1],
          v: [0, 1],
          rows: counts,
          columns: counts,
        },
      ],
      rings: [ring],
    },
    tier: "medium",
    construction: samples,
  });
  const station: IAutoMovieSurfaceConstruction = held.construction.filter(
    (c: IAutoMovieSurfaceConstruction): boolean => c.kind === "station",
  )[1]!;
  const stationPoint: IAutoMovieVector3 = position(station.points, 0);
  TestValidator.predicate(
    "held station uses the same corrected sweep as the target",
    vclose(
      stationPoint,
      position(held.cage.targets, held.cage.rings.girth![0]!),
      1e-12,
    ),
  );
  TestValidator.predicate(
    "raw sweep lacks the girth correction",
    !vclose(stationPoint, raw.point(0.5, 0), 0.001),
  );

  const feature: IAutoMovieSweep.IFeature = {
    width: 0.05,
    points: [
      { at: 0.2, angle: 0, offset: 0.02 },
      { at: 0.5, angle: 0.9, offset: 0.02 },
      { at: 0.9, angle: 0.1, offset: 0.02 },
    ],
  };
  const featured: IAutoMovieSweepSurface = compileAutoMovieSweep({
    ...sweep,
    features: [feature],
  });
  const course: { u: number; v: number } = featured.feature(0, 0.25);
  const polylineDistance: number = Math.min(
    ...feature.points
      .slice(0, -1)
      .map((a: IAutoMovieSweep.IFeaturePoint, i: number): number => {
        const b: IAutoMovieSweep.IFeaturePoint = feature.points[i + 1]!;
        const dx: number = b.at - a.at;
        const dy: number = b.angle - a.angle;
        const t: number = Math.min(
          1,
          Math.max(
            0,
            ((course.u - a.at) * dx + (course.v * 2 * Math.PI - a.angle) * dy) /
              (dx * dx + dy * dy),
          ),
        );
        return Math.hypot(
          course.u - (a.at + t * dx),
          course.v * 2 * Math.PI - (a.angle + t * dy),
        );
      }),
  );
  TestValidator.predicate(
    "smooth course leaves the input polyline",
    polylineDistance > 0.001,
  );
  TestValidator.predicate(
    "the actual field reads its declared offset on the shared course",
    nclose(featured.radius(course.u, course.v), 0.12, 1e-6),
  );
  const featuredRig: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    network: {
      sweeps: { tube: { ...sweep, features: [feature] } },
      patches: [
        {
          type: "sweep",
          name: "tube",
          sweep: "tube",
          u: [0, 1],
          v: [0, 1],
          rows: counts,
          columns: counts,
        },
      ],
    },
    tier: "medium",
    fit: false,
    construction: samples,
  });
  TestValidator.predicate(
    "the feature observation shares that field course",
    vclose(
      position(find(featuredRig, "feature", "tube").points, 16),
      featured.point(course.u, course.v),
      1e-12,
    ),
  );
  TestValidator.predicate(
    "unknown feature is refused",
    throwsError(
      (): { u: number; v: number } => featured.feature(1, 0.5),
      "no feature",
    ),
  );
  for (const invalid of [
    { ...samples, station: 2 },
    { ...samples, line: 0 },
    { ...samples, curve: NaN },
  ])
    TestValidator.predicate(
      "invalid observation count is refused",
      throwsError(
        (): IAutoMovieSurfaceRig =>
          rigAutoMovieSurfaceNetwork({
            network,
            tier: "medium",
            construction: invalid,
          }),
        "construction",
      ),
    );
  const seam: IAutoMovieSweepSurface = compileAutoMovieSweep({
    ...sweep,
    features: [
      {
        width: 0.05,
        points: [
          { at: 0.4, angle: 3.05, offset: 0.01 },
          { at: 0.4, angle: -3.05, offset: 0.01 },
        ],
      },
    ],
  });
  TestValidator.predicate(
    "the shared feature course unwraps across the short seam",
    nclose(seam.feature(0, 1).v, (-3.05 + 2 * Math.PI) / (2 * Math.PI), 1e-12),
  );
  for (const invalid of [{ station: 96 }, { ...samples, misspelled: 1 }])
    TestValidator.predicate(
      "missing and unknown named counts are refused",
      throwsError(
        (): IAutoMovieSurfaceRig =>
          rigAutoMovieSurfaceNetwork({
            network,
            tier: "medium",
            construction: invalid as IAutoMovieSurfaceConstruction.ISamples,
          }),
        "construction",
      ),
    );
  const minimal: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    network,
    tier: "medium",
    construction: { station: 3, line: 1, feature: 1, curve: 1 },
  });
  TestValidator.predicate(
    "minimum supported observation counts remain valid",
    minimal.construction.length > 0 &&
      minimal.construction.every(
        (c: IAutoMovieSurfaceConstruction): boolean => c.points.length >= 6,
      ),
  );
  const constant: IAutoMovieSweepSurface = compileAutoMovieSweep({
    ...sweep,
    features: [
      {
        width: 0.05,
        points: [
          { at: 0.5, angle: 0.3, offset: 0.01 },
          { at: 0.5, angle: 0.3, offset: 0.01 },
        ],
      },
    ],
  });
  TestValidator.predicate(
    "collapsed course stays constant at both parameter limits",
    nclose(constant.feature(0, -1).u, 0.5, 0) &&
      nclose(constant.feature(0, 2).v, 0.3 / (2 * Math.PI), 0),
  );
}
