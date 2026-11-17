/**
 * Units reported by Human action parameter schemas and numeric refusals.
 * `s` measures seconds, `m` metres, `degrees` angular degrees, `hand` a
 * performer's hand lengths, and `beats/min` tempo. The empty string means
 * a dimensionless count, fraction or scale; it does not mean an unknown unit.
 * Motions owns numeric metadata and HumanPerformanceParams reads `x-unit`
 * when explaining an invalid parameter. This vocabulary performs no conversion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines every serialized unit and the empty-string case.
 * @evidence contracts/development/design.md#principled-representation A closed string union preserves schema unit spelling without attaching typia tags to author-facing numbers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanUnit schema adapters and numeric refusal readers share this vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Units describe the declared quantity; neither field names nor a runtime implementation determine the union.
 */
export type AutoMovieMotionHumanUnit =
  | "s"
  | "m"
  | "degrees"
  | "hand"
  | "beats/min"
  | "";
