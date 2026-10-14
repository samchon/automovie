/**
 * One archetype-owned refusal raised while planning a parameter map.
 *
 * The design gate turns each refusal into one diagnostic on the recipe; the
 * archetype supplies its identity and wording.
 *
 * @evidence contracts/common.md#principled-implementation A refusal carries only the code and sentence the gate cannot derive itself; the gate adds the target and file, and it checks the code against its registered set instead of trusting the archetype's string.
 * @evidence contracts/common.md#clear-and-simple-design Two plain strings keep a catalogue package free of the production diagnostic union, so an archetype can refuse a value without depending on the gate's types.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The open `code` string is a seam the gate validates, mapping any unregistered code to `model-parameter-invalid`, and no particular code value is special-cased by this type.
 * @evidence contracts/common.md#meaningful-documentation The `code` member gives both the verbatim and the fallback reporting path, and `message` says it must be a complete sentence carrying the correction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This shape holds two strings a plan returns and runs no computation whose algorithm could be chosen.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A refusal is a per-plan value created for one recipe's diagnostic, not work coordinated across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The gate copies a refusal's message into a diagnostic and drops the plan, so this record retains nothing beyond one validation pass.
 * @author Samchon
 */
export interface IAutoMovieArchetypeRefusal {
  /**
   * Diagnostic code, reported verbatim when it is a registered AutoMovie
   * diagnostic code; any other string is reported as `model-parameter-invalid`
   * with this code named before the message.
   */
  code: string;

  /** Complete operator-facing sentence, including the correction. */
  message: string;
}
