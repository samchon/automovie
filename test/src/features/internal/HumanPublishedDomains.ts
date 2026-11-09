import {
  type AutoMovieLoftContract,
  AutoMovieSolidBody,
  AutoMovieSolidChain,
  AutoMovieSolidMesh,
  type IAutoMovieLoftChain,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";

import { AutoMovieHumanBodySurfaceRead } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurfaceRead";
import { AutoMovieHumanBodySurfaceSolids } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurfaceSolids";
import type { IAutoMovieHumanSurfaceContext } from "../../../../packages/human/src/generation/IAutoMovieHumanSurfaceContext";
import { AutoMovieHumanLoftMesh } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftStations } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftStations";
import { ConstructionShapes } from "./construction/ConstructionShapes";

/**
 * The published-domain fixture shared by the restoration scenarios:
 * a real native ellipsoid body published with authoritative grid ends and an
 * independent interior hole, then consumed through
 * `AutoMovieHumanBodySurfaceSolids.draw` in one scenario.
 */
export namespace HumanPublishedDomains {
  /** One restoration scenario. */
  export interface IScenario {
    /** Whether the publication keeps its explicit domain authorities (false: a legacy publication without them). */
    explicit: boolean;

    /** Phase density multiple of the restored chain's samples. */
    density: number;
  }

  /**
   * Every finding of the publication and of one restoration scenario.
   *
   * @param scenario The scenario.
   */
  export function audit(scenario: IScenario): string[] {
    const failures: string[] = [];
    const source: ReturnType<typeof realizeAutoMovieConstruction> = realizeAutoMovieConstruction(
      {
        name: "human-domain-roundtrip",
        root: ConstructionShapes.ellipsoid("domain.body", ConstructionShapes.DOWN, 0.001, 0.001, 0.002, 9),
      },
      { chord: 0.0005, skin: false },
    );
    const chain: IAutoMovieLoftChain | undefined = source.chains[0];
    if (chain === undefined || chain.pole === undefined || chain.opposite === undefined || source.diagnostics.length !== 0)
      throw new Error("Actual published-domain fixture has no valid two-pole original");
    const surface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(chain);
    if (surface === null) throw new Error("Actual published-domain fixture has no original surface");
    const bottom: number | null = AutoMovieHumanBodySurfaceRead.capHeight(chain, "bottom");
    const top: number | null = AutoMovieHumanBodySurfaceRead.capHeight(chain, "top");
    if (bottom === null || top === null) throw new Error("Actual published-domain fixture has no retained true tips");
    const tolerance: number = 0.2;
    const stations: number[] = AutoMovieHumanLoftStations.bisect(chain, bottom, top, tolerance).filter((station: number): boolean => station !== bottom && station !== top);
    if (stations.length < 3) throw new Error("Actual published-domain fixture has too few regular rows");
    const phases: number[] = Array.from({ length: chain.samples }, (_: unknown, index: number): number => (2 * Math.PI * index) / chain.samples);
    const body: AutoMovieSolidBody.IBody = AutoMovieSolidBody.create("human-domain-roundtrip", [{ surface, stations, phases }]);
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, surface);

    /** Keep the actual original world point and authoritative identity in its own chart. */
    const loop: (kind: AutoMovieSolidMesh.ILoop["kind"], chart: [number, number][]) => AutoMovieSolidMesh.ILoop = (
      kind: AutoMovieSolidMesh.ILoop["kind"],
      chart: [number, number][],
    ): AutoMovieSolidMesh.ILoop => ({
      kind,
      chart,
      vertices: chart.map(([s, t]: [number, number]): number => AutoMovieSolidMesh.vertex(body.mesh, surface.point?.(s, t) ?? surface.jet(s, t).p, owner, s, t)),
    });
    const a: number = stations[0]!;
    const b: number = stations.at(-1)!;
    body.faces[0]!.meshLoops = [loop("start", phases.map((phase: number): [number, number] => [a, phase])), loop("end", phases.map((phase: number): [number, number] => [b, phase]))];
    const low: number = a + 0.4 * (b - a);
    const high: number = a + 0.6 * (b - a);

    // Keep this interior cut away from the periodic cover seam, so its chart centroid is unambiguous.
    const cut: AutoMovieSolidMesh.ILoop = loop("hole", [
      [low, 3],
      [high, 3],
      [high, 3.4],
      [low, 3.4],
    ]);
    body.faces[0]!.cycles.push({ ...cut, neighbours: [] });
    const publication: AutoMovieSolidBody.IPublished = AutoMovieSolidBody.publish(body);
    if (
      publication.faces[0]!.cycles.length !== 1 ||
      publication.faces[0]!.domainLoops?.length !== 2 ||
      publication.faces[0]!.grid?.stations[0] !== a ||
      publication.faces[0]!.grid?.stations[1] !== b ||
      publication.faces[0]!.grid?.phases[0] !== phases[0] ||
      publication.faces[0]!.grid?.phases[1] !== phases.at(-1) ||
      !(surface.domain !== undefined && surface.domain[0] < a && b < surface.domain[1])
    )
      failures.push("Publication flattened original domain authorities into actual cuts");

    const explicit: boolean = scenario.explicit;
    const published: AutoMovieSolidBody.IPublished = explicit
      ? publication
      : {
          ...publication,
          faces: publication.faces.map(
            (face: AutoMovieSolidBody.IPublished["faces"][number]): AutoMovieSolidBody.IPublished["faces"][number] => ({
              chain: face.chain,
              cycles: face.cycles,
            }),
          ),
        };
    const context: IAutoMovieHumanSurfaceContext = {
      mesh: AutoMovieHumanLoftMesh.create(),
      chains: new Map([[chain.name, { ...chain, samples: chain.samples * scenario.density }]]),
      indices: new Map([[chain.name, 0]]),
      coordinates: [],
      // The scenario changes the phase density only; the station tolerance
      // stays the publication's, so a denser run differs in phases alone.
      tolerance,
      events: [],
      poles: new Map(),
      boundaries: new Map(),
      apertures: [],
      details: [],
      roots: new Map(),
      ends: new Map(),
      holes: new Map(),
      rims: new Map(),
    };
    try {
      const diagnostics: AutoMovieLoftContract.IDiagnostic[] = AutoMovieHumanBodySurfaceSolids.draw(context, {
        stature: 4,
        chains: [chain],
        events: [],
        poles: [],
        apertures: [],
        eyes: [],
        bodies: [published],
      });
      if (diagnostics.length !== 0) failures.push(`${explicit}: actual Human restoration ${JSON.stringify(diagnostics)}`);
      if (explicit) {
        const regular: number[] = [];
        for (let vertex: number = 0; vertex < context.coordinates.length / 3; vertex++) if (Number.isFinite(context.coordinates[3 * vertex + 2])) regular.push(context.coordinates[3 * vertex + 1]!);
        if (Math.min(...regular) !== a || Math.max(...regular) !== b) failures.push("Human restoration replaced published regular bounds with source pole bounds");
        if (surface.domain?.[0] !== bottom || surface.domain?.[1] !== top) failures.push("Human restoration changed original source ownership while restoring sampling bounds");
        const used: Set<number> = new Set(context.mesh.indices);
        // Vertices bucketed by x on a 1e-9 grid, so each authority reads only
        // the one or two buckets its 1e-10 window can reach.
        const buckets: Map<number, number[]> = new Map();
        for (let vertex: number = 0; vertex < context.mesh.positions.length / 3; vertex++) {
          const key: number = Math.floor(context.mesh.positions[3 * vertex]! / 1e-9);
          const list: number[] = buckets.get(key) ?? [];
          list.push(vertex);
          buckets.set(key, list);
        }
        for (const boundary of publication.faces[0]!.domainLoops ?? [])
          for (const point of boundary.points) {
            const authority: AutoMovieSolidBody.IPublished["points"][number] = publication.points[point]!;
            const expected: [number, number, number] = surface.point?.(...authority.chart) ?? surface.jet(...authority.chart).p;
            const matches: number[] = [];
            for (let key: number = Math.floor((expected[0] - 1e-10) / 1e-9); key <= Math.floor((expected[0] + 1e-10) / 1e-9); key++)
              for (const vertex of buckets.get(key) ?? [])
                if (expected.every((value: number, coordinate: number): boolean => Math.abs(value - context.mesh.positions[3 * vertex + coordinate]!) < 1e-10)) matches.push(vertex);
            if (matches.length !== 1 || !used.has(matches[0]!))
              failures.push("Human restoration ignored or duplicated an original domain authority instead of consuming its shared vertex");
          }
      }
      for (const pole of [chain.pole, chain.opposite]) {
        let count: number = 0;
        for (let index: number = 0; index < context.mesh.positions.length; index += 3)
          if (pole.point.every((value: number, coordinate: number): boolean => Math.abs(value - context.mesh.positions[index + coordinate]!) < 1e-10)) count++;
        if (count !== 1) failures.push(`${explicit}: original ${pole.end} apex count ${count}, expected one`);
      }
      for (let index: number = 0; index < context.mesh.indices.length; index += 3) {
        const vertices: number[] = context.mesh.indices.slice(index, index + 3);
        const chart: [number, number][] = vertices.map((vertex: number): [number, number] => [context.coordinates[3 * vertex + 1]!, context.coordinates[3 * vertex + 2]!]);
        if (!chart.flat().every(Number.isFinite)) continue;
        const s: number = chart.reduce((sum: number, value: [number, number]): number => sum + value[0] / 3, 0);
        const t: number = chart.reduce((sum: number, value: [number, number]): number => sum + value[1] / 3, 0);
        if (s > low && s < high && t > 3 && t < 3.4) failures.push(`${explicit}: a regular triangle fills the actual cutting hole`);
      }
      if (context.mesh.indices.length === 0) failures.push(`${explicit}: actual Human restoration emitted no triangles`);
    } catch (error: unknown) {
      failures.push(`${explicit}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return failures;
  }
}
