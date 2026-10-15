import { ceilingOf } from "../ceilingOf";
import { floorOf } from "../floorOf";
import { type StoreyId } from "../StoreyId";

/**
 * Height range of a full-height partition on a storey: finished floor to finished ceiling.
 */

export const partitionSpan = (storey: StoreyId): readonly [number, number] => [
  floorOf(storey),
  ceilingOf(storey),
];
