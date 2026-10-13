import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { appendHumanBodyLayers } from "../../body/anatomy/layer/appendHumanBodyLayers";
import { readHumanBodyLayerExterior } from "../../body/anatomy/layer/readHumanBodyLayerExterior";
import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { ICompleteHumanPersonBodyLayersProps } from "../structures/ICompleteHumanPersonBodyLayersProps";
import { meshOfHumanPart } from "./meshOfHumanPart";

/**
 * Complete body layers against the actual formed person's skin parts.
 *
 * Region owners select skin without including internal tissues or garments. Existing physical-source incidence recovers the query mesh and native body origins. The returned body component uses those same final skin meshes, coordinates and normals, so its layers do not accompany an earlier skin. Source data and caller arrays remain unchanged. Other native layer surfaces need explicit correspondence and refuse instead of using a body-only query.
 *
 * Joined coordinates are metres and normals are dimensionless in the same performed frame. Exact canonical aliases must agree and every native body sample must occur. This recovery establishes incidence, not embedding or clinical thickness; layer construction keeps its own observation/admission.
 *
 * @evidence contracts/common.md#principled-implementation Explicit face/body region maps select final skin, physical sample identity recovers one exact joined exterior and native origins, then body part/posed-surface records read those same performed positions and common normals.
 * @evidence contracts/common.md#clear-and-simple-design This adapter updates final body skin and supplies the joined exterior; canonical recovery and layer construction retain their dedicated body owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing registration, normal population or exact native aliases refuse; no body-only exterior substitutes for another layer surface, and incidence alone does not prove embedding or measured thickness.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies final metre frame, exact alias/native coverage, unchanged inputs and downstream layer admission scope.
 * @evidence contracts/performance.md#efficient-algorithms Part selection/map/update costs O(P); exterior recovery scans selected V/T/source records and native samples, while layer construction and resident-model validation retain their actual geometry/query costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One joined exterior and native-origin map serve all fields on the selected body surface; existing final skin meshes and shared normals are reused without a second pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New body/posed-surface wrappers and layer outputs belong to the caller; temporary selection/maps are call-local and borrowed final meshes remain with the build.
 */
export function completeHumanPersonBodyLayers(
  props: ICompleteHumanPersonBodyLayersProps,
): IAutoMovieHumanBodyBuild {
  const surface: ICompleteHumanPersonBodyLayersProps["basis"]["surfaces"][number] = props.basis.surfaces[props.surface];
  if (!Number.isSafeInteger(props.surface) || surface?.sourcePartition === undefined ||
      !Number.isSafeInteger(props.faceVertices) || props.faceVertices < 0 ||
      props.normals.length !== (props.faceVertices + surface.positions.length / 3) * 3)
    throw new Error("Person layer completion needs its actual native surface and complete shared normal field.");
  const exterior: ReturnType<typeof readHumanBodyLayerExterior> = readHumanBodyLayerExterior({
    domain: props.domain,
    samples: surface.sourcePartition!.samples,
    meshes: props.parts.filter((part: IAutoMovieModelPart): boolean => part.id.startsWith("face:")
      ? props.faceRegions.has(part.id.slice(5))
      : part.id.startsWith("body:") && props.bodyRegions.has(part.id.slice(5)),
    ).map(meshOfHumanPart),
  });
  const bodyMeshes: Map<string, IAutoMovieMesh> = new Map(props.parts.filter((part: IAutoMovieModelPart): boolean =>
    part.id.startsWith("body:") && props.bodyRegions.has(part.id.slice(5)),
  ).map((part: IAutoMovieModelPart): [string, IAutoMovieMesh] => [part.id.slice(5), meshOfHumanPart(part)]));
  const positions: number[] = exterior.originVertices.flatMap((vertex: number): number[] =>
    exterior.mesh.positions.slice(vertex * 3, vertex * 3 + 3),
  );
  const body: IAutoMovieHumanBodyBuild = {
    ...props.body,
    model: {
      ...props.body.model,
      parts: props.body.model.parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const mesh: IAutoMovieMesh | undefined = bodyMeshes.get(part.id);
        return mesh === undefined ? part : { ...part, geometry: { type: "mesh", mesh } };
      }),
    },
    posedSurfaces: props.body.posedSurfaces.map((own: IAutoMovieHumanBodyBuild["posedSurfaces"][number], index: number): IAutoMovieHumanBodyBuild["posedSurfaces"][number] => index !== props.surface ? own : {
      positions,
      normals: props.normals.slice(props.faceVertices * 3, props.faceVertices * 3 + positions.length),
    }),
  };
  return appendHumanBodyLayers(props.basis, body, new Map([[surface.id, exterior]]), props.instance);
}
