import type { AutoMovieConstructionRealization } from "./AutoMovieConstructionRealization";
import type { AutoMovieConstructionState } from "./AutoMovieConstructionState";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * A realized construction's skin: every face's open end that its chain closes in a pole closed by a fan to the pole, and the body's mesh returned in the tree's metres with its owners as face names. An end with neither a pole nor a shared ring stays open.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which ends close, which stay open and the returned mesh's units and owners.
 * @evidence contracts/development/design.md#principled-representation Represents A realized construction's skin: every face's open end that its chain closes in a pole closed by a fan to the pole, and the body's mesh returned in the tree's metres with its owners as face names: companion namespace of 2 members (`close`, `mesh`); units and frames named in its text: second, local, metres, world, metre. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieConstructionSkin` in packages/engine/src/geometry/construction/AutoMovieConstructionSkin.ts; its surface is the 2 members listed and the text shows 4 other files naming it, mostly packages/engine (2), packages/human (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieConstructionSkin {
  /**
   * Close the pole ends.
   *
   * @param body The drawn body; its mesh receives the fans.
   * @param state The walk's chains and their surfaces.
   * @param open Each face's open ends, as `AutoMovieSolidBody.draw` returns them.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Maps original chain surfaces by identity and consumes draw's complete endpoint record. An owned original tip is evaluated and recorded at its actual source station, separately from physical2; old datum-only poles retain their existing fan behavior.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cap selection stays at the chain/body boundary while SolidMesh owns vertex insertion and orientation-aware triangle emission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Skips non-chain faces, generic planar rims with end null and ends without a pole. Does not infer this face's station from a foreign owner's coordinates or cap a partial periodic endpoint rejected by draw.
   * @evidence contracts/development/common.md#meaningful-documentation States body mutation, open-cycle provenance and pole-only closure. Owned tips require surface Point0 and use its chart station; datum-only legacy fans do not acquire a new source replay claim.
   * @evidence contracts/development/implementation.md#efficient-algorithms Chain-map construction and boundary-fan work are linear in their inputs; each mapped face additionally scans up to R existing mesh owners, so F such faces can pay O(FR) lookup work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One surface-to-chain map serves all faces; existing ring vertices are reused by fans rather than copied as a second boundary.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local map and fan arrays die after the call; the body retains emitted apex vertices/triangles and any newly registered surface owner for its own lifetime.
   */
  export function close(
    body: AutoMovieSolidBody.IBody,
    state: AutoMovieConstructionState.IState,
    open: readonly (readonly AutoMovieSolidMesh.IOpen[])[],
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
    body.faces.forEach((f: AutoMovieSolidBody.IFace, i: number): void => {
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
   * @returns The skin: positions in metres, coordinates in the faces' charts, owners as face names.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Divides world positions by the shared mm-per-metre scale and copies indices/chart coordinates while projecting owner records to their names.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One output adapter owns physical unit conversion without changing chart units or rebuilding triangles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the emitted topology/winding and clips coordinate copying to the position-derived vertex count; it does not repair geometry or certify a closed skin.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes metre positions from unchanged owner-chart coordinates and names the returned owner labels.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear O(V+T+F) copying for V vertices, T triangles and F owners allocates the required detached output arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the already drawn body arrays once rather than retessellating; owner closures are replaced by names because this output requires labels only.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns fresh position/index/coordinate/name arrays sized by this mesh; the adapter retains neither body nor surface closures globally.
   */
  export function mesh(
    body: AutoMovieSolidBody.IBody,
  ): AutoMovieConstructionRealization.IMesh {
    const vertices: number = body.mesh.positions.length / 3;
    return {
      positions: body.mesh.positions.map(
        (x: number): number => x / AutoMovieConstructionViews.SCALE,
      ),
      indices: body.mesh.indices.slice(),
      coordinates: body.mesh.coordinates.slice(0, 3 * vertices),
      owners: body.mesh.owners.map(
        (o: AutoMovieSolidMesh.IOwner): string => o.name,
      ),
    };
  }
}

/** An owned original tip must replay through its value owner, without inventing a physical jet. */
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
