import type { IHumanBodyLayerExterior } from "@automovie/human/body/anatomy/layer/IHumanBodyLayerExterior";
import { readHumanBodyLayerExterior } from "@automovie/human/body/anatomy/layer/readHumanBodyLayerExterior";
import { findHumanPersonSkinSurface } from "@automovie/human/human/build/findHumanPersonSkinSurface";
import { validateHumanPersonSourcePartitions } from "@automovie/human/human/build/validateHumanPersonSourcePartitions";
import type { IAutoMovieHumanPersonGeneration } from "@automovie/human/human/structures/IAutoMovieHumanPersonGeneration";

/**
 * Read the complete paired neutral source exterior for offline layer queries.
 *
 * Both original partition views already use the generation's common metre
 * frame. The existing source-partition owner checks their ordered cut tables
 * and oriented parent-cell coverage. Explicit sample identities then assemble
 * the query mesh; exact shared positions are checked by its reader. No face
 * construction, clinical tissue reconstruction or shaped-document evaluation
 * is substituted by these neutral source positions.
 */
export function readHumanBodyLayerSourceExterior(
  generation: IAutoMovieHumanPersonGeneration,
): IHumanBodyLayerExterior {
  const face = findHumanPersonSkinSurface(generation.face.surfaces).surface;
  const body = findHumanPersonSkinSurface(generation.body.surfaces).surface;
  const plan = validateHumanPersonSourcePartitions({ face, body });
  if (
    plan === undefined ||
    face.sourcePartition === undefined ||
    body.sourcePartition === undefined ||
    face.sourcePartition.generation !== generation.id
  )
    throw new Error(
      "Neutral layer exterior needs both actual source partitions of this generation.",
    );
  const domain = "neutral-source-layer:" + generation.id;
  return readHumanBodyLayerExterior({
    domain,
    samples: body.sourcePartition.samples,
    meshes: [face, body].map((surface) => ({
      positions: surface.positions,
      indices: surface.indices,
      normals: null,
      uvs: null,
      skin: null,
      physicalVertices: {
        sources: surface.sourcePartition!.samples.map((id) => ({ domain, id })),
        vertices: surface.sourcePartition!.samples.map((_, at) => at),
      },
    })),
  });
}
