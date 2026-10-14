import { applyMaterialShaderPatches } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Exercises ordered operations on one supplied complete mutable shader input and retains effects preceding an original failure.
 *
 * Scenarios:
 * 1. Two operations receive the same complete mutable input in registration order and observe preceding edits.
 * 2. An empty list preserves the caller's state reference and edit sequence.
 * 3. A middle operation writes then throws its original Error, preserving predecessor effects and skipping the successor.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real operation composer with two operations, no operations and a throwing middle operation; observes input identity, edit order and the unreachable successor.
 * @evidence contracts/testing.md#independent-expectations Authored edit strings, the original input reference and original Error define expected ordering and failure identity independently of the composer.
 * @evidence contracts/testing.md#distinguishing-cases Empty registration contrasts ordered predecessors; a failing operation writes before throwing, distinguishing stop-on-error from rollback or continuing successors.
 * @evidence contracts/testing.md#execution-ownership The named entry owns a plain input and its callbacks, starts no compiler/renderer or native shader, and replaces no SDK/global method.
 */
export function test_viewer_shader_patch_order(): void {
  const state: { rendererState: { owner: string }; edits: string[] } = {
    rendererState: { owner: "caller" },
    edits: [] as string[],
  };
  const callerState: { owner: string } = state.rendererState;
  applyMaterialShaderPatches(
    [
      {
        apply: (program: typeof state): void => {
          TestValidator.predicate(
            "first operation receives the complete input",
            program === state && program.rendererState === callerState,
          );
          program.edits.push("first");
        },
      },
      {
        apply: (program: typeof state): void => {
          TestValidator.equals(
            "second operation sees the preceding edit",
            program.edits,
            ["first"],
          );
          program.edits.push("second");
        },
      },
    ],
    state,
  );
  TestValidator.equals("registration order is retained", state.edits, [
    "first",
    "second",
  ]);
  applyMaterialShaderPatches([], state);
  TestValidator.predicate(
    "an empty list preserves caller state identity",
    state.rendererState === callerState,
  );
  TestValidator.equals("an empty list adds no edit", state.edits, [
    "first",
    "second",
  ]);

  const failure: Error = new Error("caller operation failed");
  let caught: unknown;
  try {
    applyMaterialShaderPatches(
      [
        {
          apply: (program: typeof state): void => {
            program.edits.push("before failure");
          },
        },
        {
          apply: (program: typeof state): never => {
            program.edits.push("failing operation");
            throw failure;
          },
        },
        {
          apply: (program: typeof state): void => {
            program.edits.push("unreachable successor");
          },
        },
      ],
      state,
    );
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate("the original error propagates", caught === failure);
  TestValidator.equals(
    "failure retains prior edits and stops successors",
    state.edits,
    ["first", "second", "before failure", "failing operation"],
  );
}
