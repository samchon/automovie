import type { IAutoMovieConstructionJoin } from "@automovie/interface";

import { AutoMovieConstructionPortCurve } from "./AutoMovieConstructionPortCurve";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieConstructionWidths } from "./AutoMovieConstructionWidths";
import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import type { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";
import { AutoMovieSolidSharedCurve } from "./AutoMovieSolidSharedCurve";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

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
export namespace AutoMovieConstructionSharedLoop {
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
    join: Omit<AutoMovieSolidJoin.IInput, "part" | "host">;

    /** The contact, for a reader of its arcs. */
    shared: AutoMovieSolidSharedCurve.IShared;
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

  /**
   * Prepare a mixed join's kernel input.
   *
   * @param node The join, with its `loop`.
   * @param part The part's face.
   * @param host The host's atlas.
   * @param face The atlas face the loop lies on, `seed.hostFace`'s.
   * @returns The input, or the refusal.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Admits the loop's numbers, reads it through the port curve's owner, builds the shared contact with the join's own count, tolerance and grazing angle, and reads both width laws on it; a `point` seed's part chart point starts the first foot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three owners called in order, each refusal passed on under its own name.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped or retried; a `station` width, which needs the part's phase as the parameter, is refused by the width owner.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the units and the result.
   * @evidence contracts/development/implementation.md#efficient-algorithms One port curve, one shared contact of `count` feet and two width laws of `count` readings each.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The contact's stored points serve the width laws and the join.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The prepared input retains the contact, the laws and the borrowed surfaces for the join's lifetime.
   */
  export function create(
    node: IAutoMovieConstructionJoin,
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    face: number,
  ): IPrepared | IRefusal {
    const S: number = AutoMovieConstructionViews.SCALE;
    const loop: IAutoMovieConstructionJoin["loop"] = node.loop;
    if (loop === undefined) return { contract: "shared loop", detail: "the join declares no loop" };
    if (
      !(
        Number.isFinite(loop.centre[0]) &&
        Number.isFinite(loop.centre[1]) &&
        loop.semi[0] > 0 &&
        loop.semi[1] > 0 &&
        loop.semi[1] < Math.PI &&
        (loop.shape === undefined || loop.shape.length === node.count)
      )
    )
      return {
        contract: "shared loop",
        detail: `the loop needs a finite centre, positive semi-axes with the phase one under pi and, when shaped, ${node.count} shares`,
      };
    if (!(Number.isInteger(node.count) && node.count >= 8 && node.count % 4 === 0))
      return { contract: "shared loop", detail: `the count ${node.count} is not a multiple of 4 of at least 8` };
    const curve: AutoMovieConstructionPortCurve.ICurve | string = AutoMovieConstructionPortCurve.curve(
      loop,
      node.count,
      host.faces[face]!.period,
    );
    if (typeof curve === "string") return { contract: "shared loop", detail: curve };

    // The contact: the loop through the host, its foot on the part from the seed's part point when the seed states one.
    const start: [number, number] | undefined = node.seed.type === "point" ? [node.seed.part[0] * S, node.seed.part[1]] : undefined;
    const made: AutoMovieSolidSharedCurve.IResult = AutoMovieSolidSharedCurve.create({
      part,
      host,
      face,
      loop: curve.at,
      count: node.count,
      tolerance: node.tolerance * S,
      grazing: node.grazing,
      keep: node.kind === "merge" ? "outside" : "inside",
      ...(start === undefined ? {} : { start }),
    });
    if (made.shared === null) {
      const first: { contract: string; detail: string } | undefined = made.diagnostics[0];
      return { contract: first?.contract ?? "shared loop", detail: first?.detail ?? "the contact could not be built" };
    }
    const shared: AutoMovieSolidSharedCurve.IShared = made.shared;

    // The widths, read on the contact: its clock is not the part's phase, so both rails offset square to it.
    const width: AutoMovieSolidJoin.IInput["width"] | string = AutoMovieConstructionWidths.create(
      node.partWidth,
      node.hostWidth,
      false,
      { curve: shared.curve, part, host, diff: node.kind === "diff" },
    );
    if (typeof width === "string") return { contract: "width", detail: width };
    const first: AutoMovieSolidIntersection.IPoint = shared.curve.points[0]!;
    return {
      join: {
        seed: { phi: first.phi, s: first.s, y: first.y, theta: first.theta, face },
        parameter: { kind: "arc" },
        count: node.count,
        tolerance: node.tolerance * S,
        grazing: node.grazing,
        curve: shared.curve,
        toward: shared.toward,
        width,
      },
      shared,
    };
  }
}
