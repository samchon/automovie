import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";

/**
 * Compile root-feature incidence on one current closed hair collider.
 * The hair builder supplies the same closed positions/index snapshot used by
 * its signed query and ray caster, before material splitting. Original skin
 * triangle ordinals remain the closure's prefix; cap triangles follow them.
 * The returned resolver consumes the sampler's triangle and weight metadata,
 * and returns owned original triangle ordinals incident on that root feature.
 * Its distance reader measures unsigned proximity to one of those actual
 * original triangles, using an open query over the same compiled coordinates.
 * The open triangle's sign is never used. Lazy triangle queries belong to this
 * snapshot and are reused by the emergence solver's root and hit checks.
 * These are not BVH leaf ordinals or a nearest-feature triangle picked later.
 *
 * Positive weights select the feature's vertex support: three select the face,
 * two an edge and one a vertex. Their magnitudes and sum do not enter incidence,
 * so finite positive rescaling that keeps that support needs no normalization.
 * All-zero, negative or nonfinite support refuses. The index does not seat a
 * point, move a root, classify a ray crossing or add an authoring field.
 *
 * Exact coordinate identity matches createAutoMovieSignedMeshQuery, including
 * UV-split coincident vertices. No tolerance, quantization or coordinate change
 * joins nearby points. Coordinates are current head-frame metres; incidence
 * itself is dimensionless and invariant under rigid frame changes that preserve
 * exact coincidence. The caller supplies an already admitted closed, embedded,
 * outward collider; this index checks buffers and nondegenerate triangles but
 * does not replace closure or embeddedness admission.
 *
 * Compilation costs O(vertices + triangles) and retains owned triangle identity
 * and vertex-incidence arrays. A root examines the smallest incident list of its
 * one-to-three support vertices, rather than scanning the complete collider.
 * Distance to a triangle is convex: if a root and its ray hit are both within
 * the existing rounding allowance of that triangle, their complete segment is
 * too. This proximity supplies a numeric root-prefix certificate; incidence
 * alone never classifies a ray crossing or excuses a distant intersection.
 * Caller mutations of buffers, weight arrays or returned arrays cannot rewrite
 * the compiled index. A new current collider needs a new index.
 *
 * @evidence contracts/common.md#principled-implementation The minimal barycentric support defines a triangle face, edge or vertex; intersecting the support vertices' incident triangle lists returns exactly its root-star in original index order. Exact coordinate equivalence matches the collider's identity without moving it.
 * @evidence contracts/common.md#clear-and-simple-design One compilation owns current incidence and each resolver only selects support and intersects the smallest local list. Root seating and later ray admission remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject, per-root corrective or tolerance weld is stored. Derived sampler metadata selects only an existing feature and never authors geometry.
 * @evidence contracts/common.md#meaningful-documentation States the current-snapshot consumers, original ordinal meaning, support-only interpretation, costs, ownership and the closure and crossing limitations.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It indexes derived feature identity and defines no displayed part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels It consumes derived triangle support, not a channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It returns existing triangle ordinals and emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Source coordinates are current head-frame metres, while indices and weights select dimensionless topology. No coordinate or unit conversion occurs.
 * @evidence contracts/modeling.md#shared-boundaries Exact coincident-coordinate identity joins the same split vertices as the current signed collider, and original skin ordinals survive closure fan append. It does not prove surface continuity or ray clearance.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns a numerical index and displays no part; the hair builder owns observation of the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It adds no anatomical value, proportion or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits computational metadata, not a living anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Root triangle and support come from the shared sampler and are not a new caller authoring field.
 */
export function createHumanFaceHairRootBoundary(props: {
  positions: readonly number[];
  indices: readonly number[];
}): {
  resolve: (root: { triangle: number; weights: readonly number[] }) => number[];
  distance: (triangle: number, point: readonly number[]) => number;
} {
  const positions = [...props.positions];
  const indices = [...props.indices];
  if (
    positions.length % 3 !== 0 || indices.length === 0 || indices.length % 3 !== 0 ||
    !positions.every(Number.isFinite) || indices.some((id) =>
      !Number.isInteger(id) || id < 0 || id >= positions.length / 3,
    )
  ) throw new Error("Root boundary needs finite complete resident triangles.");
  const identities = new Map<string, number>();
  const vertices: number[] = [];
  for (let at = 0; at < positions.length; at += 3) {
    const key = `${positions[at]},${positions[at + 1]},${positions[at + 2]}`;
    let id = identities.get(key);
    if (id === undefined) {
      id = identities.size;
      identities.set(key, id);
    }
    vertices.push(id);
  }
  const triangles: number[][] = [];
  const incidence = new Map<number, number[]>();
  for (let at = 0; at < indices.length; at += 3) {
    const source = indices.slice(at, at + 3);
    const ids = source.map((id) => vertices[id]);
    if (new Set(ids).size !== 3)
      throw new Error("Root boundary triangles need distinct current vertices.");
    const [a, b, c] = source.map((id) => Vector3.create(
      positions[3 * id], positions[3 * id + 1], positions[3 * id + 2],
    ));
    const area = Vector3.length(Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)));
    if (!(area > 0) || !Number.isFinite(area))
      throw new Error("Root boundary triangle arithmetic must be finite and nondegenerate.");
    const ordinal = triangles.length;
    triangles.push(ids);
    for (const id of ids) {
      const adjacent = incidence.get(id) ?? [];
      adjacent.push(ordinal);
      incidence.set(id, adjacent);
    }
  }
  const resident = (triangle: number): void => {
    if (!Number.isInteger(triangle) || triangle < 0 || triangle >= triangles.length)
      throw new Error("Root boundary requires its original resident triangle ordinal.");
  };
  const queries = new Map<number, ReturnType<typeof createAutoMovieSignedMeshQuery>>();
  const resolve = (root: { triangle: number; weights: readonly number[] }): number[] => {
    resident(root.triangle);
    if (root.weights.length !== 3 || root.weights.some((weight) => !Number.isFinite(weight) || weight < 0))
      throw new Error("Root boundary needs three finite nonnegative support weights.");
    const support = triangles[root.triangle].filter((_id, at) => root.weights[at] > 0);
    if (support.length === 0)
      throw new Error("Root boundary weights need positive support.");
    let candidates = incidence.get(support[0])!;
    for (const id of support.slice(1)) {
      const adjacent = incidence.get(id)!;
      if (adjacent.length < candidates.length) candidates = adjacent;
    }
    return candidates.filter((triangle) => support.every((id) => triangles[triangle].includes(id)));
  };
  return {
    resolve,
    distance: (triangle, point) => {
      resident(triangle);
      let query = queries.get(triangle);
      if (query === undefined) {
        query = createAutoMovieSignedMeshQuery({
          positions: indices.slice(3 * triangle, 3 * triangle + 3).flatMap((id) => positions.slice(3 * id, 3 * id + 3)),
          indices: [0, 1, 2], normals: null, uvs: null, skin: null,
        }, { boundary: "open" });
        queries.set(triangle, query);
      }
      return query(point).distance;
    },
  };
}
