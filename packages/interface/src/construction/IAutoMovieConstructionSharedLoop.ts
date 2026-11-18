import type { IAutoMovieSolidJoin } from "./IAutoMovieSolidJoin";
import type { IAutoMovieSolidSharedCurve } from "./IAutoMovieSolidSharedCurve";

/**
 * A mixed join's record as the kernel's join input: the declared loop of `IAutoMovieConstructionJoin.loop` turned into the shared
 * contact, its width laws and its sides, in millimetres.
 *
 * The loop is read through the port curve's one owner (`AutoMovieConstructionPortCurve.curve`): the ellipse on the host face's chart
 * with its per-column shares joined by the periodic cubic, with two exact clock derivatives. `AutoMovieSolidSharedCurve` maps it through
 * the host and drops its foot on the part; `AutoMovieConstructionWidths` reads each width at the curve's points, the fold's turn among
 * them; the result is what `AutoMovieSolidBody.merge` takes as a join whose curve is supplied, so the rails, the blend, the trims and
 * the faces are the traced join's own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record becomes, which owners it reads and who consumes the result.
 * @evidence contracts/development/design.md#principled-representation One owner supplies the shared boundary to the host's trim, the blend and the part (construction.md, Connections); nothing here interpolates the loop a second time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepared input, the refusal and one builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A refused premise returns its name and numbers; no part of the loop falls back to a trace.
 */
export namespace IAutoMovieConstructionSharedLoop {
  /**
   * The kernel's join input for a declared loop, and the contact it was built from.
   *
   * @evidence contracts/development/design.md#principled-representation The join input carries the supplied curve, its sides and its width laws together, as the body's merge reads them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values and readers only.
   * @evidence contracts/development/common.md#meaningful-documentation States each member's consumer.
   */
  export interface IPrepared {
    /** What `AutoMovieSolidBody.merge` takes as its `join`. */
    join: Omit<IAutoMovieSolidJoin.IInput, "part" | "host">;

    /** The contact, for a reader of its arcs. */
    shared: IAutoMovieSolidSharedCurve.IShared;
  }

  /**
   * A premise the record broke.
   *
   * @evidence contracts/development/design.md#principled-representation The contract's name and its numbers, as a construction diagnostic reports them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two strings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A refusal carries no partial input.
   * @evidence contracts/development/common.md#meaningful-documentation States both fields.
   */
  export interface IRefusal {
    /** `shared loop`, `closed loop`, `enclosed loop`, `one kept side` or `width`. */
    contract: string;

    /** The message with its numbers. */
    detail: string;
  }
}
