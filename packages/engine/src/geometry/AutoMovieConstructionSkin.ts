import type {
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionState,
  IAutoMovieLoftChain,
  IAutoMovieSolidBody,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";

/**
 * A realized construction's skin: every face's open end that its chain closes
 * in a pole closed by a fan to the pole, and the body's mesh returned in the
 * tree's metres with its owners as face names. An end with neither a pole nor a
 * shared ring stays open.
 */
export namespace AutoMovieConstructionSkin {
  /**
   * Close the pole ends.
   *
   * @param body The drawn body; its mesh receives the fans.
   * @param state The walk's chains and their surfaces.
   * @param open Each face's open ends, as `AutoMovieSolidBody.draw` returns
   *   them.
   */
  export function close(
    body: IAutoMovieSolidBody.IBody,
    state: IAutoMovieConstructionState.IState,
    open: readonly (readonly IAutoMovieSolidMesh.IOpen[])[],
  ): void {
    const chainOf: Map<IAutoMovieSolidSurface, IAutoMovieLoftChain> = new Map(
      state.chainSurfaces.map(
        (
          s: IAutoMovieSolidSurface,
          i: number,
        ): [IAutoMovieSolidSurface, IAutoMovieLoftChain] => [
          s,
          state.chainList[i]!,
        ],
      ),
    );
    body.faces.forEach((f: IAutoMovieSolidBody.IFace, i: number): void => {
      const chain: IAutoMovieLoftChain | undefined = chainOf.get(f.surface);
      if (chain === undefined) return;
      const first: number = chain.layers[0]!.y;
      const last: number = chain.layers[chain.layers.length - 1]!.y;
      for (const boundary of open[i] ?? []) {
        const cycle: number[] = boundary.vertices;
        const end: "bottom" | "top" | null = boundary.end;
        if (cycle.length === 0 || end === null) continue;
        const pole: IAutoMovieLoftChain["pole"] =
          chain.pole?.end === end
            ? chain.pole
            : chain.opposite?.end === end
              ? chain.opposite
              : undefined;
        if (pole === undefined) continue;
        const station: number =
          pole.source?.station ?? (end === "bottom" ? first : last);
        const point: [number, number, number] =
          pole.source === undefined
            ? pole.point
            : ownedPoint(f.surface, station);
        const owner: number = AutoMovieSolidMesh.owner(body.mesh, f.surface);
        const apex: number = AutoMovieSolidMesh.vertex(
          body.mesh,
          point,
          owner,
          station,
          0,
        );
        const fan: [number, number, number][] = cycle.map(
          (v: number, k: number): [number, number, number] => [
            v,
            cycle[(k + 1) % cycle.length]!,
            apex,
          ],
        );
        AutoMovieSolidMesh.close(
          body.mesh,
          fan,
          f.surface,
          f.inverted === true,
        );
      }
    });
  }

  /**
   * The body's mesh in metres.
   *
   * @param body The drawn body.
   * @returns The skin: positions in metres, coordinates in the faces' charts,
   *   owners as face names.
   */
  export function mesh(
    body: IAutoMovieSolidBody.IBody,
  ): IAutoMovieConstructionRealization.IMesh {
    const vertices: number = body.mesh.positions.length / 3;
    return {
      positions: body.mesh.positions.map(
        (x: number): number => x / AutoMovieConstructionViews.SCALE,
      ),
      indices: body.mesh.indices.slice(),
      coordinates: body.mesh.coordinates.slice(0, 3 * vertices),
      owners: body.mesh.owners.map(
        (o: IAutoMovieSolidMesh.IOwner): string => o.name,
      ),
    };
  }
}

/*
 * An owned original tip must replay through its value owner, without inventing
 * a physical jet.
 */
function ownedPoint(
  surface: IAutoMovieSolidSurface,
  station: number,
): [number, number, number] {
  if (surface.point === undefined)
    throw new Error(
      "An owned original cap requires its surface Point0 reader.",
    );
  return surface.point(station, 0);
}
