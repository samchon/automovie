import type { IAutoMovieSolveSoftBodyCompliantSweep } from "@automovie/interface";

import { SOFT_BODY_NEIGHBOURS } from "../SOFT_BODY_NEIGHBOURS";
import { softBodyNeighbourOf } from "./softBodyNeighbourOf";

/*
 * Run one sweep of compliant distance constraints over a lattice, in place:
 * every edge of the lattice, its row and column neighbours, its diagonals and
 * its second neighbours, projected one after another with its Lagrange
 * multiplier, the extended position-based dynamics of Macklin, Müller and
 * Chentanez 2016 ("XPBD: position-based simulation of compliant constrained
 * dynamics", MIG 2016, pp. 49-54, equations 18 and 17).
 *
 * For an edge between particles i and k with rest length l, the constraint is C
 * = |x_i - x_k| - l, its gradient the unit direction n from k to i, and the
 * time-scaled compliance alpha~ = alpha / dt^2 with alpha the family's
 * compliance in metres per newton. The multiplier's increment is dlambda = (-C
 *
 * - Alpha~ lambda) / (w_i + w_k + alpha~), and the particles move by w_i dlambda
 *   n and -w_k dlambda n, w the inverse masses. Unlike the relaxation weight of
 *   the plain position-based solver, compliance represents a physical
 *   constitutive parameter with explicit step scaling (the paper's section 4).
 *   Finite Gauss-Seidel iteration leaves residual error: four and sixteen
 *   sweeps need not produce identical stretch or bend. Zero compliance requests
 *   an inextensible edge but does not certify convergence. On a cord, a
 *   one-wide lattice, the second neighbours are its bending constraint in
 *   distance form: the distance between the ends of two consecutive segments,
 *   which is regular at a straight rest where the angle between the segments is
 *   not differentiable.
 *
 * Edges are visited in a fixed order (row-major particles, each with the
 * neighbours that follow it in `SOFT_BODY_NEIGHBOURS`), so a solve is
 * deterministic. `lambda` holds one multiplier per particle and neighbour slot
 * and is reset by the caller at the start of each step.
 * Parameter props: The lattice, the working buffers and the step.
 */
export function solveSoftBodyCompliantSweep(
  props: IAutoMovieSolveSoftBodyCompliantSweep.IProps,
): void {
  const { columns, rows, predicted, inverseMass, lambda }: typeof props = props;
  const slots: number = SOFT_BODY_NEIGHBOURS.length;
  const scale: number = 1 / (props.dt * props.dt);
  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const particle: number = row * columns + column;
      for (let at: number = 0; at < slots; ++at) {
        const rest: number = props.restLength[particle * slots + at];
        if (rest < 0) continue;
        const other: number = softBodyNeighbourOf(
          columns,
          rows,
          column,
          row,
          at,
        );

        // Each edge once: from the particle with the lower index.
        if (other < particle) continue;
        const wi: number = inverseMass[particle];
        const wk: number = inverseMass[other];
        const tilde: number =
          props.compliance[SOFT_BODY_NEIGHBOURS[at][2]] * scale;
        if (wi + wk + tilde === 0) continue;
        const dx: number = predicted[particle * 3] - predicted[other * 3];
        const dy: number =
          predicted[particle * 3 + 1] - predicted[other * 3 + 1];
        const dz: number =
          predicted[particle * 3 + 2] - predicted[other * 3 + 2];
        const length: number = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length === 0) continue;
        const slot: number = particle * slots + at;
        const delta: number =
          (-(length - rest) - tilde * lambda[slot]) / (wi + wk + tilde);
        lambda[slot] += delta;
        const nx: number = dx / length;
        const ny: number = dy / length;
        const nz: number = dz / length;
        predicted[particle * 3] += wi * delta * nx;
        predicted[particle * 3 + 1] += wi * delta * ny;
        predicted[particle * 3 + 2] += wi * delta * nz;
        predicted[other * 3] -= wk * delta * nx;
        predicted[other * 3 + 1] -= wk * delta * ny;
        predicted[other * 3 + 2] -= wk * delta * nz;
      }
    }
}
