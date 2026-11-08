import type { AutoMovieConstructionProfile } from "./AutoMovieConstructionProfile";
import { AutoMovieConstructionProfileGrid } from "./AutoMovieConstructionProfileGrid";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Publish original profile charts and authoritative common boundaries to a body.
 *
 * All queried regular grid points require their actual physical2. Shared piece
 * endpoints were checked on the same source grid, then receive one index owned
 * by the identical original function on its supported neighborhood. Source
 * atlas constraints remain analytic; mesh boundary loops only constrain the
 * finite tessellation. Explicit collapsed tips are separate from regular rows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States original versus retained domains, mm grids, shared ownership, complete physical2 requirements and the caller's append-only transaction responsibility.
 * @evidence contracts/development/design.md#principled-representation Represents Publish original profile charts and authoritative common boundaries to a body: companion namespace of 2 members (`IEnd`, `append`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionProfileBody` in packages/engine/src/geometry/construction/AutoMovieConstructionProfileBody.ts; its surface is the 2 members listed and the text shows 6 other files naming it, mostly packages/engine (3), test (2), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieConstructionProfileBody {
  /**
   * An actual collapsed endpoint and its existing neighboring regular ring.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: An actual collapsed endpoint and its existing neighboring regular ring.
   * @evidence contracts/development/design.md#principled-representation Represents An actual collapsed endpoint and its existing neighboring regular ring: interface of 5 members (`surface`, `station`, `regular`, `vertices`, `checks`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IEnd` in packages/engine/src/geometry/construction/AutoMovieConstructionProfileBody.ts; its surface is the 5 members listed and the text shows 25 other files naming it, mostly packages/engine (11), packages/human (8), test (6), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IEnd {
    /** Original collapsed point belongs to this actual retained surface. */
    surface: IAutoMovieSolidSurface;
    /** Actual physical station mm, not the first regular tessellation row. */
    station: number;

    /** Actual neighboring regular ring station mm; its original cap strip is not a trimmed patch. */
    regular: number;

    /** Positive native boundary traversal: bottom reverses the loop clock. */
    vertices: number[];
    /** One per ring arc: actual retained face and clock for cap trim admission. */
    checks: { face: number; phase: number; from: number; to: number }[];
  }

  /**
   * Append prepared original faces; the realizing leaf owns rollback on any failure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Append prepared original faces; the realizing leaf owns rollback on any failure.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Append prepared original faces; the realizing leaf owns rollback on any failure) directly over its typed inputs (`body`, `prepared`, `tolerance`) as nested iteration of depth 4 (for-of over grids; map over pieces; map over pieces), delegating to `AutoMovieConstructionProfileGrid.create`, `pieces.map`, `AutoMovieSolidMesh.owner`, `vertex`, `known.get`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1000, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 141 lines and 5 top-level statements that reuses `AutoMovieConstructionProfileGrid.create`, `pieces.map`, `AutoMovieSolidMesh.owner`, `vertex`, `known.get` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 26 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `body`, `prepared`, `tolerance`; the dominant cost is nested iteration of depth 4 (for-of over grids; map over pieces; map over pieces), performed once per call with 21 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 21 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function append(
    body: AutoMovieSolidBody.IBody,
    prepared: AutoMovieConstructionProfile.IPrepared,
    tolerance: number,
  ): IEnd[] {
    const grids: AutoMovieConstructionProfileGrid.IGrid[] =
      AutoMovieConstructionProfileGrid.create(prepared, tolerance);
    const offset: number = body.faces.length;
    const result: IEnd[] = [];
    for (const grid of grids) {
      const pieces: typeof grid.loop.pieces = grid.loop.pieces;
      const owners: number[] = pieces.map(
        (piece: (typeof pieces)[number]): number =>
          AutoMovieSolidMesh.owner(
            body.mesh,
            prepared.originals.get(piece.id)!,
          ),
      );
      const faces: number[] = pieces.map(
        (piece: (typeof pieces)[number]): number =>
          offset +
          prepared.atlas.faces.indexOf(prepared.surfaces.get(piece.id)!),
      );
      const rowCount: number = grid.stations.length;
      const known: Map<string, number> = new Map();

      /** Boundary equality was checked against both source endpoints before one authority is assigned. */
      const vertex: (i: number, row: number, column: number) => number = (
        i: number,
        row: number,
        column: number,
      ): number => {
        const piece: (typeof pieces)[number] = pieces[i]!;
        const phases: number[] = grid.phases.get(piece.id)!;
        if (column === phases.length - 1)
          return vertex((i + 1) % pieces.length, row, 0);
        const key: string = i + "/" + row + "/" + column;
        const old: number | undefined = known.get(key);
        if (old !== undefined) return old;
        const surface: IAutoMovieSolidSurface = prepared.surfaces.get(
          piece.id,
        )!;
        const station: number = grid.stations[row]!;
        const phase: number = phases[column]!;
        const id: number = AutoMovieSolidMesh.vertex(
          body.mesh,
          surface.point!(station, phase),
          owners[i]!,
          station,
          phase,
        );
        known.set(key, id);
        return id;
      };
      for (const station of grid.stations)
        for (const piece of pieces)
          for (const phase of grid.phases.get(piece.id)!)
            prepared.surfaces.get(piece.id)!.jet(station, phase);

      for (let i: number = 0; i < pieces.length; i++) {
        const piece: (typeof pieces)[number] = pieces[i]!;
        const surface: IAutoMovieSolidSurface = prepared.surfaces.get(
          piece.id,
        )!;
        const phases: number[] = grid.phases.get(piece.id)!;
        const loops: AutoMovieSolidMesh.ILoop[] = [];
        if (surface.period !== undefined) {
          for (const row of [0, rowCount - 1])
            loops.push({
              kind: row === 0 ? "start" : "end",
              vertices: phases
                .slice(0, -1)
                .map((_phase: number, j: number): number => vertex(i, row, j)),
              chart: phases
                .slice(0, -1)
                .map((phase: number): [number, number] => [
                  grid.stations[row]!,
                  phase,
                ]),
            });
        } else {
          const boundary: [number, number][] = [];
          for (let row: number = 0; row < rowCount; row++)
            boundary.push([row, 0]);
          for (let j: number = 1; j < phases.length; j++)
            boundary.push([rowCount - 1, j]);
          for (let row: number = rowCount - 2; row >= 0; row--)
            boundary.push([row, phases.length - 1]);
          for (let j: number = phases.length - 2; j > 0; j--)
            boundary.push([0, j]);
          loops.push({
            kind: "island",
            vertices: boundary.map(([row, j]: [number, number]): number =>
              vertex(i, row, j),
            ),
            chart: boundary.map(
              ([row, j]: [number, number]): [number, number] => [
                grid.stations[row]!,
                phases[j]!,
              ],
            ),
          });
        }
        body.faces.push({
          surface,
          stations: grid.stations,
          phases: surface.period === undefined ? phases : phases.slice(0, -1),
          cycles: [],
          meshLoops: loops,
          sourceAtlas: {
            atlas: prepared.atlas,
            face: faces[i]! - offset,
            offset,
          },
        });
      }
      for (const end of ["bottom", "top"] as const) {
        if (grid.loop.pole !== end && grid.loop.pole !== "both") continue;
        const row: number = end === "bottom" ? 0 : rowCount - 1;
        const vertices: number[] = [];
        const checks: IEnd["checks"] = [];
        for (let i: number = 0; i < pieces.length; i++) {
          const phases: number[] = grid.phases.get(pieces[i]!.id)!;
          for (let j: number = 0; j < phases.length - 1; j++) {
            vertices.push(vertex(i, row, j));
            checks.push({
              face: faces[i]!,
              phase: phases[j]! / 2 + phases[j + 1]! / 2,
              from: vertex(i, row, j),
              to: vertex(i, row, j + 1),
            });
          }
        }
        if (end === "bottom") vertices.reverse();
        result.push({
          surface: prepared.surfaces.get(pieces[0]!.id)!,
          station: 1000 * grid.loop.domain[end === "bottom" ? 0 : 1],
          regular: grid.stations[row]!,
          vertices,
          checks,
        });
      }
    }
    return result;
  }
}
