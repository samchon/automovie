import {
  IAutoMovieClearanceBox,
  type IAutoMoviePropClearanceBounds,
} from "@automovie/interface";

import { transformedBoxBounds } from "../math/transformedBoxBounds";
import { setPieceMatrix } from "./staging/setPieceMatrix";

/**
 * The world-axis-aligned keep-out volumes one staged prop declares, one per
 * `placement.clearance` entry in declaration order, each keeping its id.
 *
 * Each model-local box goes through the piece's full staged transform, so a
 * rotated prop's keep-out widens rather than being re-fitted. Every declared
 * box is transformed, including one whose bounds the validator rejects:
 * filtering here would hide a malformed volume from a source-side search
 * instead of letting `validatePropPlacements` name it. A prop with no placement
 * or no clearance answers an empty list.
 *
 * @param props.prop The prop's registry entry.
 * @param props.piece The set piece that stages it.
 * @returns New world boxes in metres, one per declared clearance.
 */
export function propClearanceBounds(
  props: IAutoMoviePropClearanceBounds.IProps,
): IAutoMoviePropClearanceBounds[] {
  const matrix: number[] = setPieceMatrix(props.piece);
  return (props.prop.placement?.clearance ?? []).map(
    (clearance: IAutoMovieClearanceBox): IAutoMoviePropClearanceBounds => ({
      id: clearance.id,
      ...transformedBoxBounds(clearance, matrix),
    }),
  );
}
