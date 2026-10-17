import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import { exactCurve } from "./exactCurve.ts";
import { fitCurve } from "./fitCurve.ts";

type Point = [number, number, number];
interface Observation {
  points: Point[];
  winding: number;
  role: string;
  closed: boolean;
  featurePins?: { semantic: string; fraction: number }[];
  [name: string]: unknown;
}
interface Slice {
  y: number;
  open: number;
  loops: Observation[];
}
interface Document {
  gate: string;
  frame: string;
  units: string;
  pose: string;
  slices: Slice[];
  events?: { y0: number; y1: number }[];
  [name: string]: unknown;
}

/**
 * Fits the manifest's saved level sections without loading reference mesh topology.
 * All source slices and loop winding survive; approximation concerns each polygon independently.
 * The caller supplies a new private output version; different existing bytes are preserved.
 *
 * @evidence contracts/common.md#principled-implementation Uses fitCurve's complete-polyline difference-control bound and preserves section identity, frame, topology events and source hash.
 * @evidence contracts/common.md#clear-and-simple-design Owns only saved-section conversion and provenance; fitting and immutable publication remain with their single owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity or expected output is special-cased; invalid frame or open whole-body loops fail explicitly.
 * @evidence contracts/common.md#meaningful-documentation States private inputs, topology independence, within-section scope and immutable output behavior; artifact metadata records remaining limitations.
 * @evidence contracts/performance.md#efficient-algorithms Reads one section document once and fits each contour once; fitCurve owns per-curve complexity, while JSON serialization is linear in retained artifact size.
 * @evidence contracts/performance.md#reuse-equivalent-work No cross-run cache is held; the input manifest hash and tool hashes identify exactly which computation produced the output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One synchronous call retains its input and fitted output; writeArtifact owns temporary-file publication and cleanup, and no state persists in this module.
 */
export function fitSections(
  manifest: ReferenceManifest,
  outputDir: string,
  toleranceMm: number,
): { path: string; sha256: string } {
  if (!Number.isFinite(toleranceMm) || !(toleranceMm > 1e-10))
    throw new Error(
      "Fit tolerance must exceed the 1e-10 mm floating-point allowance",
    );
  const document: Document = readInput<Document>(manifest, "sections");
  if (
    document.gate !== manifest.gate ||
    document.frame !== manifest.frame ||
    document.pose !== manifest.pose ||
    document.units !== manifest.units
  )
    throw new Error(
      "Section document disagrees with its declared reference frame",
    );
  const exactRows: Set<number> = new Set(
    document.events?.flatMap((event: { y0: number; y1: number }): number[] => [
      event.y0,
      event.y1,
    ]) ?? [],
  );
  let originalPoints: number = 0,
    spanCount: number = 0,
    maxBoundMm: number = 0,
    c0Joins: number = 0,
    exactEventLoops: number = 0;
  const slices: object[] = document.slices.map((slice: Slice): object => ({
    y: slice.y,
    open: slice.open,
    loops: slice.loops.map((loop: Observation, loopIndex: number): object => {
      if (!loop.closed)
        throw new Error(`Open level contour at ${slice.y}/${loopIndex}`);
      const exactEvent: boolean = exactRows.has(slice.y);
      const fit: ReturnType<typeof fitCurve> = exactEvent
        ? exactCurve(loop.points)
        : fitCurve(loop.points, toleranceMm, loop.featurePins);
      if (exactEvent) exactEventLoops++;
      originalPoints += fit.observedPoints;
      spanCount += fit.segments.length;
      maxBoundMm = Math.max(maxBoundMm, fit.boundMm);
      c0Joins += fit.joins.filter(
        (join: ReturnType<typeof fitCurve>["joins"][number]): boolean =>
          join.continuity === "C0",
      ).length;
      const {
        points: _points,
        normals: _normals,
        uv: _uv,
        ...observation
      } = loop;
      return {
        winding: loop.winding,
        role: loop.role,
        observation,
        fitPolicy: exactEvent ? "exact-event-contour" : "adaptive-cubic",
        ...fit,
      };
    }),
  }));
  const self: string = fileURLToPath(import.meta.url);
  return writeArtifact(outputDir, "fitted-sections.json", {
    schema: "reference-cubic-sections-v1",
    gate: manifest.gate,
    units: manifest.units,
    frame: manifest.frame,
    pose: manifest.pose,
    bounds: document.bounds,
    nominalStepMm: document.nominalStepMm,
    eventBracketMm: document.eventBracketMm,
    events: document.events,
    source: {
      file: manifest.files.sections.path,
      sha256: manifest.files.sections.sha256,
    },
    tools: [
      self,
      path.join(path.dirname(self), "fitCurve.ts"),
      path.join(path.dirname(self), "exactCurve.ts"),
    ].map((file: string): object => ({
      file: path.basename(file),
      sha256: sha256(file),
    })),
    declaredSourceSnapshot: manifest.metadata?.sourceSnapshot ?? null,
    generatedAt: new Date().toISOString(),
    toleranceMm,
    certificate:
      "Each observed polygon edge and its corresponding restricted cubic have a cubic difference whose maximum control-vector norm bounds complete pointwise displacement. This bounds both directed curve distances under the source chord-length correspondence; floating-point allowance is 1e-10 mm, not interval arithmetic.",
    method:
      "Ordinary rows use arclength-weighted tangent-constrained adaptive cubic least squares; topology-event bracket rows retain every observed edge as a degree-elevated cubic. Phase and coordinate extrema remain exact and actual G1/C0 joins are explicit.",
    limits: [
      "Private source-derived curves are not product coefficients or an anatomical parameter family.",
      "Certificate concerns within-section polygons only, not between-station lofts, source self-intersections, population calibration or appearance.",
      "The source snapshot is a caller declaration; complete tool file hashes are recorded separately.",
    ],
    summary: {
      originalPoints,
      spanCount,
      controlPoints: spanCount * 4,
      maxBoundMm,
      c0Joins,
      exactEventLoops,
      exactEventRows: exactRows.size,
    },
    slices,
  });
}
