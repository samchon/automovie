import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";

/**
 * Carry selected source receipts from the current body into static export.
 *
 * The worker calls this after the same document built successfully. It hashes
 * each registered source mesh before transferring its receipt, so a syntactic
 * digest alone cannot qualify changed geometry. The final posed Float32 shape
 * is bound separately by the exporter's actual accessor partition.
 */
export async function createHumanBodyAtlasExportQualification(
  basis: IAutoMovieHumanBodyBasis,
  document: IAutoMovieHumanBodyBasisDocument,
  prefix: "" | "body:" = "",
): Promise<IAutoMovieHumanBodyAtlasQualification | undefined> {
  const selected = document.anatomicalInspection ?? [];
  if (selected.length === 0) return undefined;
  if (document.basis !== basis.id || new Set(selected).size !== selected.length)
    throw new Error(
      "Atlas export needs the current basis and unique selected part IDs.",
    );
  const qualification: IAutoMovieHumanBodyAtlasQualification = {
    version: 1,
    qualification: "reference-atlas-inspection",
    parts: [],
  };
  for (const id of selected) {
    const matches = (basis.anatomicalCandidates ?? []).filter(
      (part) => part.id === id,
    );
    if (matches.length !== 1 || matches[0].registration.basis !== basis.id)
      throw new Error("Atlas export source is unavailable or stale: " + id);
    const resource = matches[0];
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(resource.mesh)),
    );
    const actual = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    if (actual !== resource.compiledMeshSha256.toLowerCase())
      throw new Error("Atlas export registered mesh digest differs: " + id);
    qualification.parts.push({
      id: prefix + "anatomical-atlas:" + id,
      part: id,
      source: structuredClone(resource.source),
      registration: structuredClone(resource.registration),
      compiledMeshSha256: resource.compiledMeshSha256,
      partResolution: {
        status: "unavailable",
        reason: "geometry-not-validated",
      },
    });
  }
  return qualification;
}
