import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieInspectionRequest,
} from "@automovie/render";

/**
 * One edit of the inspector's request, as a control dispatches it to `reduceAutoMovieInspectorState`.
 *
 * Each action names one request key of the capture plan grammar and the change to its text, so the edit goes through the grammar's own reader and a refusal names the key. Toggles add or remove one item of a comma-separated list, the colour action adds or replaces one `pattern=rrggbb` pair, and the others replace the key's whole text.
 *
 * | Action | Key edited | Request member |
 * | --- | --- | --- |
 * | `select` | `parts` | `inspection.parts` |
 * | `hide` | `hide` | `inspection.hide` |
 * | `label` | `label` | `inspection.label` |
 * | `color` | `color` | `inspection.color` |
 * | `marks` | `marks` | `inspection.marks` |
 * | `shade` | `shade`, dropping `passes` | `passes` and `inspection.shade` |
 * | `switch` | `surface` or `xray` | that switch |
 * | `view` | `views` | `views` |
 * | `time` | `at`, dropping `from`, `to` and `rate` | `sampling` |
 * | `subject` | `subject` | `subject` |
 * | `text` | every key | the whole request |
 * | `restore` | none | the whole request, set back by the scene |
 *
 * @evidence contracts/development/design.md#principled-representation A union keyed by `type`, one member per kind of edit, each carrying exactly what that edit needs: a pattern and a direction for a toggle, an sRGB colour or null for a colour, a shade from the request's own union, a view text, subject seconds, a subject name or null, an address text, or a whole request.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the viewer, dispatched by the inspector's panels and read only by the reducer. Shades are the inspection request's own union and a restored request is the capture plan request, so no parallel type is declared.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a request field: every edit is of a grammar key's text, so the typed request stays render's alone and a value the grammar refuses is refused with the key named.
 * @evidence contracts/development/common.md#meaningful-documentation Tabulates every action with the key it edits and the request member it changes.
 */
export type IAutoMovieInspectorAction =
  | IAutoMovieInspectorAction.IToggle
  | IAutoMovieInspectorAction.IColor
  | IAutoMovieInspectorAction.IShade
  | IAutoMovieInspectorAction.ISwitch
  | IAutoMovieInspectorAction.IView
  | IAutoMovieInspectorAction.ITime
  | IAutoMovieInspectorAction.ISubject
  | IAutoMovieInspectorAction.IText
  | IAutoMovieInspectorAction.IRestore;
export namespace IAutoMovieInspectorAction {
  /**
   * Add a pattern to, or remove it from, one of the request's pattern lists.
   *
   * @evidence contracts/development/design.md#principled-representation The list is named by its action type and the pattern is the path grammar's text, so a toggle of an absent pattern adds it and of a present one removes it, whatever the list.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant, the pattern and the direction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `on` states the direction instead of flipping, so a repeated dispatch is idempotent.
   * @evidence contracts/development/common.md#meaningful-documentation States what each member means.
   */
  export interface IToggle {
    /** Which list: `select` edits `parts`, `hide` edits `hide`, `label` edits `label`, `marks` edits `marks`. */
    type: "select" | "hide" | "label" | "marks";

    /** A path pattern, or a kind pattern for `marks`. */
    pattern: string;

    /** True puts the pattern in the list, false takes it out. */
    on: boolean;
  }

  /**
   * Give the objects and marks a pattern selects a colour, or take a colour back.
   *
   * @evidence contracts/development/design.md#principled-representation A colour is an sRGB hex integer, the form marks and the palette use; null takes the pattern's colour out of the list.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant, the pattern and the colour.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Removal is null rather than a reserved colour, so every integer is a colour.
   * @evidence contracts/development/common.md#meaningful-documentation States the encoding and the null case.
   */
  export interface IColor {
    /** Discriminant. */
    type: "color";

    /** The path pattern coloured. */
    pattern: string;

    /** sRGB hex colour, such as `0xff3b30`, or null to remove the pattern's colour. */
    color: number | null;
  }

  /**
   * Draw in one shade.
   *
   * @evidence contracts/development/design.md#principled-representation One shade from the inspection request's union; the page draws one pass, so several passes collapse to this one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant and the shade.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The shade type is the request's own, so an unknown shade cannot be dispatched.
   * @evidence contracts/development/common.md#meaningful-documentation States that several passes become one.
   */
  export interface IShade {
    /** Discriminant. */
    type: "shade";

    /** The shade drawn. */
    shade: IAutoMovieInspectionRequest.Shade;
  }

  /**
   * Turn one of the request's switches on or off.
   *
   * @evidence contracts/development/design.md#principled-representation The switch is named by its key and its state is a boolean, written `1` or `0`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant, the key and the state.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the switches a panel offers are listed, so no key outside the grammar can be named.
   * @evidence contracts/development/common.md#meaningful-documentation States what each key does.
   */
  export interface ISwitch {
    /** Discriminant. */
    type: "switch";

    /** `surface` draws the surfaces; `xray` draws marks over the surfaces that would hide them. */
    key: "surface" | "xray";

    /** The switch's new state. */
    on: boolean;
  }

  /**
   * Draw through one view.
   *
   * @evidence contracts/development/design.md#principled-representation A view is its text in the inspection view grammar, which the plan reader checks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant and the text.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The text replaces every view, because the page draws through one.
   * @evidence contracts/development/common.md#meaningful-documentation States the grammar and the replacement.
   */
  export interface IView {
    /** Discriminant. */
    type: "view";

    /** A view text such as `film`, `front@ortho` or `0,1.6,4:0,1,0`. */
    view: string;
  }

  /**
   * Fix the second the picture shows.
   *
   * @evidence contracts/development/design.md#principled-representation Subject seconds, written as the `at` key, which replaces any even sampling.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant and the second.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Playback does not dispatch it per frame; a pause or a seek does, so the request names the picture shown when nothing moves.
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the key and when it is dispatched.
   */
  export interface ITime {
    /** Discriminant. */
    type: "time";

    /** Subject second, zero or more. */
    seconds: number;
  }

  /**
   * Inspect another subject.
   *
   * @evidence contracts/development/design.md#principled-representation A subject name, or null for the host's only subject.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant and the name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Null keeps the grammar's own meaning instead of an empty name.
   * @evidence contracts/development/common.md#meaningful-documentation States the null case.
   */
  export interface ISubject {
    /** Discriminant. */
    type: "subject";

    /** The subject's name, or null for the only subject. */
    name: string | null;
  }

  /**
   * Replace the whole request with the one an address or command text names.
   *
   * @evidence contracts/development/design.md#principled-representation The text is a query string of the plan grammar's keys, with or without its leading `?`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant and the text.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A refused text keeps the previous request, so a typing mistake never blanks the picture.
   * @evidence contracts/development/common.md#meaningful-documentation States the text's form and the refusal.
   */
  export interface IText {
    /** Discriminant. */
    type: "text";

    /** The address text. */
    text: string;
  }

  /**
   * Set back the request the scene still draws after it refused a new one.
   *
   * @evidence contracts/development/design.md#principled-representation The scene's refusal comes after the grammar accepted the request, such as a mark pattern that matches no kind, so the scene hands back the request it draws and the reason.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The discriminant, the request and the reason.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The request is a whole plan request the scene applied before, not a partial patch.
   * @evidence contracts/development/common.md#meaningful-documentation States who dispatches it and why.
   */
  export interface IRestore {
    /** Discriminant. */
    type: "restore";

    /** The request the scene draws. */
    request: IAutoMovieCapturePlanRequest;

    /** Why the newer request was refused. */
    error: string;
  }
}
