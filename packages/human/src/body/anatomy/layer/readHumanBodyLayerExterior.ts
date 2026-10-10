import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";

import type { IHumanBodyLayerExterior } from "./IHumanBodyLayerExterior";
import type { IHumanBodyLayerExteriorInput } from "./IHumanBodyLayerExteriorInput";

/**
 * Recover one query exterior from the skin parts' actual physical samples.
 *
 * UV and material duplicates read one canonical sample. Every occurrence must
 * have the identical performed coordinates: this stricter requirement is
 * appropriate for a person assembled from one source sample value, and no
 * coordinate average alters that value. All native body samples must occur.
 * The returned mesh and origin map are owned; source meshes remain untouched.
 * The anatomical assembly compiler consumes this final exterior for its
 * whole-person layer normal and ray domain. This only recovers geometry and incidence. Triangle topology, embedding and
 * the inward-ray interpretation remain the consuming owners' responsibilities.
 */
export function readHumanBodyLayerExterior(
  input: IHumanBodyLayerExteriorInput,
): IHumanBodyLayerExterior {
  if (
    input.domain.trim().length === 0 ||
    input.meshes.length === 0 ||
    input.samples.length === 0 ||
    input.samples.some((sample) => !Number.isSafeInteger(sample) || sample < 0)
  )
    throw new Error(
      "Layer exterior needs actual skin meshes, one physical domain and native body sample IDs.",
    );
  const slots = new Map<number, number>();
  const positions: number[] = [];
  const indices: number[] = [];
  for (const mesh of input.meshes) {
    resolveAutoMovieMeshPhysicalVertices(mesh);
    const physical = mesh.physicalVertices;
    if (
      physical === undefined ||
      mesh.indices === null ||
      mesh.indices.length === 0 ||
      mesh.indices.length % 3 !== 0
    )
      throw new Error(
        "Layer exterior needs indexed skin parts with actual physical registration.",
      );
    const vertices = physical.vertices.map((reference, vertex) => {
      const source =
        reference === null ? undefined : physical.sources[reference];
      if (source === undefined || source.domain !== input.domain)
        throw new Error(
          "Layer exterior skin samples must belong to the selected physical domain.",
        );
      let slot = slots.get(source.id);
      if (slot === undefined) {
        slot = positions.length / 3;
        slots.set(source.id, slot);
        positions.push(...mesh.positions.slice(vertex * 3, vertex * 3 + 3));
      } else if (
        [0, 1, 2].some(
          (axis) =>
            positions[slot! * 3 + axis] !== mesh.positions[vertex * 3 + axis],
        )
      )
        throw new Error(
          "Layer exterior aliases disagree on actual performed coordinates for sample " +
            source.id +
            ".",
        );
      return slot;
    });
    for (const vertex of mesh.indices) {
      if (
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        vertex >= vertices.length
      )
        throw new Error("Layer exterior has a nonresident triangle corner.");
      indices.push(vertices[vertex]);
    }
  }
  const originVertices = input.samples.map((sample) => {
    const slot = slots.get(sample);
    if (slot === undefined)
      throw new Error(
        "Layer exterior omits native body sample " + sample + ".",
      );
    return slot;
  });
  return {
    mesh: { positions, indices, normals: null, uvs: null, skin: null },
    originVertices,
  };
}
