import * as THREE from "three";

import type { IAutoMovieFormationCycle } from "../IAutoMovieFormationCycle.js";
import type { IAutoMovieFormationCycleTake } from "../IAutoMovieFormationCycleTake.js";

/**
 * Read and linearly mix two neighboring canonical baked samples into a CPU
 * rest-to-posed matrix, closing the last sample back into the first. Valid
 * finite position, positive sample count and complete selected take are
 * producer premises. JavaScript arithmetic over Float32 table data follows the
 * shader law without claiming bit-identical native GLSL or observed
 * appearance.
 */
export const sampleFormationCycleMatrix: (
  cycle: IAutoMovieFormationCycle,
  part: number,
  position: number,
  take?: IAutoMovieFormationCycleTake,
) => THREE.Matrix4 = (
  cycle: IAutoMovieFormationCycle,
  part: number,
  position: number,
  take: IAutoMovieFormationCycleTake = cycle.active,
): THREE.Matrix4 => {
  if (part < 0 || part >= cycle.names.length)
    throw new RangeError(
      `Formation cycle part ${part} is outside 0..${cycle.names.length - 1}.`,
    );
  const wrapped: number = position - Math.floor(position);
  const scaled: number = wrapped * cycle.samples;
  const first: number = Math.floor(scaled);
  const blend: number = scaled - first;
  const second: number = (first + 1) % cycle.samples;
  const read: (sample: number, row: number, column: number) => number = (
    sample: number,
    row: number,
    column: number,
  ): number =>
    take.matrices[((part * 3 + row) * cycle.samples + sample) * 4 + column]!;
  const mix: (row: number, column: number) => number = (
    row: number,
    column: number,
  ): number =>
    read(first, row, column) * (1 - blend) + read(second, row, column) * blend;
  return new THREE.Matrix4().set(
    mix(0, 0),
    mix(0, 1),
    mix(0, 2),
    mix(0, 3),
    mix(1, 0),
    mix(1, 1),
    mix(1, 2),
    mix(1, 3),
    mix(2, 0),
    mix(2, 1),
    mix(2, 2),
    mix(2, 3),
    0,
    0,
    0,
    1,
  );
};
