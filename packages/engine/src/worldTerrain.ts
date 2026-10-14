import { IAutoMovieWorldSurface } from "@automovie/interface";
/**
 * Construct a flat world surface from an authored XZ footprint and height.
 *
 * @evidence contracts/common.md#principled-implementation A copied polygon and existing constant height rule preserve supplied coordinates and scalar height by value; geometry, id and finite-height admission belong to downstream world validation.
 * @evidence contracts/common.md#clear-and-simple-design The compact constructor assembles the existing surface representation without introducing a terrain mesh or separate height method.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No invalid height or ring is clamped, filled or silently defaulted, and structuredClone failures propagate; current helper calls have test-only reach.
 * @evidence contracts/common.md#meaningful-documentation Documents copied footprint ownership, constant metre height, walkable flag preservation and the absence of admission here.
 * @evidence contracts/performance.md#efficient-algorithms Cloning E footprint points takes O(E) work/storage; the constant rule adds fixed data independent of covered area.
 * @evidence contracts/performance.md#reuse-equivalent-work The copied ring can be reused by downstream queries of this design, while each construction copies current input rather than caching mutable source identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the copied footprint and fresh rule; no source callback, geometry buffer, renderer or watcher is acquired.
 * @author Samchon
 */
export const worldTerrain: (input: { id: string; polygon: { x: number; z: number; }[]; height: number; walkable: boolean; }) => IAutoMovieWorldSurface = (input: {
  id: string;
  polygon: IAutoMovieWorldSurface["polygon"];
  height: number;
  walkable: boolean;
}): IAutoMovieWorldSurface => ({
  id: input.id,
  polygon: structuredClone(input.polygon),
  height: { kind: "constant", value: input.height },
  walkable: input.walkable,
});
