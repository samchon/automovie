import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import { Vector3, createAutoMovieSignedMeshQuery, type IAutoMovieSignedMeshQueryHit as ImportedIAutoMovieSignedMeshQueryHit } from "@automovie/engine";

import type { IHumanFaceHairRootBoundary } from "./IHumanFaceHairRootBoundary";
import type { IHumanFaceHairRootBoundaryProps } from "./IHumanFaceHairRootBoundaryProps";
import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * Compile root-feature incidence on one current closed hair collider. The hair builder supplies the same closed positions/index snapshot used by its signed query and ray caster, before material splitting. Original skin triangle ordinals remain the closure's prefix; cap triangles follow them. The returned resolver consumes the sampler's triangle and weight metadata, and returns owned resident triangle ordinals incident on that root feature, including an appended cap when it shares that feature. Its distance reader measures unsigned proximity to the named resident triangle using an open query over the same compiled coordinates. The open triangle's sign is never used. Lazy triangle queries belong to this snapshot and are reused by the emergence solver's root and hit checks. These are not BVH leaf ordinals or a nearest-feature triangle picked later.
 *
 * Positive weights select the feature's vertex support: three select the face, two an edge and one a vertex. Their magnitudes and sum do not enter incidence, so finite positive rescaling that keeps that support needs no normalization. All-zero, negative or nonfinite support refuses. The index does not seat a point, move a root, classify a ray crossing or add an authoring field.
 *
 * Exact coordinate identity matches createAutoMovieSignedMeshQuery, including UV-split coincident vertices. No tolerance, quantization or coordinate change joins nearby points. Coordinates are current head-frame metres; incidence itself is dimensionless and invariant under rigid frame changes that preserve exact coincidence. The caller supplies an already admitted closed, embedded, outward collider; this index checks buffers and nondegenerate triangles but does not replace closure or embeddedness admission.
 *
 * Compilation costs O(vertices + triangles) and retains owned triangle identity and vertex-incidence arrays. A root examines the smallest incident list of its one-to-three support vertices, rather than scanning the complete collider. Distance to a triangle is convex: if a root and its ray hit are both within the existing rounding allowance of that triangle, their complete segment is too. This proximity supplies a numeric root-prefix certificate; incidence alone never classifies a ray crossing or excuses a distant intersection. Caller mutations of buffers, weight arrays or returned arrays cannot rewrite the compiled index. A new current collider needs a new index.
 *
 * @evidence contracts/common.md#principled-implementation Exact-coordinate incidence preserves supplied collider ordinals and root positive-weight support, including cap faces incident on that feature, on one closed snapshot.
 * @evidence contracts/common.md#clear-and-simple-design A resolver and lazy unsigned triangle-distance reader supply the root-prefix admission owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid support and degenerate buffers refuse; coincidence is exact, and incidence does not replace embeddedness or proximity admission.
 * @evidence contracts/common.md#meaningful-documentation Triangle ordinals follow the supplied closed collider, including its cap suffix; coordinates are metres and positive-weight magnitude does not alter feature incidence.
 * @evidence contracts/performance.md#efficient-algorithms Compilation is linear in topology; root support intersects incident lists and lazy triangle queries avoid whole-mesh scans.
 * @evidence contracts/performance.md#reuse-equivalent-work Each requested resident triangle's open-distance query is built lazily and reused within the same immutable coordinate/index snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned coordinates, incidence and at most one lazy query per resident triangle live with the boundary closure; returned support arrays are owned.
 */
export function createHumanFaceHairRootBoundary(
  props: IHumanFaceHairRootBoundaryProps,
): IHumanFaceHairRootBoundary {
  const positions: number[] = [...props.positions];
  const indices: number[] = [...props.indices];
  if (
    positions.length % 3 !== 0 ||
    indices.length === 0 ||
    indices.length % 3 !== 0 ||
    !positions.every(Number.isFinite) ||
    indices.some(
      (id: number): boolean => !Number.isInteger(id) || id < 0 || id >= positions.length / 3,
    )
  )
    throw new Error("Root boundary needs finite complete resident triangles.");
  const identities: Map<string, number> = new Map<string, number>();
  const vertices: number[] = [];
  for (let at: number = 0; at < positions.length; at += 3) {
    const key: string = `${positions[at]},${positions[at + 1]},${positions[at + 2]}`;
    let id: number | undefined = identities.get(key);
    if (id === undefined) {
      id = identities.size;
      identities.set(key, id);
    }
    vertices.push(id);
  }
  const triangles: number[][] = [];
  const incidence: Map<number, number[]> = new Map<number, number[]>();
  for (let at: number = 0; at < indices.length; at += 3) {
    const source: number[] = indices.slice(at, at + 3);
    const ids: number[] = source.map((id: number): number => vertices[id]);
    if (new Set(ids).size !== 3)
      throw new Error(
        "Root boundary triangles need distinct current vertices.",
      );
    const [a, b, c]: ImportedIAutoMovieVector3[] = source.map((id: number): ImportedIAutoMovieVector3 =>
      Vector3.create(
        positions[3 * id],
        positions[3 * id + 1],
        positions[3 * id + 2],
      ),
    );
    const area: number = Vector3.length(
      Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
    );
    if (!(area > 0) || !Number.isFinite(area))
      throw new Error(
        "Root boundary triangle arithmetic must be finite and nondegenerate.",
      );
    const ordinal: number = triangles.length;
    triangles.push(ids);
    for (const id of ids) {
      const adjacent: number[] = incidence.get(id) ?? [];
      adjacent.push(ordinal);
      incidence.set(id, adjacent);
    }
  }
  const resident: (triangle: number) => void = (triangle: number): void => {
    if (
      !Number.isInteger(triangle) ||
      triangle < 0 ||
      triangle >= triangles.length
    )
      throw new Error(
        "Root boundary requires its original resident triangle ordinal.",
      );
  };
  const queries: Map<number, (point: readonly number[]) => ImportedIAutoMovieSignedMeshQueryHit> = new Map<
    number,
    ReturnType<typeof createAutoMovieSignedMeshQuery>
  >();
  const resolve: (root: IHumanFaceHairRootReference) => number[] = (root: IHumanFaceHairRootReference): number[] => {
    resident(root.triangle);
    if (
      root.weights.length !== 3 ||
      root.weights.some((weight: number): boolean => !Number.isFinite(weight) || weight < 0)
    )
      throw new Error(
        "Root boundary needs three finite nonnegative support weights.",
      );
    const support: number[] = triangles[root.triangle].filter(
      (_id: number, at: number): boolean => root.weights[at] > 0,
    );
    if (support.length === 0)
      throw new Error("Root boundary weights need positive support.");
    let candidates: number[] = incidence.get(support[0])!;
    for (const id of support.slice(1)) {
      const adjacent: number[] = incidence.get(id)!;
      if (adjacent.length < candidates.length) candidates = adjacent;
    }
    return candidates.filter((triangle: number): boolean =>
      support.every((id: number): boolean => triangles[triangle].includes(id)),
    );
  };
  return {
    resolve,
    distance: (triangle: number, point: readonly number[]): number => {
      resident(triangle);
      let query: ((point: readonly number[]) => ImportedIAutoMovieSignedMeshQueryHit) | undefined = queries.get(triangle);
      if (query === undefined) {
        query = createAutoMovieSignedMeshQuery(
          {
            positions: indices
              .slice(3 * triangle, 3 * triangle + 3)
              .flatMap((id: number): number[] => positions.slice(3 * id, 3 * id + 3)),
            indices: [0, 1, 2],
            normals: null,
            uvs: null,
            skin: null,
          },
          { boundary: "open" },
        );
        queries.set(triangle, query);
      }
      return query(point).distance;
    },
  };
}
