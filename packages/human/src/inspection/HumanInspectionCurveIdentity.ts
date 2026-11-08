/** Stable source display identity and palette, independent of source acquisition or geometry. */
export namespace HumanInspectionCurveIdentity {
  /** Existing compared-original ID namespace. */
  export const PREFIX: string = "human.construction.view.";

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
  export function colour(index: number): string {
    const h: number = (index * 137.508) % 360;
    const s: number = 0.85;
    const l: number = index % 2 === 0 ? 0.45 : 0.55;
    const f: (n: number) => number = (n: number): number => {
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


}
