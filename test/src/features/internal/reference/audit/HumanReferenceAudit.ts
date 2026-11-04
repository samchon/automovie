import { HumanRawGeometry as Geometry } from "../../HumanRawGeometry";
import { HumanRawBoundary as Boundary } from "../../HumanRawBoundary";
import type { HumanRawFinding } from "../../HumanRawFinding";

/** Independent comparison of raw source triangles with actual emitted triangles. */
export namespace HumanReferenceAudit {
  /** A reference-only anatomical or geometric region, frozen before reading the candidate. */
  export interface Region {
    /** Fixed source part or independently registered anatomical region. */
    name: string;

    /** Source-only face/coordinate membership, frozen before reading output. */
    triangle: (face: number, point: Geometry.Point) => boolean;

    /** Provenance of this region's independent definition. */
    basis: string;
  }

  /** Every numeric gate carries its independent geometric or anatomical authority. */
  export interface Limits {
    /** Maximum independently justified separation in millimetres. */
    distance: number;

    /** Maximum independently justified orientation error in degrees. */
    normalDegrees: number;

    /** Geometric derivation or published anatomical authority; never current residuals. */
    basis: string;
  }

  /**
   * Complete failed observation address; absent values stay explicit rather
   * than becoming zero. The shared raw-geometry address, so the comparator
   * and the placement contract report alike.
   */
  export type Finding = HumanRawFinding;

  /** Area-weighted statistics retain missing normal intersections as unavailable evidence. */
  export interface Metric {
    /** Fixed source region. */
    part: string;

    /** Explicit comparison direction. */
    direction: string;

    /** Total observed area in square millimetres. */
    area: number;

    /** Number of original-face quadrature observations. */
    samples: number;

    /** Area whose normal rays had no intersection; never discarded from coverage. */
    missingNormalArea: number;

    /** Area-weighted unsigned nearest distance RMS, mm. */
    nearestRms: number;

    /** Area-weighted nearest distance 95th percentile, mm. */
    nearestP95: number;

    /** Largest sampled nearest distance, mm; original vertices are checked separately. */
    nearestMaximum: number;

    /** Area-weighted normal distance RMS, mm; null if any normal support is missing. */
    normalRms: number | null;

    /** Area-weighted normal distance p95, mm; null if any normal support is missing. */
    normalP95: number | null;

    /** Area-weighted geometric normal angle RMS, degrees. */
    normalAngleRms: number;
  }

  /** A result is admitted only when explicit externally justified limits and all observations exist. */
  export interface Report {
    /** No absent limit, source region or sample may establish acceptance. */
    status: "PASS" | "FAIL" | "UNAVAILABLE";

    /** Every collected failed observation, without early exit between regions. */
    findings: Finding[];

    /** Two-way area-weighted readings per fixed source region. */
    metrics: Metric[];

    /** Total original indexed source/output surface vertices independently queried. */
    verticesChecked: number;

    /** Independent authority of the limits, or explicit diagnostic-only limitation. */
    authority: string;
  }

  /** Weighted scalar observation. */
  interface Weighted { value: number; area: number; }

  /** Geometry depends on the actual sample and target, not the number of reporting regions. */
  interface Observation { hit?: Geometry.Hit; nearestError?: string; normalCalled: boolean; normal?: number; normalError?: string; }

  /**
   * Audit both directions on every face quadrature sample and original indexed vertex.
   * The reverse pass attributes a sample to its nearest RAW source triangle, never
   * a generated-body label. It cannot hide extra skin by cropping the candidate.
   */
  export function compare(person: string, stage: string, reference: Geometry.Mesh, candidate: Geometry.Mesh, regions: readonly Region[], limits?: Limits): Report {
    const findings: Finding[] = [];
    const metrics: Metric[] = [];
    for (const [direction, mesh] of [["reference", reference], ["candidate", candidate]] as const) {
      for (const issue of Geometry.inspect(mesh)) findings.push({ person, part: "all", stage, direction, triangle: issue.triangle ?? -1, coordinate: issue.coordinate, observed: null, expected: 0, deviation: null, tolerance: 0, units: "valid geometry", reason: issue.reason + (issue.vertex === null ? "" : `; original vertex ${issue.vertex}`) });
    }
    if (findings.length !== 0) return { status: "FAIL", findings, metrics, verticesChecked: 0, authority: "Euclidean validity" };
    if (regions.length === 0 || (limits !== undefined && (![limits.distance, limits.normalDegrees].every(Number.isFinite) || limits.distance < 0 || limits.normalDegrees < 0 || limits.basis.length === 0))) throw new Error("Regions and externally justified finite nonnegative limits are required");
    const source: Geometry.Index = new Geometry.Index(reference);
    const emitted: Geometry.Index = new Geometry.Index(candidate);
    if (limits !== undefined) {
      const rawBoundary: Boundary.Result = Boundary.read(reference); const skinBoundary: Boundary.Result = Boundary.read(candidate);
      for (const [direction, from, to] of [["reference boundary", rawBoundary, skinBoundary], ["candidate boundary", skinBoundary, rawBoundary]] as const) {
        for (const row of from.invalid) findings.push({ person, part: "all", stage, direction, triangle: row.edge.triangle, coordinate: row.edge.a, observed: null, expected: 0, deviation: null, tolerance: 0, units: "edge incidence", reason: row.reason });
        for (const edge of from.edges) for (const phase of [0, 0.5, 1]) {
          const point: Geometry.Point = [edge.a[0] + phase * (edge.b[0] - edge.a[0]), edge.a[1] + phase * (edge.b[1] - edge.a[1]), edge.a[2] + phase * (edge.b[2] - edge.a[2])];
          const distance: number = Boundary.distance(point, to.edges);
          if (!Number.isFinite(distance) || distance > limits.distance) findings.push({ person, part: "all", stage, direction, triangle: edge.triangle, coordinate: point, observed: Number.isFinite(distance) ? distance : null, expected: 0, deviation: Number.isFinite(distance) ? distance : null, tolerance: limits.distance, units: "mm", reason: `${limits.basis}; an actual open boundary has no matching reference/output boundary. Finite face samples cannot excuse a missing strip.` });
        }
      }
    }
    const sourceSamples: Geometry.Sample[] = Geometry.samples(reference);
    const outputSamples: Geometry.Sample[] = Geometry.samples(candidate);
    const observations: Map<Geometry.Sample, Observation> = new Map();
    for (const sample of sourceSamples) if (!regions.some((region: Region): boolean => region.triangle(sample.triangle, sample.point))) findings.push(finding(person, "unassigned raw source", stage, "reference coverage", sample, null, 0, "sample", "An actual source sample belongs to no declared region; candidate cropping cannot remove this obligation."));
    for (const region of regions) for (const direction of ["reference-to-candidate", "candidate-to-reference"] as const) {
      const samples: Geometry.Sample[] = direction === "reference-to-candidate" ? sourceSamples : outputSamples;
      const target: Geometry.Index = direction === "reference-to-candidate" ? emitted : source;
      const distances: Weighted[] = []; const normals: Weighted[] = []; const angles: Weighted[] = [];
      let area: number = 0; let missingNormalArea: number = 0;
      for (const sample of samples) {
        if (![...sample.point, ...sample.normal, sample.area].every(Number.isFinite) || sample.area <= 0) { findings.push(finding(person, region.name, stage, direction, sample, null, 0, "finite sample", "Non-finite or non-positive derived quadrature/normal.")); continue; }
        let observation: Observation | undefined = observations.get(sample);
        if (observation === undefined) {
          observation = { normalCalled: false };
          try { observation.hit = target.nearest(sample.point); }
          catch (error) { observation.nearestError = error instanceof Error ? error.message : String(error); }
          observations.set(sample, observation);
        }
        if (observation.hit === undefined) { findings.push(finding(person, region.name, stage, direction, sample, null, 0, "mm", `Nearest observation refused: ${observation.nearestError}`)); continue; }
        const hit: Geometry.Hit = observation.hit;
        const sourceFace: number = direction === "reference-to-candidate" ? sample.triangle : hit.triangle;
        const sourcePoint: Geometry.Point = direction === "reference-to-candidate" ? sample.point : hit.point;
        if (!region.triangle(sourceFace, sourcePoint)) continue;
        area += sample.area;
        if (![...hit.point, ...hit.normal, hit.distance].every(Number.isFinite)) { findings.push(finding(person, region.name, stage, direction, sample, null, 0, "mm", "Nearest observation contains non-finite derived values.")); continue; }
        distances.push({ value: hit.distance, area: sample.area });
        const angle: number = Math.acos(Math.max(-1, Math.min(1, Geometry.dot(sample.normal, hit.normal)))) * 180 / Math.PI;
        if (Number.isFinite(angle)) angles.push({ value: angle, area: sample.area });
        else findings.push(finding(person, region.name, stage, direction, sample, null, 0, "degree", "Derived normal angle is non-finite."));
        if (!observation.normalCalled) {
          observation.normalCalled = true;
          try { observation.normal = target.normalDistance(sample.point, sample.normal); }
          catch (error) { observation.normalError = error instanceof Error ? error.message : String(error); }
        }
        if (observation.normalError !== undefined) findings.push(finding(person, region.name, stage, direction, sample, null, 0, "mm", `Normal observation refused: ${observation.normalError}`));
        const normal: number | undefined = observation.normal;
        if (normal === undefined) {
          missingNormalArea += sample.area;
          findings.push(finding(person, region.name, stage, direction, sample, null, 0, "mm", "No intersection on this actual source/output normal line; nearest distance cannot substitute for normal distance."));
        } else if (Number.isFinite(normal)) normals.push({ value: Math.abs(normal), area: sample.area });
        else { missingNormalArea += sample.area; findings.push(finding(person, region.name, stage, direction, sample, null, 0, "mm", "Derived normal distance is non-finite.")); }
        if (limits !== undefined && hit.distance > limits.distance) findings.push(finding(person, region.name, stage, direction, sample, hit.distance, limits.distance, "mm", limits.basis));
        if (limits !== undefined && normal !== undefined && Number.isFinite(normal) && Math.abs(normal) > limits.distance) findings.push(finding(person, region.name, stage, direction + ".normal-distance", sample, Math.abs(normal), limits.distance, "mm", `${limits.basis}; finite normal-line separation is independently gated even when nearest distance is smaller.`));
        if (limits !== undefined && angle > limits.normalDegrees) findings.push(finding(person, region.name, stage, direction + ".normal", sample, angle, limits.normalDegrees, "degree", limits.basis));
      }
      if (area === 0) findings.push({ person, part: region.name, stage, direction, triangle: -1, coordinate: null, observed: null, expected: 1, deviation: null, tolerance: 0, units: "sample", reason: "The declared fixed reference region has no observed support." });
      metrics.push({ part: region.name, direction, area, samples: distances.length, missingNormalArea, nearestRms: rms(distances), nearestP95: percentile(distances), nearestMaximum: distances.reduce((maximum: number, row: Weighted): number => Math.max(maximum, row.value), 0), normalRms: missingNormalArea === 0 && normals.length !== 0 ? rms(normals) : null, normalP95: missingNormalArea === 0 && normals.length !== 0 ? percentile(normals) : null, normalAngleRms: rms(angles) });
      for (const [key, value] of Object.entries(metrics[metrics.length - 1]!)) if (typeof value === "number" && !Number.isFinite(value)) findings.push({ person, part: region.name, stage, direction, triangle: -1, coordinate: null, observed: null, expected: 0, deviation: null, tolerance: 0, units: "finite derived metric", reason: `${key} is non-finite; unresolved arithmetic never establishes acceptance.` });
    }

    // Every indexed surface vertex is checked too: a tiny-area spike must not
    // vanish in p95, and an unused buffer point must not fabricate a skin defect.
    let verticesChecked: number = 0;
    for (const [direction, mesh, target] of [["reference-vertex-to-candidate", reference, emitted], ["candidate-vertex-to-reference", candidate, source]] as const) for (const index of new Set(Array.from(mesh.indices))) {
      const coordinate: Geometry.Point = Geometry.vertex(mesh, index);
      verticesChecked++;
      let hit: Geometry.Hit;
      try { hit = target.nearest(coordinate); }
      catch (error) { findings.push({ person, part: "all", stage, direction, triangle: -1, coordinate, observed: null, expected: 0, deviation: null, tolerance: 0, units: "mm", reason: `Original vertex ${index}: ${error instanceof Error ? error.message : String(error)}` }); continue; }
      if (!Number.isFinite(hit.distance)) { findings.push({ person, part: "all", stage, direction, triangle: -1, coordinate, observed: null, expected: 0, deviation: null, tolerance: 0, units: "mm", reason: `Original vertex ${index}: non-finite nearest distance` }); continue; }
      if (limits !== undefined && hit.distance > limits.distance) findings.push({ person, part: "all", stage, direction, triangle: -1, coordinate, observed: hit.distance, expected: 0, deviation: hit.distance, tolerance: limits.distance, units: "mm", reason: `${limits.basis}; original vertex ${index}` });
    }
    return { status: findings.length !== 0 ? "FAIL" : limits === undefined ? "UNAVAILABLE" : "PASS", findings, metrics, verticesChecked, authority: limits?.basis ?? "Raw source diagnostic only: no invented anatomical surface tolerance and no held-out training provenance supplied." };
  }

  /** Retain the exact failing quadrature coordinate and source face. */
  function finding(person: string, part: string, stage: string, direction: string, sample: Geometry.Sample, observed: number | null, tolerance: number, units: string, reason: string): Finding { return { person, part, stage, direction, triangle: sample.triangle, coordinate: sample.point, observed, expected: 0, deviation: observed === null ? null : Math.abs(observed), tolerance, units, reason }; }

  /** Area-weighted RMS, explicitly non-finite when no support exists. */
  function rms(rows: readonly Weighted[]): number { const area: number = rows.reduce((sum: number, row: Weighted): number => sum + row.area, 0); return area > 0 ? Math.sqrt(rows.reduce((sum: number, row: Weighted): number => sum + row.area * row.value ** 2, 0) / area) : NaN; }

  /** Area-weighted 95th percentile; no nearest-row or neighbouring-person surrogate is used. */
  function percentile(rows: readonly Weighted[]): number {
    const sorted: Weighted[] = [...rows].sort((a: Weighted, b: Weighted): number => a.value - b.value);
    const total: number = sorted.reduce((sum: number, row: Weighted): number => sum + row.area, 0);
    let cumulative: number = 0;
    for (const row of sorted) { cumulative += row.area; if (cumulative >= total * 0.95) return row.value; }
    return NaN;
  }
}
