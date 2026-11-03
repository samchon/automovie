import { HumanRawGeometry as G } from "./HumanRawGeometry";

/** Fixed original-source memberships measured against an independently produced skin. */
export namespace HumanRawFeatureAudit {
  /** A source-native feature membership, not a fitted landmark or an ordered curve. */
  export interface Member {
    /** Fixed original feature identifier; source-native side names retain their own meaning. */
    feature: string;
    /** Original canonical vertex identity, retained even when carrier support is absent. */
    canonicalVertex: number;
    /** Original render-carrier surface vertex; null means lineage has not been established. */
    sourceVertex: number | null;
  }

  /** An error bound requires its independent geometric or anatomical contract. */
  export interface Limit {
    /** Maximum unsigned point-to-surface separation, mm. */
    distanceMm: number;
    /** Independent basis; an observed candidate residual cannot set this bound. */
    basis: string;
  }

  /** Every original membership keeps its address and every actual measured witness. */
  export interface Observation {
    /** Whole-person identity supplied by the consumer. */
    person: string;
    /** Fixed source feature identifier, never inferred from generated geometry. */
    feature: string;
    /** This is an unordered original-source point, not a certified clinical landmark. */
    stage: "fixed source membership to final skin";
    /** Measurement direction; reverse coverage belongs to the full-surface observer. */
    direction: "reference-to-candidate";
    /** Original canonical identity, independent of candidate topology. */
    canonicalVertex: number;
    /** Original carrier index, or null for unavailable source lineage. */
    sourceVertex: number | null;
    /** Original source coordinate, or null without indexed source support. */
    coordinate: G.Point | null;
    /** Actual closest point on the emitted candidate triangle. */
    candidateCoordinate: G.Point | null;
    /** Original emitted candidate face index, or null without a finite observation. */
    triangle: number | null;
    /** Measured unsigned separation; missing/non-finite observations remain null. */
    observed: number | null;
    /** Point-to-surface separation of a source-matching reconstruction is zero. */
    expected: 0;
    /** Unsigned error from the fixed source point, mm. */
    deviation: number | null;
    /** Independent acceptance bound; null explicitly prevents shape admission. */
    tolerance: number | null;
    /** The source and candidate use the same documented millimetre chart. */
    units: "mm";
    /** Missing support, geometric refusal, or qualified observation/limit basis. */
    reason: string;
    /** Finite measurements alone are observations; they cannot supply a missing limit. */
    status: "PASS" | "FAIL" | "UNAVAILABLE";
  }

  /** The membership audit does not certify continuity, clinical identity or reverse coverage. */
  export interface Report {
    /** Any invalid geometry/membership or exceeded independent limit is red. */
    status: "PASS" | "FAIL" | "UNAVAILABLE";
    /** Every original membership, including unavailable observations, is retained. */
    observations: Observation[];
    /** Every raw geometry/input refusal is retained rather than converted to zero error. */
    refusals: { person: string; part: string; triangle: number | null; coordinate: G.Point | null; observed: null; expected: 0; deviation: null; tolerance: null; units: "mm"; reason: string }[];
  }

  /**
   * Read each fixed raw-source vertex against actual emitted triangles.
   * Source memberships are supplied before inspecting the candidate and must refer
   * to indexed carrier vertices. Native names establish membership only; this
   * operation does not turn them into Farkas landmarks, order a curve or certify
   * anatomical left/right. A missing independently justified limit remains
   * UNAVAILABLE. Whole-surface two-way distance and triangle interiors are separate
   * obligations and cannot be replaced by these sparse point observations.
   */
  export function read(person: string, source: G.Mesh, candidate: G.Mesh, members: readonly Member[], limit?: Limit): Report {
    const refusals: Report["refusals"] = [];
    for (const [part, mesh] of [["original raw source", source], ["actual final skin", candidate]] as const) for (const issue of G.inspect(mesh)) refusals.push({ person, part, triangle: issue.triangle, coordinate: issue.coordinate, observed: null, expected: 0, deviation: null, tolerance: null, units: "mm", reason: issue.reason });
    if (!Array.isArray(members) || members.length === 0) refusals.push({ person, part: "fixed source membership", triangle: null, coordinate: null, observed: null, expected: 0, deviation: null, tolerance: null, units: "mm", reason: "The complete original feature membership is required; no observations cannot mean zero error" });
    if (limit !== undefined && (limit === null || !Number.isFinite(limit.distanceMm) || limit.distanceMm < 0 || typeof limit.basis !== "string" || limit.basis.trim().length === 0)) refusals.push({ person, part: "independent acceptance limit", triangle: null, coordinate: null, observed: null, expected: 0, deviation: null, tolerance: null, units: "mm", reason: "A finite nonnegative limit with its independent basis is required" });
    if (refusals.length !== 0) return { status: "FAIL", observations: [], refusals };
    const referenced: Set<number> = new Set(Array.from(source.indices));
    const index: G.Index = new G.Index(candidate);
    const observations: Observation[] = [];
    for (const member of members) {
      if (member === null || typeof member !== "object") {
        refusals.push({ person, part: "fixed source membership", triangle: null, coordinate: null, observed: null, expected: 0, deviation: null, tolerance: null, units: "mm", reason: "An original membership record is absent or malformed; its address cannot be fabricated" });
        continue;
      }
      const row: Observation = { person, feature: member.feature, stage: "fixed source membership to final skin", direction: "reference-to-candidate", canonicalVertex: member.canonicalVertex, sourceVertex: member.sourceVertex, coordinate: null, candidateCoordinate: null, triangle: null, observed: null, expected: 0, deviation: null, tolerance: limit?.distanceMm ?? null, units: "mm", reason: "", status: "FAIL" };
      if (typeof member.feature !== "string" || member.feature.length === 0 || !Number.isSafeInteger(member.canonicalVertex) || member.canonicalVertex < 0 || member.sourceVertex === null || !Number.isSafeInteger(member.sourceVertex) || !referenced.has(member.sourceVertex)) row.reason = "Original canonical membership lacks a qualified indexed raw-source carrier vertex";
      else {
        row.coordinate = G.vertex(source, member.sourceVertex);
        try {
          const hit: G.Hit = index.nearest(row.coordinate);
          if (![hit.distance, ...hit.point, ...hit.normal].every(Number.isFinite) || hit.distance < 0 || !Number.isSafeInteger(hit.triangle) || hit.triangle < 0) row.reason = "Actual closest-triangle observation is missing or numerically unresolved";
          else {
            row.candidateCoordinate = hit.point; row.triangle = hit.triangle; row.observed = hit.distance; row.deviation = hit.distance;
            row.status = limit === undefined ? "UNAVAILABLE" : hit.distance <= limit.distanceMm ? "PASS" : "FAIL";
            row.reason = limit === undefined ? "Finite source-native membership observation only: no independent clinical/geometric acceptance limit was supplied" : `Independent point-to-surface contract: ${limit.basis}`;
          }
        } catch (error) { row.reason = `Actual closest-triangle observation refused: ${error instanceof Error ? error.message : String(error)}`; }
      }
      observations.push(row);
    }
    return { status: refusals.length !== 0 || observations.some((row: Observation): boolean => row.status === "FAIL") ? "FAIL" : observations.some((row: Observation): boolean => row.status === "UNAVAILABLE") ? "UNAVAILABLE" : "PASS", observations, refusals };
  }
}
