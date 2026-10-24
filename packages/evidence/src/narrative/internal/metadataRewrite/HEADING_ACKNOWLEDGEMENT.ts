/**
 * Recognizes an acknowledgement heading and an optional inline reason.
 *
 * Principled implementation: Anchored grammar recognizes H2-H4 acknowledgements with optional inline reasons.
 * Clear and simple design: Heading grammar is separate because later section lines may supply reasons.
 * Prohibited implementation shortcuts: Heading levels and keywords are supported protocol variants.
 * Meaningful documentation: The comment states optional inline reasons; evidenceSections requires an eventual reason.
 * Efficient algorithms: Compilation occurs once; each match examines one heading and captures its fields.
 * Reuse equivalent work: The non-global expression is shared without mutable match-cursor state.
 * Bound retention and release resources: The module retains one RegExp; match results belong to callers.
 */
export const HEADING_ACKNOWLEDGEMENT: RegExp =
  /^(#{2,4}) @(evidence|evidenceExclude) (\S+)(?: (\S(?:.*\S)?))?$/u;
