import type { IAutoMovieSequence } from "../cinematics/IAutoMovieSequence";
import type { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";

/**
 * The edit relation between two output instants of one cut, with each instant's live shot clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the output and shot-local clocks, the edit cases that break continuity and the declared deliberate break.
 * @evidence contracts/development/design.md#principled-representation The relation comes from the canonical sequence and its prepared playback layout. Each endpoint keeps the live entry, shot and retimed shot-local second, so a comparison uses source time rather than output spacing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine derives the relation from the edit it already owns. The producer evaluates its own tracks at the returned shot clocks and selects any limits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A transition overlap or a change of shot is never called continuous, and an instant outside the timeline is unavailable rather than clamped.
 */
export namespace IAutoMovieClassifyPlaybackBoundary {
  /**
   * The cut, its prepared layout, the two output instants and the producer's deliberate breaks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the clock of every number and that a break owns the shot-local half-open interval ending at its second.
   * @evidence contracts/development/design.md#principled-representation The sequence and the layout built from it share the playback mapping. Breaks are shot-local because a source take owns them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the cut, the layout built once by the caller and explicit breaks enter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No default frame step, speed or break is assumed.
   */
  export interface IProps {
    /** The cut the layout was built from, already admitted by `cutSequence`. */
    readonly sequence: IAutoMovieSequence;

    /** The layout of `sequence` from `sequenceTimeline`. */
    readonly timeline: IAutoMoviePlaybackTimeline;

    /** Earlier output second. */
    readonly before: number;

    /** Later output second, at or after `before`. */
    readonly after: number;

    /**
     * Deliberate breaks in authored takes. A break at shot-local `seconds`
     * separates every earlier instant of that shot from the instant itself and
     * every later one.
     */
    readonly discontinuities?: readonly {
      /** Id of the shot whose take breaks. */
      readonly shot: string;

      /** Shot-local second at which the new state begins. */
      readonly seconds: number;
    }[];
  }

  /**
   * One instant on the live shot's clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the sequence entry, shot id and shot-local seconds after trim and playback rate.
   * @evidence contracts/development/design.md#principled-representation The same three values a playback sample uses to place the live shot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries only what a producer needs to evaluate its track.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The entry index distinguishes two plays of the same shot.
   */
  export interface IEndpoint {
    /** Index of the live entry in `sequence.shots`. */
    readonly entry: number;

    /** Id of the live shot. */
    readonly shot: string;

    /** Shot-local seconds of the live shot at this instant. */
    readonly seconds: number;
  }

  /**
   * The relation and, when both instants lie on the timeline, their shot clocks.
   *
   * `continuous` holds inside one entry and across a hard cut that resumes the
   * same shot exactly where the previous entry ended. `cut` holds across any
   * other edit, and whenever either instant shows a transition overlap.
   * `discontinuity` holds inside a continuous relation crossed by a declared
   * break. `unavailable` holds when an instant is not finite, the instants are
   * reversed, or either lies outside `[0, runtime)`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines each relation and when endpoints are present.
   * @evidence contracts/development/design.md#principled-representation The four relations are the boundary values continuity checks already consume.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returns the relation and the clocks needed to evaluate it, nothing else.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An unavailable relation carries no invented endpoint.
   */
  export type IResult =
    | {
        readonly boundary: "continuous" | "cut" | "discontinuity";

        /** Live shot clock at `before`. */
        readonly before: IEndpoint;

        /** Live shot clock at `after`. */
        readonly after: IEndpoint;
      }
    | { readonly boundary: "unavailable" };
}
