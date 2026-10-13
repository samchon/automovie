import { SOFT_BODY_NEIGHBOURS } from "./SOFT_BODY_NEIGHBOURS";
import { softBodyNeighbourOf } from "./softBodyNeighbourOf";
/** Write one simultaneous Jacobi distance-constraint correction for every particle.
 *
 * @evidence contracts/common.md#principled-implementation Every correction reads the same predicted buffer, then groups the canonical twelve offsets into six mirror-pair sums and a fixed family fold. Prepared rest lengths, inverse masses, valences and stiffness are premises; finite rounding and collapsed current edges retain their original handling.
 * @evidence contracts/common.md#clear-and-simple-design The shared sweep owner serves static and moving-boundary integration while the caller applies the completed correction buffer afterward.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Anchored or isolated particles receive zero correction and zero-length current edges are skipped explicitly; no sequential update, fixture correction or claimed global contraction substitutes for the Jacobi scheme.
 * @evidence contracts/common.md#meaningful-documentation States simultaneous reads, ordered mirror folding and the caller's prepared-buffer responsibility.
 * @evidence contracts/performance.md#efficient-algorithms For P particles and a fixed twelve-neighbour stencil, each sweep costs O(P) with one constant eighteen-scalar fold buffer; caller-owned correction storage is O(P).
 * @evidence contracts/performance.md#reuse-equivalent-work The eighteen-slot fold buffer is reused for every particle, while prepared topology/rest lengths are supplied once by the solve; no prior sweep's corrections are reused after positions change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Predicted and preparation arrays are read only, correction is overwritten, and the fold buffer is released when the sweep returns.
 */
export const gatherSoftBodyCorrections: (props: { columns: number; rows: number; predicted: Float64Array<ArrayBufferLike>; correction: Float64Array<ArrayBufferLike>; inverseMass: Float64Array<ArrayBufferLike>; valence: Int32Array<ArrayBufferLike>; restLength: Float64Array<ArrayBufferLike>; stiffness: number[]; }) => void = (props: {
  columns: number;
  rows: number;
  predicted: Float64Array;
  correction: Float64Array;
  inverseMass: Float64Array;
  valence: Int32Array;
  restLength: Float64Array;
  stiffness: number[];
}): void => {
  const { columns, rows, predicted, correction, inverseMass }: typeof props = props;
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
        const rest: number = props.restLength[particle * SOFT_BODY_NEIGHBOURS.length + at];
        if (rest < 0) continue;
        const other: number = softBodyNeighbourOf(columns, rows, column, row, at);
        const dx: number = predicted[other * 3] - predicted[base];
        const dy: number = predicted[other * 3 + 1] - predicted[base + 1];
        const dz: number = predicted[other * 3 + 2] - predicted[base + 2];
        const length: number = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length === 0) continue;
        const share: number =
          inverseMass[particle] / (inverseMass[particle] + inverseMass[other]);
        const factor: number =
          (props.stiffness[SOFT_BODY_NEIGHBOURS[at][2]] * share * (length - rest)) /
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
const foldSlot: (neighbour: readonly [column: number, row: number, family: 0 | 2 | 1]) => number = (
  neighbour: readonly [column: number, row: number, family: 0 | 1 | 2],
): number => {
  if (neighbour[2] === 1) return neighbour[1] < 0 ? 2 : 3;
  const axis: number = neighbour[0] === 0 ? 1 : 0;
  return neighbour[2] === 0 ? axis : 4 + axis;
};
