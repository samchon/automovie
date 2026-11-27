import { type AutoMovieArchetypeQuadrupedBody as Body, AutoMovieArchetypeQuadruped } from "@automovie/archetypes";
import {
  QuadrupedChange
} from "../../../../../packages/archetypes/src/animals/quadruped/QuadrupedChange";
import { AutoMovieEngineGravity } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Roundoff in SI threshold arithmetic with these metre/kilogram inputs. */
const SPEED_ROUNDOFF: number = 32 * Number.EPSILON;

/**
 * Gait changes use independent reference laws and direction-sensitive edges.
 *
 * Scenarios:
 * 1. At the 1.38 m reference, Griffin's Froude criterion and Heglund and
 *    Taylor's 170 kg anchor independently give walk/trot and trot/canter
 *    transition speeds for the same supplied hip and mass.
 * 2. The equine up edge is strict. A speed in the overlap retains whichever
 *    gait was already established and the down edge is strict as well.
 * 3. The canine authored speed, with zero hysteresis, selects the faster
 *    gait exactly at the boundary from either side.
 */
export function test_archetypes_animals_gait_change_boundary(): void {
  const horse: AutoMovieArchetypeQuadruped.ISpecies = AutoMovieArchetypeQuadruped.SPECIES.horse;
  const dimensions: Partial<Record<Body.Dimension, number>> = {
    withersHeight: 1.38,
    mass: 170,
  };
  const hip: number = 0.9;
  const walk: number = Math.sqrt(0.35 * AutoMovieEngineGravity.STANDARD * hip);
  TestValidator.predicate(
    "Froude and mass reduce to their independent reference values",
    nclose(
      QuadrupedChange.point(horse, "walk", "trot", dimensions, hip),
      walk,
      SPEED_ROUNDOFF,
    ) &&
      nclose(
        QuadrupedChange.point(horse, "trot", "canter", dimensions, hip),
        5,
        SPEED_ROUNDOFF,
      ),
  );
  const lower: number = walk - 0.2;
  const upper: number = walk + 0.2;
  TestValidator.equals(
    "equality at the upper physical threshold holds walk",
    QuadrupedChange.called(horse, upper, "walk", dimensions, hip),
    "walk",
  );
  TestValidator.equals(
    "a speed above that threshold enters trot",
    QuadrupedChange.called(horse, upper + 0.001, "walk", dimensions, hip),
    "trot",
  );
  TestValidator.equals(
    "equality at the lower physical threshold holds trot",
    QuadrupedChange.called(horse, lower, "trot", dimensions, hip),
    "trot",
  );
  TestValidator.equals(
    "a speed below the lower threshold returns to walk",
    QuadrupedChange.called(horse, lower - 0.001, "trot", dimensions, hip),
    "walk",
  );
  for (const previous of ["walk", "trot"] as const)
    TestValidator.equals(
      `the open overlap retains ${previous}`,
      QuadrupedChange.called(horse, walk, previous, dimensions, hip),
      previous,
    );

  const dog: AutoMovieArchetypeQuadruped.ISpecies = AutoMovieArchetypeQuadruped.SPECIES.dog;
  for (const previous of ["walk", "trot"] as const) {
    TestValidator.equals(
      `the canine 2.69 m/s boundary selects trot from ${previous}`,
      QuadrupedChange.called(dog, 2.69, previous, dimensions, hip),
      "trot",
    );
    TestValidator.equals(
      `the preceding speed selects walk from ${previous}`,
      QuadrupedChange.called(dog, 2.689, previous, dimensions, hip),
      "walk",
    );
  }
}
