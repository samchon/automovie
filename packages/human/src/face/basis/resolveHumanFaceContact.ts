import {
  createAutoMovieSignedMeshQuery,
  solveAutoMovieQuadraticProgram,
} from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";

type Contact = NonNullable<IAutoMovieHumanFaceBasis["contact"]>;

/**
 * Keep soft tissue outside the rigid dental and ocular surfaces by the rest
 * floor rule:
 * every soft vertex's floor is its clearance in the shape-only rest state,
 * held to at most the collider's cover (the thinnest tissue that lies over
 * it: a lid over a globe keeps its thickness, while lips meet the teeth
 * with none), so tissue the source authored touching or slightly inside a
 * tooth at rest is left there, and only tissue that a pose pushed deeper is
 * corrected against every known collider floor together. A largest
 * single-floor projection that satisfies the full affine floors retains the
 * exact normal response; otherwise the shared QP minimizes squared local
 * displacement with the existing clearance tolerance. A candidate must also
 * pass all original signed queries and its actual Euclidean movement budget.
 * Solver success alone admits no correction.
 *
 * The colliders are compiled twice per document, at rest and posed, as
 * oriented sheets with their closure triangles; a vertex farther than a
 * collider's reach at rest or posed, or one whose nearest feature at rest or
 * posed is a rim of an open sheet, reads no side and has no floor, so it is
 * left alone, which is the contract the sheet query states. Seam copies of
 * one welded vertex are judged once and moved together, so a push never
 * opens a seam or changes the model's
 * admitted weld partition. A pushed vertex's neighbours take half the mean
 * push of the pushed vertices around them, so a correction spreads over one
 * ring instead of standing as a spike; the pushed vertices themselves stay
 * on their validated floor. The one-ring candidates are rechecked against
 * their original queries and total movement budget too. An original floor
 * that becomes unverifiable at a sheet rim or beyond reach refuses instead
 * of silently losing that constraint. Owned staging arrays preserve every
 * supplied pose buffer until every soft surface passes; successful results
 * are then copied in place, retaining those buffer identities. The summary
 * counts directly corrected welded groups, excluding spread-only neighbours,
 * and retains the deepest initial collider excess, not net travel.
 * Kozlov et al. 2017 use teeth-shaped collision surfaces and volume
 * simulation to keep lips outside teeth in an animated rig
 * (https://la.disneyresearch.com/wp-content/uploads/Enriching-Facial-Blendshape-Rigs-with-Physical-Simulation-Paper2.pdf).
 * They also detect and resolve intersections in rest configurations with
 * their simulation. Removing those intersections does not establish the
 * anatomical correctness of an authored smile or every expression mixture.
 * This builder uses neither their simulation nor measured tissue stiffness:
 * its rest-clearance floor, neighbour averaging and allowed push budget are
 * authored deterministic constraints. They do not prove all combinations
 * anatomically valid or intersection-free.
 * A pointwise clearance can hold at all corrected vertices while the edges
 * between them invert or adjacent skin triangles cross. The one-ring spread
 * does not solve a coupled tissue strain or require an orientation-preserving
 * surface, so the returned counts cannot certify the performed skin as whole.
 *
 * @evidence contracts/common.md#principled-implementation Rest-clearance floors are captured on the original point for every queryable collider. Joint candidates use the shared minimum-displacement QP in positive budget units, while exact single-floor witnesses retain the original normal response. All moved points, including one-ring neighbours, must satisfy original signed-query floors within the declared tolerance and the strict Euclidean net budget before any supplied buffer is committed. Unverifiable query support refuses. These authored geometric constraints are not tissue mechanics or whole-skin validity.
 * @evidence contracts/common.md#clear-and-simple-design One orchestrator owns query witnesses, welded groups, local displacement and one-ring verification; the engine owns signed geometry and the shared QP.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No budget or tolerance is enlarged and no radial clipping substitutes for a failed witness. Staging keeps all supplied pose arrays unchanged on refusal.
 * @evidence contracts/common.md#meaningful-documentation States the original floor/query ownership, strict net budget, solver and spread checks, atomic mutation, summary interpretation and skin-validity limits.
 * @evidence contracts/modeling.md#spatial-conventions Basis metres; millimetres appear only in error text.
 * @evidenceExclude contracts/anatomy.md#parametric-authority resolveHumanFaceContact defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping resolveHumanFaceContact is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels resolveHumanFaceContact defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry resolveHumanFaceContact emits no primitive.
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
    cover: collider.coverMetres ?? 0,
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
  const staged = new Map<string, number[]>();
  const resolved = contact.soft.map((soft) => {
    const surface = surfaces.get(soft.surface)!;
    const original = posed.get(soft.surface)!;
    const positions = [...original];
    const rest = shaped.get(soft.surface)!;
    // Coincident posed copies move together, but their distinct shaped points
    // retain every original rest floor. Posed coincidence does not establish
    // equal clearance before the pose.
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
    const floors = new Map<number, { collider: typeof colliders[number]; floor: number }[]>();
    const verify = (vertex: number): void => {
      const point = positions.slice(3 * vertex, 3 * vertex + 3);
      const travel = Math.hypot(...point.map((value, axis) => value - original[3 * vertex + axis]));
      if (!Number.isFinite(travel) || travel > soft.budgetMetres)
        throw new Error(`${soft.surface} has an unverified net contact move of ${mm(travel)} mm at vertex ${vertex}, past its ${mm(soft.budgetMetres)} mm tissue budget.`);
      for (const witness of floors.get(vertex)!) {
        const hit = witness.collider.now.query(point);
        if (!near(witness.collider.now, witness.collider.reach, point) ||
            hit.boundary || hit.distance > witness.collider.reach)
          throw new Error(`${soft.surface} contact floor cannot be verified at vertex ${vertex}: the corrected point leaves the oriented sheet's reach or meets its rim.`);
        if (witness.floor - hit.signedDistance > contact.toleranceMetres)
          throw new Error(`${soft.surface} violates an original contact floor at vertex ${vertex} after correction by ${mm(witness.floor - hit.signedDistance)} mm.`);
      }
    };
    let deepest = 0;
    for (const members of groups.values()) {
      const vertex = members[0];
      const p = positions.slice(3 * vertex, 3 * vertex + 3);
      const known: { collider: typeof colliders[number]; floor: number }[] = [];
      const rows: ContactFloor[] = [];
      for (const collider of colliders) {
        if (!near(collider.now, collider.reach, p)) continue;
        const hit = collider.now.query(p);
        if (hit.distance > collider.reach || hit.boundary) continue;
        // The floor is only known where the rest reading is one the sheet
        // can give: within reach and off its rim. Elsewhere the vertex has no
        // floor and is left alone rather than pushed from an assumed zero.
        for (const member of members) {
          const r = rest.slice(3 * member, 3 * member + 3);
          if (!near(collider.rest, collider.reach, r)) continue;
          const before = collider.rest.query(r);
          if (before.boundary || before.distance > collider.reach) continue;
          const floor = Math.min(before.signedDistance, collider.cover);
          const excess = floor - hit.signedDistance;
          known.push({ collider, floor });
          rows.push({ normal: hit.normal, minimum: excess });
          if (excess <= contact.toleranceMetres) continue;
          if (excess > soft.budgetMetres)
            throw new Error(
              `${soft.surface} penetrates a rigid surface by ${mm(excess)} mm at vertex ${vertex}, past its ${mm(soft.budgetMetres)} mm tissue budget.`,
            );
          deepest = Math.max(deepest, excess);
        }
      }
      floors.set(vertex, known);
      if (!rows.some((row) => row.minimum > contact.toleranceMetres)) continue;
      let push: number[];
      try {
        push = contactCorrection(rows, soft.budgetMetres, contact.toleranceMetres);
      } catch (error) {
        throw new Error(`${soft.surface} contact correction at vertex ${vertex} has no verified witness within its ${mm(soft.budgetMetres)} mm net tissue budget: ${String(error)}`);
      }
      pushes.set(vertex, push);
      for (const member of members)
        for (let axis = 0; axis < 3; axis++)
          positions[3 * member + axis] = p[axis] + push[axis];
      verify(vertex);
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
        verify(vertex);
      }
    }
    staged.set(soft.surface, positions);
    return {
      surface: soft.surface,
      vertices: pushes.size,
      maxDepthMetres: deepest,
    };
  });
  // No supplied pose buffer is changed until every soft surface has a witness.
  for (const [surface, positions] of staged) {
    const output = posed.get(surface)!;
    for (let at = 0; at < positions.length; at++) output[at] = positions[at];
  }
  return resolved;
}

/** Original unit-normal affine floors in the posed point's metre frame. */
type ContactFloor = { normal: readonly number[]; minimum: number };

/**
 * A bounded local clearance witness. A largest single-floor projection that
 * satisfies all full floors attains the norm lower bound and needs no native solve.
 * Otherwise the shared QP minimizes squared displacement in budget units.
 * Redundant rows below -budget follow from Cauchy-Schwarz for unit normals.
 * Only the existing contact tolerance is used; no radial clip is performed.
 * Actual signed geometry is checked by the caller before committing any move.
 */
function contactCorrection(rows: readonly ContactFloor[], budget: number, tolerance: number): number[] {
  const needed = rows.filter((row) => row.minimum > tolerance);
  const largest = needed.reduce((a, b) => a.minimum >= b.minimum ? a : b);
  const direct = largest.normal.map((value) => value * largest.minimum);
  const satisfies = (vector: readonly number[], slack: number) => rows.every((row) =>
    row.normal.reduce((sum, value, axis) => sum + value * vector[axis], 0) >= row.minimum - slack);
  if (Math.hypot(...direct) <= budget && satisfies(direct, 0)) return direct;
  // A required positive displacement with zero budget already refused above.
  const result = solveAutoMovieQuadraticProgram({
    diagonal: [1, 1, 1], linear: [0, 0, 0],
    rows: rows.filter((row) => row.minimum - tolerance > -budget).map((row) => ({
      indices: [0, 1, 2], weights: [...row.normal],
      lower: (row.minimum - tolerance) / budget, upper: null,
    })),
  });
  if (result.status !== 1)
    throw new Error("The simultaneous contact solve returned no verified displacement.");
  const vector = result.primal.map((value) => value * budget);
  // NaN cannot satisfy an affine comparison; an infinite norm exceeds the
  // admitted finite budget. These checks also reject nonfinite native output.
  if (!satisfies(vector, tolerance) || Math.hypot(...vector) > budget)
    throw new Error("The simultaneous contact candidate violates an original affine floor or net tissue budget.");
  return vector;
}
