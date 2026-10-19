import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { observeAutoMovieRecoveryAtlas as O } from "../../internal/observeAutoMovieRecoveryAtlas";
import { readRecoveryFixedReference as read } from "./readRecoveryFixedReference";
import { writeAutoMovieRecoveryArtifact } from "./writeAutoMovieRecoveryArtifact";

/**
 * Publish fitted atlas coefficients and a separate private source-ownership ledger.
 * The observation specification references a fixed registered mesh specification,
 * a fixed curve bundle supplying only automatic station levels, and optionally its
 * fixed open-continuation graph for deterministic unsupported-open-first work order.
 * Every referenced byte hash is verified before observation. This stage refits raw
 * observations in a joint chart; it is not a same-coefficient operator comparison.
 * An explicit stationSpacingMm selects a greedy increasing subsequence of saved
 * levels with the final endpoint retained, and reclassifies every coalesced slab.
 * scalarWindowMm restricts work to complete slabs with positive window overlap;
 * declared bounds and the conservative whole-slab extent are published separately.
 *
 * @evidence contracts/common.md#principled-implementation Hash-admitted observations are clipped at saved automatic levels or an explicitly declared physical-spacing subsequence. Private topology, harmonic mapping and constrained joint Bernstein fitting publish independent coefficients.
 * @evidence contracts/common.md#clear-and-simple-design Fixed input admission, private ownership publication and public coefficient publication remain separate from engine realization, which opens only atlas.json.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source arrays and incidence remain in this process and the private ledger; neither source triangle arrays, normals nor mesh references enter the public geometry contract.
 * @evidence contracts/common.md#meaningful-documentation States fixed-byte admission, new-fit comparison scope, deterministic work priority, incomplete chart coverage and explicit C0/external-jet limitations.
 * @evidence contracts/performance.md#efficient-algorithms Each fixed file is read and hashed once; source assembly is linear in bytes and faces. Observation helpers own indexed clipping and bounded chart solves, while publication streams JSON without a whole serialized string.
 * @evidence contracts/performance.md#reuse-equivalent-work Saved station levels and open-event addresses define one work order; admitted source arrays serve topology and fitting without another extraction or hidden geometry fallback.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Source and curve publications remain live for one observation command and are released on return; explicit interval/chart/patch/iteration budgets bound retained fitted output and immutable files belong to the caller.
 */
export function observeRecoveryAtlas(
  inputFile: string,
  outputDirectory: string,
  sourceEpoch: string,
): string {
  type Ref = { path: string; sha256: string };
  const bytes: Buffer = fs.readFileSync(inputFile),
    inputSha256: string = createHash("sha256").update(bytes).digest("hex"),
    base: string = path.dirname(path.resolve(inputFile));
  const input: {
    schema: string;
    source: Ref;
    curves: Ref;
    continuation?: Ref;
    privateWitnessFaces?: number[];
    privateWitnessQueries?: {
      face: number;
      barycentric: [number, number, number];
    }[];
    stationSpacingMm?: number;
    scalarWindowMm?: [number, number];
    inventoryOnly?: boolean;
    physicalGradientLengthMm?: number;
    work: {
      maxIntervals: number;
      maxCharts: number;
      maxPatchesPerChart: number;
      maxIterations: number;
      maxObservationRowsPerChart?: number;
      maxRefinementsPerChart?: number;
    };
    tessellation: Parameters<typeof O>[0]["tessellation"];
  } = JSON.parse(bytes.toString("utf8"));
  if (
    input.schema !== "automovie-recovery-atlas-observation-v1" ||
    !input.work ||
    !input.tessellation
  )
    throw new Error(
      "A versioned atlas observation specification and explicit work budgets are required",
    );
  const sourceBytes: ReturnType<typeof read> = read(input.source, base);
  const source: {
    units: string;
    frame: string;
    pose: string;
    meshes: Ref[];
    policy: {
      axis: [number, number, number];
      toleranceMm: number;
      maxSpans: number;
      cornerDegrees: number;
      exactCoordinateAliases: boolean;
    };
  } = JSON.parse(sourceBytes.bytes.toString("utf8"));
  if (
    source.units !== "mm" ||
    !source.frame ||
    !source.pose ||
    !source.meshes?.length
  )
    throw new Error("Registered millimetre source meshes are required");
  const verticesMm: [number, number, number][] = [],
    triangles: [number, number, number][] = [];
  for (const reference of source.meshes) {
    const fixed: ReturnType<typeof read> = read(
      reference,
      path.dirname(sourceBytes.file),
    );
    const mesh: {
      vertices: [number, number, number][];
      triangles: [number, number, number][];
    } = JSON.parse(fixed.bytes.toString("utf8"));
    const offset: number = verticesMm.length;
    for (const vertex of mesh.vertices) verticesMm.push(vertex);
    for (const triangle of mesh.triangles)
      triangles.push([
        triangle[0] + offset,
        triangle[1] + offset,
        triangle[2] + offset,
      ]);
  }
  const curveBytes: ReturnType<typeof read> = read(input.curves, base);
  const bundle: {
    loft: { sections: { coordinateMm: number }[] };
    policy: { axis: number[]; exactCoordinateAliases: boolean };
    provenance: { sources?: Ref[]; inputHash?: string };
  } = JSON.parse(curveBytes.bytes.toString("utf8"));
  if (
    bundle.policy.axis.length !== 3 ||
    bundle.policy.axis.some(
      (value: number, i: number): boolean => value !== source.policy.axis[i],
    ) ||
    bundle.policy.exactCoordinateAliases !==
      source.policy.exactCoordinateAliases ||
    bundle.provenance.inputHash !== input.source.sha256 ||
    bundle.provenance.sources?.length !== source.meshes.length ||
    source.meshes.some(
      (reference: Ref, i: number): boolean =>
        reference.path !== bundle.provenance.sources![i]!.path ||
        reference.sha256 !== bundle.provenance.sources![i]!.sha256,
    )
  )
    throw new Error(
      "Saved automatic levels and the registered raw source must have identical source and scalar policy ownership",
    );
  const savedLevelsMm: number[] = bundle.loft.sections.map(
      (section: { coordinateMm: number }): number => section.coordinateMm,
    ),
    levelsMm: number[] = [];
  if (
    input.stationSpacingMm !== undefined &&
    !(input.stationSpacingMm > 0 && Number.isFinite(input.stationSpacingMm))
  )
    throw new Error(
      "An explicit positive physical station-coalescing distance is required",
    );
  for (const level of savedLevelsMm)
    if (
      !levelsMm.length ||
      input.stationSpacingMm === undefined ||
      level - levelsMm.at(-1)! >= input.stationSpacingMm
    )
      levelsMm.push(level);
  if (levelsMm.at(-1) !== savedLevelsMm.at(-1))
    levelsMm.push(savedLevelsMm.at(-1)!);
  const priority: Set<number> = new Set();
  const norm: number = Math.hypot(...source.policy.axis),
    witnessFaces: number[] = [
      ...new Set([
        ...(input.privateWitnessFaces ?? []),
        ...(input.privateWitnessQueries ?? []).map(
          (
            query: NonNullable<typeof input.privateWitnessQueries>[number],
          ): number => query.face,
        ),
      ]),
    ];
  const queryAccounting: {
    face: number;
    barycentric: number[];
    scalarMm: number;
    interval: number;
  }[] = [];
  for (const query of input.privateWitnessQueries ?? []) {
    if (
      !Number.isSafeInteger(query.face) ||
      query.face < 0 ||
      query.face >= triangles.length ||
      !Array.isArray(query.barycentric) ||
      query.barycentric.length !== 3 ||
      query.barycentric.some(
        (value: number): boolean =>
          !Number.isFinite(value) || value < 0 || value > 1,
      ) ||
      Math.abs(
        query.barycentric.reduce(
          (sum: number, value: number): number => sum + value,
          0,
        ) - 1,
      ) >
        8 * Number.EPSILON
    )
      throw new Error(
        "Private witness queries require fixed source-face barycentric addresses",
      );
    const point: number[] = [0, 1, 2].map((k: number): number =>
      triangles[query.face]!.reduce(
        (sum: number, id: number, j: number): number =>
          sum + query.barycentric[j]! * verticesMm[id]![k]!,
        0,
      ),
    );
    const scalarMm: number = point.reduce(
      (sum: number, value: number, k: number): number =>
        sum + (value * source.policy.axis[k]!) / norm,
      0,
    );
    let lo: number = 0,
      hi: number = levelsMm.length - 1;
    while (lo + 1 < hi) {
      const middle: number = (lo + hi) >> 1;
      if (levelsMm[middle]! <= scalarMm) lo = middle;
      else hi = middle;
    }
    if (!(levelsMm[lo]! <= scalarMm && scalarMm < levelsMm[lo + 1]!))
      throw new Error(
        "Private source witness is outside an ordinary open saved slab",
      );
    priority.add(lo);
    queryAccounting.push({
      face: query.face,
      barycentric: [...query.barycentric],
      scalarMm,
      interval: lo,
    });
  }
  for (const face of witnessFaces) {
    if (!Number.isSafeInteger(face) || face < 0 || face >= triangles.length)
      throw new Error(
        "Private diagnostic witness face addresses are outside the fixed source",
      );
    const heights: number[] = triangles[face]!.map((id: number): number =>
      verticesMm[id]!.reduce(
        (sum: number, x: number, k: number): number =>
          sum + (x * source.policy.axis[k]!) / norm,
        0,
      ),
    );
    const minimum: number = Math.min(...heights),
      maximum: number = Math.max(...heights);
    for (let i: number = 0; i + 1 < levelsMm.length; i++)
      if (levelsMm[i]! <= maximum && levelsMm[i + 1]! >= minimum)
        priority.add(i);
  }
  if (input.continuation) {
    const continuationBytes: ReturnType<typeof read> = read(
      input.continuation,
      base,
    );
    const graph: {
      intervals: {
        beforeSection: number;
        afterSection: number;
        unresolved: { before: unknown[]; after: unknown[] }[];
      }[];
      provenance?: { curveBundleSha256?: string };
    } = JSON.parse(continuationBytes.bytes.toString("utf8"));
    if (graph.provenance?.curveBundleSha256 !== input.curves.sha256)
      throw new Error(
        "Open continuation must bind the exact saved curve bundle used for automatic levels",
      );
    if (graph.intervals.length !== savedLevelsMm.length - 1)
      throw new Error(
        "Open continuation does not cover the saved automatic intervals",
      );
    graph.intervals.forEach(
      (interval: (typeof graph.intervals)[number], i: number): void => {
        if (interval.beforeSection !== i || interval.afterSection !== i + 1)
          throw new Error(
            "Open continuation addresses do not match the saved station order",
          );
        if (
          interval.unresolved.some(
            (group: (typeof interval.unresolved)[number]): boolean =>
              group.before.length > 0 || group.after.length > 0,
          )
        ) {
          const coordinate: number = savedLevelsMm[i]!,
            index: number = levelsMm.findIndex(
              (level: number, j: number): boolean =>
                j + 1 < levelsMm.length &&
                level <= coordinate &&
                coordinate < levelsMm[j + 1]!,
            );
          if (index >= 0) priority.add(index);
        }
      },
    );
  }
  const intervalOrder: number[] = [
    ...priority,
    ...Array.from(
      { length: levelsMm.length - 1 },
      (_: unknown, i: number): number => i,
    ).filter((id: number): boolean => !priority.has(id)),
  ];
  const output: string = path.resolve(outputDirectory);
  if (fs.existsSync(output))
    throw new Error("Atlas observation output must be a new directory");
  fs.mkdirSync(output, { recursive: true });
  const started: number = performance.now();
  console.error(
    JSON.stringify({
      phase: "atlas-observation-admitted",
      vertices: verticesMm.length,
      triangles: triangles.length,
      stations: levelsMm.length,
      priorityIntervals: priority.size,
      memory: process.memoryUsage(),
    }),
  );
  const result: ReturnType<typeof O> = O(
    {
      verticesMm,
      triangles,
      axis: source.policy.axis,
      exactCoordinateAliases: source.policy.exactCoordinateAliases,
      levelsMm,
      intervalOrder,
      toleranceMm: source.policy.toleranceMm,
      maxSpans: source.policy.maxSpans,
      cornerDegrees: source.policy.cornerDegrees,
      ...input.work,
      inventoryOnly: input.inventoryOnly,
      physicalGradientLengthMm: input.physicalGradientLengthMm,
      scalarWindowMm: input.scalarWindowMm,
      priorityFaces: witnessFaces,
      topologyDomain: `observed-atlas.${inputSha256}`,
      tessellation: input.tessellation,
    },
    (record: object): void => {
      console.error(JSON.stringify(record));
    },
  );
  const provenance: object = {
    sourceEpoch,
    sourceSpecification: input.source,
    automaticLevels: input.curves,
    continuation: input.continuation ?? null,
    registeredSources: source.meshes,
    frame: source.frame,
    pose: source.pose,
    inputSha256,
    operator:
      "selected-domain-common-boundary-area-and-physical-gradient-bicubic-fit",
    physicalGradientLengthMm: input.physicalGradientLengthMm ?? 0,
    inventoryOnly: input.inventoryOnly === true,
    scalarWindowMm: input.scalarWindowMm ?? null,
    stationPolicy: {
      saved: savedLevelsMm.length,
      observed: levelsMm.length,
      minimumSpacingMm: input.stationSpacingMm ?? null,
      method:
        "greedy increasing saved-level subsequence; final endpoint retained; complete source region topology reclassified across each coalesced slab",
    },
    sourcePrivate: true,
    comparison:
      "new observation fit; original saved coefficients are not reused",
    generatedAt: new Date().toISOString(),
    elapsedMs: performance.now() - started,
  };
  // Private point witnesses never enter the coefficient-only compiler publication.
  const privateFitWitnesses: object[] = [],
    publicCharts: object[] = result.charts.map((value: object): object => {
      const chart: {
        id: string;
        joint: { maximumWitness?: unknown; [key: string]: unknown };
        [key: string]: unknown;
      } = value as {
        id: string;
        joint: { maximumWitness?: unknown; [key: string]: unknown };
        [key: string]: unknown;
      };
      const { maximumWitness, ...joint }: typeof chart.joint = chart.joint;
      if (maximumWitness)
        privateFitWitnesses.push({ chartId: chart.id, maximumWitness });
      return { ...chart, joint };
    });
  const witnessPublication: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
    writeAutoMovieRecoveryArtifact(
      path.join(output, "private-fit-witnesses.json"),
      {
        schema: "automovie-recovery-private-fit-witnesses-v1",
        provenance,
        witnesses: privateFitWitnesses,
      },
    );
  const publicFile: string = path.join(output, "atlas.json");
  const publication: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
    writeAutoMovieRecoveryArtifact(publicFile, {
      schema: "automovie-recovery-atlas-v1",
      geometry: result.geometry,
      charts: publicCharts,
      coverage: result.coverage,
      provenance,
    });
  const witnessAccounting: object[] = witnessFaces.map(
    (face: number): object => {
      const found: object[] = [];
      for (const record of result.privateLedger) {
        const row: {
          interval: number;
          cells: {
            id: number;
            face: number;
            component: number | null;
            dimension: number;
          }[];
          outcomes: {
            component: number;
            chart: string | null;
            sourceFaces?: number[];
            reason: string | null;
          }[];
        } = record as {
          interval: number;
          cells: {
            id: number;
            face: number;
            component: number | null;
            dimension: number;
          }[];
          outcomes: {
            component: number;
            chart: string | null;
            sourceFaces?: number[];
            reason: string | null;
          }[];
        };
        for (const cell of row.cells)
          if (cell.face === face)
            found.push({
              interval: row.interval,
              cell: cell.id,
              dimension: cell.dimension,
              component: cell.component,
              outcomes: row.outcomes.filter(
                (value: (typeof row.outcomes)[number]): boolean =>
                  value.component === cell.component &&
                  value.sourceFaces?.includes(face) === true,
              ),
              scope:
                "matching face owners may include multiple feature chart parts; not a complete source-face coverage certificate",
            });
      }
      return {
        face,
        visitedCellOwnership: found,
        complete: false,
        limitation:
          "Only visited clipped cells are classified; unvisited cells retain incomplete coverage.",
      };
    },
  );
  const ledger: ReturnType<typeof writeAutoMovieRecoveryArtifact> =
    writeAutoMovieRecoveryArtifact(
      path.join(output, "private-source-ledger.json"),
      {
        schema: "automovie-recovery-private-cell-ledger-v1",
        provenance,
        coverage: result.coverage,
        witnessAccounting,
        queryAccounting,
        intervals: result.privateLedger,
      },
    );
  writeAutoMovieRecoveryArtifact(path.join(output, "observation.json"), {
    schema: "automovie-recovery-atlas-observation-result-v1",
    provenance,
    coverage: result.coverage,
    public: { path: publicFile, ...publication },
    private: ledger,
    privateFitWitnesses: witnessPublication,
    counts: {
      charts: result.charts.length,
      patches: result.geometry.patches.length,
      coefficients: result.geometry.controls.length,
    },
    memory: {
      current: process.memoryUsage(),
      processMaximumRssKiB: process.resourceUsage().maxRSS,
    },
  });
  console.log(
    JSON.stringify({
      phase: "atlas-observation-complete",
      atlas: publicFile,
      sha256: publication.sha256,
      coverage: result.coverage,
    }),
  );
  return publicFile;
}
