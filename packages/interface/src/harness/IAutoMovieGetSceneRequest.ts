/**
 * Asks for the staged scene: placements, cameras and lights.
 *
 * The engine's `readSlateContext` answers it with the slate's `scene`, the
 * slate's own object, or `null` before staging has run.
 *
 * @evidence contracts/common.md#principled-implementation The scene is a single slate slice, so the request is a discriminator with no key and the answer is that slice as stored.
 * @evidence contracts/common.md#clear-and-simple-design A parameterless record in the shared request union, so every stored read is dispatched on `type` alone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Before staging the answer is `null` rather than a scene staged on demand or an empty placeholder.
 * @evidence contracts/common.md#meaningful-documentation States what the scene holds, the resolver, that the answer aliases the slate, and the `null` answer before staging.
 * @author Samchon
 */
export interface IAutoMovieGetSceneRequest {
  /** Selects the knowledge query that reads the staged scene. */
  type: "getScene";
}
