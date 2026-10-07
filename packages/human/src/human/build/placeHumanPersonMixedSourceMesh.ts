import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanPersonMixedSourceMeshProps } from "../structures/IAutoMovieHumanPersonMixedSourceMeshProps";
import { moveHumanMeshRigidly } from "./moveHumanMeshRigidly";

/**
 * Place a generated part's skin boundary on the actual one-skin person.
 *
 * The ordinary rigid carry still owns every generated dental/lining point.
 * Exact native skin aliases then read final body-weighted skin coordinates,
 * and only their physical domain is rebased to the same person instance.
 * Neither source-rest coordinates nor equal-position welding establish the
 * attachment. An unavailable native sample refuses before a result is returned.
 * Changed soft-sheet normals are read from that actual placed triangle mesh;
 * their shading remains independent of the shared physical lip boundary.
 * The input stays owned by the caller and unchanged.
 *
 * @evidence contracts/common.md#principled-implementation One actual canonical skin sample supplies every alias at the generated/native joint; rigid placement continues for all other points, and normals follow the placed triangle incidence.
 * @evidence contracts/common.md#clear-and-simple-design One rigid copy, native alias scatter/domain rebase and placed-normal evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No position weld, regenerated lip boundary or independently estimated skin carry substitutes for final skin coordinates.
 * @evidence contracts/common.md#meaningful-documentation States coordinate ownership, selective domain rebasing, normal islands, refusal and caller immutability.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres receive the actual person head carry; attached aliases take the final skin's person-frame metre coordinates.
 * @evidence contracts/modeling.md#shared-boundaries Exact native aliases and the displayed skin read one final position and share one person-domain source identity.
 * @evidence contracts/modeling.md#emitted-geometry Existing vertices/indices/UVs remain the same population; only placement, attached domains and affected normal values change.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The generated part retains its producer's identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels This placement consumes no new authoring channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation The person and oral joint owners observe this placed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Source and oral owners define the physical skin and lining boundary.
 * @evidenceExclude contracts/anatomy.md#permitted-range The source/pose/model owners admit the geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The placement introduces no anatomy input.
 */
export function placeHumanPersonMixedSourceMesh(
  props: IAutoMovieHumanPersonMixedSourceMeshProps,
): IAutoMovieMesh {
  const { mesh, head, samples, positions, origin, domain } = props;
  const output = moveHumanMeshRigidly(mesh, head);
  const physical = output.physicalVertices;
  if (
    physical === undefined ||
    !physical.sources.some((source) => source.domain === origin)
  )
    return output;
  for (let vertex = 0; vertex < physical.vertices.length; vertex++) {
    const reference = physical.vertices[vertex];
    const source = reference === null ? undefined : physical.sources[reference];
    if (source === undefined || source.domain !== origin) continue;
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
    domain: source.domain === origin ? domain : source.domain,
  }));
  const indices =
    output.indices ??
    Array.from({ length: output.positions.length / 3 }, (_, vertex) => vertex);
  output.normals = areaWeightedNormals(output.positions, indices);
  resolveAutoMovieMeshPhysicalVertices(output);
  return output;
}
