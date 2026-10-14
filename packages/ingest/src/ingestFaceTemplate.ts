import { IAutoMovieFaceTemplate } from "@automovie/interface";
import type { Accessor, Document, Mesh, Primitive, PrimitiveTarget } from "@gltf-transform/core";
import { accessorValues } from "./internal/accessorValues";

/**
 * Extract an {@link IAutoMovieFaceTemplate} from a parsed glTF/GLB {@link Document} for a caller supplying fixed morph-target data.
 *
 * This exported mapper currently has test callers in this repository; the face editor does not call it through a runtime import flow. It describes a portable conversion seam, not a completed editor asset-ingress feature.
 *
 * A face asset carries its editable shape as glTF morph targets on one primitive: `POSITION` is the resting face and each target holds per-vertex deltas under a parameter name, such as an `identity` likeness or a semantic slider. The first primitive with targets, in mesh then primitive order, is rewritten into the flat arrays the engine's `morphFace` consumes; later morphed primitives are ignored. A target is named by its own name, else by the same index in `mesh.extras.targetNames`, the convention three.js and most exporters write. Normalized integer accessors, as `KHR_mesh_quantization` allows, are decoded to the values they mean, and every target becomes an own key of `targets`, including one named `__proto__`.
 *
 * Structural defects make the asset unusable for deterministic morphing, so they throw rather than degrade: no morphed primitive, a morphed primitive without `POSITION` data, a target that cannot be named, two targets with one name, a target without `POSITION` delta data, or a delta array whose length differs from the resting face.
 *
 * @param doc Parsed document with finite VEC3 POSITION and delta accessors; this mapper reads it without validating component finiteness or accessor layout.
 * @returns A new template whose arrays the caller owns.
 *
 * @evidence contracts/common.md#principled-implementation The first morphed primitive's POSITION and each target's POSITION deltas become flat arrays through `accessorValues`, which decodes normalized quantized accessors, and names come from the target or the `extras.targetNames` convention exporters write; `Object.fromEntries` makes every name an own key.
 * @evidence contracts/common.md#clear-and-simple-design The exported function only finds the first morphed primitive and `templateOf` turns it into the template; accessor decoding is the shared internal helper also used by node import.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing storage, missing or duplicate names and unequal delta lengths throw; finite components and VEC3 accessor layout are caller premises, while `__proto__` remains an own data key.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the primitive selection order, that later morphed primitives are ignored, the naming fallback, quantized decoding, own-key storage, every refusal, and caller ownership of the arrays.
 * @evidence contracts/performance.md#efficient-algorithms Work follows materialized mesh and visited primitive/target lists, resting components, all copied delta components and target-name text; selection stops at the first morphed primitive, and malformed delta data is copied before its length is refused.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Calls have no shared execution or retained cache over mutable Document data, and each returned template requires independently owned arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Mesh, primitive and target list copies, the name map and entry list are temporary; new position/delta arrays transfer to the caller, with malformed arrays collectable on refusal and no retained Document reference.
 * @author Samchon
 */
export const ingestFaceTemplate: (doc: Document) => IAutoMovieFaceTemplate = (doc: Document): IAutoMovieFaceTemplate => {
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives())
      if (prim.listTargets().length !== 0) return templateOf(mesh, prim);
  throw new Error("document has no primitive with morph targets");
};

const templateOf: (mesh: Mesh, prim: Primitive) => IAutoMovieFaceTemplate = (mesh: Mesh, prim: Primitive): IAutoMovieFaceTemplate => {
  const posAccessor: Accessor | null = prim.getAttribute("POSITION");
  if (posAccessor === null)
    throw new Error("morphed primitive has no POSITION attribute");
  const positions: number[] | null = accessorValues(posAccessor);
  if (positions === null)
    throw new Error("morphed primitive POSITION accessor has no array data");

  const extraNames: unknown = (mesh.getExtras() as { targetNames?: unknown })
    .targetNames;
  const fallback: readonly unknown[] = Array.isArray(extraNames)
    ? extraNames
    : [];
  const entries: [string, number[]][] = [];
  const indexByName: Map<string, number> = new Map<string, number>();
  const targets: PrimitiveTarget[] = prim.listTargets();
  for (let i: number = 0; i < targets.length; ++i) {
    const target: PrimitiveTarget = targets[i]!;
    const candidate: unknown = fallback[i];
    const name: string =
      target.getName() || (typeof candidate === "string" ? candidate : "");
    if (name === "")
      throw new Error(
        `morph target #${i} has no name (neither a target name nor mesh.extras.targetNames)`,
      );
    const first: number | undefined = indexByName.get(name);
    if (first !== undefined)
      throw new Error(
        `morph target #${i} duplicates name "${name}" (first at #${first})`,
      );
    indexByName.set(name, i);
    const deltaAccessor: Accessor | null = target.getAttribute("POSITION");
    if (deltaAccessor === null)
      throw new Error(`morph target "${name}" has no POSITION deltas`);
    const delta: number[] | null = accessorValues(deltaAccessor);
    if (delta === null)
      throw new Error(
        `morph target "${name}" POSITION accessor has no array data`,
      );
    if (delta.length !== positions.length)
      throw new Error(
        `morph target "${name}" has ${delta.length} components, expected ${positions.length}`,
      );
    entries.push([name, delta]);
  }
  return { positions, targets: Object.fromEntries(entries) };
};
