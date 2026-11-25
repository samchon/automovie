import { archetypeCatalogueRideContact } from "../../internal/archetypeCatalogueRideContact";

/**
 * Exercise the latter half of the same sedan seat and turn compositions.
 *
 * Scenarios:
 * 1. Build model seeds 100 through 199 and record all lawful contacts and low-seat refusals.
 * 2. Compare the real seated actor and cushion through the authored turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Records the distinct model seed interval and actual carrier and human surfaces.
 * @evidence contracts/development/testing.md#behavioral-verification Executes the public sit and ride, reading the actor's displayed seat and heading at the route samples.
 * @evidence contracts/development/testing.md#independent-expectations The crouch threshold is 0.8 of the actor's measured popliteal height per #3363. The collider-based support gap is bounded by 10 mm and heading by one degree.
 * @evidence contracts/development/testing.md#distinguishing-cases This second disjoint half verifies remaining model draws and independently checks any physically low seat refusal.
 * @evidence contracts/development/testing.md#execution-ownership The runner discovers this tail as one scenario and retains only the refusal seeds, observed extrema and representative failures.
 */
export function test_archetype_catalogue_actor_ride_second(): void {
  archetypeCatalogueRideContact(100, 200);
}
