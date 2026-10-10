import { appendHumanBodyLayers } from "../../body/anatomy/layer/appendHumanBodyLayers";
import { readHumanBodyLayerExterior } from "../../body/anatomy/layer/readHumanBodyLayerExterior";
import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { ICompleteHumanPersonBodyLayersProps } from "../structures/ICompleteHumanPersonBodyLayersProps";
import { meshOfHumanPart } from "./meshOfHumanPart";

/**
 * Complete body layers against the actual formed person's skin parts.
 *
 * Region owners select skin without including internal tissues or garments.
 * Existing physical-source incidence recovers the query mesh and native body
 * origins. The returned body component uses those same final skin meshes,
 * coordinates and normals, so its layers do not accompany an earlier skin.
 * Source data and caller arrays remain unchanged. Other native layer surfaces
 * need explicit correspondence and refuse instead of using a body-only query.
 */
export function completeHumanPersonBodyLayers(
  props: ICompleteHumanPersonBodyLayersProps,
): IAutoMovieHumanBodyBuild {
  const surface = props.basis.surfaces[props.surface];
  if (!Number.isSafeInteger(props.surface) || surface?.sourcePartition === undefined ||
      !Number.isSafeInteger(props.faceVertices) || props.faceVertices < 0 ||
      props.normals.length !== (props.faceVertices + surface.positions.length / 3) * 3)
    throw new Error("Person layer completion needs its actual native surface and complete shared normal field.");
  const exterior = readHumanBodyLayerExterior({
    domain: props.domain,
    samples: surface.sourcePartition!.samples,
    meshes: props.parts.filter((part) => part.id.startsWith("face:")
      ? props.faceRegions.has(part.id.slice(5))
      : part.id.startsWith("body:") && props.bodyRegions.has(part.id.slice(5)),
    ).map(meshOfHumanPart),
  });
  const bodyMeshes = new Map(props.parts.filter((part) =>
    part.id.startsWith("body:") && props.bodyRegions.has(part.id.slice(5)),
  ).map((part) => [part.id.slice(5), meshOfHumanPart(part)]));
  const positions = exterior.originVertices.flatMap((vertex) =>
    exterior.mesh.positions.slice(vertex * 3, vertex * 3 + 3),
  );
  const body: IAutoMovieHumanBodyBuild = {
    ...props.body,
    model: {
      ...props.body.model,
      parts: props.body.model.parts.map((part) => {
        const mesh = bodyMeshes.get(part.id);
        return mesh === undefined ? part : { ...part, geometry: { type: "mesh", mesh } };
      }),
    },
    posedSurfaces: props.body.posedSurfaces.map((own, index) => index !== props.surface ? own : {
      positions,
      normals: props.normals.slice(props.faceVertices * 3, props.faceVertices * 3 + positions.length),
    }),
  };
  return appendHumanBodyLayers(props.basis, body, new Map([[surface.id, exterior]]), props.instance);
}
