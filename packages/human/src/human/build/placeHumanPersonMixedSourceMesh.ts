import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import { interpolateAutoMovieTrianglePoint } from "@automovie/engine/math/interpolateAutoMovieTrianglePoint";
import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanPersonMixedSourceMeshProps } from "../structures/IAutoMovieHumanPersonMixedSourceMeshProps";
import { moveHumanMeshRigidly } from "./moveHumanMeshRigidly";

/**
 * Place a generated part's skin boundary on the actual one-skin person.
 *
 * The ordinary rigid carry still owns every generated dental/lining point.
 * Exact native skin aliases then read final body-weighted skin coordinates.
 * Registered material seats read their original three canonical parents and
 * represented weights in the producer's triangle corner order. Both source
 * domains are rebased to the same person instance, retaining their distinction.
 * Neither source-rest coordinates nor equal-position welding establish the
 * attachment. An unavailable native sample refuses before a result is returned.
 * Changed soft-sheet normals are read from that actual placed triangle mesh;
 * their shading remains independent of the shared physical lip boundary.
 * The input stays owned by the caller and unchanged.
 */
export function placeHumanPersonMixedSourceMesh(
  props: IAutoMovieHumanPersonMixedSourceMeshProps,
): IAutoMovieMesh {
  const { mesh, head, samples, positions, origin, domain } = props;
  const output = moveHumanMeshRigidly(mesh, head);
  const physical = output.physicalVertices;
  const materialDomain = origin + ":material-skin";
  const attachments = props.materialAttachments?.get(materialDomain);
  if (
    physical === undefined ||
    !physical.sources.some((source) => source.domain === origin || source.domain === materialDomain)
  )
    return output;
  for (let vertex = 0; vertex < physical.vertices.length; vertex++) {
    const reference = physical.vertices[vertex];
    const source = reference === null ? undefined : physical.sources[reference];
    if (source === undefined) continue;
    if (source.domain === materialDomain) {
      const attachment = attachments?.get(source.id);
      if (attachment === undefined || attachment.surface !== props.surface ||
          attachment.identity.trim() === "")
        throw new Error("Generated person material attachment needs its exact registered skin parents: " + source.id);
      const parents = attachment.parents.map((parent) => {
        const sample = samples.get(parent);
        if (sample === undefined || sample * 3 + 2 >= positions.length)
          throw new Error("Generated person material attachment lacks a canonical skin parent: " + parent);
        return { x: positions[sample * 3], y: positions[sample * 3 + 1], z: positions[sample * 3 + 2] };
      });
      const point = interpolateAutoMovieTrianglePoint(parents, attachment.weights);
      output.positions.splice(vertex * 3, 3, point.x, point.y, point.z);
      continue;
    }
    if (source.domain !== origin) continue;
    const sample = samples.get(source.id);
    if (sample === undefined || sample * 3 + 2 >= positions.length)
      throw new Error(
        "Generated person attachment needs its actual canonical skin sample: " +
          source.id +
          ".",
      );
    for (let axis = 0; axis < 3; axis++) {
      const value = positions[sample * 3 + axis];
      if (!Number.isFinite(value))
        throw new Error(
          "Generated person attachment has a nonfinite actual skin sample: " +
            source.id +
            ".",
        );
      output.positions[vertex * 3 + axis] = value;
    }
  }
  physical.sources = physical.sources.map((source) => ({
    ...source,
    domain: source.domain === origin ? domain :
      source.domain === materialDomain ? domain + ":material-skin" : source.domain,
  }));
  const indices =
    output.indices ??
    Array.from({ length: output.positions.length / 3 }, (_, vertex) => vertex);
  output.normals = areaWeightedNormals(output.positions, indices);
  resolveAutoMovieMeshPhysicalVertices(output);
  return output;
}
