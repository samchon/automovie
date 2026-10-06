import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyAssemblyQualification } from "./IAutoMovieHumanBodyAssemblyQualification";
import { createHumanBodySourceResidentMesh } from "../anatomy/assembly/createHumanBodySourceResidentMesh";

/**
 * Bind every actual coarse source surface's receipt to its static export ID.
 *
 * Original compiled source geometry is hashed before export; the posed writer
 * retains these source receipts independently of its Float32 representation.
 * Missing assembly returns no namespace. Rights and authored registration do
 * not certify clinical resolution, personal fit or independent anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Actual source geometry digest and exact member identities bind provenance before the shared writer groups primitives.
 * @evidence contracts/common.md#clear-and-simple-design One source walk prepares body or prefixed person qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Receipt strings never replace hashing the actual acquired/authored geometry.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes original geometry, posed representation and unavailable clinical validity.
 */
export async function createHumanBodyAssemblyExportQualification(basis: IAutoMovieHumanBodyBasis, document: IAutoMovieHumanBodyBasisDocument, prefix: "" | "body:" = ""): Promise<IAutoMovieHumanBodyAssemblyQualification | undefined> {
  const assembly = basis.anatomicalAssembly;
  if (assembly === undefined) return undefined;
  if (assembly.basis !== basis.id || document.basis !== basis.id || assembly.generation !== assembly.rig.generation)
    throw new Error("Coarse anatomical export has unregistered source basis/rig.");
  const qualification: IAutoMovieHumanBodyAssemblyQualification = { version: 1, sourceModel: document.id, generation: assembly.generation, basis: basis.id, shape: { ...document.shape }, registration: assembly.registration, ...(assembly.mode === undefined ? {} : { mode: assembly.mode }), parts: [] };
  for (const part of assembly.parts)
    for (const surface of part.surfaces) {
      const bytes = new TextEncoder().encode(JSON.stringify(surface.mesh));
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      const sha256 = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      if (sha256 !== surface.compiledMeshSha256.toLowerCase())
        throw new Error("Coarse anatomical export source mesh digest differs: " + part.id + "/" + surface.id);
      const resident = createHumanBodySourceResidentMesh(surface.mesh);
      qualification.parts.push({ id: prefix + "anatomical-source:" + part.id + "/" + surface.id, part: part.id, tissue: part.tissue, surface: surface.id, source: structuredClone(surface.source), compiledMeshSha256: sha256,
        ...(resident.sourceVertices.length === resident.sourceVertexCount ? {} : { sourceVertices: {
          sourceVertexCount: resident.sourceVertexCount, residentToSource: resident.sourceVertices,
        } }),
        bindingAccount: surface.binding.account, attachments: structuredClone(part.attachments), qualification: part.qualification, clinical: "unavailable" });
    }
  return qualification;
}
