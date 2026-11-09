import type { IAutoMovieRelationalGoal } from "./IAutoMovieRelationalGoal";

/**
 * One subject's intended action: the smallest unit a production composes.
 *
 * The engine never interprets `capability`; it is the production's own
 * vocabulary (a verb a subject can perform), so the same schedule machinery
 * serves any film. Timing, outcomes and state come from the production's
 * pure functions handed to `resolveAutoMovieSchedule`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (One subject's intended action: the smallest unit a production composes) and documents 5 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents One subject's intended action: the smallest unit a production composes: interface of 5 members (`subject`, `capability`, `goal`, `anchor`, `parameters`). Optional members `goal`, `anchor`, `parameters` express documented absence, and the ranges its member docs state are left to runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieIntent` in packages/engine/src/composition/IAutoMovieIntent.ts; its surface is the 5 members listed and the text shows 14 other files naming it, mostly movies (8), packages/engine (5), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; 3 optional members (`goal`, `anchor`, `parameters`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export interface IAutoMovieIntent {
  /** Stable id of the acting subject. */
  subject: string;

  /** The production's capability name, such as a verb its subject class offers. */
  capability: string;

  /** Optional relation the action must realize against another subject. */
  goal?: IAutoMovieRelationalGoal;

  /** Optional stable id other parts align to with `AutoMovieComposition.at`; unique in a composition. */
  anchor?: string;

  /** Production data the timing, outcome and state functions read; the engine copies it untouched. */
  parameters?: Readonly<Record<string, unknown>>;
}
