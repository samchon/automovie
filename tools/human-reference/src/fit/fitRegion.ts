import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import { fitCurve } from "./fitCurve.ts";

type Point = [number, number, number];
interface Loop {
  points: Point[];
  closed: boolean;
  role?: string;
  featurePins?: { semantic: string; fraction: number }[];
  [key: string]: unknown;
}
interface Section {
  id: string;
  family: string;
  station: unknown;
  pose: string;
  plane: unknown;
  status: string;
  loops: Loop[];
}
interface FeatureLoop extends Loop {
  id: string;
  name: string;
  kind: string;
  side: string;
  pose: string;
  frame: unknown;
  method: string;
  confidence: string;
}
interface Course {
  id: string;
  pieces: Point[][];
  pose?: string;
  [key: string]: unknown;
}
interface Region {
  gate: string;
  region: string;
  units: string;
  frame: string;
  sources: unknown;
  tool: unknown;
  families: unknown;
  sections: Section[];
  loops: FeatureLoop[];
  courses: Course[];
  limits: string[];
  reservedSectionIds?: string[];
}

/**
 * Fits registered regional observations while retaining semantic section IDs and guide gaps.
 * Validation families and diagnostic posture conversions are excluded explicitly.
 * Source pieces stay independent; this operation establishes no patch adjacency or anatomical seam.
 *
 * @evidence contracts/common.md#principled-implementation Fits complete saved curves with fitCurve's dimensional bound, preserving pose and source protocols instead of inferring anatomy from dense points.
 * @evidence contracts/common.md#clear-and-simple-design Owns regional admission and observation-to-span mapping; one shared pure fitter and one immutable writer perform the subordinate operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exclusions follow declared validation family and posture semantics for every region; no identity or consumer is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States section identity, gaps, held-out exclusion, posture limitations and absence of anatomical adjacency; output records excluded IDs and reasons.
 * @evidence contracts/performance.md#efficient-algorithms Scans each source section, feature loop and course piece once, delegating each curve's fitting complexity; input and output JSON memory scale with the full region.
 * @evidence contracts/performance.md#reuse-equivalent-work No cross-run cache or mutable source index is retained; input and tool hashes identify the operation's exact source dependencies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All input, mapping and fit arrays belong to one synchronous call, and writeArtifact owns its temporary files and immutable publication lifetime.
 */
export function fitRegion(
  manifest: ReferenceManifest,
  outputDir: string,
  toleranceMm: number,
): { path: string; sha256: string } {
  if (!Number.isFinite(toleranceMm) || !(toleranceMm > 1e-10))
    throw new Error(
      "Fit tolerance must exceed the 1e-10 mm floating-point allowance",
    );
  const source: Region = readInput<Region>(manifest, "region");
  if (
    source.gate !== manifest.gate ||
    source.frame !== manifest.frame ||
    source.units !== manifest.units
  )
    throw new Error(
      "Region document disagrees with its declared reference frame",
    );
  const excluded: { id: string; reason: string }[] = [];
  const reservedSectionIds: Set<string> = new Set(
    source.reservedSectionIds ?? [],
  );
  let originalPoints: number = 0,
    spanCount: number = 0,
    c0Joins: number = 0;
  const fitted = (loop: Loop): object | null => {
    const distinct: Point[] = loop.points.filter(
      (point: Point, index: number): boolean =>
        !index ||
        point.some(
          (value: number, k: number): boolean =>
            value !== loop.points[index - 1][k],
        ),
    );
    if (distinct.length < (loop.closed ? 3 : 2)) return null;
    const fit: ReturnType<typeof fitCurve> = fitCurve(
      loop.points,
      toleranceMm,
      loop.featurePins,
      loop.closed,
    );
    originalPoints += fit.observedPoints;
    spanCount += fit.segments.length;
    c0Joins += fit.joins.filter(
      (join: ReturnType<typeof fitCurve>["joins"][number]): boolean =>
        join.continuity === "C0",
    ).length;
    return { role: loop.role, ...fit };
  };
  const sections: object[] = [];
  for (const section of source.sections) {
    if (reservedSectionIds.has(section.id)) {
      excluded.push({
        id: section.id,
        reason: "Explicitly reserved section excluded from fitting",
      });
      continue;
    }
    if (
      section.family
        .split(".")
        .some(
          (token: string): boolean =>
            token === "validation" || token === "heldout",
        )
    ) {
      excluded.push({
        id: section.id,
        reason: "Reserved family excluded from fitting",
      });
      continue;
    }
    if (section.pose === "diagnostic-T") {
      excluded.push({
        id: section.id,
        reason:
          "Diagnostic posture conversion excluded from anatomical fitting",
      });
      continue;
    }
    const loops: object[] = [];
    section.loops.forEach((loop: Loop, index: number): void => {
      const result: object | null = fitted(loop);
      if (result) loops.push(result);
      else
        excluded.push({
          id: `${section.id}/${index}`,
          reason: "Insufficient distinct observations",
        });
    });
    sections.push({
      id: section.id,
      family: section.family,
      station: section.station,
      pose: section.pose,
      plane: section.plane,
      status: section.status,
      loops,
    });
  }
  const loops: object[] = [];
  for (const loop of source.loops) {
    if (loop.pose === "diagnostic-T") {
      excluded.push({
        id: loop.id,
        reason:
          "Diagnostic posture conversion excluded from anatomical fitting",
      });
      continue;
    }
    const result: object | null = fitted(loop);
    if (result)
      loops.push({
        id: loop.id,
        name: loop.name,
        kind: loop.kind,
        side: loop.side,
        pose: loop.pose,
        frame: loop.frame,
        method: loop.method,
        confidence: loop.confidence,
        ...result,
      });
    else
      excluded.push({
        id: loop.id,
        reason: "Insufficient distinct feature-curve observations",
      });
  }
  const courses: object[] = source.courses.flatMap(
    (course: Course): object[] => {
      if (course.pose === "diagnostic-T") {
        excluded.push({
          id: course.id,
          reason:
            "Diagnostic posture conversion excluded from anatomical fitting",
        });
        return [];
      }
      const { pieces: observedPieces, ...metadata } = course;
      const pieces: object[] = [];
      observedPieces.forEach((piece: Point[], index: number): void => {
        const result: object | null = fitted({ points: piece, closed: false });
        if (result) pieces.push({ sourcePiece: index, ...result });
        else
          excluded.push({
            id: `${course.id}/piece-${index}`,
            reason: "Insufficient distinct guide-piece observations",
          });
      });
      return [{ ...metadata, pieces }];
    },
  );
  const self: string = fileURLToPath(import.meta.url);
  return writeArtifact(outputDir, `${source.region}.json`, {
    schema: "reference-cubic-region-v1",
    gate: manifest.gate,
    region: source.region,
    units: manifest.units,
    frame: manifest.frame,
    sources: source.sources,
    input: {
      file: manifest.files.region.path,
      sha256: manifest.files.region.sha256,
      extractionTool: source.tool,
    },
    tools: [self, path.join(path.dirname(self), "fitCurve.ts")].map(
      (file: string): object => ({
        file: path.basename(file),
        sha256: sha256(file),
      }),
    ),
    declaredSourceSnapshot: manifest.metadata?.sourceSnapshot ?? null,
    generatedAt: new Date().toISOString(),
    toleranceMm,
    families: source.families,
    method:
      "Complete-polygon cubic difference-control bound, exact source arclength pins and coordinate extrema, explicit G1/C0 joins, preserved independent guide pieces.",
    limits: [
      ...source.limits,
      "Source-derived controls remain private diagnostic observations, not product parameters or anatomical patch adjacency.",
      "The caller declares the source snapshot; tool file hashes are recorded independently.",
    ],
    summary: { originalPoints, spanCount, c0Joins, excluded: excluded.length },
    excluded,
    sections,
    loops,
    courses,
  });
}
