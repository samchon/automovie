import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import type { IAutoMovieRecoveryImageLoft } from "@automovie/interface/recovery";
import { compileAutoMovieRecoveryImageLoft } from "@automovie/recovery";
import {
  buildAutoMovieConstruction,
  buildModel,
  collectAutoMovieOwnedResources,
  createAutoMovieResourceRetirement,
} from "@automovie/viewer";
import type * as THREE from "three";

/**
 * Build one inspected candidate transactionally from a saved recipe document.
 * Optional references are admitted static generated mesh models, bounded to
 * 80,000 vertices and 160,000 triangles; their geometry and own normals are
 * preserved while appearance is replaced by the same neutral viewer material.
 * Source and displayed-reference hashes remain distinct. The document byte bound
 * is 16 MiB; this is an inspection admission limit, not reconstruction accuracy.
 *
 * @evidence contracts/common.md#principled-implementation Public recovery compilation, model validation and viewer builders create the displayed candidate. Exact UTF-8 document/generated/reference hashes bind its numerical identity, and separate original/neutral reference hashes disclose the appearance transform.
 * @evidence contracts/common.md#clear-and-simple-design This transactional loader owns admission, construction and hashing while the page owns request serialization, scene attachment, camera controls and replacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No image or source mesh supplies generated geometry; optional reference meshes remain a separate bounded subject with their own normals. Invalid input fails before transfer and no old displayed candidate is retired here.
 * @evidence contracts/common.md#meaningful-documentation States supported static reference meshes, neutral appearance, exact identity hashes, explicit document/geometry budgets and incoming-resource rollback ownership.
 * @evidence contracts/performance.md#efficient-algorithms Hashing/parsing are O(B) in bounded document bytes; reference validation is O(V+F) in bounded source geometry. One bounded atlas realization and one construction build create the candidate, without camera-dependent regeneration.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned candidate and its single retirement promise serve every page view/pass until replacement; hashing does not repeat fitting or geometry construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every completed child builder transfers its actual resource identities immediately into local rollback. Failed loads attempt all accumulated retirements; success transfers one candidate and its disposer to the serializing page with no global cache or renderer acquired.
 */
export async function createRecoveryViewerCandidate(text: string): Promise<{
  generated: THREE.Group;
  reference: THREE.Group | null;
  referenceModel: IAutoMovieModel | undefined;
  construction: ReturnType<typeof buildAutoMovieConstruction>;
  retire: () => Promise<void>;
  recipe: IAutoMovieRecoveryImageLoft;
  documentHash: string;
  modelHash: string;
  referenceHash: string | null;
  referenceSourceHash: string | null;
  diagnostics: string[];
}> {
  const maximum: number = 16 * 1024 * 1024;
  if (text.length > maximum)
    throw new Error("Inspection document exceeds the 16 MiB byte limit");
  const encoder: TextEncoder = new TextEncoder();
  const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(
    Math.min(maximum, 3 * text.length),
  );
  const encoded: TextEncoderEncodeIntoResult = encoder.encodeInto(text, bytes);
  if (encoded.read !== text.length)
    throw new Error("Inspection document exceeds the 16 MiB byte limit");
  const parsed:
    | IAutoMovieRecoveryImageLoft
    | { recipe: IAutoMovieRecoveryImageLoft; reference?: IAutoMovieModel } =
    JSON.parse(text) as
      | IAutoMovieRecoveryImageLoft
      | { recipe: IAutoMovieRecoveryImageLoft; reference?: IAutoMovieModel };
  if (parsed === null || typeof parsed !== "object")
    throw new Error("A saved recipe or recipe/reference document is required");
  const recipe: IAutoMovieRecoveryImageLoft =
    "recipe" in parsed ? parsed.recipe : parsed;
  const reference: IAutoMovieModel | undefined =
    "recipe" in parsed ? parsed.reference : undefined;
  if (reference !== undefined) {
    if (
      !reference ||
      reference.origin !== "generated" ||
      reference.skeleton !== null ||
      reference.asset !== null ||
      !Array.isArray(reference.parts) ||
      reference.parts.length < 1 ||
      reference.parts.length > 128 ||
      !Array.isArray(reference.materials)
    )
      throw new Error(
        "Independent references must be admitted static generated mesh models",
      );
    let vertices: number = 0,
      triangles: number = 0;
    for (const part of reference.parts) {
      if (
        !part ||
        part.geometry?.type !== "mesh" ||
        !part.geometry.mesh ||
        !Array.isArray(part.geometry.mesh.positions) ||
        !(
          part.geometry.mesh.normals === null ||
          Array.isArray(part.geometry.mesh.normals)
        ) ||
        !(
          part.geometry.mesh.indices === null ||
          Array.isArray(part.geometry.mesh.indices)
        )
      )
        throw new Error(
          "Independent reference parts require resident triangle meshes",
        );
      vertices += part.geometry.mesh.positions.length / 3;
      triangles +=
        (part.geometry.mesh.indices?.length ??
          part.geometry.mesh.positions.length / 3) / 3;
      if (vertices > 80_000 || triangles > 160_000)
        throw new Error(
          "Independent reference exceeds the inspection geometry budget",
        );
    }
    const validation: ReturnType<typeof validateModel> = validateModel({
      model: reference,
    });
    if (!validation.success)
      throw new Error(
        `Invalid independent reference: ${JSON.stringify(validation.violations)}`,
      );
  }
  const compiled: ReturnType<typeof compileAutoMovieRecoveryImageLoft> =
    compileAutoMovieRecoveryImageLoft(recipe, {
      tolerance: 0.0001,
      maxCells: 50_000,
      maxVertices: 80_000,
    });
  if (!("value" in compiled)) throw new Error(compiled.diagnostics.join("; "));
  const hash: (value: Uint8Array<ArrayBuffer>) => Promise<string> = async (
    value: Uint8Array<ArrayBuffer>,
  ): Promise<string> => {
    const digest: ArrayBuffer = await crypto.subtle.digest("SHA-256", value);
    return Array.from(new Uint8Array(digest), (byte: number): string =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  };
  const retirements: ((() => void) | (() => Promise<void>))[] = [];
  try {
    const generated: ReturnType<typeof buildModel> = buildModel(
      compiled.value.model,
    );
    retirements.push(
      ...collectAutoMovieOwnedResources(generated.object).map(
        (resource: { dispose(): void }): (() => void) =>
          (): void =>
            resource.dispose(),
      ),
    );
    const construction: ReturnType<typeof buildAutoMovieConstruction> =
      buildAutoMovieConstruction(compiled.value.construction, {
        color: 0xa34413,
        maxPoints: 100_000,
      });
    retirements.push(construction.dispose);
    const neutral: IAutoMovieModel | undefined = reference
      ? {
          ...reference,
          materials: [],
          parts: reference.parts.map(
            (
              part: IAutoMovieModel["parts"][number],
            ): IAutoMovieModel["parts"][number] => ({
              ...part,
              material: null,
              geometry:
                part.geometry.type === "mesh"
                  ? {
                      type: "mesh",
                      mesh: {
                        ...part.geometry.mesh,
                        colors: undefined,
                        reliefWeights: undefined,
                      },
                    }
                  : part.geometry,
            }),
          ),
        }
      : undefined;
    const source: ReturnType<typeof buildModel> | null = neutral
      ? buildModel(neutral)
      : null;
    if (source)
      retirements.push(
        ...collectAutoMovieOwnedResources(source.object).map(
          (resource: { dispose(): void }): (() => void) =>
            (): void =>
              resource.dispose(),
        ),
      );
    return {
      generated: generated.object,
      reference: source?.object ?? null,
      referenceModel: reference,
      construction,
      retire: createAutoMovieResourceRetirement(retirements),
      recipe,
      documentHash: await hash(bytes.subarray(0, encoded.written)),
      modelHash: await hash(
        encoder.encode(JSON.stringify(compiled.value.model)),
      ),
      referenceHash: neutral
        ? await hash(encoder.encode(JSON.stringify(neutral)))
        : null,
      referenceSourceHash: reference
        ? await hash(encoder.encode(JSON.stringify(reference)))
        : null,
      diagnostics: compiled.diagnostics,
    };
  } catch (error: unknown) {
    await createAutoMovieResourceRetirement(retirements, { error })();
    throw error;
  }
}
