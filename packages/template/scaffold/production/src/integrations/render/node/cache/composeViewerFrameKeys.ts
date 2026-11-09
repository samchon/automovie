import {
  type IAutoMovieArtifactKey,
  composeAutoMovieArtifactKey,
} from "@automovie/engine";

/**
 * Compose the cache key of every captured Viewer frame.
 *
 * Each key is the engine artifact key of stage `render.viewer-frame` at this
 * module's version, with the run's toolchain (package versions, browser build,
 * GL backend) and the run's capture inputs (route, raster, selectors, hooks),
 * plus two per-frame inputs: `seconds`, the frame time in the shortest
 * round-trip decimal form, and `state`, the page's digest for that time. A
 * frame is therefore a pure function of its key (Remotion's frame-purity rule):
 * identical keys at different times never share pixels, and a production edit
 * that leaves a frame's state digest unchanged keeps its key.
 *
 * @param scope Toolchain identities and capture inputs shared by every frame.
 * @param times Frame seconds, in capture order.
 * @param states The page's state digest per frame, aligned with `times`.
 * @returns One `sha256:` key per frame.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Delegates to the engine's canonical key, adding the frame time and state digest as declared inputs so every pixel-affecting value is in the hash; Number-to-string is ECMAScript's shortest round-trip form, so distinct times never collide.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pure and separate from page observation and storage so the key schema is unit-testable.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scope members named `seconds` or `state` are refused rather than silently overwritten.
 * @evidence contracts/development/implementation.md#efficient-algorithms F keys, each one sort of a constant-size record and one SHA-256 of its short text: O(F).
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure composition; reuse is decided by the planner.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned keys outlive the call.
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, version, per-frame inputs and the purity consequence.
 */
export function composeViewerFrameKeys(
  scope: Pick<IAutoMovieArtifactKey, "toolchain" | "inputs">,
  times: readonly number[],
  states: readonly string[],
): string[] {
  if (times.length !== states.length)
    throw new Error("Every frame time needs exactly one state digest");
  if ("seconds" in scope.inputs || "state" in scope.inputs)
    throw new Error("Frame scope inputs must not name seconds or state");
  return times.map((seconds: number, index: number): string =>
    composeAutoMovieArtifactKey({
      stage: "render.viewer-frame",
      version: VERSION,
      toolchain: scope.toolchain,
      inputs: {
        ...scope.inputs,
        seconds: String(seconds),
        state: states[index]!,
      },
    }),
  );
}

/** Frame capture implementation version; bump when capture would produce other pixels from the same inputs. */
const VERSION: string = "1";
