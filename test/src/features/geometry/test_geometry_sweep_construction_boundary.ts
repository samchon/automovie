import {
  type IAutoMovieSurfaceConstruction,
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSurfaceRig,
  compileAutoMovieSweep,
  rigAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { vclose } from "../internal/vclose";

/**
 * A generated network curve shares the geometric field of its grid-filtered sweep endpoint.
 *
 * Scenarios:
 *
 * 1. The fork curve of the branched-body fixture meets its shared geometric target, independently located by its sweep-domain corner identity. The raw zero-cell sweep point remains a negative control and differs because the shared grid samples a nonzero cell.
 * 2. Asking for construction observations leaves every target, control position, corner and ring unchanged. Inspection neither narrows a registry cell nor substitutes an endpoint into a separately generated display curve.
 * 3. A formula-generated ring of deliberately displaced cage pins includes the shared node. The whole generating curve stays unchanged even though the emitted pin target moves, distinguishing geometric evaluation from a pin-overwritten target-buffer read.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles a real sweep/bridge network with and without construction, locates the emitted fork endpoint by its sweep-domain corner identity, and independently compares that target with the actual curve endpoint. Returning a raw endpoint, changing observation cells or altering cage output fails.
 * @evidence contracts/testing.md#independent-expectations The shared geometric boundary contract determines endpoint equality; emitted node identity follows the patch's affine chart and sampler's domain identity. A separately compiled raw zero-cell surface point distinguishes an unchanged mixed-field implementation. This establishes evaluator consistency rather than anatomical correctness.
 * @evidence contracts/testing.md#distinguishing-cases Covers a shared filtered node beside a continuous curve, the no-inspection control and active cage pins that must not change the generating curve. Separate construction pose and volume scenarios own bound resweep and fixed rest snapshots. The main construction test owns tangent flattening, girth correction, smooth feature courses and count admission; pose and general topology are owned by existing rig tests.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous test_geometry_sweep_construction_boundary entry; no host, process, renderer or GPU is started.
 */
export function test_geometry_sweep_construction_boundary(): void {
  const network: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const plain: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    network,
    tier: "medium",
  });
  const observed: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    network,
    tier: "medium",
    construction: { station: 16, line: 16, feature: 8, curve: 8 },
  });
  const curve: IAutoMovieSurfaceConstruction = observed.construction.find(
    (entry: IAutoMovieSurfaceConstruction): boolean =>
      entry.kind === "curve" && entry.name === "fork",
  )!;
  const node: IAutoMovieSurfaceNetwork.ISweepNode = network.nodes!
    .forkFront as IAutoMovieSurfaceNetwork.ISweepNode;
  const raw: IAutoMovieVector3 = compileAutoMovieSweep(
    network.sweeps[node.sweep]!,
  ).point(node.u, node.v);
  const actual: IAutoMovieVector3 = {
    x: curve.points[0]!,
    y: curve.points[1]!,
    z: curve.points[2]!,
  };
  TestValidator.predicate(
    "the shared-field curve is distinct from the raw zero-cell sweep",
    !vclose(actual, raw, 1e-6),
  );
  const ids: Set<number> = new Set();
  observed.cage.corners.forEach(
    (
      corners: IAutoMovieSurfaceRig["cage"]["corners"][number],
      face: number,
    ): void => {
      corners.forEach(
        (
          coordinate: IAutoMovieSurfaceRig["cage"]["corners"][number][number],
          corner: number,
        ): void => {
          const patch: IAutoMovieSurfaceNetwork.IPatch =
            network.patches[coordinate.patch]!;
          if (patch.type !== "sweep" || patch.sweep !== node.sweep) return;
          const u: number =
            patch.u[0] + (patch.u[1] - patch.u[0]) * coordinate.t;
          const v: number =
            patch.v[0] + (patch.v[1] - patch.v[0]) * coordinate.s;
          const turn: number = v - node.v - Math.round(v - node.v);
          if (Math.abs(u - node.u) <= 1e-9 && Math.abs(turn) <= 1e-9)
            ids.add(observed.cage.cage.faces[face]![corner]!);
        },
      );
    },
  );
  TestValidator.equals("one emitted semantic node", ids.size, 1);
  const index: number = [...ids][0]!;
  const target: IAutoMovieVector3 = {
    x: observed.cage.targets[3 * index]!,
    y: observed.cage.targets[3 * index + 1]!,
    z: observed.cage.targets[3 * index + 2]!,
  };
  TestValidator.predicate(
    "the curve meets its shared geometric target",
    vclose(actual, target, 1e-12),
  );
  TestValidator.predicate(
    "observation preserves every emitted number",
    observed.cage.targets.every((value: number, i: number): boolean =>
      nclose(value, plain.cage.targets[i]!, 0),
    ) &&
      observed.cage.cage.positions.every((value: number, i: number): boolean =>
        nclose(value, plain.cage.cage.positions[i]!, 0),
      ),
  );
  TestValidator.predicate(
    "observation preserves corner coordinates",
    observed.cage.corners.every(
      (
        corners: IAutoMovieSurfaceRig["cage"]["corners"][number],
        f: number,
      ): boolean =>
        corners.every(
          (
            coordinate: IAutoMovieSurfaceRig["cage"]["corners"][number][number],
            c: number,
          ): boolean => {
            const expected: IAutoMovieSurfaceRig["cage"]["corners"][number][number] =
              plain.cage.corners[f]![c]!;
            return (
              coordinate.patch === expected.patch &&
              nclose(coordinate.s, expected.s, 0) &&
              nclose(coordinate.t, expected.t, 0)
            );
          },
        ),
    ),
  );
  TestValidator.equals(
    "observation preserves rings",
    observed.cage.rings,
    plain.cage.rings,
  );
  function counts(n: number): IAutoMovieSurfaceNetwork.ICounts { return ({
    lowest: n, low: n, medium: n, high: n,
  }); }
  const boundary: Array<[number, number, number]> = [
    [-0.17, 0.17, 8], [0.17, 0.33, 2], [0.33, 0.67, 8], [0.67, 0.83, 2],
  ];
  const pinned: IAutoMovieSurfaceRig = rigAutoMovieSurfaceNetwork({
    network: {
      ...network,
      rings: [...(network.rings ?? []), {
        name: "geometric-field-negative-control",
        edges: boundary.map(([from, to, segments]: [number, number, number]): IAutoMovieSurfaceNetwork.ISweepEdge => ({
          type: "sweep", sweep: "trunk", from: { u: 0, v: from }, to: { u: 0, v: to }, segments: counts(segments),
        })),
        positions: Array.from({ length: 20 }, (_: unknown, i: number): IAutoMovieVector3 => {
          const angle: number = 2 * Math.PI * i / 20;
          return { x: 0.5 * Math.cos(angle), y: 0, z: 0.5 * Math.sin(angle) };
        }),
      }],
    },
    tier: "medium",
    fit: false,
    construction: { station: 16, line: 16, feature: 8, curve: 8 },
  });
  const pinnedCurve: IAutoMovieSurfaceConstruction = pinned.construction.find(
    (entry: IAutoMovieSurfaceConstruction): boolean => entry.kind === "curve" && entry.name === "fork",
  )!;
  TestValidator.predicate("active cage pins do not replace the generating curve", pinnedCurve.points.every(
    (value: number, i: number): boolean => nclose(value, curve.points[i]!, 0),
  ));
  TestValidator.predicate("the negative control actually moves the shared pin", !vclose(actual, {
    x: pinned.cage.targets[3 * index]!,
    y: pinned.cage.targets[3 * index + 1]!,
    z: pinned.cage.targets[3 * index + 2]!,
  }, 1e-3));
}
