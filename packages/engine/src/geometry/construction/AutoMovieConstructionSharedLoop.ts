import type {
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionPortCurve,
  IAutoMovieConstructionSharedLoop,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidJoin,
  IAutoMovieSolidSharedCurve,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieConstructionPortCurve } from "./AutoMovieConstructionPortCurve";
import { AutoMovieConstructionViews } from "./AutoMovieConstructionViews";
import { AutoMovieConstructionWidths } from "./AutoMovieConstructionWidths";
import { AutoMovieSolidSharedCurve } from "./AutoMovieSolidSharedCurve";

/**
 * A mixed join's record as the kernel's join input: the declared loop of
 * `IAutoMovieConstructionJoin.loop` turned into the shared contact, its width
 * laws and its sides, in millimetres.
 *
 * The loop is read through the port curve's one owner
 * (`AutoMovieConstructionPortCurve.curve`): the ellipse on the host face's
 * chart with its per-column shares joined by the periodic cubic, with two exact
 * clock derivatives. `AutoMovieSolidSharedCurve` maps it through the host and
 * drops its foot on the part; `AutoMovieConstructionWidths` reads each width at
 * the curve's points, the fold's turn among them; the result is what
 * `AutoMovieSolidBody.merge` takes as a join whose curve is supplied, so the
 * rails, the blend, the trims and the faces are the traced join's own.
 */
export namespace AutoMovieConstructionSharedLoop {
  /**
   * Prepare a mixed join's kernel input.
   *
   * @param node The join, with its `loop`.
   * @param part The part's face.
   * @param host The host's atlas.
   * @param face The atlas face the loop lies on, `seed.hostFace`'s.
   * @returns The input, or the refusal.
   */
  export function create(
    node: IAutoMovieConstructionJoin,
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    face: number,
  ):
    | IAutoMovieConstructionSharedLoop.IPrepared
    | IAutoMovieConstructionSharedLoop.IRefusal {
    const S: number = AutoMovieConstructionViews.SCALE;
    const loop: IAutoMovieConstructionJoin["loop"] = node.loop;
    if (loop === undefined)
      return { contract: "shared loop", detail: "the join declares no loop" };
    if (
      !(
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
    if (!(node.count >= 8 && node.count % 4 === 0))
      return {
        contract: "shared loop",
        detail: `the count ${node.count} is not a multiple of 4 of at least 8`,
      };
    const curve: IAutoMovieConstructionPortCurve.ICurve | string =
      AutoMovieConstructionPortCurve.curve(
        loop,
        node.count,
        host.faces[face]!.period,
      );
    if (typeof curve === "string")
      return { contract: "shared loop", detail: curve };

    // The contact: the loop through the host, its foot on the part from the seed's part point when the seed states one.
    const start: [number, number] | undefined =
      node.seed.type === "point"
        ? [node.seed.part[0] * S, node.seed.part[1]]
        : undefined;
    const made: IAutoMovieSolidSharedCurve.IResult =
      AutoMovieSolidSharedCurve.create({
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
      const first: { contract: string; detail: string } | undefined =
        made.diagnostics[0];
      return {
        contract: first?.contract ?? "shared loop",
        detail: first?.detail ?? "the contact could not be built",
      };
    }
    const shared: IAutoMovieSolidSharedCurve.IShared = made.shared;

    // The widths, read on the contact: its clock is not the part's phase, so both rails offset square to it.
    const width: IAutoMovieSolidJoin.IInput["width"] | string =
      AutoMovieConstructionWidths.create(
        node.partWidth,
        node.hostWidth,
        false,
        { curve: shared.curve, part, host, diff: node.kind === "diff" },
      );
    if (typeof width === "string") return { contract: "width", detail: width };
    const first: IAutoMovieSolidIntersection.IPoint = shared.curve.points[0]!;
    return {
      join: {
        seed: {
          phi: first.phi,
          s: first.s,
          y: first.y,
          theta: first.theta,
          face,
        },
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
