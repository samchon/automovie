import {
  type AutoMovieConstructionRealization,
  type IAutoMovieSolidSurface,
  realizeAutoMovieConstruction,
} from "@automovie/engine";

import type { AutoMovieHumanTorsoSource } from "../generation/trunk/AutoMovieHumanTorsoSource";
import { HumanTorsoObservation } from "./HumanTorsoObservation";
import type { NodeCanvasTypes as N } from "./NodeCanvasTypes";

/** The existing public single-profile realizer's actual retained surfaces and tessellated mesh, without whole-person calibration or binding. */
export namespace HumanTorsoLoftObservation {
  /** Selected actual realization/mesh/render owners whose bytes accompany this observer; not an exhaustive transformed-module identity. */
  export const sourceFiles: readonly string[] = [
    ...["realizeAutoMovieConstruction", "AutoMovieConstructionProfileRealize", "AutoMovieConstructionProfileSurface", "AutoMovieConstructionProfileGrid", "AutoMovieConstructionProfileBody", "AutoMovieConstructionProfileSkin", "AutoMovieConstructionSkin", "gridAutoMovieSolidMesh", "faceAutoMovieSolidMesh", "AutoMovieSolidMeshAuthorities", "AutoMovieSolidMeshWrite", "AutoMovieLoftSectionNative"].map(
      (name: string): string => "packages/engine/src/geometry/construction/" + name + ".ts",
    ),
    "packages/human/src/executable/NodeCanvasRaster.ts",
  ];

  /** Display buffers preserve actual stage failures instead of substituting original guide geometry. */
  export interface IOutput {
    /** The official realizer and every requested display reader succeeded, or retain their partial/failed state. */
    readonly status: "provided" | "partial" | "failed";

    /** Curves read only from the realized profile's retained atlas faces. */
    readonly curves: readonly N.Curve[];

    /** The official single-leaf skin:true output, not the whole figure's final skin. */
    readonly meshes: readonly N.Mesh[];

    /** Actual source/operator boundaries and failures for the existing packet. */
    readonly facts: Readonly<Record<string, unknown>>;

    /** Exact official buffers, archived once by the executable rather than repeated in progress manifests. */
    readonly buffers?: Pick<AutoMovieConstructionRealization.IRealization, "body" | "mesh">;
  }

  /**
   * Request one real profile leaf and adapt its public output for the existing renderer.
   *
   * @evidence contracts/common.md#principled-implementation Passes the exact source declaration and same source object in profiles to realizeAutoMovieConstruction with skin:true. Surface lines read retained atlas faces in their published grid domain; triangles come only from the official returned mesh.
   * @evidence contracts/common.md#clear-and-simple-design One explicit consumer adapts the public realization to existing curve/mesh display buffers; it owns no loft, solver, triangulator or renderer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never substitutes original guide lines, reference skin or sampled triangles for a missing realized face/mesh. Every diagnostic and failed line remains recorded; no whole-body preparation or binding occurs.
   * @evidence contracts/common.md#meaningful-documentation Separates complete public realization with tessellation, retained atlas reading, display sampling and single-leaf clay from whole-person final skin. Elapsed public time includes admission, grid/physical2, atlas and tessellation and is not inferred by subtraction.
   * @evidence contracts/performance.md#efficient-algorithms One public realization precedes a bounded display population of named sections and three meridians per retained face. Source-owned adaptive grid and tessellation costs remain those of the engine.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's exact already-authored source, the one realizer output and actual published boundary/grid coordinates for every camera; no original or constraint solve is repeated.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One synchronous call owns its temporary realization/readers. Returned copied display points and borrowed mesh indices belong to the packet; no cache, process or external handle escapes.
   */
  export function create(original: AutoMovieHumanTorsoSource.IOutput): IOutput {
    const started: number = performance.now();
    const curves: N.Curve[] = [];
    const meshes: N.Mesh[] = [];
    const failures: { id: string; detail: string }[] = [];
    const selections: { face: string; gridBounds: unknown; meridianAnchors: number[]; sectionStations: number[]; phaseSteps: number; stationStepsPerAnchorSpan: number }[] = [];
    const facts: Record<string, unknown> = {
      stage: "single-profile-official-loft-and-tessellation",
      requestedSkin: true,
      wholePersonFinalSkin: "not-run",
      binding: "not-run",
      source: original.source.definition.name,
      sourceConstraintState: original.plan.constraints,
      sourceMeaning: "The actual supplied original profile, possibly with unresolved semantic constraints; public realization is a separate requested operation, not constraint closure or anatomical acceptance",
      chordMetres: 0.0005 * original.plan.scale,
      timingBoundary: "Complete public realization: admission, profile/grid/physical2/atlas, body drawing and official skin tessellation; not an isolated loft time or a subtraction",
      displayPolicy: "Retained atlas Point0 sections and three meridians per face; display sampling is not a new original, fit or geometry certificate",
      failures,
      selections,
      renderer: "Existing two-sided CPU flat Lambert clay, no viewer PBR/shadows/smooth-normal parity",
    };
    try {
      const realized: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction(
        { name: "S00.single-profile", root: { ...original.source.definition, type: "profile" } },
        { chord: 0.0005 * original.plan.scale, skin: true,
          profiles: new Map([[original.source.definition.name, original.source]]) },
      );
      const realizedAt: number = performance.now();
      facts.publicRealizationMilliseconds = realizedAt - started;
      facts.diagnostics = realized.diagnostics;
      facts.publishedBody = { points: realized.body.points.length, faces: realized.body.faces.length };
      const profile: NonNullable<typeof realized.profiles>[number] | undefined = realized.profiles?.[0];
      if (profile === undefined || realized.profiles?.length !== 1)
        throw new Error("The official single leaf has no unique retained profile");
      const multiplier: number = 1 / (1000 * original.plan.scale);
      for (const [index, face] of profile.atlas.faces.entries()) {
        const published: (typeof realized.body.faces)[number] | undefined = realized.body.faces.find(
          (item: (typeof realized.body.faces)[number]): boolean => item.chain === face.name,
        );
        if (published?.grid === undefined || published.domainLoops === undefined)
          throw new Error("Realized face has no actual published grid/domain authorities: " + face.name);
        const grid: NonNullable<typeof published.grid> = published.grid;
        const rows: number[] = [...new Set([
          ...published.domainLoops.flatMap((loop: NonNullable<typeof published.domainLoops>[number]): number[] => loop.chart.map((p: [number, number]): number => p[0])),
          ...original.sections.map((section: AutoMovieHumanTorsoSource.ISection): number => section.station)
            .filter((s: number): boolean => s >= grid.stations[0] && s <= grid.stations[1]),
        ])].sort((a: number, b: number): number => a - b);
        selections.push({ face: face.name, gridBounds: grid, meridianAnchors: rows,
          sectionStations: original.sections.map((section: AutoMovieHumanTorsoSource.ISection): number => section.station)
            .filter((s: number): boolean => s >= grid.stations[0] && s <= grid.stations[1]),
          phaseSteps: 64, stationStepsPerAnchorSpan: 16 });

        /** A failed complete line stays unavailable; no surviving prefix is drawn. */
        const append: (id: string, coordinates: readonly [number, number][]) => void = (
          id: string, coordinates: readonly [number, number][],
        ): void => {
          try {
            if (face.point === undefined) throw new Error("Retained face Point0 is unavailable");
            const points: N.Point[] = coordinates.map(([s, t]: [number, number]): N.Point => {
              if (!profile.atlas.kept(index, s, t)) throw new Error("Display query is outside the retained atlas face");
              const p: ReturnType<NonNullable<IAutoMovieSolidSurface["point"]>> = face.point!(s, t);
              if (!p.every(Number.isFinite)) throw new Error("Realized face returned a nonfinite point");
              return [p[0] * multiplier, p[1] * multiplier, p[2] * multiplier];
            });
            curves.push({ id, points, closed: false, colour: "a52863" });
          } catch (error: unknown) {
            failures.push({ id, detail: error instanceof Error ? (error.stack ?? error.message) : String(error) });
          }
        };
        for (const section of original.sections.filter((section: AutoMovieHumanTorsoSource.ISection): boolean => section.station >= grid.stations[0] && section.station <= grid.stations[1]))
          append("loft." + face.name + "/" + section.id,
            Array.from({ length: 65 }, (_: unknown, j: number): [number, number] => [section.station, grid.phases[0] + (grid.phases[1] - grid.phases[0]) * j / 64]));
        for (const fraction of [0, 0.5, 1])
          append("loft." + face.name + "/meridian." + fraction,
            HumanTorsoObservation.subdivide(rows, 16).map((s: number): [number, number] => [s, grid.phases[0] + (grid.phases[1] - grid.phases[0]) * fraction]));
      }
      const mesh: typeof realized.mesh = realized.mesh;
      if (mesh.positions.length < 9 || !mesh.positions.every(Number.isFinite) || mesh.indices.length < 3 ||
        !mesh.indices.every((i: number): boolean => Number.isSafeInteger(i) && i >= 0 && 3 * i + 2 < mesh.positions.length))
        throw new Error("The official single-leaf tessellation has no finite nonempty display mesh");
      meshes.push({ id: "S00.official-single-leaf-tessellation",
        positions: mesh.positions.map((value: number): number => value / original.plan.scale), indices: mesh.indices,
        colour: [0.61, 0.43, 0.29] });
      facts.retainedFaces = profile.atlas.faces.map((face: IAutoMovieSolidSurface): unknown => ({ name: face.name, domain: face.domain, period: face.period ?? null }));
      facts.mesh = { vertices: mesh.positions.length / 3, triangles: mesh.indices.length / 3, owners: mesh.owners,
        units: "positions in world metres; coordinates are original owner/station-mm/normalized-piece-phase" };
      facts.displayMilliseconds = performance.now() - realizedAt;
      const meshReadStarted: number = performance.now();
      facts.meshReading = inspectMesh(realized, original.plan.domain[0]);
      facts.meshReadingMilliseconds = performance.now() - meshReadStarted;
      return { status: realized.diagnostics.length === 0 && failures.length === 0 ? "provided" : "partial", curves, meshes, facts, buffers: { body: realized.body, mesh } };
    } catch (error: unknown) {
      facts.error = error instanceof Error ? (error.stack ?? error.message) : String(error);
      facts.failedElapsedMilliseconds = performance.now() - started;
      return { status: "failed", curves, meshes, facts };
    }
  }
}

/** Read the exact returned vertex/triangle consumer against its retained original owners, without fitting, welding or changing any buffer. */
function inspectMesh(
  realized: AutoMovieConstructionRealization.IRealization,
  pole: number,
): Readonly<Record<string, unknown>> {
  const mesh: AutoMovieConstructionRealization.IMesh = realized.mesh;
  const faces: readonly IAutoMovieSolidSurface[] = realized.profiles![0]!.atlas.faces;
  const readings: { owner: string; vertices: number; pointReadings: number; jetReadings: number; unobservedJets: number; maxPointGapMm: number | null; maxJetGapMm: number | null; maxPointJetGapMm: number | null; worst: unknown; unavailable: { vertex: number; detail: string }[] }[] = mesh.owners.map(
    (owner: string): (typeof readings)[number] => ({ owner, vertices: 0, pointReadings: 0, jetReadings: 0, unobservedJets: 0, maxPointGapMm: null, maxJetGapMm: null, maxPointJetGapMm: null, worst: null, unavailable: [] }),
  );
  const bySource: Map<string, number[]> = new Map();
  for (let vertex: number = 0; 3 * vertex < mesh.positions.length; vertex++) {
    const owner: number = mesh.coordinates[3 * vertex]!;
    const s: number = mesh.coordinates[3 * vertex + 1]!;
    const t: number = mesh.coordinates[3 * vertex + 2]!;
    const row: (typeof readings)[number] = readings[owner]!;
    const key: string = row.owner + "/" + s + "/" + t;
    const known: number[] = bySource.get(key) ?? [];
    known.push(vertex);
    bySource.set(key, known);
    const face: IAutoMovieSolidSurface = faces.find((face: IAutoMovieSolidSurface): boolean => face.name === row.owner)!;
    const stored: number[] = mesh.positions.slice(3 * vertex, 3 * vertex + 3).map((value: number): number => value * 1000);
    row.vertices++;
    try {
      const point: readonly number[] = face.point!(s, t);
      row.pointReadings++;
      const jet: readonly number[] | null = s === pole ? null : face.jet(s, t).p;
      if (jet === null) row.unobservedJets++;
      else row.jetReadings++;
      const gap: (a: readonly number[], b: readonly number[]) => number = (a: readonly number[], b: readonly number[]): number => Math.hypot(...a.map((value: number, k: number): number => value - b[k]!));
      const pointGap: number = gap(stored, point);
      const jetGap: number | null = jet === null ? null : gap(stored, jet);
      const pointJetGap: number | null = jet === null ? null : gap(point, jet);
      const observed: number[] = [pointGap, jetGap, pointJetGap].filter((value: number | null): value is number => value !== null);
      if (!observed.every(Number.isFinite)) throw new Error("Nonfinite original mesh replay gap");
      if (Math.max(...observed) > Math.max(row.maxPointGapMm ?? -Infinity, row.maxJetGapMm ?? -Infinity, row.maxPointJetGapMm ?? -Infinity))
        row.worst = { vertex, chart: [s, t], stored, point, jet };
      row.maxPointGapMm = Math.max(row.maxPointGapMm ?? -Infinity, pointGap);
      if (jetGap !== null) row.maxJetGapMm = Math.max(row.maxJetGapMm ?? -Infinity, jetGap);
      if (pointJetGap !== null) row.maxPointJetGapMm = Math.max(row.maxPointJetGapMm ?? -Infinity, pointJetGap);
    } catch (error: unknown) {
      row.unavailable.push({ vertex, detail: error instanceof Error ? (error.stack ?? error.message) : String(error) });
    }
  }
  const edges: Map<string, [number, number]> = new Map();
  for (let at: number = 0; at < mesh.indices.length; at += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = mesh.indices[at + corner]!;
      const b: number = mesh.indices[at + (corner + 1) % 3]!;
      const key: string = Math.min(a, b) + "/" + Math.max(a, b);
      const counts: [number, number] = edges.get(key) ?? [0, 0];
      counts[a < b ? 0 : 1]++;
      edges.set(key, counts);
    }
  const boundaries: unknown[] = [];
  for (const face of realized.body.faces)
    for (const loop of face.domainLoops ?? [])
      for (let at: number = 0; at < loop.chart.length; at++) {
        const next: number = (at + 1) % loop.chart.length;
        const a: [number, number] = loop.chart[at]!;
        const b: [number, number] = loop.chart[next]!;
        if (a[1] !== b[1] || a[0] === b[0]) continue;

        // Published point IDs are renumbered boundary identities, not mesh

        // vertex IDs. Resolve their original evaluating owner/chart exactly.
        const ids: number[][] = [loop.points[at]!, loop.points[next]!].map((id: number): number[] => {
          const point: (typeof realized.body.points)[number] = realized.body.points[id]!;
          return bySource.get(point.chain + "/" + point.chart[0] + "/" + point.chart[1]) ?? [];
        });
        const from: number | undefined = ids[0]!.length === 1 ? ids[0]![0] : undefined;
        const to: number | undefined = ids[1]!.length === 1 ? ids[1]![0] : undefined;
        boundaries.push({ face: face.chain, chart: [a, b], publishedPoints: [loop.points[at], loop.points[next]], vertices: ids,
          incidenceByGlobalIndexDirection: from === undefined || to === undefined ? null
            : edges.get(Math.min(from, to) + "/" + Math.max(from, to)) ?? [0, 0] });
      }
  return { scope: "Every official returned vertex replay; every published longitudinal boundary segment; numeric observations, not a continuum or visual certificate",
    readings, boundaries, edgeCounts: { total: edges.size,
      open: [...edges.values()].filter((counts: [number, number]): boolean => counts[0] + counts[1] === 1).length,
      inconsistent: [...edges.values()].filter((counts: [number, number]): boolean => counts[0] + counts[1] > 2 || Math.max(...counts) > 1).length } };
}
