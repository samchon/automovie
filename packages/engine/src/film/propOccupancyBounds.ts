import { IAutoMoviePropBox, IAutoMoviePropSpec, IAutoMovieStageSetPiece } from "@automovie/interface";

/**
 * The world-axis-aligned volume one staged prop occupies.
 *
 * A declared `footprint` wins because it is the prop's own statement of what it
 * takes up; otherwise the bound is derived from the prop's own parts, which is
 * the only honest answer a prop that says nothing can be given. Either way all
 * eight corners travel through the piece's full TRS (translation, unit
 * quaternion, per-axis scale) before the world bound is taken, so a rotated
 * prop widens rather than being silently re-fitted to its local box.
 *
 * Those parts are the prop's geometry, not necessarily what a viewer draws. A
 * prop citing an external appearance (`IAutoMoviePropSpec.modelRef`) keeps its
 * parts as the deterministic proxy the builder registered, and that proxy is
 * what is measured here, because it is the only volume anybody stated: the
 * imported bytes are a file the engine never opens. So an author whose proxy is
 * cruder than the mesh it stands for declares a `footprint` for exactly the
 * reason a generated prop does, to state a use volume the geometry does not
 * show.
 *
 * A prop whose parts carry no vertices at all collapses to the staged origin
 * rather than to an empty bound, so a caller never has to special-case it.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance propOccupancyBounds transforms the prop body into the world volume used to test occupied circulation space.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propOccupancyBounds realizes furnishing placement clearance: The world-axis-aligned volume one staged prop occupies. A declared `footprint` wins because it is the prop's own statement of what it takes up; otherwise the bound is derived from the prop's own parts, which is the only honest answer a prop that says nothing can be given. Either way all eight corners travel through the piece's full TRS (translation, unit quaternion, per-axis scale) before the world bound is taken, so a rotated prop widens rather than being silently re-fitted to its local box. Those parts are the prop's geometry, not necessarily what a viewer draws. A prop citing an external appearance (`IAutoMoviePropSpec.modelRef`) keeps its parts as the deterministic proxy the builder registered, and that proxy is what is measured here, because it is the only volume anybody stated: the imported bytes are a file the engine never opens. So an author whose proxy is cruder than the mesh it stands for declares a `footprint` for exactly the reason a generated prop does, to state a use volume the geometry does not show. A prop whose parts carry no vertices at all collapses to the staged origin rather than to an empty bound, so a caller never has to special-case it.
 */
export const propOccupancyBounds = (props: {
  prop: IAutoMoviePropSpec;
  piece: IAutoMovieStageSetPiece;
}): IAutoMoviePropBox => {
  const matrix = stagedMatrix(props.piece);
  const footprint = props.prop.placement?.footprint ?? null;
  if (footprint !== null) return transformedBox(footprint, matrix);
  return transformedModelBounds(props.prop.model, matrix);
};
