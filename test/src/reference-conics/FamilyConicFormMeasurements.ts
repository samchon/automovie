import type { AutoMovieHumanEmptyProbes } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionRealization,
  IAutoMovieHumanBodySurface,
  IAutoMovieMeshCrossing,
  IAutoMovieMeshPiece,
  IAutoMovieMeshWinding,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { FamilyConicSurfaceMeasurements as Surface } from "./FamilyConicSurfaceMeasurements";

/** An inspection of the same retained skin and source charts the figure draws. */
export namespace FamilyConicFormMeasurements {
  /** Completed stages of the form and contact queries. */
  export type Phase = Surface.Phase | "boundary-gaps" | "clearances";

  /**
   * Geometry borrowed from the completed construction, with metre tessellation
   * and millimetre source charts.
   */
  type Realization = Pick<
    IAutoMovieConstructionRealization.IRealization,
    "body"
  > & {
    /** Indexed retained skin in metres. */
    mesh: Surface.Mesh & { indices: number[] };
    /** Retained analytic charts in millimetres, listed or indexed by name. */
    surfaces:
      | IAutoMovieConstructionRealization.IRealization["surfaces"]
      | ReadonlyMap<string, IAutoMovieSolidSurface>;
    /** Original named triangle index spans supplied by the skin producer. */
    triangleGroups?: IAutoMovieHumanBodySurface.IOutput["mesh"]["groups"];
    /** Previously measured welded components of this unchanged skin. */
    pieces?: IAutoMovieMeshPiece[];
  };

  /** One measured opening or the family rule's reason it could not be sampled. */
  type Probe = AutoMovieHumanEmptyProbes.IProbe & {
    /** Winding evaluation for a successfully placed opening. */
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
    /** Point on the first surface at the largest discrepancy, in world mm. */
    pointMm: AutoMovieVector3Tuple;
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
    /** Least retained triangle separation for the supplied owner pairs, in mm. */
    clearances: Clearance[];
    /** Maximum fitted bed or strip clipping, recorded at each authored digit. */
    clipping: NonNullable<IAutoMovieHumanBodySurface.IOutput["nailClipping"]>;
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
    onPhase?: (phase: Phase) => void,
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
    const shape = Surface.measure(
      real.mesh,
      { pieces: [{ genus: 0, boundaryLoops: 0 }], probes: sites },
      real.pieces,
      onPhase,
    );
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
    onPhase?.("boundary-gaps");
    const clearances: Clearance[] = ownerGaps(
      real,
      pairs,
      crossings.length !== 0,
    );
    onPhase?.("clearances");
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
    const surfaces = Array.isArray(real.surfaces)
      ? new Map(real.surfaces.map((surface) => [surface.name, surface]))
      : real.surfaces;
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
          let first: AutoMovieVector3Tuple;
          let second: AutoMovieVector3Tuple;
          try {
            first = position(surface, chart);
            second = position(other, authority.chart);
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
          const pointMm: AutoMovieVector3Tuple =
            face.chain === ordered[0] ? first : second;
          const key: string = JSON.stringify(ordered);
          const row = rows.get(key);
          if (row === undefined)
            rows.set(key, {
              first: ordered[0]!,
              second: ordered[1]!,
              samples: 1,
              maxMm: gap,
              pointMm,
            });
          else {
            ++row.samples;
            if (gap > row.maxMm) {
              row.maxMm = gap;
              row.pointMm = pointMm;
            }
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
   * Take triangles from the actual named ranges of the generated skin. The
   * generic engine mesh publishes owner coordinates instead of index ranges.
   */
  function ownerGaps(
    { mesh, triangleGroups }: Realization,
    pairs: readonly (readonly [string, string])[],
    hasCrossings: boolean,
  ): Clearance[] {
    const names = new Set(pairs.flat());
    const faces = new Map(
      [...names].map((name): [string, number[]] => [name, []]),
    );
    const append = (positions: number[], first: number, end: number): void => {
      for (let i: number = first; i < end; ++i) {
        const vertex: number = mesh.indices[i]!;
        positions.push(
          mesh.positions[vertex * 3]!,
          mesh.positions[vertex * 3 + 1]!,
          mesh.positions[vertex * 3 + 2]!,
        );
      }
    };
    if (triangleGroups !== undefined) {
      for (const [index, group] of triangleGroups.entries()) {
        if (!group.name.endsWith("/solid")) continue;
        const positions = faces.get(group.name.slice(0, -"/solid".length));
        if (positions !== undefined)
          append(
            positions,
            group.start,
            triangleGroups[index + 1]?.start ?? mesh.indices.length,
          );
      }
    } else if ("owners" in mesh && "coordinates" in mesh) {
      const owned = mesh as IAutoMovieConstructionRealization.IMesh;
      for (let i: number = 0; i < mesh.indices.length; i += 3) {
        const front: number = owned.coordinates[mesh.indices[i]! * 3]!;
        const middle: number = owned.coordinates[mesh.indices[i + 1]! * 3]!;
        const back: number = owned.coordinates[mesh.indices[i + 2]! * 3]!;
        const owner: number =
          front === back || front === middle
            ? front
            : middle === back
              ? middle
              : -1;
        const positions = faces.get(owned.owners[owner]!);
        if (positions !== undefined) append(positions, i, i + 3);
      }
    }
    const prepared = new Map(
      [...faces].flatMap(([name, positions]) => {
        if (positions.length === 0) return [];
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
