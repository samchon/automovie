import { AutoMovieEngineSoftBody } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `softBodyParticleDistance` is the Euclidean distance between two xyz triples
 * of a flat position array.
 *
 * Scenarios:
 *
 * 1. Particles (0,0,0) and (3,4,12) are 13 apart, either way round.
 * 2. A particle is 0 from itself.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Passes two explicit XYZ triples directly to AutoMovieEngineSoftBody.softBodyParticleDistance and compares both particle orders and a self-distance.
 * @evidence contracts/development/testing.md#independent-expectations The displacement (3, 4, 12) has length √(9+16+144)=13 in either order. A zero displacement has length zero.
 * @evidence contracts/development/common.md#meaningful-documentation The flat position array exercises three-coordinate indexing, symmetry and the zero distance to the same particle.
 */
export function test_engine_soft_body_particle_distance(): void {
  const values: number[] = [0, 0, 0, 3, 4, 12];
  TestValidator.equals("3-4-12", AutoMovieEngineSoftBody.softBodyParticleDistance(values, 0, 1), 13);
  TestValidator.equals("reversed", AutoMovieEngineSoftBody.softBodyParticleDistance(values, 1, 0), 13);
  TestValidator.equals("itself", AutoMovieEngineSoftBody.softBodyParticleDistance(values, 1, 1), 0);
}
