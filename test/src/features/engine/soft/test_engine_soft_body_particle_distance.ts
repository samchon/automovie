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
 */
export function test_engine_soft_body_particle_distance(): void {
  const values: number[] = [0, 0, 0, 3, 4, 12];
  TestValidator.equals("3-4-12", AutoMovieEngineSoftBody.softBodyParticleDistance(values, 0, 1), 13);
  TestValidator.equals("reversed", AutoMovieEngineSoftBody.softBodyParticleDistance(values, 1, 0), 13);
  TestValidator.equals("itself", AutoMovieEngineSoftBody.softBodyParticleDistance(values, 1, 1), 0);
}
