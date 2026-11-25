import type {
  IAutoMovieConstructionProfileBody,
  IAutoMovieConstructionProfileGrid,
  IAutoMoviePreparedConstructionProfile,
  IAutoMovieSolidBody,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionProfileGrid } from "./AutoMovieConstructionProfileGrid";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";

/**
 * Publish original profile charts and authoritative common boundaries to a
 * body.
 *
 * All queried regular grid points require their actual physical2. Shared piece
 * endpoints were checked on the same source grid, then receive one index owned
 * by the identical original function on its supported neighborhood. Source
 * atlas constraints remain analytic; mesh boundary loops only constrain the
 * finite tessellation. Explicit collapsed tips are separate from regular rows.
 */
export namespace AutoMovieConstructionProfileBody {
  /**
   * Append prepared original faces; the realizing leaf owns rollback on any
   * failure.
   */
  export function append(
    body: IAutoMovieSolidBody.IBody,
    prepared: IAutoMoviePreparedConstructionProfile.IPrepared,
    tolerance: number,
  ): IAutoMovieConstructionProfileBody.IEnd[] {
    const grids: IAutoMovieConstructionProfileGrid.IGrid[] =
      AutoMovieConstructionProfileGrid.create(prepared, tolerance);
    const offset: number = body.faces.length;
    const result: IAutoMovieConstructionProfileBody.IEnd[] = [];
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

      /**
       * Boundary equality was checked against both source endpoints before one
       * authority is assigned.
       */
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
        const loops: IAutoMovieSolidMesh.ILoop[] = [];
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
        const checks: IAutoMovieConstructionProfileBody.IEnd["checks"] = [];
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
