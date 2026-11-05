import { AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { HumanDebugViewParts } from "./HumanDebugViewParts";

/** Points of each top section ring. */
const RING: number = 48;

/**
 * Each built part's view curves placed in 3D, in the person's millimetres converted to metres, one
 * colour per part.
 *
 * At every emitted station of a part's loft, its frame (origin on the axis, chart axes `u` and `v`)
 * places the box the four outlines give: the front pair's edges at `origin + u e0` and
 * `origin - u e2` and the side pair's at `origin + v e1` and `origin - v e3`. Joined over the
 * stations, each edge is the outline curve the part's front or side view draws, carried by its own
 * frame, so a leaning part draws its views leaning. The top is the section rings at the stations of
 * the part's outline knots (its named sites), where the fullness owner speaks; the axis is the
 * origins. Ids are `human.construction.view.<part>/<front.pos|front.neg|side.pos|side.neg|top.<k>|axis>`.
 *
 * Colours are equal steps of the golden angle in hue, so neighbours in the part list differ.
 */
export namespace HumanDebugViewCurves {
  /** Curve id namespace of the compared parts. */
  export const PREFIX: string = "human.construction.view.";

  /**
   * The curves and the legend.
   *
   * @param built The person's parts.
   * @returns Curves in metres and one legend entry per part with any curve.
   */
  export function of(built: HumanDebugViewParts.IOutput): {
    curves: IHumanDebugDocument.ICurve[];
    legend: { label: string; colour: string }[];
  } {
    const curves: IHumanDebugDocument.ICurve[] = [];
    const legend: { label: string; colour: string }[] = [];
    const k: number = built.scale / 1000;
    built.parts.forEach((p: HumanDebugViewParts.IPart, index: number): void => {
      const sections: typeof p.loft.sections = p.loft.sections;
      if (sections.length < 2) return;
      const colour: string = hue(index);
      const id: string = PREFIX + p.name + "/";
      const place = (o: readonly number[], d: readonly number[], r: number): IHumanDebugDocument.Point => [
        (o[0]! + d[0]! * r) * k,
        (o[1]! + d[1]! * r) * k,
        (o[2]! + d[2]! * r) * k,
      ];
      const edge = (name: string, axis: "u" | "v", q: 0 | 1 | 2 | 3, sign: 1 | -1): void => {
        curves.push({
          id: id + name,
          closed: false,
          points: sections.map((s: (typeof sections)[number]): IHumanDebugDocument.Point => place(s.frame.origin, s.frame[axis], sign * s.section.box.extents[q])),
          colour,
        });
      };
      edge("front.pos", "u", 0, 1);
      edge("front.neg", "u", 2, -1);
      edge("side.pos", "v", 1, 1);
      edge("side.neg", "v", 3, -1);
      curves.push({
        id: id + "axis",
        closed: false,
        points: sections.map((s: (typeof sections)[number]): IHumanDebugDocument.Point => place(s.frame.origin, [0, 0, 0], 0)),
        colour,
      });
      const sites: Set<number> = new Set(p.part.front.positive.knots.map((knot: IAutoMovieViewPart.IKnot): number => knot.station));
      let n: number = 0;
      for (const s of sections) {
        if (!sites.has(s.station)) continue;
        const points: IHumanDebugDocument.Point[] = [];
        for (let i: number = 0; i < RING; i++) {
          const phi: number = (2 * Math.PI * i) / RING;
          const r: number = AutoMovieViewSection.radius(s.section, phi)[0];
          const d: number[] = [0, 1, 2].map((c: number): number => Math.cos(phi) * s.frame.u[c]! + Math.sin(phi) * s.frame.v[c]!);
          points.push(place(s.frame.origin, d, r));
        }
        curves.push({ id: id + "top." + n++, closed: true, points, colour });
      }
      legend.push({ label: p.name, colour });
    });
    return { curves, legend };
  }

  /**
   * The view of a compared curve and its part, read from its id.
   *
   * @param id Curve id.
   * @returns The part's name and `front`, `side`, `top` or `axis`; null for another curve.
   */
  export function view(id: string): { part: string; view: "front" | "side" | "top" | "axis" } | null {
    if (!id.startsWith(PREFIX)) return null;
    const at: number = id.lastIndexOf("/");
    const tail: string = id.slice(at + 1);
    return { part: id.slice(PREFIX.length, at), view: tail === "axis" ? "axis" : (tail.slice(0, tail.indexOf(".")) as "front" | "side" | "top") };
  }

  /**
   * The label of a compared curve and the point it stands at: `<part> · <view>`, the outline edges
   * (`front+`, `front-`, `side+`, `side-`) at their last station, where the part ends and the edges
   * of one view stand apart, the axis at its first, and the top at its first ring's `+u` point
   * (one label per part; the other rings carry none).
   *
   * @param id Curve id.
   * @param count The curve's point count.
   * @returns The text and the point's index, or null for a curve that carries no label.
   */
  export function label(id: string, count: number): { text: string; index: number } | null {
    const read: ReturnType<typeof view> = view(id);
    if (read === null || count === 0) return null;
    const tail: string = id.slice(id.lastIndexOf("/") + 1);
    const names: Record<string, string> = { "front.pos": "front+", "front.neg": "front-", "side.pos": "side+", "side.neg": "side-", axis: "axis", "top.0": "top" };
    const name: string | undefined = names[tail];
    if (name === undefined) return null;
    return { text: read.part + " · " + name, index: tail === "axis" || tail === "top.0" ? 0 : count - 1 };
  }

  /** A saturated colour `rrggbb` for the part at an index, by the golden angle in hue. */
  function hue(index: number): string {
    const h: number = (index * 137.508) % 360;
    const s: number = 0.85;
    const l: number = index % 2 === 0 ? 0.45 : 0.55;
    const f = (n: number): number => {
      const k: number = (n + h / 30) % 12;
      return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [f(0), f(8), f(4)].map((c: number): string => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
  }
}
