import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import type { EngineViewerInput } from "./EngineViewerInput.ts";
import type { ViewerInput } from "./ViewerInput.ts";
import type { ViewerSnapshot } from "./ViewerSnapshot.ts";

/**
 * Freezes independently displayed reference bytes and an actual engine-model artifact from one verified manifest.
 *
 * @evidence contracts/common.md#principled-implementation Uses shared byte-hash admission, requires engine model schema and construction, and reconciles reported topology counts.
 * @evidence contracts/common.md#clear-and-simple-design Input identity, frozen HTTP payloads and renderer lifetime remain separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing engine provenance refuses the run; an external triangle payload or reference substitute is never promoted.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes artifact admission from surface generation and names the required producer construction.
 * @evidence contracts/performance.md#efficient-algorithms Scans source tuples, model parts and construction while serializing payload bytes proportional to their sizes.
 * @evidence contracts/performance.md#reuse-equivalent-work Serializes each immutable payload once for reuse by this runtime's browser requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns an unshared payload map owned by the server; close clears it and function temporaries can release.
 */
export function loadViewerSnapshot(manifestFile: string): ViewerSnapshot {
  const manifest: ReferenceManifest = readManifest(manifestFile);
  const source: ViewerInput["source"] = readInput(manifest, "source");
  const reconstruction: EngineViewerInput = readInput(
    manifest,
    "reconstruction",
  );
  if (
    !source ||
    !Array.isArray(source.vertices) ||
    !Array.isArray(source.triangles)
  )
    throw new Error("Missing reference display mesh");
  if (
    reconstruction.schema !== "human-reference-engine-model-v1" ||
    !reconstruction.model ||
    reconstruction.construction?.units !== "m" ||
    !Array.isArray(reconstruction.construction.lines) ||
    !reconstruction.construction.lines.length
  )
    throw new Error(
      "Actual engine model and its generating construction are required",
    );
  if (
    !reconstruction.provenance?.engineOperators?.length ||
    !/^[a-f0-9]{40,64}$/i.test(reconstruction.provenance.sourceCommit)
  )
    throw new Error(
      "Generating operator and committed source provenance are required",
    );
  const lines: object[] = reconstruction.construction.lines.map(
    (line: EngineViewerInput["construction"]["lines"][number]): object => ({
      name: line.id,
      closed: line.closed,
      points: line.points,
      color: "#16833a",
      width: 1,
      cls: "actual-engine-generating-curve",
      bounds: true,
    }),
  );
  const payloads: Map<string, string> = new Map();
  payloads.set(
    `/mesh/${manifest.gate}/${manifest.pose}`,
    JSON.stringify({
      vertices: source.vertices.flat(),
      triangles: source.triangles.flat(),
    }),
  );
  payloads.set(`/loft/${manifest.gate}`, JSON.stringify(reconstruction));
  payloads.set(
    `/replay/${manifest.gate}`,
    JSON.stringify({
      lines,
      points: [],
      units: "m",
      provenance: reconstruction.provenance,
    }),
  );
  const inventory: string = JSON.stringify({
    gates: [manifest.gate],
    regions: [],
    pose: manifest.pose,
    frame: manifest.frame,
    units: manifest.units,
  });
  payloads.set("/inventory", inventory);
  payloads.set(`/inventory/${manifest.gate}`, inventory);
  const vertices: number = reconstruction.model.parts.reduce(
    (sum: number, part: EngineViewerInput["model"]["parts"][number]): number =>
      sum +
      (part.geometry.type === "mesh"
        ? part.geometry.mesh.positions.length / 3
        : 0),
    0,
  );
  const triangles: number = reconstruction.model.parts.reduce(
    (sum: number, part: EngineViewerInput["model"]["parts"][number]): number =>
      sum +
      (part.geometry.type === "mesh"
        ? (part.geometry.mesh.indices?.length ??
            part.geometry.mesh.positions.length / 3) / 3
        : 0),
    0,
  );
  if (
    vertices !== reconstruction.counts.vertices ||
    triangles !== reconstruction.counts.triangles
  )
    throw new Error("Generated model counts differ from producer provenance");
  return {
    id: sha256(manifestFile),
    manifest,
    payloads,
    loadedAt: new Date().toISOString(),
    geometry: {
      source: {
        vertices: source.vertices.length,
        triangles: source.triangles.length,
      },
      reconstruction: { vertices, triangles },
    },
  };
}
