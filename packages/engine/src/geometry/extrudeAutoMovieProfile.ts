import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { meshOf } from "./meshOf";
import { positive } from "./positive";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Extrude a convex XY profile along local Z into a closed triangle mesh.
 *
 * The result carries generated vertex normals and no texture coordinates. Its
 * side ring is one strip of shared vertices closed with a modular index, so the
 * vertex that starts the ring is the vertex that ends it and no single number
 * can be both zero and the profile's perimeter. Emitting a coordinate here
 * would mean either mirroring the image back across the closing quad or
 * splitting every corner, and the split version of this operation already
 * exists: [extrudeAutoMovieRegion](./proceduralRegionExtrusion.ts) takes the same profile, keeps concave
 * outlines and holes the hull here destroys, and lays a stated metric atlas
 * over the result. Reach for that one whenever the prism carries a finish.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Builds a reusable solid by extruding an authored profile.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Emits the closed topology of the extrusion operation.
 */
export const extrudeAutoMovieProfile = (props: {
  profile: readonly IAutoMovieProfilePoint[];
  depth: number;
}): IAutoMovieMesh => {
  positive(props.depth, "extrusion depth");
  const profile = profileHull(props.profile);
  const half = props.depth / 2;
  const positions: number[] = [];
  for (const point of profile) positions.push(point.x, point.y, half);
  for (const point of profile) positions.push(point.x, point.y, -half);
  const count = profile.length;
  const indices: number[] = [];
  for (let index = 1; index + 1 < count; ++index) {
    indices.push(0, index, index + 1);
    indices.push(count, count + index + 1, count + index);
  }
  for (let index = 0; index < count; ++index) {
    const next = (index + 1) % count;
    indices.push(index, count + index, next);
    indices.push(next, count + index, count + next);
  }
  return meshOf(positions, indices);
};
