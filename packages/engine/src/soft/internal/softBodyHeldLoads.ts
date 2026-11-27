import {
  type IAutoMovieSoftBodyHeldLoads,
  IAutoMovieVector3,
} from "@automovie/interface";

import { SOFT_BODY_NEIGHBOURS } from "../SOFT_BODY_NEIGHBOURS";
import { softBodyNeighbourOf } from "./softBodyNeighbourOf";

/*
 * The force each held particle (an anchor, of zero inverse mass) bears from the
 * compliant constraints that tie it to the rest of the lattice, at the end of a
 * step: the pull a hand holding a cord's end feels.
 *
 * In XPBD a constraint's force is its gradient times its multiplier over the
 * step squared (Macklin, Müller and Chentanez 2016, MIG 2016, equation 9's
 * relation f = grad C^T lambda / dt^2). For an edge from particle i to k with
 * unit direction n from k to i, the force on k is -lambda n / dt^2; a stretched
 * edge has a negative multiplier, so the force points from the held particle
 * into the body that hangs from it. The direction is read at the step's final
 * positions, where the last sweep left the edge.
 * Parameter props: The lattice, the step's positions, the inverse masses, the rest
 * lengths, the multipliers and the step.
 * Returns: The force on every held particle that a constraint pulls, newtons,
 * world frame, by particle.
 */
export function softBodyHeldLoads(
  props: IAutoMovieSoftBodyHeldLoads.IProps,
): ReadonlyMap<number, IAutoMovieVector3> {
  const { columns, rows, position, inverseMass }: typeof props = props;
  const slots: number = SOFT_BODY_NEIGHBOURS.length;
  const scale: number = 1 / (props.dt * props.dt);
  const out: Map<number, IAutoMovieVector3> = new Map();
  const add = (particle: number, x: number, y: number, z: number): void => {
    const was: IAutoMovieVector3 = out.get(particle) ?? { x: 0, y: 0, z: 0 };
    out.set(particle, { x: was.x + x, y: was.y + y, z: was.z + z });
  };
  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const particle: number = row * columns + column;
      for (let at: number = 0; at < slots; ++at) {
        if (props.restLength[particle * slots + at] < 0) continue;
        const other: number = softBodyNeighbourOf(
          columns,
          rows,
          column,
          row,
          at,
        );
        if (other < particle) continue;
        const heldI: boolean = inverseMass[particle] === 0;
        const heldK: boolean = inverseMass[other] === 0;
        if (heldI === heldK) continue;
        const dx: number = position[particle * 3] - position[other * 3];
        const dy: number = position[particle * 3 + 1] - position[other * 3 + 1];
        const dz: number = position[particle * 3 + 2] - position[other * 3 + 2];
        const length: number = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length === 0) continue;
        const f: number =
          (props.lambda[particle * slots + at] * scale) / length;

        // On i the force is +lambda n / dt^2, on k it is -lambda n / dt^2.
        if (heldI) add(particle, f * dx, f * dy, f * dz);
        else add(other, -f * dx, -f * dy, -f * dz);
      }
    }
  return out;
}
