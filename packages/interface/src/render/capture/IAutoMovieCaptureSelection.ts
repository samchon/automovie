/**
 * Which objects one cell draws: the request's own selection, or one unit of a sweep alone or with its neighbours.
 *
 * `.agents/skills/visual-debugging/capture.md` asks for the whole, each unit alone and each unit with the neighbours it touches. `parts` is the selection's path patterns, which replace the inspection request's `parts` for that cell.
 *
 * @evidence contracts/development/design.md#principled-representation The three selections the skill names need different data, so they are a union keyed by `kind`: only a swept selection has a unit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The kind, the swept unit's path and the patterns the cell draws; the patterns are what the inspection core reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The whole is a member of the union, not an absent selection.
 * @evidence contracts/development/common.md#meaningful-documentation States what each kind selects and how `parts` reaches the drawing.
 */
export type IAutoMovieCaptureSelection =
  | {
      /** The request's own `parts` and `hide`. */
      kind: "whole";

      /** The request's `parts`; empty draws every object. */
      parts: string[];
    }
  | {
      /** One swept unit alone, or with the neighbours within the sweep's margin. */
      kind: "alone" | "neighbours";

      /** Identity path of the swept unit. */
      unit: string;

      /** Path patterns of what the cell draws: the unit, and its neighbours for `neighbours`. */
      parts: string[];
    };
