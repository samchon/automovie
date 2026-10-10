import { createHumanBodySourceResidentMesh } from "../anatomy/assembly/createHumanBodySourceResidentMesh";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyAssemblyQualification } from "./IAutoMovieHumanBodyAssemblyQualification";
import type { IHumanBodyLayerObservation } from "../anatomy/layer/IHumanBodyLayerObservation";

/**
 * Bind every actual coarse source surface's receipt to its static export ID.
 *
 * Original compiled source geometry is hashed before export; the posed writer
 * retains these source receipts independently of its Float32 representation.
 * Missing assembly returns no namespace. Rights and authored registration do
 * not certify clinical resolution, personal fit or independent anatomy.
 * A registered native SAT owner additionally requires the layer constructor's
 * actual final observation. Its field/exterior/member provenance is retained
 * separately from original acquired or authored static mesh digests.
 */
export async function createHumanBodyAssemblyExportQualification(
  basis: IAutoMovieHumanBodyBasis,
  document: IAutoMovieHumanBodyBasisDocument,
  prefix: "" | "body:" = "",
  layers: readonly IHumanBodyLayerObservation[] | undefined = undefined,
): Promise<IAutoMovieHumanBodyAssemblyQualification | undefined> {
  const assembly = basis.anatomicalAssembly;
  if (assembly === undefined) return undefined;
  if (
    assembly.basis !== basis.id ||
    document.basis !== basis.id ||
    assembly.generation !== assembly.rig.generation
  )
    throw new Error(
      "Coarse anatomical export has unregistered source basis/rig.",
    );
  const qualification: IAutoMovieHumanBodyAssemblyQualification = {
    version: 1,
    sourceModel: document.id,
    generation: assembly.generation,
    basis: basis.id,
    shape: { ...document.shape },
    registration: assembly.registration,
    ...(assembly.mode === undefined ? {} : { mode: assembly.mode }),
    parts: [],
  };
  if (assembly.nativeSubcutaneous !== undefined) {
    const native = layers?.flatMap((layer) => layer.nativeSubcutaneous === undefined ? [] : [layer.nativeSubcutaneous]) ?? [];
    if (native.length !== 1 || native[0].basis !== basis.id ||
        JSON.stringify(native[0].source) !== JSON.stringify(assembly.nativeSubcutaneous))
      throw new Error("Native subcutaneous export needs the actual final boundary calculation and its registered source.");
    qualification.nativeSubcutaneous = {
      ...structuredClone(native[0]),
      members: native[0].members.map((member) => ({ ...member, id: prefix + member.id })),
    };
  }
  for (const part of assembly.parts)
    for (const surface of part.surfaces) {
      const bytes = new TextEncoder().encode(JSON.stringify(surface.mesh));
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      const sha256 = [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      if (sha256 !== surface.compiledMeshSha256.toLowerCase())
        throw new Error(
          "Coarse anatomical export source mesh digest differs: " +
            part.id +
            "/" +
            surface.id,
        );
      const resident = createHumanBodySourceResidentMesh(surface.mesh);
      qualification.parts.push({
        id: prefix + "anatomical-source:" + part.id + "/" + surface.id,
        part: part.id,
        tissue: part.tissue,
        surface: surface.id,
        source: structuredClone(surface.source),
        compiledMeshSha256: sha256,
        ...(resident.sourceVertices.length === resident.sourceVertexCount
          ? {}
          : {
              sourceVertices: {
                sourceVertexCount: resident.sourceVertexCount,
                residentToSource: resident.sourceVertices,
              },
            }),
        bindingAccount: surface.binding.account,
        attachments: structuredClone(part.attachments),
        qualification: part.qualification,
        clinical: "unavailable",
      });
    }
  return qualification;
}
