import type {
  AutoMovieInspectionShade,
  IAutoMovieCapturePlanRequest,
} from "@automovie/interface";

/**
 * One edit of the inspector's request, as a control dispatches it to
 * `reduceAutoMovieInspectorState`.
 *
 * Each action names one request key of the capture plan grammar and the change
 * to its text, so the edit goes through the grammar's own reader and a refusal
 * names the key. Toggles add or remove one item of a comma-separated list, the
 * colour action adds or replaces one `pattern=rrggbb` pair, and the others
 * replace the key's whole text.
 *
 * | Action    | Key edited                                | Request member                           |
 * | --------- | ----------------------------------------- | ---------------------------------------- |
 * | `select`  | `parts`                                   | `inspection.parts`                       |
 * | `hide`    | `hide`                                    | `inspection.hide`                        |
 * | `label`   | `label`                                   | `inspection.label`                       |
 * | `color`   | `color`                                   | `inspection.color`                       |
 * | `marks`   | `marks`                                   | `inspection.marks`                       |
 * | `shade`   | `shade`, dropping `passes`                | `passes` and `inspection.shade`          |
 * | `switch`  | `surface` or `xray`                       | that switch                              |
 * | `view`    | `views`                                   | `views`                                  |
 * | `time`    | `at`, dropping `from`, `to` and `rate`    | `sampling`                               |
 * | `locate`  | `at` as `time` does, and `label` replaced | `sampling` and `inspection.label`        |
 * | `subject` | `subject`                                 | `subject`                                |
 * | `text`    | every key                                 | the whole request                        |
 * | `restore` | none                                      | the whole request, set back by the scene |
 */
export type IAutoMovieViewerInspectorAction =
  | IAutoMovieViewerInspectorAction.IToggle
  | IAutoMovieViewerInspectorAction.IColor
  | IAutoMovieViewerInspectorAction.IShade
  | IAutoMovieViewerInspectorAction.ISwitch
  | IAutoMovieViewerInspectorAction.IView
  | IAutoMovieViewerInspectorAction.ITime
  | IAutoMovieViewerInspectorAction.ILocate
  | IAutoMovieViewerInspectorAction.ISubject
  | IAutoMovieViewerInspectorAction.IText
  | IAutoMovieViewerInspectorAction.IRestore;
export namespace IAutoMovieViewerInspectorAction {
  /** Add a pattern to, or remove it from, one of the request's pattern lists. */
  export interface IToggle {
    /**
     * Which list: `select` edits `parts`, `hide` edits `hide`, `label` edits
     * `label`, `marks` edits `marks`.
     */
    type: "select" | "hide" | "label" | "marks";

    /** A path pattern, or a kind pattern for `marks`. */
    pattern: string;

    /** True puts the pattern in the list, false takes it out. */
    on: boolean;
  }

  /**
   * Give the objects and marks a pattern selects a colour, or take a colour
   * back.
   */
  export interface IColor {
    /** Discriminant. */
    type: "color";

    /** The path pattern coloured. */
    pattern: string;

    /**
     * SRGB hex colour, such as `0xff3b30`, or null to remove the pattern's
     * colour.
     */
    color: number | null;
  }

  /** Draw in one shade. */
  export interface IShade {
    /** Discriminant. */
    type: "shade";

    /** The shade drawn. */
    shade: AutoMovieInspectionShade;
  }

  /** Turn one of the request's switches on or off. */
  export interface ISwitch {
    /** Discriminant. */
    type: "switch";

    /**
     * `surface` draws the surfaces; `xray` draws marks over the surfaces that
     * would hide them.
     */
    key: "surface" | "xray";

    /** The switch's new state. */
    on: boolean;
  }

  /** Draw through one view. */
  export interface IView {
    /** Discriminant. */
    type: "view";

    /** A view text such as `film`, `front@ortho` or `0,1.6,4:0,1,0`. */
    view: string;
  }

  /** Fix the second the picture shows. */
  export interface ITime {
    /** Discriminant. */
    type: "time";

    /** Subject second, zero or more. */
    seconds: number;
  }

  /** Show a finding: fix the picture at its second and name its entities on it. */
  export interface ILocate {
    /** Discriminant. */
    type: "locate";

    /** Subject second of the finding's witness, zero or more. */
    seconds: number;

    /** Drawn paths to label, replacing the current labels. */
    label: string[];
  }

  /** Inspect another subject. */
  export interface ISubject {
    /** Discriminant. */
    type: "subject";

    /** The subject's name, or null for the only subject. */
    name: string | null;
  }

  /** Replace the whole request with the one an address or command text names. */
  export interface IText {
    /** Discriminant. */
    type: "text";

    /** The address text. */
    text: string;
  }

  /** Set back the request the scene still draws after it refused a new one. */
  export interface IRestore {
    /** Discriminant. */
    type: "restore";

    /** The request the scene draws. */
    request: IAutoMovieCapturePlanRequest;

    /** Why the newer request was refused. */
    error: string;
  }
}
