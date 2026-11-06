import {
  type AutoMovieLoftContract,
  AutoMovieViewCurves,
  type AutoMovieViewLoft,
  AutoMovieViewOutline,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { HumanDebugViewParts } from "./HumanDebugViewParts";

/** Points of each top section ring. */
const RING: number = 48;

/** Display subdivisions between source knots, extrema and declared stations; not a geometric acceptance tolerance. */
const STEPS: number = 16;

/**
 * Each built part's view curves placed in 3D, in the person's millimetres converted to metres, one
 * colour per part.
 *
 * Front and side read the engine's original source evaluator in the actual axis frame, independently
 * of section/fullness success. Display polylines include every named knot, scalar extremum, finite
 * pole endpoint and declared station, including an open end's source tangent extension, with subdivisions between them.
 * They are not the final loft's coefficient curves. A failed source edge is explicitly diagnosed
 * and withheld rather than connected across an invalid reading; other valid edges remain visible.
 * The axis reads its own source frames. Top rings still belong to the raw section/fullness owner:
 * `top.<k>` names the front-positive knot index, and a missing non-pole section is diagnosed without
 * renumbering later rings. Ids are `human.construction.view.<part>/<front.pos|front.neg|side.pos|side.neg|top.<k>|axis>`.
 *
 * Colours are equal steps of the golden angle in hue, so neighbours in the part list differ.
 *
 * @evidence contracts/common.md#principled-implementation Reads the shared original-outline evaluator and actual axis independently of surviving sections; raw top rings retain their section owner's admission and stable knot identity.
 * @evidence contracts/common.md#clear-and-simple-design Separates original edges/axis from section-owned top rings and returns display failures beside the curves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Copies no spline or pole algorithm, clamps no overshoot and replaces no failed edge with a section polyline.
 * @evidence contracts/common.md#meaningful-documentation States source versus final ownership, finite endpoint treatment, sampling and explicit missing support.
 * @evidence contracts/performance.md#efficient-algorithms Four shared preparations per part plus source readings at O(K) display stations; each shared reading costs its outline's knot scan. Raw top rings use 48 radius readings each.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses each prepared source edge across its readings and the source station union for the axis; no person generation occurs here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fresh curve/legend/diagnostic arrays proportional to display samples; borrowed parts and lofts stay unmutated and no renderer or global cache is retained.
 */
export namespace HumanDebugViewCurves {
  /** Curve id namespace of the compared parts. */
  export const PREFIX: string = "human.construction.view.";

  /**
   * The curves and the legend.
   *
   * @param built The person's parts.
   * @returns Curves in metres, one legend entry per part with any curve and explicit display failures.
   *
   * @evidence contracts/common.md#principled-implementation Places shared source evaluations and source-axis origins independently of loft admission; raw top rings keep the front-positive knot index.
   * @evidence contracts/common.md#clear-and-simple-design Returns display failures separately from the untouched production diagnostics on built.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed reading withholds that edge and reports its cause rather than drawing across it or substituting surviving sections.
   * @evidence contracts/common.md#meaningful-documentation Names units, source/section ownership, stable ids and missing-support behavior.
   * @evidence contracts/performance.md#efficient-algorithms Sorts K anchors per edge in O(K log K), then reads at most 16K display stations with the shared knot-scan evaluator. Raw top lookup scans admitted sections per source knot and reads 48 radii per admitted ring.
   * @evidence contracts/performance.md#reuse-equivalent-work Prepares each scalar source once, reuses its anchors for the axis and reads existing raw sections without a new person or loft.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owns fresh returned arrays and call-local prepared sources and station sets. Borrowed raw part/loft records remain unmutated.
   */
  export function of(built: HumanDebugViewParts.IOutput): {
    curves: IHumanDebugDocument.ICurve[];
    legend: { label: string; colour: string }[];
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  } {
    const curves: IHumanDebugDocument.ICurve[] = [];
    const legend: { label: string; colour: string }[] = [];
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const k: number = built.scale / 1000;
    built.parts.forEach((p: HumanDebugViewParts.IPart, index: number): void => {
      const sections: AutoMovieViewLoft.IStation[] = p.loft?.sections ?? [];
      const colour: string = hue(index);
      const id: string = PREFIX + p.name + "/";
      const before: number = curves.length;
      const source: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(
        p.part,
      );
      diagnostics.push(...source.diagnostics);
      const report = (detail: string): void => {
        diagnostics.push({
          producer: "view." + p.name,
          level: 2,
          contract: "source display",
          detail,
        });
      };
      const place = (
        o: readonly number[],
        d: readonly number[],
        r: number,
      ): IHumanDebugDocument.Point => [
        (o[0]! + d[0]! * r) * k,
        (o[1]! + d[1]! * r) * k,
        (o[2]! + d[2]! * r) * k,
      ];
      const axisStations: Set<number> = new Set(
        p.part.stations.filter(Number.isFinite),
      );
      for (const edge of source.curves) {
        if (edge.outline === null) continue;
        const ends: Readonly<AutoMovieViewOutline.IEnds> = edge.outline.ends;
        const anchors: number[] = [
          ...edge.outline.knots.map(
            (knot: IAutoMovieViewPart.IKnot): number => knot.station,
          ),
          ...AutoMovieViewOutline.criticalStations(edge.outline),
          ...p.part.stations.filter(
            (s: number): boolean =>
              Number.isFinite(s) &&
              (ends.bottom === undefined || s >= ends.bottom) &&
              (ends.top === undefined || s <= ends.top),
          ),
        ];
        const stations: number[] = sampled(anchors);
        anchors.forEach((s: number): void => {
          axisStations.add(s);
        });
        const points: IHumanDebugDocument.Point[] = [];
        let failure: string | null = null;
        for (const station of stations) {
          const read: AutoMovieViewCurves.IReading | string =
            AutoMovieViewCurves.at(edge, p.part.axis, station);
          if (typeof read === "string") {
            failure = read;
            break;
          }
          points.push(place(read.point, [0, 0, 0], 0));
        }
        if (failure !== null) report(failure);
        else
          curves.push({
            id:
              id +
              edge.name.replace("positive", "pos").replace("negative", "neg"),
            closed: false,
            points,
            colour,
          });
      }
      const axis: IHumanDebugDocument.Point[] = [];
      for (const station of sampled([...axisStations])) {
        try {
          const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
            p.part.axis.at(station);
          if (!frame.origin.every(Number.isFinite)) {
            report("axis at " + station + " has a nonfinite origin");
            axis.length = 0;
            break;
          }
          axis.push(place(frame.origin, [0, 0, 0], 0));
        } catch (error) {
          report(
            "axis at " +
              station +
              ": " +
              (error instanceof Error
                ? (error.stack ?? error.message)
                : String(error)),
          );
          axis.length = 0;
          break;
        }
      }
      if (axis.length >= 2)
        curves.push({ id: id + "axis", closed: false, points: axis, colour });
      p.part.front.positive.knots.forEach(
        (knot: IAutoMovieViewPart.IKnot, n: number): void => {
          const s: (typeof sections)[number] | undefined = sections.find(
            (section: (typeof sections)[number]): boolean =>
              section.station === knot.station,
          );
          if (s === undefined) {
            const pole: boolean =
              ((p.part.pole === "bottom" || p.part.pole === "both") &&
                knot.station === p.part.stations[0]) ||
              ((p.part.pole === "top" || p.part.pole === "both") &&
                knot.station === p.part.stations[p.part.stations.length - 1]);
            if (!pole)
              report(
                "top." +
                  n +
                  " at " +
                  knot.station +
                  " has no admitted raw fullness section",
              );
            return;
          }
          const points: IHumanDebugDocument.Point[] = [];
          for (let i: number = 0; i < RING; i++) {
            const phi: number = (2 * Math.PI * i) / RING;
            const r: number = AutoMovieViewSection.radius(s.section, phi)[0];
            const d: number[] = [0, 1, 2].map(
              (c: number): number =>
                Math.cos(phi) * s.frame.u[c]! + Math.sin(phi) * s.frame.v[c]!,
            );
            points.push(place(s.frame.origin, d, r));
          }
          curves.push({ id: id + "top." + n, closed: true, points, colour });
        },
      );
      if (curves.length !== before) legend.push({ label: p.name, colour });
    });
    return { curves, legend, diagnostics };
  }

  /**
   * The view of a compared curve and its part, read from its id.
   *
   * @param id Curve id.
   * @returns The part's name and `front`, `side`, `top` or `axis`; null for another curve.
   */
  export function view(
    id: string,
  ): { part: string; view: "front" | "side" | "top" | "axis" } | null {
    if (!id.startsWith(PREFIX)) return null;
    const at: number = id.lastIndexOf("/");
    const tail: string = id.slice(at + 1);
    return {
      part: id.slice(PREFIX.length, at),
      view:
        tail === "axis"
          ? "axis"
          : (tail.slice(0, tail.indexOf(".")) as "front" | "side" | "top"),
    };
  }

  /**
   * The label of a compared curve and the point it stands at: `<part> · <view>`, the outline edges
   * (`front+`, `front-`, `side+`, `side-`) at their last station, where the part ends and the edges
   * of one view stand apart, the axis at its first, and each top ring at its own `+u` point
   * with its knot index, so an isolated ring remains identifiable when top.0 is a pole or missing.
   *
   * @param id Curve id.
   * @param count The curve's point count.
   * @returns The text and the point's index, or null for a curve that carries no label.
   *
   * @evidence contracts/common.md#principled-implementation Reads the actual id suffix, keeping every top ring's source-knot index in its label; anchors stay on supplied display points.
   * @evidence contracts/common.md#clear-and-simple-design A label contains identity and anchor index only, independently of source evaluation and surface framing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent curve or empty point list gains no fabricated identity or anchor.
   * @evidence contracts/common.md#meaningful-documentation States outline end, axis start and top-ring +u anchor meanings.
   * @evidence contracts/performance.md#efficient-algorithms Parses an id in O(L) for L characters, with a fixed-size suffix table and no geometry scan.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each requested label is a pure string/index read with no effectful work to share.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh text/index record or null and retains no curve or renderer resource.
   */
  export function label(
    id: string,
    count: number,
  ): { text: string; index: number } | null {
    const read: ReturnType<typeof view> = view(id);
    if (read === null || count === 0) return null;
    const tail: string = id.slice(id.lastIndexOf("/") + 1);
    const names: Record<string, string> = {
      "front.pos": "front+",
      "front.neg": "front-",
      "side.pos": "side+",
      "side.neg": "side-",
      axis: "axis",
    };
    const name: string | undefined = /^top\.\d+$/.test(tail)
      ? tail
      : names[tail];
    if (name === undefined) return null;
    return {
      text: read.part + " · " + name,
      index: tail === "axis" || tail.startsWith("top.") ? 0 : count - 1,
    };
  }

  /** A saturated colour `rrggbb` for the part at an index, by the golden angle in hue. */
  function hue(index: number): string {
    const h: number = (index * 137.508) % 360;
    const s: number = 0.85;
    const l: number = index % 2 === 0 ? 0.45 : 0.55;
    const f = (n: number): number => {
      const k: number = (n + h / 30) % 12;
      return (
        l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
      );
    };
    return [f(0), f(8), f(4)]
      .map((c: number): string =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  }

  /**
   * Display stations, including all supplied anchors exactly; sampling is not a world-curve error bound.
   *
   * Deduplicates finite knots, extrema and declared stations, retaining each exactly and inserting
   * 15 uniform interior stations per interval. This chooses display stations without changing source
   * interpolation, clamping extrema or deciding section admission. Two sorts of at most 16K numbers
   * cost O(K log K). The result is a fresh O(K) array; temporary sets end with the call.
   */
  function sampled(anchors: readonly number[]): number[] {
    const sorted: number[] = [...new Set(anchors.filter(Number.isFinite))].sort(
      (a: number, b: number): number => a - b,
    );
    const stations: Set<number> = new Set(sorted);
    for (let i: number = 1; i < sorted.length; i++)
      for (let j: number = 1; j < STEPS; j++)
        stations.add(
          sorted[i - 1]! + ((sorted[i]! - sorted[i - 1]!) * j) / STEPS,
        );
    return [...stations].sort((a: number, b: number): number => a - b);
  }
}
