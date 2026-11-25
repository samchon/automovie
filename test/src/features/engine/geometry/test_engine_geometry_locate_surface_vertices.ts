import {
  compileAutoMovieSweep,
  locateAutoMovieSurfaceVertices,
  sampleAutoMovieSurfaceNetwork,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import type {
  IAutoMovieSubdivisionParameter,
  IAutoMovieSubdivisionSurface,
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceLocation,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepBottle } from "../../internal/sweepBottle";
import { sweepTransitionTube } from "../../internal/sweepTransitionTube";
import { throwsError } from "../../internal/throwsError";

/**
 * `locateAutoMovieSurfaceVertices` locates every vertex of a subdivided network
 * by patch, patch coordinates and, on a sweep or transition patch, the sweep's
 * domain point, which lies on the sweep near the vertex.
 *
 * Fixtures: the bottle (sweep, heel and base Coons patches) and the tube that
 * changes column count, at the medium tier subdivided twice. Near means within
 * 1 cm: the chart departs 4.6 mm where row spacing changes, against 0.27 m read
 * the wrong way round.
 *
 * Scenarios:
 *
 * 1. Each vertex names its patch; on a sweep or transition patch its sweep, whose
 *    point at the domain point lies within 1 cm, while reading s as u and t as
 *    v puts it over 10 cm away; on a Coons patch no domain point; every patch
 *    is reached.
 * 2. A cage of another network ("not sampled from this network"), a face out of
 *    range, a non-quad corner ("not a quad") and u = 1.5 ("outside 0 to 1") are
 *    refused.
 */
export function test_engine_geometry_locate_surface_vertices(): void {
  // 1.
  for (const [name, network] of [
    ["bottle", sweepBottle()],
    ["tube", sweepTransitionTube()],
  ] satisfies [string, IAutoMovieSurfaceNetwork][]) {
    const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network, tier: "medium" });
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: { positions: cage.cage.positions, faces: cage.cage.faces },
      levels: 2,
    });
    const located: IAutoMovieSurfaceLocation[] = locateAutoMovieSurfaceVertices({
      network,
      cage,
      parameters: surface.parameters,
    });
    const sweeps: Record<string, IAutoMovieSweepSurface> = Object.fromEntries(
      Object.entries(network.sweeps).map(([key, sweep]: [string, IAutoMovieSweep]) => [key, compileAutoMovieSweep(sweep)]),
    );
    const distance = (sweep: string, u: number, v: number, at: number): number => {
      const p = sweeps[sweep]!.point(u, v);
      const q: ArrayLike<number> = surface.limitPositions;
      return Math.hypot(p.x - q[3 * at]!, p.y - q[3 * at + 1]!, p.z - q[3 * at + 2]!);
    };
    let near: number = 0;
    let swapped: number = 0;
    const reached: Set<string> = new Set();
    located.forEach((l: IAutoMovieSurfaceLocation, v: number): void => {
      const patch: IAutoMovieSurfaceNetwork.IPatch = network.patches[l.coordinate.patch]!;
      reached.add(l.name);
      TestValidator.predicate(
        `${name} vertex ${v} kind`,
        l.name === patch.name &&
          (patch.type === "sweep" || patch.type === "transition"
            ? l.sweep !== null && l.sweep.name === patch.sweep
            : l.sweep === null),
      );
      if (l.sweep === null) return;
      near = Math.max(near, distance(l.sweep.name, l.sweep.u, l.sweep.v, v));
      swapped = Math.max(swapped, distance(l.sweep.name, l.coordinate.s, l.coordinate.t, v));
    });
    TestValidator.equals(`${name} reached`, reached.size, network.patches.length);
    TestValidator.predicate(`${name} near ${near}`, near <= 0.01);
    TestValidator.predicate(`${name} swapped ${swapped}`, swapped > 0.1);
  }

  // 2.
  const network: IAutoMovieSurfaceNetwork = sweepTransitionTube();
  const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network, tier: "lowest" });
  for (const [label, parameter, other, message] of [
    ["another network", { face: 0, corner: null, u: 0.5, v: 0.5 }, sweepBottle(), "not sampled from this network"],
    ["face out of range", { face: cage.cage.faces.length, corner: null, u: 0.5, v: 0.5 }, network, "out of range"],
    ["non-quad", { face: 0, corner: 1, u: 0.5, v: 0.5 }, network, "not a quad"],
    ["outside", { face: 0, corner: null, u: 1.5, v: 0.5 }, network, "outside 0 to 1"],
  ] satisfies [string, IAutoMovieSubdivisionParameter, IAutoMovieSurfaceNetwork, string][])
    TestValidator.predicate(
      label,
      throwsError((): unknown => locateAutoMovieSurfaceVertices({ network: other, cage, parameters: [parameter] }), message),
    );
}
