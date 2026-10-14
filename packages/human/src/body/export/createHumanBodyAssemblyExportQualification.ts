import { createHumanBodySourceResidentMesh } from "../anatomy/assembly/createHumanBodySourceResidentMesh";
import type { IHumanBodyLayerObservation } from "../anatomy/layer/IHumanBodyLayerObservation";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyAssemblyQualification } from "./IAutoMovieHumanBodyAssemblyQualification";

/**
 * Bind every actual coarse source surface's receipt to its static export ID.
 *
 * Source mesh serialization is SHA-256 hashed before its receipt is transferred, independently of posed Float32 output. Missing assembly returns undefined. Original acquisition rights and authored registration do not certify clinical resolution, personal fit or independent anatomy. A registered native SAT source additionally requires exactly one matching final layer observation; field/exterior/member provenance remains separate from static source mesh digests.
 *
 * The body/person runtimes supply the effective document after construction and an empty/body prefix. Source mesh compaction records original ordinals when unused bookkeeping vertices are omitted. This function copies metadata, hashes source geometry and checks basis/generation identity; the writer separately joins actual emitted parts and validates portable output.
 *
 * @evidence contracts/common.md#principled-implementation Exact basis/rig generation and one matching native observation precede source mesh SHA-256 verification, original-ordinal compaction and copied rights/attachment receipts with explicit clinical unavailability.
 * @evidence contracts/common.md#clear-and-simple-design A single qualification factory carries static source parts and optional native field observations while construction and actual Float32 accessor binding remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changed source meshes, stale basis/generation or absent/ambiguous native observations refuse; valid digests and rights do not establish authentic personal anatomy or clinical tissue resolution.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes original serialization hashes, effective document identity, body prefix, unused source ordinals, native final observations and independent portable output admission.
 * @evidence contracts/performance.md#efficient-algorithms Each source mesh is serialized/encoded/hashed and compacted once per qualification request, with work proportional to actual source attributes/indices plus copied provenance and native member records.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing resident-mesh compaction and supplied final layer observations are reused; source receipts are reverified each export rather than identity-caching mutable source data.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned qualification owns copied provenance/weights/member accounts; serialized bytes, hash buffers and compaction temporaries expire after each awaited mesh, without file/network handles or a persistent cache.
 */
export async function createHumanBodyAssemblyExportQualification(
  basis: IAutoMovieHumanBodyBasis,
  document: IAutoMovieHumanBodyBasisDocument,
  prefix: "" | "body:" = "",
  layers: readonly IHumanBodyLayerObservation[] | undefined = undefined,
): Promise<IAutoMovieHumanBodyAssemblyQualification | undefined> {
  const assembly: IAutoMovieHumanBodyBasis["anatomicalAssembly"] =
    basis.anatomicalAssembly;
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
    const native: NonNullable<
      IHumanBodyLayerObservation["nativeSubcutaneous"]
    >[] =
      layers?.flatMap(
        (
          layer: IHumanBodyLayerObservation,
        ): NonNullable<IHumanBodyLayerObservation["nativeSubcutaneous"]>[] =>
          layer.nativeSubcutaneous === undefined
            ? []
            : [layer.nativeSubcutaneous],
      ) ?? [];
    if (
      native.length !== 1 ||
      native[0].basis !== basis.id ||
      JSON.stringify(native[0].source) !==
        JSON.stringify(assembly.nativeSubcutaneous)
    )
      throw new Error(
        "Native subcutaneous export needs the actual final boundary calculation and its registered source.",
      );
    qualification.nativeSubcutaneous = {
      ...structuredClone(native[0]),
      members: native[0].members.map(
        (
          member: (typeof native)[number]["members"][number],
        ): typeof member => ({ ...member, id: prefix + member.id }),
      ),
    };
  }
  for (const part of assembly.parts)
    for (const surface of part.surfaces) {
      const bytes: Uint8Array<ArrayBuffer> = new TextEncoder().encode(
        JSON.stringify(surface.mesh),
      );
      const digest: ArrayBuffer = await globalThis.crypto.subtle.digest(
        "SHA-256",
        bytes,
      );
      const sha256: string = [...new Uint8Array(digest)]
        .map((byte: number): string => byte.toString(16).padStart(2, "0"))
        .join("");
      if (sha256 !== surface.compiledMeshSha256.toLowerCase())
        throw new Error(
          "Coarse anatomical export source mesh digest differs: " +
            part.id +
            "/" +
            surface.id,
        );
      const resident: ReturnType<typeof createHumanBodySourceResidentMesh> =
        createHumanBodySourceResidentMesh(surface.mesh);
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
