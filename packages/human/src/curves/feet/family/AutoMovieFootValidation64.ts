import type { IAutoMovieFootDimensions64 as D } from "./IAutoMovieFootDimensions64";

/** Check the internal dimensional recipe before consuming a current ankle. */
export namespace AutoMovieFootValidation64 {
  /**
   * Check finite numeric leaves, five toe recipes, four shared saddles and named fans.
   * Toe row fractions must increase below one and leave positive tip extent.
   * This validates the sparse recipe shape; actual ankle topology and placement are
   * checked during generation. Missing malformed containers may throw naturally,
   * and biological ranges or global nonintersection are not established.
   */
  export function parameters(value: D.Parameters): void {
    function finite(v: unknown): void {
      if (typeof v === "number" && !Number.isFinite(v))
        throw new Error("Finite foot measurements required");
      if (Array.isArray(v)) v.forEach(finite);
      else if (v !== null && typeof v === "object")
        Object.values(v).forEach(finite);
    }
    finite(value);
    for (const side of ["left", "right"] as const) {
      const p: D.Side = value.sides[side];
      if (!value.bindings[side].bone || !value.bindings[side].boundaryId)
        throw new Error("Explicit consumer bone and ankle ID required");
      for (const n of ["1", "2", "3", "4", "5"]) {
        const toe: D.Toe = p.toes[n]!;
        if (
          !toe ||
          !(toe.breadth_mm > 0) ||
          !(toe.thickness_mm > 0) ||
          !(toe.rootGap_mm >= 0) ||
          !(toe.projectedExtentAfterWeb_mm > toe.rootGap_mm)
        )
          throw new Error("Five positive independent toe dimensions required");
        const profiles: D.ToeProfile[] = Object.values(toe.profiles).sort(
          (a: D.ToeProfile, b: D.ToeProfile): number => a.fraction - b.fraction,
        );
        if (
          profiles.length < 2 ||
          profiles.some(
            (q: D.ToeProfile, i: number): boolean =>
              q.fraction < 0 ||
              q.fraction >= 1 ||
              (i > 0 && q.fraction <= profiles[i - 1]!.fraction) ||
              !(q.breadthRatio > 0) ||
              !(q.thicknessRatio > 0),
          )
        )
          throw new Error(
            "Distinct increasing toe profiles before actual tip required",
          );
        if (!p.branches.fan[n])
          throw new Error("Each toe needs a named parent fan");
      }
      if (
        Object.keys(p.toes).length !== 5 ||
        Object.keys(p.branches.saddles)
          .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
          .join(",") !== "1,2,3,4"
      )
        throw new Error("Five toes and four shared web saddles required");
      if (Object.keys(p.courses).length < 2)
        throw new Error("Sparse named main courses required");
    }
  }
}
