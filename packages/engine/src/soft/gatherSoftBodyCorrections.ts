import type { IAutoMovieGatherSoftBodyCorrections } from "@automovie/interface";

import { SOFT_BODY_NEIGHBOURS } from "./SOFT_BODY_NEIGHBOURS";
import { softBodyNeighbourOf } from "./softBodyNeighbourOf";

/**
 * Write one simultaneous Jacobi distance-constraint correction for every
 * particle.
 */
export const gatherSoftBodyCorrections: (
  props: IAutoMovieGatherSoftBodyCorrections.IProps,
) => void = (props: IAutoMovieGatherSoftBodyCorrections.IProps): void => {
  const { columns, rows, predicted, correction, inverseMass }: typeof props =
    props;
  // Six mirror-partner slots of three components each, in the order the family
  // fold below adds them: structural along the lattice's two axes, the lower
  // and upper diagonal pairs, and bending along the two axes.
  const fold: Float64Array<ArrayBuffer> = new Float64Array(18);
  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const particle: number = row * columns + column;
      const base: number = particle * 3;
      if (inverseMass[particle] === 0 || props.valence[particle] === 0) {
        correction[base] = 0;
        correction[base + 1] = 0;
        correction[base + 2] = 0;
        continue;
      }
      fold.fill(0);
      for (let at: number = 0; at < SOFT_BODY_NEIGHBOURS.length; ++at) {
        const rest: number =
          props.restLength[particle * SOFT_BODY_NEIGHBOURS.length + at];
        if (rest < 0) continue;
        const other: number = softBodyNeighbourOf(
          columns,
          rows,
          column,
          row,
          at,
        );
        const dx: number = predicted[other * 3] - predicted[base];
        const dy: number = predicted[other * 3 + 1] - predicted[base + 1];
        const dz: number = predicted[other * 3 + 2] - predicted[base + 2];
        const length: number = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length === 0) continue;
        const share: number =
          inverseMass[particle] / (inverseMass[particle] + inverseMass[other]);
        const factor: number =
          (props.stiffness[SOFT_BODY_NEIGHBOURS[at][2]] *
            share *
            (length - rest)) /
          length;
        const slot: number = 3 * foldSlot(SOFT_BODY_NEIGHBOURS[at]);
        fold[slot] += factor * dx;
        fold[slot + 1] += factor * dy;
        fold[slot + 2] += factor * dz;
      }
      const inverse: number = 1 / props.valence[particle];
      for (let axis: number = 0; axis < 3; ++axis)
        correction[base + axis] =
          (fold[axis] +
            fold[3 + axis] +
            (fold[6 + axis] + fold[9 + axis]) +
            (fold[12 + axis] + fold[15 + axis])) *
          inverse;
    }
};

/** Choose the fixed mirror-pair accumulator slot for one canonical offset. */
const foldSlot: (
  neighbour: readonly [column: number, row: number, family: 0 | 2 | 1],
) => number = (
  neighbour: readonly [column: number, row: number, family: 0 | 1 | 2],
): number => {
  if (neighbour[2] === 1) return neighbour[1] < 0 ? 2 : 3;
  const axis: number = neighbour[0] === 0 ? 1 : 0;
  return neighbour[2] === 0 ? axis : 4 + axis;
};
