import type { AutoMovieHumanEmptyProbes } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionRealization,
  IAutoMovieMeshCrossing,
  IAutoMovieMeshPiece,
  IAutoMovieMeshWinding,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { FamilyConicSurfaceMeasurements as Surface } from "./FamilyConicSurfaceMeasurements";

/** An inspection of the same retained skin and source charts the figure draws. */
export namespace FamilyConicFormMeasurements {
  /**
   * Geometry borrowed from the completed construction, with metre tessellation
   * and millimetre source charts.
   */
  type Realization = Pick<
    IAutoMovieConstructionRealization.IRealization,
    "mesh" | "body" | "surfaces"
  >;

  /** One measured opening or the family rule's reason it could not be sampled. */
  type Probe = AutoMovieHumanEmptyProbes.IProbe & {
    reading?: IAutoMovieMeshWinding;
  };

  /**
   * A physical gap between two retained face authorities on their published
   * shared boundary.
   */
  interface Contact {
    /** The first named surface. */
    first: string;
    /** The second named surface. */
    second: string;
    /** Shared boundary chart pairs evaluated in world coordinates. */
    samples: number;
    /** Largest world-space discrepancy, in mm. */
    maxMm: number;
  }

  /**
   * A pair of facing owner surfaces that retain their own names in the sewn
   * mesh.
   */
  interface Clearance {
    /** The first separated face's surface name. */
    first: string;
    /** The second separated face's surface name. */
    second: string;
    /**
     * Least observed triangle distance, in mm. Zero on a crossing, null when a
     * face was not retained.
     */
    gapMm: number | null;
  }

  /**
   * Pairwise surface measurements and topological findings on one emitted
   * figure.
   */
  export interface IReport {
    /**
     * Welded connected pieces, with manifoldness, winding consistency and
     * genus.
     */
    pieces: IAutoMovieMeshPiece[];
    /**
     * Generalized winding numbers at the declared empty probes, in listing
     * order.
     */
    probes: Probe[];
    /** Generalized winding at the supplied interior point. */
    interior: IAutoMovieMeshWinding;
    /**
     * Original-buffer triangle crossing witnesses, one per affected first
     * triangle.
     */
    crossings: IAutoMovieMeshCrossing[];
    /**
     * Original world positions at both sides of the same published contact
     * vertex.
     */
    contacts: Contact[];
    /**
     * Least retained triangle separation for the supplied owner pairs, in
     * mm.
     */
    clearances: Clearance[];
    /** Maximum fitted bed or strip clipping, recorded at each authored digit. */
    clipping: { digit: string; maximumMm: number }[];
    /** Every failed or unavailable measurement. */
    findings: string[];
    /** Duration of the report alone, in ms. */
    queryMs: number;
  }

  /**
   * Evaluate on the original buffers in one report. Probe inputs are in mm, the
   * interior point is in metres. The crossing query supplies intersection
   * witnesses, while a boundary contact gap and a triangle distance measure
   * independent properties. Clipping comes from the same construction's nail
   * fit.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the engine's mesh piece, generalized winding, triangle crossing and prepared distance readers on the actual retained mesh and compares both source charts at each shared boundary sample.
   * @evidence contracts/development/implementation.md#efficient-algorithms Point winding shares one prepared mesh. One triangle pass selects the named faces and each distance hierarchy processes only its own triangles. Pair crossing hierarchies run when the full skin contains a strict crossing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing samples stay findings. No reference distance, posed stand-in, substitute hull, reopened operator or modified candidate mesh is used.
   */
  export function measure(
    real: Realization,
    probeInputs: readonly AutoMovieHumanEmptyProbes.IProbe[],
    interiorPoint: readonly number[],
    pairs: readonly (readonly [string, string])[],
    clipping: IReport["clipping"] = [],
  ): IReport {
    const started: number = performance.now();
    const sites: Surface.IProbe[] = [
      {
        name: "the declared interior point",
        kind: "solid",
        point: interiorPoint,
      },
    ];
    for (const probe of probeInputs)
      if ("point" in probe)
        sites.push({
          name: probe.name,
          kind: "empty",
          point: probe.point.map((mm): number => mm / 1000),
        });
    const shape = Surface.measure(real.mesh, {
      pieces: [{ genus: 0, boundaryLoops: 0 }],
      probes: sites,
    });
    const { pieces, crossings, findings } = shape;
    const interior: IAutoMovieMeshWinding = shape.probes[0]!.reading;
    let probeIndex: number = 1;
    const probes: Probe[] = probeInputs.map((probe): Probe => {
      if (!("point" in probe)) {
        findings.push(probe.name + " probe unplaced: " + probe.reason);
        return probe;
      }
      return { ...probe, reading: shape.probes[probeIndex++]!.reading };
    });

    const contacts: Contact[] = boundaryGaps(real, findings);
    const clearances: Clearance[] = ownerGaps(
      real.mesh,
      pairs,
      crossings.length !== 0,
    );
    for (const row of clearances)
      if (row.gapMm === null)
        findings.push(
          `clearance ${row.first} / ${row.second} lacks retained triangles`,
        );

    // The made-figure check in Human's nails.md bounds the combined fit.
    for (const row of clipping)
      if (!Number.isFinite(row.maximumMm) || row.maximumMm > 0.01)
        findings.push(
          `${row.digit} clips ${row.maximumMm} mm against the 0.01 mm limit`,
        );
    return {
      pieces,
      probes,
      interior,
      crossings,
      contacts,
      clearances,
      clipping,
      findings,
      queryMs: performance.now() - started,
    };
  }

  /**
   * Compare the two world points each published common boundary coordinate
   * denotes.
   */
  function boundaryGaps(real: Realization, findings: string[]): Contact[] {
    const surfaces = new Map(
      real.surfaces.map((surface): [string, IAutoMovieSolidSurface] => [
        surface.name,
        surface,
      ]),
    );
    const rows = new Map<string, Contact>();
    const unavailable = new Set<string>();
    for (const face of real.body.faces) {
      const surface = surfaces.get(face.chain);
      const gaps = [...face.cycles, ...(face.domainLoops ?? [])];
      for (const cycle of gaps)
        for (const [i, point] of cycle.points.entries()) {
          const authority = real.body.points[point];
          if (authority?.chain === face.chain) continue;
          const other =
            authority === undefined ? undefined : surfaces.get(authority.chain);
          const chart = cycle.chart[i];
          if (
            surface === undefined ||
            other === undefined ||
            authority === undefined ||
            chart === undefined
          ) {
            unavailable.add(
              `shared boundary on ${face.chain} has an incomplete source chart`,
            );
            continue;
          }
          let gap: number;
          try {
            const first: AutoMovieVector3Tuple = position(surface, chart);
            const second: AutoMovieVector3Tuple = position(
              other,
              authority.chart,
            );
            gap = Math.hypot(
              first[0] - second[0],
              first[1] - second[1],
              first[2] - second[2],
            );
            if (!Number.isFinite(gap)) throw new Error("nonfinite position");
          } catch (error: unknown) {
            unavailable.add(
              `shared boundary ${face.chain} / ${authority.chain}: ${error instanceof Error ? error.message : String(error)}`,
            );
            continue;
          }
          const ordered: string[] =
            face.chain < authority.chain
              ? [face.chain, authority.chain]
              : [authority.chain, face.chain];
          const key: string = JSON.stringify(ordered);
          const row = rows.get(key);
          if (row === undefined)
            rows.set(key, {
              first: ordered[0]!,
              second: ordered[1]!,
              samples: 1,
              maxMm: gap,
            });
          else {
            ++row.samples;
            row.maxMm = Math.max(row.maxMm, gap);
          }
        }
    }
    findings.push(...unavailable);
    return [...rows.values()];
  }

  /**
   * A collapsed cap may own its retained Point0 even where a two-jet does not
   * exist.
   */
  function position(
    surface: IAutoMovieSolidSurface,
    chart: [number, number],
  ): AutoMovieVector3Tuple {
    return surface.point?.(...chart) ?? surface.jet(...chart).p;
  }

  /**
   * Take triangles with two or three corners assigned to the same named face.
   * Each selected face's distance query receives only its own corners.
   */
  function ownerGaps(
    mesh: Realization["mesh"],
    pairs: readonly (readonly [string, string])[],
    hasCrossings: boolean,
  ): Clearance[] {
    const names = new Set(pairs.flat());
    const faces = new Map(
      mesh.owners.flatMap((name, owner): [number, number[]][] =>
        names.has(name) ? [[owner, []]] : [],
      ),
    );
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const a: number = mesh.indices[i]!;
      const b: number = mesh.indices[i + 1]!;
      const c: number = mesh.indices[i + 2]!;
      const front: number = mesh.coordinates[a * 3]!;
      const middle: number = mesh.coordinates[b * 3]!;
      const back: number = mesh.coordinates[c * 3]!;
      const owner: number =
        front === back || front === middle
          ? front
          : middle === back
            ? middle
            : -1;
      const positions = faces.get(owner);
      if (positions === undefined) continue;
      for (const vertex of [a, b, c])
        positions.push(
          mesh.positions[vertex * 3]!,
          mesh.positions[vertex * 3 + 1]!,
          mesh.positions[vertex * 3 + 2]!,
        );
    }
    const prepared = new Map(
      [...faces].flatMap(([owner, positions]) => {
        if (positions.length === 0) return [];
        const name: string = mesh.owners[owner]!;
        return [
          [
            name,
            Surface.prepareGap(
              { positions, indices: null },
              name,
              hasCrossings,
            ),
          ] as const,
        ];
      }),
    );
    return pairs.map(([first, second]): Clearance => {
      const a = prepared.get(first);
      const b = prepared.get(second);
      return {
        first,
        second,
        gapMm: a === undefined || b === undefined ? null : Surface.gap(a, b),
      };
    });
  }
}
