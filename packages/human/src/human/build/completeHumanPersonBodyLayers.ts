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
 *
 * @evidence contracts/common.md#principled-implementation Reads actual formed parts through the existing incidence owner before one layer completion.
 * @evidence contracts/common.md#clear-and-simple-design Owns skin selection and final body component consistency rather than another geometry evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest projection, coordinate weld, missing surface substitute or second placement establishes correspondence.
 * @evidence contracts/common.md#meaningful-documentation Explains final component consistency, source ownership and unsupported correspondence.
 * @evidence contracts/modeling.md#shared-boundaries Both skin partitions supply their actual physical sample identities in the same final frame.
 * @evidence contracts/modeling.md#spatial-conventions Final person metres and shared unit normals are retained unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Existing part and layer owners define the identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing document and field owners define the channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Reuses actual skin meshes and delegates layer emission.
 * @evidence contracts/modeling.md#rendered-observation The Person construction consumer observes its actual joined model; this completion certifies no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Field anchors retain their qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range Layer admission remains with its existing observation owner.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This runtime completion exposes no personal vertices.
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
