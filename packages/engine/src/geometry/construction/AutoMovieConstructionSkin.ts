import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import type { AutoMovieConstructionRealization } from "./AutoMovieConstructionRealization";
import type { AutoMovieConstructionState } from "./AutoMovieConstructionState";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A realized construction's skin: every face's open end that its chain closes in a pole closed by a fan to the pole, and the body's mesh returned in the tree's metres with its owners as face names. An end with neither a pole nor a shared ring stays open.
 *
 * @evidence contracts/common.md#principled-implementation A pole end is closed by the fan to the chain's own pole point, the cap the dome's construction converges to, and the mesh is scaled to metres once at the boundary where the kernel's millimetres leave it.
 * @evidence contracts/common.md#clear-and-simple-design Two functions: close the pole ends, then return the mesh in the tree's unit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An open end with neither a pole nor a shared ring stays open rather than being capped by a made fan.
 * @evidence contracts/common.md#meaningful-documentation States which ends close, which stay open and the returned mesh's units and owners.
 * @evidence contracts/performance.md#efficient-algorithms One pass over each face's open cycles and one linear copy of the mesh arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Chains are found by their surface through one map built per call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned arrays are the realization's own; the face map is released with the call.
 */
export namespace AutoMovieConstructionSkin {
  /**
   * Close the pole ends.
   *
   * @param body The drawn body; its mesh receives the fans.
   * @param state The walk's chains and their surfaces.
   * @param open Each face's open ends, as `AutoMovieSolidBody.draw` returns them.
   */
  export function close(body: AutoMovieSolidBody.IBody, state: AutoMovieConstructionState.IState, open: readonly number[][][]): void {
    const chainOf: Map<IAutoMovieSolidSurface, IAutoMovieLoftChain> = new Map(
      state.chainSurfaces.map((s: IAutoMovieSolidSurface, i: number): [IAutoMovieSolidSurface, IAutoMovieLoftChain] => [s, state.chainList[i]!]),
    );
    body.faces.forEach((f: AutoMovieSolidBody.IFace, i: number): void => {
      const chain: IAutoMovieLoftChain | undefined = chainOf.get(f.surface);
      if (chain === undefined) return;
      const first: number = chain.layers[0]!.y;
      const last: number = chain.layers[chain.layers.length - 1]!.y;
      const owner: number = AutoMovieSolidMesh.owner(body.mesh, f.surface);
      for (const cycle of open[i] ?? []) {
        if (cycle.length === 0) continue;
        const station: number = body.mesh.coordinates[3 * cycle[0]! + 1]!;
        const end: "bottom" | "top" = Math.abs(station - first) <= Math.abs(station - last) ? "bottom" : "top";
        const pole: IAutoMovieLoftChain["pole"] = chain.pole?.end === end ? chain.pole : chain.opposite?.end === end ? chain.opposite : undefined;
        if (pole === undefined) continue;
        const apex: number = AutoMovieSolidMesh.vertex(body.mesh, pole.point, owner, end === "bottom" ? first : last, 0);
        const fan: [number, number, number][] = cycle.map((v: number, k: number): [number, number, number] => [v, cycle[(k + 1) % cycle.length]!, apex]);
        AutoMovieSolidMesh.close(body.mesh, fan, f.surface, f.inverted === true);
      }
    });
  }

  /**
   * The body's mesh in metres.
   *
   * @param body The drawn body.
   * @returns The skin: positions in metres, coordinates in the faces' charts, owners as face names.
   */
  export function mesh(body: AutoMovieSolidBody.IBody): AutoMovieConstructionRealization.IMesh {
    const vertices: number = body.mesh.positions.length / 3;
    return {
      positions: body.mesh.positions.map((x: number): number => x / AutoMovieConstructionViews.SCALE),
      indices: body.mesh.indices.slice(),
      coordinates: body.mesh.coordinates.slice(0, 3 * vertices),
      owners: body.mesh.owners.map((o: AutoMovieSolidMesh.IOwner): string => o.name),
    };
  }
}
