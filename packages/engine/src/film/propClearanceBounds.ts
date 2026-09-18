import { IAutoMoviePropSpec, IAutoMovieStageSetPiece } from "@automovie/interface";
import { IAutoMoviePropClearanceBounds } from "./IAutoMoviePropClearanceBounds";

/**
 * The world-axis-aligned keep-out volumes one staged prop declares.
 *
 * Every declared box is transformed, including one whose bounds the validator
 * rejects: filtering here would hide a malformed volume from a source-side
 * search instead of letting the validator name it.
 *
 * @evidence requirements/interior/furniture-fixtures-and-equipment.md#interior-object-use-clearance propClearanceBounds transforms each declared use envelope into a world keep-out volume for placement validation.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-furniture-fixture-equipment-placement propClearanceBounds realizes furnishing placement clearance: The world-axis-aligned keep-out volumes one staged prop declares. Every declared box is transformed, including one whose bounds the validator rejects: filtering here would hide a malformed volume from a source-side search instead of letting the validator name it.
 */
export const propClearanceBounds = (props: {
  prop: IAutoMoviePropSpec;
  piece: IAutoMovieStageSetPiece;
}): IAutoMoviePropClearanceBounds[] => {
  const matrix = stagedMatrix(props.piece);
  return (props.prop.placement?.clearance ?? []).map((clearance) => ({
    id: clearance.id,
    ...transformedBox(clearance, matrix),
  }));
};
