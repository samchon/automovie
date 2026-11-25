import type {
  AutoMovieVector2Tuple,
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
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidSharedCurve } from "./AutoMovieSolidSharedCurve";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { orientAutoMovieSolidChart } from "./orientAutoMovieSolidChart";

/**
 * A mixed join's record as the kernel's join input: the declared loop of
 * `IAutoMovieConstructionJoin.loop` turned into the shared contact, its width
 * laws and its sides, in millimetres.
 *
 * The loop is read through the port curve's one owner
 * (`AutoMovieConstructionPortCurve.curve`): the ellipse on the host face's
 * chart with its per-column shares joined by the periodic cubic, with two exact
 * clock derivatives. `AutoMovieSolidSharedCurve` maps it through the host and
 * uses the paired part chart of an original source or projects the legacy port;
 * `AutoMovieConstructionWidths` reads each width at the curve's points, the
 * fold's turn among them; the result is what `AutoMovieSolidBody.merge` takes
 * as a join whose curve is supplied, so the rails, the blend, the trims and the
 * faces are the traced join's own.
 */
export namespace AutoMovieConstructionSharedLoop {
  /**
   * The explicitly observed chart polygon must be simple and its source must
   * return to its own chart.
   */
  function observedLoop(
    loop: IAutoMovieSolidSharedCurve.Loop,
    host: IAutoMovieSolidSurface,
    count: number,
    tolerance: number,
  ): string | null {
    const turn: number = 2 * Math.PI;
    const rows: ReturnType<IAutoMovieSolidSharedCurve.Loop>[] = [];
    try {
      for (let i: number = 0; i <= 2 * count; ++i) {
        const row: ReturnType<IAutoMovieSolidSharedCurve.Loop> = loop(
          (turn * i) / (2 * count),
        );
        if (
          ![...row.point, ...row.first, ...row.second].every(Number.isFinite) ||
          !(Math.hypot(...row.first) > 0)
        )
          return "the original chart 2-jet is unavailable at clock " + i;
        rows.push(row);
      }
    } catch (error: unknown) {
      if (error instanceof AutoMovieLoftAdmissionError) return error.message;
      throw error;
    }
    const ending: AutoMovieVector2Tuple = rows.pop()!.point;
    const points: AutoMovieVector2Tuple[] = rows.map(
      (row): AutoMovieVector2Tuple => row.point,
    );
    const first: AutoMovieVector2Tuple = points[0]!;
    const a: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
      host,
      ...first,
    );
    const b: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
      host,
      ...ending,
    );
    if (
      a === null ||
      b === null ||
      (host.period !== undefined &&
        Math.round((ending[1] - first[1]) / host.period) !== 0) ||
      !(
        AutoMovieSolidVector.norm(AutoMovieSolidVector.sub(a.p, b.p)) <=
        tolerance
      )
    )
      return "the original loop does not close on its one host chart";
    const sign = orientAutoMovieSolidChart;
    const contains = (
      a: AutoMovieVector2Tuple,
      b: AutoMovieVector2Tuple,
      p: AutoMovieVector2Tuple,
    ): boolean =>
      sign(a, b, p) === 0 &&
      p.every(
        (x: number, k: number): boolean =>
          x >= Math.min(a[k]!, b[k]!) && x <= Math.max(a[k]!, b[k]!),
      );
    for (const [i, from] of points.entries()) {
      const to: AutoMovieVector2Tuple = points[(i + 1) % points.length]!;
      const after: AutoMovieVector2Tuple = points[(i + 2) % points.length]!;
      if (
        (from[0] === to[0] && from[1] === to[1]) ||
        contains(from, to, after) ||
        contains(to, after, from)
      )
        return (
          "the original loop repeats or reverses a chart edge at clock " + i
        );
      for (let j: number = i + 2; j < points.length; ++j) {
        if (i === 0 && j + 1 === points.length) continue;
        const p: AutoMovieVector2Tuple = points[j]!,
          q: AutoMovieVector2Tuple = points[(j + 1) % points.length]!;
        if (
          (sign(from, to, p) * sign(from, to, q) < 0 &&
            sign(p, q, from) * sign(p, q, to) < 0) ||
          contains(from, to, p) ||
          contains(from, to, q) ||
          contains(p, q, from) ||
          contains(p, q, to)
        )
          return (
            "the original loop's observed chart edges " +
            i +
            " and " +
            j +
            " intersect"
          );
      }
    }
    return null;
  }

  /**
   * Prepare a mixed join's kernel input.
   *
   * @param node The join, with its `loop`.
   * @param part The part's face.
   * @param host The host's atlas.
   * @param face The atlas face the loop lies on, `seed.hostFace`'s.
   * @param sources The invocation's evaluated loop records, for explicit source
   *   keys.
   * @returns The input, or the refusal.
   */
  export function create(
    node: IAutoMovieConstructionJoin,
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    face: number,
    sources?: ReadonlyMap<string, IAutoMovieConstructionSharedLoop.ISource>,
  ):
    | IAutoMovieConstructionSharedLoop.IPrepared
    | IAutoMovieConstructionSharedLoop.IRefusal {
    const S: number = AutoMovieConstructionViews.SCALE;
    const loop: IAutoMovieConstructionJoin["loop"] = node.loop;
    if (loop === undefined)
      return { contract: "shared loop", detail: "the join declares no loop" };
    if (
      !(Number.isInteger(node.count) && node.count >= 8 && node.count % 4 === 0)
    )
      return {
        contract: "shared loop",
        detail: `the count ${node.count} is not a multiple of 4 of at least 8`,
      };
    let read: IAutoMovieSolidSharedCurve.Loop;
    let start: [number, number] | undefined;
    let partAt: IAutoMovieSolidSharedCurve.Loop | undefined;
    if ("source" in loop) {
      const record: IAutoMovieConstructionSharedLoop.ISource | undefined =
        sources?.get(loop.source);
      if (record === undefined)
        return {
          contract: "shared loop",
          detail: "the original shared loop source is absent: " + loop.source,
        };
      if (
        record.hostFace !== node.seed.hostFace ||
        record.partFace !== node.seed.partFace
      )
        return {
          contract: "shared loop",
          detail:
            "the original shared loop source belongs to different faces: " +
            loop.source,
        };
      if (record.kind === "refused")
        return { contract: "shared loop", detail: record.detail };
      if (
        typeof record.at !== "function" ||
        typeof record.partAt !== "function"
      )
        return {
          contract: "shared loop",
          detail:
            "the original shared loop source lacks both chart readers: " +
            loop.source,
        };
      read = record.at;
      partAt = record.partAt;
      const fault: string | null = observedLoop(
        read,
        host.faces[face]!,
        node.count,
        node.tolerance * S,
      );
      if (fault !== null) return { contract: "enclosed loop", detail: fault };
    } else {
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
      const curve: IAutoMovieConstructionPortCurve.ICurve | string =
        AutoMovieConstructionPortCurve.curve(
          loop,
          node.count,
          host.faces[face]!.period,
        );
      if (typeof curve === "string")
        return { contract: "shared loop", detail: curve };
      read = curve.at;
      start =
        node.seed.type === "point"
          ? [node.seed.part[0] * S, node.seed.part[1]]
          : undefined;
    }

    // The paired source owns both addresses. A seed starts the projection of a legacy port.
    const made: IAutoMovieSolidSharedCurve.IResult =
      AutoMovieSolidSharedCurve.create({
        part,
        host,
        face,
        loop: read,
        count: node.count,
        tolerance: node.tolerance * S,
        grazing: node.grazing,
        keep: node.kind === "merge" ? "outside" : "inside",
        ...(start === undefined ? {} : { start }),
        ...(partAt === undefined ? {} : { partAt }),
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
