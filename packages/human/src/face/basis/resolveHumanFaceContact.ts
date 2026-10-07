import {
  createAutoMovieSignedMeshQuery,
  solveAutoMovieQuadraticProgram,
} from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
import type { IAutoMovieMesh } from "@automovie/interface";
import type { IHumanFaceDynamicCollider } from "./IHumanFaceDynamicCollider";
import type { IHumanFaceContactBounds } from "./IHumanFaceContactBounds";
import type { IHumanFaceContactGeometry } from "./IHumanFaceContactGeometry";
import type { IHumanFaceContactColliderState } from "./IHumanFaceContactColliderState";
import type { IHumanFaceContactWitness } from "./IHumanFaceContactWitness";
import type { IHumanFaceContactHit } from "./IHumanFaceContactHit";
import type { IHumanFaceContactFloor } from "./IHumanFaceContactFloor";

type Contact = NonNullable<IAutoMovieHumanFaceBasis["contact"]>;

/**
 * Keep soft tissue outside the rigid dental and ocular surfaces by the rest
 * floor rule:
 * every soft vertex's floor is its clearance in the shape-only rest state,
 * held to at most the collider's cover (the thinnest tissue that lies over
 * it: a lid over a globe keeps its thickness, while lips meet the teeth
 * with none), so tissue the source authored touching or slightly inside a
 * tooth at rest is left there, and only tissue that a pose pushed deeper is
 * corrected against every known collider floor together. Each floor is an
 * affine row along the signed distance's gradient at the original point: the
 * face normal on a face, the unit vector from the nearest point on an edge or
 * vertex, never that feature's pseudonormal, which only orients the side and
 * gains clearance more slowly than its length. A largest single-floor
 * projection along that gradient that satisfies the full affine floors
 * retains the exact normal response; otherwise the shared QP minimizes
 * squared local displacement to the floors, relaxed by the existing clearance
 * tolerance only where the budget cannot reach them. A candidate must also
 * pass all original signed queries and its actual Euclidean movement budget.
 * Solver success alone admits no correction.
 *
 * The colliders are compiled twice per document, at rest and posed, as
 * oriented sheets with their closure triangles; a vertex farther than a
 * collider's reach at rest or posed, or one whose nearest feature at rest or
 * posed is a rim of an open sheet, reads no side and has no floor, so it
 * is left alone, which is the contract the sheet query states. Seam copies of
 * one welded vertex are judged once and moved together, so a push never
 * opens a seam or changes the model's
 * admitted weld partition. A pushed vertex's neighbours take half the mean
 * push of the pushed vertices around them as a smoothing target, so a
 * correction spreads over one ring instead of standing as a spike; a neighbour
 * that needed no correction is valid where it stands, so it takes the move
 * nearest that target that keeps its own original floors, and stays put when
 * no such move verifies. The pushed vertices themselves stay on their
 * validated floor, and a push that cannot be verified refuses. Where a
 * corrected point leaves a collider's reach or meets its rim, so the sheet
 * reads no side there, the floor is proven instead by the distance's
 * 1-Lipschitz bound from its original outside reading: a move shorter than
 * that reading cannot cross the surface and loses at most its length of
 * clearance, and a floor that bound does not prove refuses instead of silently
 * losing that constraint. Owned staging arrays preserve every
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
 * @evidence contracts/common.md#principled-implementation Rest-clearance floors are captured on the original point for every queryable collider as affine rows along the signed distance's gradient, which stays conservative where clearance is convex. Joint candidates use the shared minimum-displacement QP in positive budget units to the floors themselves and relax by half the declared tolerance only when the budget cannot reach them, while exact single-floor witnesses retain the original gradient response. All moved points, including one-ring neighbours, must satisfy original signed-query floors within the declared tolerance, or the distance's 1-Lipschitz bound where the sheet reads no side, and the strict Euclidean net budget before any supplied buffer is committed. An unverifiable pushed point refuses; an unverifiable smoothing move is not made. These authored geometric constraints are not tissue mechanics or whole-skin validity.
 * @evidence contracts/common.md#clear-and-simple-design One orchestrator owns query witnesses, welded groups, local displacement and one-ring verification; the engine owns signed geometry and the shared QP.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No budget or tolerance is enlarged and no radial clipping substitutes for a failed witness. Staging keeps all supplied pose arrays unchanged on refusal.
 * @evidence contracts/common.md#meaningful-documentation States the original floor/query ownership, the gradient rows, strict net budget, solver, spread and reach-proof rules, atomic mutation, summary interpretation and skin-validity limits.
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
  generated?: ReadonlyMap<string, readonly IHumanFaceDynamicCollider[]>,
): IAutoMovieHumanFaceContactSummary["resolved"] {
  const surfaces = new Map(
    basis.surfaces.map((surface) => [surface.id, surface]),
  );
  const compile = (
    id: string,
    closure: readonly number[],
    positions: readonly number[],
    mesh?: IAutoMovieMesh,
    label: string = id,
    pointIds?: readonly string[],
  ): IHumanFaceContactGeometry => {
    let query: ReturnType<typeof createAutoMovieSignedMeshQuery>;
    try {
      query = createAutoMovieSignedMeshQuery(
      {
        positions: positions as number[],
        indices: mesh === undefined ? [...surfaces.get(id)!.indices, ...closure] : mesh.indices,
        normals: null,
        uvs: null,
        skin: null,
      },
      { boundary: "open" },
      );
    } catch (error) {
      const original = mesh === undefined ? surfaces.get(id)?.positions : undefined;
      let changedCoordinates = 0, maximumChangeMetres = 0;
      if (original !== undefined && original.length === positions.length)
        positions.forEach((value, at) => {
          if (value !== original[at]) changedCoordinates++;
          maximumChangeMetres = Math.max(maximumChangeMetres, Math.abs(value - original[at]));
        });
      throw new Error("Face contact collider " + label +
        (original === undefined ? "" : "; changed source coordinates " + changedCoordinates + ", maximum change " + maximumChangeMetres + " m") +
        ": " + (error instanceof Error ? error.message : String(error)) +
        (pointIds === undefined ? "" : "; physical point identities " + JSON.stringify(pointIds)), { cause: error });
    }
    const low = [Infinity, Infinity, Infinity];
    const high = [-Infinity, -Infinity, -Infinity];
    for (let at = 0; at < positions.length; at += 3)
      for (let axis = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis], positions[at + axis]);
        high[axis] = Math.max(high[axis], positions[at + axis]);
      }
    return { query, low, high };
  };
  const colliders: IHumanFaceContactColliderState[] = contact.colliders.flatMap((collider) => {
    const replacements = generated?.get(collider.surface);
    if (replacements !== undefined) {
      if (replacements.length === 0)
        throw new Error("Generated contact replacement must retain at least one exterior.");
      return replacements.map(replacement => ({
        reach: collider.reachMetres,
        cover: collider.coverMetres ?? 0,
        now: compile(collider.surface, [], replacement.posed.positions, replacement.posed, (replacement.id ?? collider.surface) + ":performed", replacement.pointIds),
        rest: compile(collider.surface, [], replacement.rest.positions, replacement.rest, (replacement.id ?? collider.surface) + ":rest", replacement.pointIds),
      }));
    }
    return [{
    reach: collider.reachMetres,
    cover: collider.coverMetres ?? 0,
    now: compile(
      collider.surface,
      collider.closure,
      posed.get(collider.surface)!,
      undefined,
      collider.surface + ":performed",
    ),
    rest: compile(
      collider.surface,
      collider.closure,
      shaped.get(collider.surface)!,
      undefined,
      collider.surface + ":rest",
    ),
    }];
  });
  const near = (
    box: IHumanFaceContactBounds,
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
    const floors = new Map<number, IHumanFaceContactWitness[]>();
    const rowsOf = new Map<number, IHumanFaceContactFloor[]>();
    // The first refusal reading of one welded point, or null when every
    // original floor holds there within the declared tolerance and the net
    // budget. A directly corrected point refuses on it; a spread-only
    // neighbour that has one keeps its original place instead.
    const fault = (vertex: number): string | null => {
      const point = positions.slice(3 * vertex, 3 * vertex + 3);
      const travel = Math.hypot(...point.map((value, axis) => value - original[3 * vertex + axis]));
      if (!Number.isFinite(travel) || travel > soft.budgetMetres)
        return `${soft.surface} has an unverified net contact move of ${mm(travel)} mm at vertex ${vertex}, past its ${mm(soft.budgetMetres)} mm tissue budget.`;
      for (const witness of floors.get(vertex)!) {
        const hit = witness.collider.now.query(point);
        if (!near(witness.collider.now, witness.collider.reach, point) ||
            hit.boundary || hit.distance > witness.collider.reach) {
          // The sheet reads no side here, but the distance to a surface is
          // 1-Lipschitz: a move shorter than the original outside reading
          // cannot cross the surface, and clearance cannot fall by more than
          // the move. That bound proves the floor without the side reading.
          if (witness.signed > travel &&
              witness.floor - (witness.signed - travel) <= contact.toleranceMetres)
            continue;
          return `${soft.surface} contact floor cannot be verified at vertex ${vertex}: the corrected point leaves the oriented sheet's reach or meets its rim.`;
        }
        if (witness.floor - hit.signedDistance > contact.toleranceMetres)
          return `${soft.surface} violates an original contact floor at vertex ${vertex} after correction by ${mm(witness.floor - hit.signedDistance)} mm.`;
      }
      return null;
    };
    const verify = (vertex: number): void => {
      const message = fault(vertex);
      if (message !== null) throw new Error(message);
    };
    let deepest = 0;
    for (const members of groups.values()) {
      const vertex = members[0];
      const p = positions.slice(3 * vertex, 3 * vertex + 3);
      const known: IHumanFaceContactWitness[] = [];
      const rows: IHumanFaceContactFloor[] = [];
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
          known.push({ collider, floor, signed: hit.signedDistance });
          rows.push({ normal: signedGradient(hit, p), minimum: excess });
          if (excess <= contact.toleranceMetres) continue;
          if (excess > soft.budgetMetres)
            throw new Error(
              `${soft.surface} penetrates a rigid surface by ${mm(excess)} mm at vertex ${vertex}, past its ${mm(soft.budgetMetres)} mm tissue budget.`,
            );
          deepest = Math.max(deepest, excess);
        }
      }
      floors.set(vertex, known);
      rowsOf.set(vertex, rows);
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
        const members = groups.get(key)!;
        const move = contactProjection(
          rowsOf.get(vertex)!,
          [0, 1, 2].map((axis) => (0.5 * total[axis]) / total[3]),
          soft.budgetMetres,
          contact.toleranceMetres,
          rowsOf.get(vertex)!.map((row) => Math.min(row.minimum, 0)),
        );
        for (const member of members)
          for (let axis = 0; axis < 3; axis++)
            positions[3 * member + axis] += move?.[axis] ?? 0;
        // The smoothing is a preference. A neighbour that needed no correction
        // is valid where it stands, so a move its own floors, reach or budget
        // do not verify is not made, and no floor is lost by it.
        if (move !== null && fault(vertex) === null) continue;
        for (const member of members)
          for (let axis = 0; axis < 3; axis++)
            positions[3 * member + axis] = original[3 * member + axis];
        // Standing is valid only where the original itself reads clean: a
        // supplied nonfinite point has no verified place and refuses.
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

/**
 * The signed distance's gradient at a queried point, the direction along which
 * clearance grows at unit rate. On a face it is the face normal. At the
 * nearest point of an edge or vertex the gradient is the unit vector from that
 * point to the query, signed by the side, and the feature's pseudonormal only
 * orients the side: it departs from the gradient by the angle between them, so
 * moving along it gains clearance more slowly than its length. On the surface
 * itself no radial direction exists and the pseudonormal is the one-sided
 * limit.
 */
function signedGradient(
  hit: IHumanFaceContactHit,
  query: readonly number[],
): number[] {
  if (hit.feature === "face" || !(hit.distance > 0)) return hit.normal;
  const side = hit.signedDistance < 0 ? -1 : 1;
  return query.map((value, axis) => (side * (value - hit.point[axis])) / hit.distance);
}

/** Whether every affine floor reads at least its minimum minus the slack. */
function holds(rows: readonly IHumanFaceContactFloor[], vector: readonly number[], slack: number): boolean {
  return rows.every((row) =>
    row.normal.reduce((sum, value, axis) => sum + value * vector[axis], 0) >= row.minimum - slack);
}

/**
 * A bounded local clearance witness. A largest single-floor projection along
 * the gradient reads clearance growing at unit rate, because the nearest
 * feature stays nearest along its own radial ray, so when it satisfies all full
 * floors it attains the norm lower bound and needs no native solve. The
 * projection n * m reads n . (n * m) = m only in real arithmetic, so a floating
 * reading may miss by a rounding unit; that case takes the solve, which reaches
 * the same floor. Otherwise the shared QP
 * minimizes squared displacement in budget units to the floors themselves; only
 * when the budget cannot reach them does it relax each by half the contact
 * tolerance. The tolerance is the admission slack, so it is not spent while the
 * floors are reachable, and the other half stays for the solver's residual
 * (about 1e-6 of the budget) so the candidate does not land on the admission
 * edge, where one nanometre decides between accepting and refusing. The gradient linearisation is conservative where clearance is
 * convex, outside a convex feature, and actual signed geometry is checked by
 * the caller before committing any move.
 */
function contactCorrection(rows: readonly IHumanFaceContactFloor[], budget: number, tolerance: number): number[] {
  const needed = rows.filter((row) => row.minimum > tolerance);
  const largest = needed.reduce((a, b) => a.minimum >= b.minimum ? a : b);
  const direct = largest.normal.map((value) => value * largest.minimum);
  if (Math.hypot(...direct) <= budget && holds(rows, direct, 0)) return direct;
  // A required positive displacement with zero budget already refused above.
  const vector =
    contactProjection(rows, [0, 0, 0], budget, tolerance, rows.map((row) => row.minimum)) ??
    contactProjection(rows, [0, 0, 0], budget, tolerance, rows.map((row) => row.minimum - tolerance / 2));
  if (vector === null)
    throw new Error("The simultaneous contact solve returned no verified displacement.");
  return vector;
}

/**
 * The displacement nearest a target whose reading along each row's gradient is
 * at least that row's lower bound, inside the budget and within the contact
 * tolerance of every original floor, or null when none exists. Used with a zero
 * target for the least correction, and with a smoothing target for a neighbour
 * whose own floors outrank it. Rows whose bound lies below -budget follow from
 * Cauchy-Schwarz for unit normals, and a solution longer than the budget is
 * refused after the solve.
 */
function contactProjection(
  rows: readonly IHumanFaceContactFloor[],
  target: readonly number[],
  budget: number,
  tolerance: number,
  lowers: readonly number[],
): number[] | null {
  // A smoothing target is half a mean of pushes that each fit the budget.
  if (rows.length === 0) return [...target];
  const result = solveAutoMovieQuadraticProgram({
    diagonal: [1, 1, 1], linear: target.map((value) => -value / budget),
    rows: rows.flatMap((row, at) => lowers[at] > -budget ? [{
      indices: [0, 1, 2], weights: [...row.normal],
      lower: lowers[at] / budget, upper: null,
    }] : []),
  });
  if (result.status !== 1) return null;
  const vector = result.primal.map((value) => value * budget);
  // NaN cannot satisfy an affine comparison; an infinite norm exceeds the
  // admitted finite budget. These checks also reject nonfinite native output.
  if (!holds(rows, vector, tolerance) || !(Math.hypot(...vector) <= budget)) return null;
  return vector;
}
