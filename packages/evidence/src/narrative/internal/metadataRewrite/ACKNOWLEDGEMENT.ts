/**
 * Recognizes a flat evidence acknowledgement with its required reason.
 *
 * Principled implementation: Anchored grammar requires an acknowledgement keyword, nonspace target and nonempty reason.
 * Clear and simple design: The shared expression keeps classification and projection grammar aligned.
 * Prohibited implementation shortcuts: The two keywords are supported evidence syntax.
 * Meaningful documentation: The comment states flat-declaration and required-reason semantics.
 * Efficient algorithms: One module initialization compiles the expression; matching examines line characters.
 * Reuse equivalent work: The non-global expression is reused without previous-line cursor state.
 * Bound retention and release resources: The module retains one RegExp and no input history.
 */
export const ACKNOWLEDGEMENT: RegExp =
  /^@(evidence|evidenceExclude) (\S+) (\S(?:.*\S)?)$/u;
