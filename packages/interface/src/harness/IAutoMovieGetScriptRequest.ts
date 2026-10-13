/**
 * Asks for the full script: logline, theme, cast, beats and any refinement
 * tree.
 *
 * The engine's `readSlateContext` answers it with the slate's `script`, the
 * slate's own object, or `null` before the script stage has run.
 *
 * @evidence contracts/common.md#principled-implementation The script is a single slate slice, so the request carries only its discriminator and the resolver returns the stored slice unchanged.
 * @evidence contracts/common.md#clear-and-simple-design A parameterless member of the request union; narrower reads such as one beat's notes or end state have their own records instead of options here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Before the script stage the answer is `null` rather than a script assembled from the brief.
 * @evidence contracts/common.md#meaningful-documentation States what the script holds, the resolver, that the answer aliases the slate, and the `null` answer before the script stage.
 * @author Samchon
 */
export interface IAutoMovieGetScriptRequest {
  /** Selects the knowledge query that reads the project script. */
  type: "getScript";
}
