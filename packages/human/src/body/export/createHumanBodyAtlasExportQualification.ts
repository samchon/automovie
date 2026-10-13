import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";

/**
 * Carry selected source receipts from the current body into static export.
 *
 * Body/person runtimes call this after constructing the effective document. Each selected registered mesh is SHA-256 hashed before transferring its receipt, so a syntactic digest cannot qualify changed source geometry. The final posed Float32 shape is bound separately by the exporter's actual accessor partition. An empty selection returns undefined; caller basis/source state remains unchanged and the output owns copied provenance and registration.
 *
 * @evidence contracts/common.md#principled-implementation Unique selected identities and exact document/reference basis select one source resource each; actual mesh serialization SHA-256 must match before copied reference receipts are published.
 * @evidence contracts/common.md#clear-and-simple-design This factory supplies selected atlas qualification to the existing body/person exporter while the common static writer owns portable geometry and source intervals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/ambiguous/stale resources and changed source digests refuse; acquired reference replay retains geometry-not-validated personal part status rather than clinical certification.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes effective document selection, original source hash, final Float32 binding, empty namespace omission and owned metadata copies.
 * @evidence contracts/performance.md#efficient-algorithms P selected parts scan A registered candidates, then serialization/encoding/hash work follows selected mesh size and cloning follows receipt size.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing source mesh and registration records are consumed directly; mutable source bytes are rehashed per export rather than reused from an unverified syntactic receipt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Qualification owns copied source/registration records while per-part serialized bytes and hash buffers expire after awaited verification; no source file, network handle or persistent cache is acquired.
 */
export async function createHumanBodyAtlasExportQualification(
  basis: IAutoMovieHumanBodyBasis,
  document: IAutoMovieHumanBodyBasisDocument,
  prefix: "" | "body:" = "",
): Promise<IAutoMovieHumanBodyAtlasQualification | undefined> {
  const selected: NonNullable<IAutoMovieHumanBodyBasisDocument["anatomicalInspection"]> = document.anatomicalInspection ?? [];
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
    const matches: NonNullable<IAutoMovieHumanBodyBasis["anatomicalCandidates"]> = (basis.anatomicalCandidates ?? []).filter(
      (part: typeof matches[number]): boolean => part.id === id,
    );
    if (matches.length !== 1 || matches[0].registration.basis !== basis.id)
      throw new Error("Atlas export source is unavailable or stale: " + id);
    const resource: typeof matches[number] = matches[0];
    const digest: ArrayBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(resource.mesh)),
    );
    const actual: string = Array.from(new Uint8Array(digest), (byte: number): string =>
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
