import { HumanRawGeometry as G } from "./HumanRawGeometry";

/** Observe independently supplied reference courses against raw producer buffers only. */
export namespace HumanRawCourseAudit {
  /** Raw source curve, whose origin and authority are provided by its reader. */
  export interface Course {
    /** Actual fixed source measurement-course name. */
    name: string;
    /** Evaluated registered source points in millimetres. */
    points: readonly G.Point[];
    /** Source-reported dimension, in mm, without implying clinical certification. */
    dimension: number;
    /** Independently retained source provenance and limitations. */
    authority: string;
  }
  /** Actual sample address; raw-source disagreement remains separate from candidate disagreement. */
  export interface Reading {
    /** Original course name and part locator. */
    part: string;
    /** Original source segment index. */
    interval: number;
    /** Segment fraction, including original keys and intermediate coordinates. */
    fraction: number;
    /** Registered physical observation coordinate, mm. */
    coordinate: G.Point;
    /** Distance to actual raw reference mesh, mm; null means refused. */
    sourceDistance: number | null;
    /** Distance to actual emitted skin, mm; null means refused. */
    skinDistance: number | null;
    /** Actual nearest final-skin face, not a construction address. */
    skinTriangle: number | null;
    /** Nearest actual emitted coordinate, mm. */
    skinCoordinate: G.Point | null;
    /** Original source-to-output normal direction, not Human's supplied normal. */
    direction: G.Point | null;
    /** Explicit failure to observe either side; never a successful zero. */
    reason: string | null;
  }
  /** A diagnostic never invents a clinical course or a surface tolerance. */
  export interface Report {
    /** Exact source course name. */
    part: string;
    /** No raw comparison alone supplies clinical registration or held-out training evidence. */
    status: "DIAGNOSTIC" | "FAIL";
    /** Every original key and at-most-3-mm intermediate segment observation. */
    readings: Reading[];
    /** Independently calculated source polyline length, mm. */
    polylineLength: number;
    /** Original independently recorded dimension, mm. */
    sourceDimension: number;
    /** The mismatch cannot be hidden by changing the native source dimension. */
    sourceDimensionDifference: number;
    /** Largest original-source coordinate disagreement with reference mesh, mm. */
    sourceMaximum: number | null;
    /** Largest original-source coordinate disagreement with generated skin, mm. */
    skinMaximum: number | null;
    /** Meaning and limits of this observation. */
    authority: string;
    /** Explicit input/domain failures; an empty observation set cannot look healthy. */
    issues: string[];
  }
  /**
   * Read raw source keys and every intervening 3-mm chord against both surfaces.
   * No production curve evaluator, anatomical-address solver or tape reader runs.
   * Source interpolation chord error is retained against the actual raw answer,
   * rather than being subtracted from generated error or treated as a free margin.
   */
  export function read(course: Course, source: G.Index, skin: G.Index): Report {
    const readings: Reading[] = []; let polylineLength: number = 0;
    const issues: string[] = [];
    if (course.points.length < 2) issues.push("A source course requires at least two independent coordinates");
    if (!Number.isFinite(course.dimension)) issues.push("The original source dimension is non-finite");
    course.points.forEach((point: G.Point, index: number): void => { if (point.length !== 3 || !point.every(Number.isFinite)) issues.push(`Source key ${index} has a malformed or non-finite coordinate ${JSON.stringify(point)}`); });
    if (issues.length !== 0) return { part: course.name, status: "FAIL", readings, polylineLength: NaN, sourceDimension: course.dimension, sourceDimensionDifference: NaN, sourceMaximum: null, skinMaximum: null, authority: course.authority, issues };
    for (let interval: number = 0; interval + 1 < course.points.length; interval++) {
      const a: G.Point = course.points[interval]!; const b: G.Point = course.points[interval + 1]!;
      const length: number = Math.hypot(...G.sub(b, a)); polylineLength += length;
      if (!Number.isFinite(length)) { issues.push(`Source interval ${interval} has unresolved length arithmetic`); continue; }
      const count: number = Math.max(1, Math.ceil(length / 3));
      if (count > 1_000_000) { issues.push(`Source interval ${interval} exceeds the declared one-million-sample CPU observation domain; no reading is admitted`); continue; }
      for (let sample: number = 0; sample <= count; sample++) {
        if (interval !== 0 && sample === 0) continue;
        const fraction: number = sample / count;
        const coordinate: G.Point = [a[0] + fraction * (b[0] - a[0]), a[1] + fraction * (b[1] - a[1]), a[2] + fraction * (b[2] - a[2])];
        const row: Reading = { part: course.name, interval, fraction, coordinate, sourceDistance: null, skinDistance: null, skinTriangle: null, skinCoordinate: null, direction: null, reason: null };
        try { const hit: G.Hit = source.nearest(coordinate); row.sourceDistance = hit.distance; row.direction = hit.normal; }
        catch (error) { row.reason = `Raw source observation refused: ${error instanceof Error ? error.message : String(error)}`; }
        try { const hit: G.Hit = skin.nearest(coordinate); row.skinDistance = hit.distance; row.skinTriangle = hit.triangle; row.skinCoordinate = hit.point; }
        catch (error) { row.reason = `${row.reason ?? ""} Emitted skin observation refused: ${error instanceof Error ? error.message : String(error)}`; }
        readings.push(row);
      }
    }
    const values: (field: "sourceDistance" | "skinDistance") => number | null = (field: "sourceDistance" | "skinDistance"): number | null => readings.length === 0 || readings.some((row: Reading): boolean => row[field] === null) ? null : Math.max(...readings.map((row: Reading): number => row[field]!));
    return { part: course.name, status: issues.length !== 0 || readings.length === 0 || !Number.isFinite(polylineLength) || !Number.isFinite(course.dimension) || readings.some((row: Reading): boolean => row.reason !== null) ? "FAIL" : "DIAGNOSTIC", readings, polylineLength, sourceDimension: course.dimension, sourceDimensionDifference: polylineLength - course.dimension, sourceMaximum: values("sourceDistance"), skinMaximum: values("skinDistance"), authority: `${course.authority}; source key/chord distances are observations, not registered clinical identity or invented acceptance limits.`, issues };
  }
}
