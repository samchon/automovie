import * as THREE from "three";

import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake.js";

/**
 * Read and linearly mix two neighboring canonical baked samples into a CPU rest-to-posed matrix, closing the last sample back into the first. Valid finite position, positive sample count and complete selected take are producer premises. JavaScript arithmetic over Float32 table data follows the shader law without claiming bit-identical native GLSL or observed appearance.
 *
 * @evidence contracts/common.md#principled-implementation Checks the requested part index, wraps a finite cycle position modulo1 and linearly mixes adjacent canonical Float32 table entries with last-to-first closure into a Matrix4.
 * @evidence contracts/common.md#clear-and-simple-design One readable CPU projection of the baked cycle law stays distinct from shader patching, take loading and actor/instance ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Valid positive sample count, complete take table and finite position remain actual producer premises; JavaScript arithmetic is not bit-identical device GLSL or appearance proof and no fallback repairs malformed table data.
 * @evidence contracts/common.md#meaningful-documentation Documents normalized cycle wrap, selected take, rest-to-posed matrix and CPU-versus-native precision/validity boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Twelve affine components each read two samples and one fixed Matrix4 is created, constant work independent of full table length or formation population.
 * @evidence contracts/performance.md#reuse-equivalent-work Every request uses the current take/position with its canonical table; this helper does not reuse a stale matrix after take selection or cycle advancement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one returned matrix owns copied numbers, while cycle/take tables stay borrowed and no take texture, geometry or native resource is acquired.
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
  if (
    Number.isSafeInteger(part) === false ||
    part < 0 ||
    part >= cycle.names.length
  )
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
