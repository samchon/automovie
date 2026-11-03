import { HumanRawGeometry as G } from "./HumanRawGeometry";
import type { HumanRawFinding } from "./HumanRawFinding";

/** World-frame placement from original public stature and actual bind vertices only. */
export namespace HumanRawPlacement {
  /** This contract applies to an upright bind skin in the declared Y-up millimetre frame. */
  export interface Input {
    /** Original requested stature, not a generated calibration dimension, mm. */
    stature: number;

    /** Declared world floor coordinate, mm. */
    floor: number;
  }

  /** Placement acceptance covers these two exact staging facts only. */
  export interface Report {
    /** Missing geometry, missing public input and unresolved observations stay red. */
    status: "PASS" | "FAIL";

    /** Every actual invalid observation retains the world coordinate when available. */
    findings: HumanRawFinding[];

    /** Actual highest bind-skin vertex, null without support. */
    crown: G.Point | null;

    /** Actual lowest bind-skin vertex, null without support. */
    sole: G.Point | null;

    /** Original indexed surface vertex carrying the crown witness. */
    crownVertex: number | null;

    /** Original indexed surface vertex carrying the floor witness. */
    soleVertex: number | null;

    /** Roundoff allowance derived only from prescribed inputs, never candidate error. */
    arithmeticTolerance: number | null;
  }

  /**
   * Check the bind's crown at floor plus stature and lowest skin at the world floor.
   * The two extrema are direct raw-array observations in the documented Y-up frame.
   * A 256-epsilon allowance scales only with the original expected coordinates;
   * a runaway candidate cannot increase its own tolerance. This is an exact
   * staging contract, not an ISO anthropometric error or whole-anatomy admission.
   */
  export function read(person: string, mesh: G.Mesh, input: Input): Report {
    const findings: HumanRawFinding[] = G.inspect(mesh).map((row: G.Issue): HumanRawFinding => ({ person, part: "all", stage: "upright bind placement", direction: "raw buffer", triangle: row.triangle ?? -1, coordinate: row.coordinate, observed: null, expected: 0, deviation: null, tolerance: 0, units: "valid geometry", reason: row.reason }));
    if (![input?.stature, input?.floor].every(Number.isFinite) || input.stature <= 0 || !Number.isFinite(input.floor + input.stature)) findings.push({ person, part: "public stature/world floor", stage: "upright bind placement", direction: "original public input", triangle: -1, coordinate: null, observed: null, expected: 1, deviation: null, tolerance: 0, units: "finite mm", reason: "Original finite positive stature and finite world floor are required; generated dimensions cannot substitute" });
    if (findings.length !== 0) return { status: "FAIL", findings, crown: null, sole: null, crownVertex: null, soleVertex: null, arithmeticTolerance: null };

    // Only indexed vertices belong to the emitted skin. Unused buffer points
    // cannot supply a missing crown/sole or move a correct surface's extrema.
    const referenced: Set<number> = new Set(Array.from(mesh.indices));
    let crownVertex: number = mesh.indices[0]!; let soleVertex: number = crownVertex;
    let crown: G.Point = G.vertex(mesh, crownVertex); let sole: G.Point = crown;
    for (const vertex of referenced) {
      const point: G.Point = G.vertex(mesh, vertex);
      if (point[1] > crown[1]) { crown = point; crownVertex = vertex; }
      if (point[1] < sole[1]) { sole = point; soleVertex = vertex; }
    }
    const tolerance: number = 256 * Number.EPSILON * Math.max(1, Math.abs(input.floor), input.stature, Math.abs(input.floor + input.stature));
    for (const [part, coordinate, vertex, expected] of [["crown at requested stature", crown, crownVertex, input.floor + input.stature], ["sole on declared world floor", sole, soleVertex, input.floor]] as [string, G.Point, number, number][]) {
      const deviation: number = Math.abs(coordinate[1] - expected);
      if (!Number.isFinite(deviation) || deviation > tolerance) findings.push({ person, part, stage: "upright bind placement", direction: "world Y", triangle: -1, coordinate, observed: coordinate[1], expected, deviation: Number.isFinite(deviation) ? deviation : null, tolerance, units: "mm", reason: `Original indexed surface vertex ${vertex}. Declared upright Y-up bind contract: crown equals floor plus original stature, and lowest skin supports the floor. The allowance covers double arithmetic only; finite anatomy or pose validity is not inferred.` });
    }
    return { status: findings.length === 0 ? "PASS" : "FAIL", findings, crown, sole, crownVertex, soleVertex, arithmeticTolerance: tolerance };
  }
}
