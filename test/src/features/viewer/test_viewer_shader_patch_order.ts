import { applyMaterialShaderPatches } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Ordered material operations share the caller's complete program. A failed
 * operation propagates its own error while retaining edits already performed.
 *
 * Scenarios:
 * 1. Two operations observe the same opaque input and the preceding edit.
 * 2. An empty registration list leaves every caller-owned field untouched.
 * 3. A middle operation throws its original error; its prior edits remain and
 *    the following operation is never called.
 */
export const test_viewer_shader_patch_order = (): void => {
  const state = { rendererState: { owner: "caller" }, edits: [] as string[] };
  const callerState = state.rendererState;
  applyMaterialShaderPatches([
    { apply: (program: typeof state) => {
      TestValidator.predicate("first operation receives the complete input", program === state && program.rendererState === callerState);
      program.edits.push("first");
    } },
    { apply: (program: typeof state) => {
      TestValidator.equals("second operation sees the preceding edit", program.edits, ["first"]);
      program.edits.push("second");
    } },
  ], state);
  TestValidator.equals("registration order is retained", state.edits, ["first", "second"]);
  applyMaterialShaderPatches([], state);
  TestValidator.predicate("an empty list preserves caller state identity", state.rendererState === callerState);
  TestValidator.equals("an empty list adds no edit", state.edits, ["first", "second"]);

  const failure = new Error("caller operation failed");
  let caught: unknown;
  try {
    applyMaterialShaderPatches([
      { apply: (program: typeof state) => { program.edits.push("before failure"); } },
      { apply: (program: typeof state) => { program.edits.push("failing operation"); throw failure; } },
      { apply: (program: typeof state) => { program.edits.push("unreachable successor"); } },
    ], state);
  } catch (error) { caught = error; }
  TestValidator.predicate("the original error propagates", caught === failure);
  TestValidator.equals("failure retains prior edits and stops successors", state.edits, ["first", "second", "before failure", "failing operation"]);
};
