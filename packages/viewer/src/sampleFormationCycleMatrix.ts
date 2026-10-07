import * as THREE from "three";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle";
import type { IAutoMovieFormationCycleTake } from "./IAutoMovieFormationCycleTake";

/**
 * The rest-to-posed matrix of one part at one cycle position.
 *
 * This is the arithmetic the vertex stage runs, kept here in one readable
 * place: the two neighbouring samples are read and mixed, and the last sample
 * mixes back into the first so the cycle closes. Measurement scripts, tests,
 * and reviewers get the exact number a frame drew instead of a screenshot.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Reads the same neighbouring rigid-part samples and periodic blend as the vertex shader for the selected member cycle position.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Reads the same neighbouring rigid-part samples and periodic blend as the vertex shader for the selected member cycle position.
 */
export const sampleFormationCycleMatrix = (
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
  const wrapped = position - Math.floor(position);
  const scaled = wrapped * cycle.samples;
  const first = Math.floor(scaled);
  const blend = scaled - first;
  const second = (first + 1) % cycle.samples;
  const read = (sample: number, row: number, column: number): number =>
    take.matrices[((part * 3 + row) * cycle.samples + sample) * 4 + column]!;
  const mix = (row: number, column: number): number =>
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
