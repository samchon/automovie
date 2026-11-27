import { AutoMovieEngineResolve } from "@automovie/engine";
import type { IAutoMovieProfile } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A limit on a, a copy a <- b and a driven c <- pointer. */
const PROFILE: IAutoMovieProfile = {
  id: "p",
  name: "p",
  limits: [
    {
      channel: { kind: "node", node: "a", path: "rotation" },
      min: null,
      max: null,
    },
  ],
  drivers: [
    {
      type: "copy",
      owner: "a",
      source: "b",
      translation: true,
      rotation: false,
      scale: false,
      influence: 1,
    },
    {
      type: "driven",
      output: { kind: "node", node: "c", path: "translation" },
      source: { kind: "pointer", pointer: "/x", valueType: "scalar" },
    },
  ],
};

/**
 * `profileSemanticKeys` lists the nodes a profile names, each once, limits
 * first and then drivers in order; a pointer channel names no node.
 *
 * Scenarios:
 *
 * 1. The limit gives "a", the copy adds "b" ("a" is already listed), and the
 *    driven output adds "c" while its pointer source adds nothing.
 */
export function test_engine_resolve_profile_semantic_keys(): void {
  TestValidator.equals("ordered distinct nodes", AutoMovieEngineResolve.profileSemanticKeys(PROFILE), [
    "a",
    "b",
    "c",
  ]);
}
