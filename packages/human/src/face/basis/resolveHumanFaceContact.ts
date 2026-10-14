import {
  type IAutoMovieSignedMeshQueryHit as IAutoMovieSignedMeshQueryHitImported,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type {
  IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported,
  IAutoMovieHumanFaceContactCollider as IAutoMovieHumanFaceContactColliderImported,
  IAutoMovieHumanFaceContactSoftSurface as IAutoMovieHumanFaceContactSoftSurfaceImported,
} from "../../index";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
import type { IHumanFaceContactBounds } from "./IHumanFaceContactBounds";
import type { IHumanFaceContactColliderState } from "./IHumanFaceContactColliderState";
import type { IHumanFaceContactFloor } from "./IHumanFaceContactFloor";
import type { IHumanFaceContactGeometry } from "./IHumanFaceContactGeometry";
import type { IHumanFaceContactWitness } from "./IHumanFaceContactWitness";
import type { IHumanFaceDynamicCollider } from "./IHumanFaceDynamicCollider";
import { readHumanFaceContactGradient } from "./readHumanFaceContactGradient";
import { solveHumanFaceContactCorrection } from "./solveHumanFaceContactCorrection";
import { solveHumanFaceContactProjection } from "./solveHumanFaceContactProjection";

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
 * @evidence contracts/common.md#principled-implementation Current posed/shaped surfaces and generated dynamic colliders supply finite model-metre geometry. Signed open-sheet queries establish every known original rest floor; affine gradient/QP candidates must pass actual floor, reach and net-budget verification before staged coordinates commit. Convex gradient behavior does not prove coupled strain, topology or whole-surface injectivity.
 * @evidence contracts/common.md#clear-and-simple-design Collider compilation, original witnesses, direct correction and one-ring smoothing remain distinct stages; shared gradient/floor/projection helpers preserve one numerical rule while this owner alone commits pose buffers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source cover/reach/budget and half-mean smoothing are authored constraints. Unknown rim/out-of-reach sides do not invent zero floors; original outside distance may prove a Lipschitz bound after motion. Failure preserves all input pose buffers and no solver status replaces actual geometry checks.
 * @evidence contracts/common.md#meaningful-documentation Prose gives model-metre floor/cover semantics, welded posed groups with distinct rest witnesses, allowed smoothing, all-surface commit, correction-count populations and unproved tissue/anatomy/topology limits.
 * @evidence contracts/performance.md#efficient-algorithms Rest/posed collider hierarchies build over actual triangles; each soft vertex/group queries C colliders and retains its original witnesses. Corrected one-rings scan source triangles and may solve three-variable QPs with many floor rows; spatial queries and candidate/witness populations determine cost beyond an O(V) pose copy.
 * @evidence contracts/performance.md#reuse-equivalent-work Each collider's rest/posed query and bounds serve all soft vertices, and each welded group's original floors serve correction plus smoothing verification. Performed/rest geometry changes require new hierarchies; no accepted contact result is cached across poses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staged surface coordinates, group maps, adjacency and up to vertex-by-collider witnesses remain invocation-owned until complete commit/failure. Successful coordinates copy into existing caller buffers, summary scalars transfer, and no task/GPU/native handle is acquired here.
 */
export function resolveHumanFaceContact(
  basis: IAutoMovieHumanFaceBasis,
  contact: Contact,
  posed: Map<string, number[]>,
  shaped: ReadonlyMap<string, readonly number[]>,
  generated?: ReadonlyMap<string, readonly IHumanFaceDynamicCollider[]>,
): IAutoMovieHumanFaceContactSummary["resolved"] {
  const surfaces: Map<string, IAutoMovieHumanFaceBasisSurfaceImported> =
    new Map(
      basis.surfaces.map(
        (
          surface: IAutoMovieHumanFaceBasisSurfaceImported,
        ): [string, IAutoMovieHumanFaceBasisSurfaceImported] => [
          surface.id,
          surface,
        ],
      ),
    );
  const compile: (
    id: string,
    closure: readonly number[],
    positions: readonly number[],
    mesh?: IAutoMovieMesh,
    label?: string,
    pointIds?: readonly string[],
  ) => IHumanFaceContactGeometry = (
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
          indices:
            mesh === undefined
              ? [...surfaces.get(id)!.indices, ...closure]
              : mesh.indices,
          normals: null,
          uvs: null,
          skin: null,
        },
        { boundary: "open" },
      );
    } catch (error) {
      const original: number[] | undefined =
        mesh === undefined ? surfaces.get(id)?.positions : undefined;
      let changedCoordinates: number = 0,
        maximumChangeMetres: number = 0;
      if (original !== undefined && original.length === positions.length)
        positions.forEach((value: number, at: number): void => {
          if (value !== original[at]) changedCoordinates++;
          maximumChangeMetres = Math.max(
            maximumChangeMetres,
            Math.abs(value - original[at]),
          );
        });
      throw new Error(
        "Face contact collider " +
          label +
          (original === undefined
            ? ""
            : "; changed source coordinates " +
              changedCoordinates +
              ", maximum change " +
              maximumChangeMetres +
              " m") +
          ": " +
          (error instanceof Error ? error.message : String(error)) +
          (pointIds === undefined
            ? ""
            : "; physical point identities " + JSON.stringify(pointIds)),
        { cause: error },
      );
    }
    const low: number[] = [Infinity, Infinity, Infinity];
    const high: number[] = [-Infinity, -Infinity, -Infinity];
    for (let at: number = 0; at < positions.length; at += 3)
      for (let axis: number = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis], positions[at + axis]);
        high[axis] = Math.max(high[axis], positions[at + axis]);
      }
    return { query, low, high };
  };
  const colliders: IHumanFaceContactColliderState[] = contact.colliders.flatMap(
    (
      collider: IAutoMovieHumanFaceContactColliderImported,
    ): {
      reach: number;
      cover: number;
      now: IHumanFaceContactGeometry;
      rest: IHumanFaceContactGeometry;
    }[] => {
      const replacements: readonly IHumanFaceDynamicCollider[] | undefined =
        generated?.get(collider.surface);
      if (replacements !== undefined) {
        if (replacements.length === 0)
          throw new Error(
            "Generated contact replacement must retain at least one exterior.",
          );
        return replacements.map(
          (
            replacement: IHumanFaceDynamicCollider,
          ): {
            reach: number;
            cover: number;
            now: IHumanFaceContactGeometry;
            rest: IHumanFaceContactGeometry;
          } => ({
            reach: collider.reachMetres,
            cover: collider.coverMetres ?? 0,
            now: compile(
              collider.surface,
              [],
              replacement.posed.positions,
              replacement.posed,
              (replacement.id ?? collider.surface) + ":performed",
              replacement.pointIds,
            ),
            rest: compile(
              collider.surface,
              [],
              replacement.rest.positions,
              replacement.rest,
              (replacement.id ?? collider.surface) + ":rest",
              replacement.pointIds,
            ),
          }),
        );
      }
      return [
        {
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
        },
      ];
    },
  );
  const near: (
    box: IHumanFaceContactBounds,
    reach: number,
    p: readonly number[],
  ) => boolean = (
    box: IHumanFaceContactBounds,
    reach: number,
    p: readonly number[],
  ): boolean =>
    [0, 1, 2].every(
      (axis: number): boolean =>
        p[axis] >= box.low[axis] - reach && p[axis] <= box.high[axis] + reach,
    );
  const mm: (metres: number) => string = (metres: number): string =>
    (metres * 1000).toFixed(2);
  const staged: Map<string, number[]> = new Map<string, number[]>();
  const resolved: {
    surface: string;
    vertices: number;
    maxDepthMetres: number;
  }[] = contact.soft.map(
    (
      soft: IAutoMovieHumanFaceContactSoftSurfaceImported,
    ): { surface: string; vertices: number; maxDepthMetres: number } => {
      const surface: IAutoMovieHumanFaceBasisSurfaceImported = surfaces.get(
        soft.surface,
      )!;
      const original: number[] = posed.get(soft.surface)!;
      const positions: number[] = [...original];
      const rest: readonly number[] = shaped.get(soft.surface)!;
      // Coincident posed copies move together, but their distinct shaped points
      // retain every original rest floor. Posed coincidence does not establish
      // equal clearance before the pose.
      const groups: Map<string, number[]> = new Map<string, number[]>();
      const groupOf: Int32Array<ArrayBuffer> = new Int32Array(
        positions.length / 3,
      );
      for (let vertex: number = 0; vertex * 3 < positions.length; vertex++) {
        const key: string = positions
          .slice(3 * vertex, 3 * vertex + 3)
          .join(",");
        let members: number[] | undefined = groups.get(key);
        if (members === undefined) {
          members = [];
          groups.set(key, members);
        }
        groupOf[vertex] = members.length === 0 ? vertex : members[0];
        members.push(vertex);
      }
      const pushes: Map<number, number[]> = new Map<number, number[]>();
      const floors: Map<number, IHumanFaceContactWitness[]> = new Map<
        number,
        IHumanFaceContactWitness[]
      >();
      const rowsOf: Map<number, IHumanFaceContactFloor[]> = new Map<
        number,
        IHumanFaceContactFloor[]
      >();
      // The first refusal reading of one welded point, or null when every
      // original floor holds there within the declared tolerance and the net
      // budget. A directly corrected point refuses on it; a spread-only
      // neighbour that has one keeps its original place instead.
      const fault: (vertex: number) => string | null = (
        vertex: number,
      ): string | null => {
        const point: number[] = positions.slice(3 * vertex, 3 * vertex + 3);
        const travel: number = Math.hypot(
          ...point.map(
            (value: number, axis: number): number =>
              value - original[3 * vertex + axis],
          ),
        );
        if (!Number.isFinite(travel) || travel > soft.budgetMetres)
          return `${soft.surface} has an unverified net contact move of ${mm(travel)} mm at vertex ${vertex}, past its ${mm(soft.budgetMetres)} mm tissue budget.`;
        for (const witness of floors.get(vertex)!) {
          const hit: IAutoMovieSignedMeshQueryHitImported =
            witness.collider.now.query(point);
          if (
            !near(witness.collider.now, witness.collider.reach, point) ||
            hit.boundary ||
            hit.distance > witness.collider.reach
          ) {
            // The sheet reads no side here, but the distance to a surface is
            // 1-Lipschitz: a move shorter than the original outside reading
            // cannot cross the surface, and clearance cannot fall by more than
            // the move. That bound proves the floor without the side reading.
            if (
              witness.signed > travel &&
              witness.floor - (witness.signed - travel) <=
                contact.toleranceMetres
            )
              continue;
            return `${soft.surface} contact floor cannot be verified at vertex ${vertex}: the corrected point leaves the oriented sheet's reach or meets its rim.`;
          }
          if (witness.floor - hit.signedDistance > contact.toleranceMetres)
            return `${soft.surface} violates an original contact floor at vertex ${vertex} after correction by ${mm(witness.floor - hit.signedDistance)} mm.`;
        }
        return null;
      };
      const verify: (vertex: number) => void = (vertex: number): void => {
        const message: string | null = fault(vertex);
        if (message !== null) throw new Error(message);
      };
      let deepest: number = 0;
      for (const members of groups.values()) {
        const vertex: number = members[0];
        const p: number[] = positions.slice(3 * vertex, 3 * vertex + 3);
        const known: IHumanFaceContactWitness[] = [];
        const rows: IHumanFaceContactFloor[] = [];
        for (const collider of colliders) {
          if (!near(collider.now, collider.reach, p)) continue;
          const hit: IAutoMovieSignedMeshQueryHitImported =
            collider.now.query(p);
          if (hit.distance > collider.reach || hit.boundary) continue;
          // The floor is only known where the rest reading is one the sheet
          // can give: within reach and off its rim. Elsewhere the vertex has no
          // floor and is left alone rather than pushed from an assumed zero.
          for (const member of members) {
            const r: number[] = rest.slice(3 * member, 3 * member + 3);
            if (!near(collider.rest, collider.reach, r)) continue;
            const before: IAutoMovieSignedMeshQueryHitImported =
              collider.rest.query(r);
            if (before.boundary || before.distance > collider.reach) continue;
            const floor: number = Math.min(
              before.signedDistance,
              collider.cover,
            );
            const excess: number = floor - hit.signedDistance;
            known.push({ collider, floor, signed: hit.signedDistance });
            rows.push({
              normal: readHumanFaceContactGradient(hit, p),
              minimum: excess,
            });
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
        if (
          !rows.some(
            (row: IHumanFaceContactFloor): boolean =>
              row.minimum > contact.toleranceMetres,
          )
        )
          continue;
        let push: number[];
        try {
          push = solveHumanFaceContactCorrection(
            rows,
            soft.budgetMetres,
            contact.toleranceMetres,
          );
        } catch (error) {
          throw new Error(
            `${soft.surface} contact correction at vertex ${vertex} has no verified witness within its ${mm(soft.budgetMetres)} mm net tissue budget: ${String(error)}`,
          );
        }
        pushes.set(vertex, push);
        for (const member of members)
          for (let axis: number = 0; axis < 3; axis++)
            positions[3 * member + axis] = p[axis] + push[axis];
        verify(vertex);
      }
      if (pushes.size > 0) {
        const neighbours: Map<number, Set<number>> = new Map<
          number,
          Set<number>
        >();
        const link: (a: number, b: number) => void = (
          a: number,
          b: number,
        ): void => {
          if (a === b) return;
          let set: Set<number> | undefined = neighbours.get(a);
          if (set === undefined) {
            set = new Set();
            neighbours.set(a, set);
          }
          set.add(b);
        };
        for (let at: number = 0; at < surface.indices.length; at += 3)
          for (let corner: number = 0; corner < 3; corner++) {
            const a: number = groupOf[surface.indices[at + corner]];
            const b: number = groupOf[surface.indices[at + ((corner + 1) % 3)]];
            link(a, b);
            link(b, a);
          }
        const spread: Map<number, number[]> = new Map<number, number[]>();
        for (const vertex of pushes.keys())
          for (const other of neighbours.get(vertex) ?? []) {
            if (pushes.has(other)) continue;
            const total: number[] = spread.get(other) ?? [0, 0, 0, 0];
            const push: number[] = pushes.get(vertex)!;
            for (let axis: number = 0; axis < 3; axis++)
              total[axis] += push[axis];
            total[3]++;
            spread.set(other, total);
          }
        for (const [vertex, total] of spread) {
          const key: string = positions
            .slice(3 * vertex, 3 * vertex + 3)
            .join(",");
          const members: number[] = groups.get(key)!;
          const move: number[] | null = solveHumanFaceContactProjection(
            rowsOf.get(vertex)!,
            [0, 1, 2].map(
              (axis: number): number => (0.5 * total[axis]) / total[3],
            ),
            soft.budgetMetres,
            contact.toleranceMetres,
            rowsOf
              .get(vertex)!
              .map((row: IHumanFaceContactFloor): number =>
                Math.min(row.minimum, 0),
              ),
          );
          for (const member of members)
            for (let axis: number = 0; axis < 3; axis++)
              positions[3 * member + axis] += move?.[axis] ?? 0;
          // The smoothing is a preference. A neighbour that needed no correction
          // is valid where it stands, so a move its own floors, reach or budget
          // do not verify is not made, and no floor is lost by it.
          if (move !== null && fault(vertex) === null) continue;
          for (const member of members)
            for (let axis: number = 0; axis < 3; axis++)
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
    },
  );
  // No supplied pose buffer is changed until every soft surface has a witness.
  for (const [surface, positions] of staged) {
    const output: number[] = posed.get(surface)!;
    for (let at: number = 0; at < positions.length; at++)
      output[at] = positions[at];
  }
  return resolved;
}
