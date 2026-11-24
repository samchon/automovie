import { readWorld } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `readWorld` reads one node's world matrix from the provided map.
 *
 * Scenarios:
 *
 * 1. A provided id answers its own matrix.
 * 2. A missing id throws a message naming the owner, the role and the id.
 */
export function test_unit_engine_resolve_read_world(): void {
  const matrix: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  TestValidator.predicate(
    "the provided matrix",
    readWorld(new Map([["a", matrix]]), "a", "source") === matrix,
  );
  let message: string = "";
  try {
    readWorld(new Map(), "b", "target");
  } catch (error) {
    message = error instanceof Error ? error.message : "";
  }
  TestValidator.equals(
    "a missing id names its owner and role",
    message,
    'world driver target node "b" was not provided',
  );
}