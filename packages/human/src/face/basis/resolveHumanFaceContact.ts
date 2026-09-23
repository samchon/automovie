import { createAutoMovieSignedMeshQuery } from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";

type Contact = NonNullable<IAutoMovieHumanFaceBasis["contact"]>;

/**
 * Keep soft tissue outside the rigid dental surfaces by the rest floor rule:
 * every soft vertex keeps at least the clearance it has in the shape-only
 * rest state, so tissue the source authored touching or slightly inside a
 * tooth at rest is left there, and only tissue that a pose pushed deeper is
 * moved back, along the nearest feature's normal, exactly to that floor. A
 * push larger than the surface's budget refuses the document by surface,
 * vertex and depth.
 *
 * The colliders are compiled twice per document, at rest and posed, as
 * oriented sheets with their closure triangles; a vertex farther than a
 * collider's reach at rest or posed, or one whose nearest feature at rest or
 * posed is a rim of an open sheet, reads no side and has no floor, so it is
 * left alone, which is the contract the sheet query states. Seam copies of one welded vertex are judged once
 * and moved together, so a push never opens a seam or changes the model's
 * admitted weld partition. A pushed vertex's neighbours take half the mean
 * push of the pushed vertices around them, so a correction spreads over one
 * ring instead of standing as a spike; the pushed vertices themselves stay
 * on their floor. Positions are corrected in place and the count of welded
 * vertices moved and the deepest excess per surface are returned for the
 * summary.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-contact Returns tissue pushed past its rest clearance to that clearance within the tissue budget and refuses beyond it.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-contact Compiles the posed and rest colliders as sheets, applies the floor rule within reach and tolerance, and reports resolved counts and depths.
 */
export function resolveHumanFaceContact(
  basis: IAutoMovieHumanFaceBasis,
  contact: Contact,
  posed: Map<string, number[]>,
  shaped: ReadonlyMap<string, readonly number[]>,
): IAutoMovieHumanFaceContactSummary["resolved"] {
  const surfaces = new Map(
    basis.surfaces.map((surface) => [surface.id, surface]),
  );
  const compile = (
    id: string,
    closure: readonly number[],
    positions: readonly number[],
  ) => {
    const query = createAutoMovieSignedMeshQuery(
      {
        positions: positions as number[],
        indices: [...surfaces.get(id)!.indices, ...closure],
        normals: null,
        uvs: null,
        skin: null,
      },
      { boundary: "open" },
    );
    const low = [Infinity, Infinity, Infinity];
    const high = [-Infinity, -Infinity, -Infinity];
    for (let at = 0; at < positions.length; at += 3)
      for (let axis = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis], positions[at + axis]);
        high[axis] = Math.max(high[axis], positions[at + axis]);
      }
    return { query, low, high };
  };
  const colliders = contact.colliders.map((collider) => ({
    reach: collider.reachMetres,
    now: compile(
      collider.surface,
      collider.closure,
      posed.get(collider.surface)!,
    ),
    rest: compile(
      collider.surface,
      collider.closure,
      shaped.get(collider.surface)!,
    ),
  }));
  const near = (
    box: { low: number[]; high: number[] },
    reach: number,
    p: readonly number[],
  ): boolean =>
    [0, 1, 2].every(
      (axis) =>
        p[axis] >= box.low[axis] - reach && p[axis] <= box.high[axis] + reach,
    );
  const mm = (metres: number): string => (metres * 1000).toFixed(2);
  return contact.soft.map((soft) => {
    const surface = surfaces.get(soft.surface)!;
    const positions = posed.get(soft.surface)!;
    const rest = shaped.get(soft.surface)!;
    // Seam copies of one welded vertex are queried once and moved together,
    // so a push never splits a weld: the model keeps its admitted partition
    // and the seam stays closed.
    const groups = new Map<string, number[]>();
    const groupOf = new Int32Array(positions.length / 3);
    for (let vertex = 0; vertex * 3 < positions.length; vertex++) {
      const key = positions.slice(3 * vertex, 3 * vertex + 3).join(",");
      let members = groups.get(key);
      if (members === undefined) {
        members = [];
        groups.set(key, members);
      }
      groupOf[vertex] = members.length === 0 ? vertex : members[0];
      members.push(vertex);
    }
    const pushes = new Map<number, number[]>();
    let deepest = 0;
    for (const members of groups.values()) {
      const vertex = members[0];
      const p = positions.slice(3 * vertex, 3 * vertex + 3);
      const r = rest.slice(3 * vertex, 3 * vertex + 3);
      let push: number[] | undefined;
      for (const collider of colliders) {
        if (!near(collider.now, collider.reach, p)) continue;
        const hit = collider.now.query(p);
        if (hit.distance > collider.reach || hit.boundary) continue;
        // The floor is only known where the rest reading is one the sheet
        // can give: within reach and off its rim. Elsewhere the vertex has no
        // floor and is left alone rather than pushed from an assumed zero.
        if (!near(collider.rest, collider.reach, r)) continue;
        const before = collider.rest.query(r);
        if (before.boundary || before.distance > collider.reach) continue;
        const floor = Math.min(before.signedDistance, 0);
        const excess = floor - hit.signedDistance;
        if (excess <= contact.toleranceMetres) continue;
        if (excess > soft.budgetMetres)
          throw new Error(
            `${soft.surface} penetrates a dental surface by ${mm(excess)} mm at vertex ${vertex}, past its ${mm(soft.budgetMetres)} mm tissue budget.`,
          );
        deepest = Math.max(deepest, excess);
        push ??= [0, 0, 0];
        for (let axis = 0; axis < 3; axis++) {
          push[axis] += excess * hit.normal[axis];
          p[axis] += excess * hit.normal[axis];
        }
      }
      if (push === undefined) continue;
      pushes.set(vertex, push);
      for (const member of members)
        for (let axis = 0; axis < 3; axis++)
          positions[3 * member + axis] = p[axis];
    }
    if (pushes.size > 0) {
      const neighbours = new Map<number, Set<number>>();
      const link = (a: number, b: number): void => {
        if (a === b) return;
        let set = neighbours.get(a);
        if (set === undefined) {
          set = new Set();
          neighbours.set(a, set);
        }
        set.add(b);
      };
      for (let at = 0; at < surface.indices.length; at += 3)
        for (let corner = 0; corner < 3; corner++) {
          const a = groupOf[surface.indices[at + corner]];
          const b = groupOf[surface.indices[at + ((corner + 1) % 3)]];
          link(a, b);
          link(b, a);
        }
      const spread = new Map<number, number[]>();
      for (const vertex of pushes.keys())
        for (const other of neighbours.get(vertex) ?? []) {
          if (pushes.has(other)) continue;
          const total = spread.get(other) ?? [0, 0, 0, 0];
          const push = pushes.get(vertex)!;
          for (let axis = 0; axis < 3; axis++) total[axis] += push[axis];
          total[3]++;
          spread.set(other, total);
        }
      for (const [vertex, total] of spread) {
        const key = positions.slice(3 * vertex, 3 * vertex + 3).join(",");
        for (const member of groups.get(key)!)
          for (let axis = 0; axis < 3; axis++)
            positions[3 * member + axis] += (0.5 * total[axis]) / total[3];
      }
    }
    return {
      surface: soft.surface,
      vertices: pushes.size,
      maxDepthMetres: deepest,
    };
  });
}
