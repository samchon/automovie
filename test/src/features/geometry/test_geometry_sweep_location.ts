import {
  type IAutoMovieSubdivisionSurface,
  type IAutoMovieSurfaceCage,
  type IAutoMovieSurfaceLocation,
  type IAutoMovieSurfaceNetwork,
  type IAutoMovieSweepSurface,
  compileAutoMovieSweep,
  locateAutoMovieSurfaceVertices,
  sampleAutoMovieSurfaceNetwork,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepBottle } from "../internal/sweepBottle";
import { sweepTransitionTube } from "../internal/sweepTransitionTube";
import { throwsError } from "../internal/throwsError";

/** Metres a vertex may lie from the sweep at its located domain point: the chart's departure where row spacing changes, measured 4.6 mm, against 0.27 m for the chart read the wrong way round. */
const NEAR: number = 0.01;

/**
 * Every vertex of a subdivided network is located by patch, patch
 * coordinates and, on a sweep or transition patch, the sweep's domain point,
 * which lies on the sweep near the vertex.
 *
 * Scenarios:
 *
 * 1. The bottle and the tube that changes column count, at the medium tier
 *    subdivided twice: each vertex on a sweep or transition patch names its
 *    sweep, and the sweep at its domain point lies within 1 cm of the
 *    vertex, where reading `s` as `u` and `t` as `v` puts it tens of
 *    centimetres away; each vertex on the bottle's heel and base Coons
 *    patches has no domain point; every patch is reached.
 * 2. A cage of another network, a face out of range, a non-quad face and
 *    coordinates outside 0 to 1 are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Locates every subdivided vertex with `locateAutoMovieSurfaceVertices` and evaluates the sweep at each domain point; a swapped or unscaled chart, a wrong patch or a missing patch kind fails, while the chart composition passes.
 * @evidence contracts/testing.md#independent-expectations The expected point is the sweep itself from `compileAutoMovieSweep`, independent of the cage; the swapped reading is measured beside it, so the bound is shown to distinguish; the patch kinds come from the fixtures' declarations.
 * @evidence contracts/testing.md#distinguishing-cases Covers sweep, transition and Coons patches, a seam spanning a whole turn and each refusal; displacement by the located field is owned by the displacement test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_location` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_location(): void {
  for (const [name, network] of [
    ["bottle", sweepBottle()],
    ["tube", sweepTransitionTube()],
  ] as const) {
    const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
      network,
      tier: "medium",
    });
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: { positions: cage.cage.positions, faces: cage.cage.faces },
      levels: 2,
    });
    const locations: IAutoMovieSurfaceLocation[] =
      locateAutoMovieSurfaceVertices({
        network,
        cage,
        parameters: surface.parameters,
      });
    const sweeps: Record<string, IAutoMovieSweepSurface> = Object.fromEntries(
      Object.entries(network.sweeps).map(
        ([key, sweep]): [string, IAutoMovieSweepSurface] => [
          key,
          compileAutoMovieSweep(sweep),
        ],
      ),
    );
    const distance = (
      sweep: string,
      u: number,
      v: number,
      at: number,
    ): number => {
      const p = sweeps[sweep]!.point(u, v);
      return Math.hypot(
        p.x - surface.limitPositions[3 * at]!,
        p.y - surface.limitPositions[3 * at + 1]!,
        p.z - surface.limitPositions[3 * at + 2]!,
      );
    };
    let near: number = 0;
    let swapped: number = 0;
    let kinds: boolean = true;
    const reached: Set<string> = new Set();
    locations.forEach((l: IAutoMovieSurfaceLocation, v: number): void => {
      const patch: IAutoMovieSurfaceNetwork.IPatch =
        network.patches[l.coordinate.patch]!;
      reached.add(l.name);
      kinds &&=
        l.name === patch.name &&
        (patch.type === "sweep" || patch.type === "transition"
          ? l.sweep?.name === patch.sweep
          : l.sweep === null);
      if (l.sweep === null) return;
      near = Math.max(near, distance(l.sweep.name, l.sweep.u, l.sweep.v, v));
      swapped = Math.max(
        swapped,
        distance(l.sweep.name, l.coordinate.s, l.coordinate.t, v),
      );
    });
    TestValidator.equals(
      `the ${name}'s vertices are located on their patches and near their sweeps`,
      {
        kinds,
        reached: reached.size,
        near: near <= NEAR,
        swapped: swapped > 10 * NEAR,
      },
      {
        kinds: true,
        reached: network.patches.length,
        near: true,
        swapped: true,
      },
    );
  }

  const network: IAutoMovieSurfaceNetwork = sweepTransitionTube();
  const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network,
    tier: "lowest",
  });
  const locate =
    (
      parameter: { face: number; corner: number | null; u: number; v: number },
      other: IAutoMovieSurfaceNetwork = network,
    ) =>
    (): unknown =>
      locateAutoMovieSurfaceVertices({
        network: other,
        cage,
        parameters: [parameter],
      });
  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "a cage of another network",
      locate({ face: 0, corner: null, u: 0.5, v: 0.5 }, sweepBottle()),
      "not sampled from this network",
    ],
    [
      "a face out of range",
      locate({ face: cage.cage.faces.length, corner: null, u: 0.5, v: 0.5 }),
      "out of range",
    ],
    [
      "a non-quad face",
      locate({ face: 0, corner: 1, u: 0.5, v: 0.5 }),
      "not a quad",
    ],
    [
      "coordinates outside 0 to 1",
      locate({ face: 0, corner: null, u: 1.5, v: 0.5 }),
      "outside 0 to 1",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
