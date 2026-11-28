import { AutoMovieEngineMaterial } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineMaterial.pcg3d` is the PCG3D hash (Jarzynski and Olano 2020):
 * exact modulo 2³², reading inputs as unsigned 32-bit words.
 *
 * Scenarios:
 *
 * 1. Every word lies in [0, 2³²) and the same input hashes the same.
 * 2. −1 hashes as its two's complement 0xffffffff.
 * 3. Neighbouring lattice points (0,0,0) and (1,0,0) differ in every word.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieEngineMaterial.pcg3d with authored integer triples and compares the range, repeat, unsigned-word conversion and selected neighbour outputs.
 * @evidence contracts/development/testing.md#independent-expectations Unsigned conversion maps -1 and 0xffffffff to the same 32-bit word. Word bounds come from the 32-bit representation, and the two adjacent coordinates provide distinct witnesses.
 * @evidence contracts/development/common.md#meaningful-documentation The three-word range and replay are checked. Two equivalent input words and two adjacent coordinates distinguish conversion from position sensitivity.
 */
export function test_engine_material_pcg3d(): void {
  const words: [number, number, number] = AutoMovieEngineMaterial.pcg3d(
    3,
    5,
    7,
  );
  TestValidator.predicate(
    "unsigned 32-bit words",
    words.every((word: number): boolean => word >>> 0 === word),
  );
  TestValidator.equals(
    "deterministic",
    AutoMovieEngineMaterial.pcg3d(3, 5, 7),
    words,
  );
  TestValidator.equals(
    "two's complement",
    AutoMovieEngineMaterial.pcg3d(-1, 0, 2),
    AutoMovieEngineMaterial.pcg3d(0xffffffff, 0, 2),
  );
  const origin: [number, number, number] = AutoMovieEngineMaterial.pcg3d(
    0,
    0,
    0,
  );
  const next: [number, number, number] = AutoMovieEngineMaterial.pcg3d(1, 0, 0);
  TestValidator.predicate(
    "neighbours differ",
    origin.every((word: number, i: number): boolean => word !== next[i]),
  );
}
