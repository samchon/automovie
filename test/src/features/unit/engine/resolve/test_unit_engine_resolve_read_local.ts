import { readLocal } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `readLocal` reads one node's local transform from the provided map.
 *
 * Scenarios:
 *
 * 1. A provided id answers its own transform record.
 * 2. A missing id throws a message naming the role and the id.
 */
export function test_unit_engine_resolve_read_local(): void {
  const local: IAutoMovieTransform = {
    translation: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  TestValidator.predicate(
    "the provided record",
    readLocal(new Map([["a", local]]), "a") === local,
  );
  let message: string = "";
  try {
    readLocal(new Map(), "b", "aim target");
  } catch (error) {
    message = error instanceof Error ? error.message : "";
  }
  TestValidator.equals(
    "a missing id names its role",
    message,
    'aim target node "b" was not provided',
  );
}