import { Assembly } from "../Assembly";
import type { Frame } from "../Frame";
import { block } from "./block";
import { at } from "./at";
import { edgesOf } from "./edgesOf";
import type { Glazing } from "./Glazing";

/** A folded 0.002m cassette between the two standard window levels. The
 * lower head and upper sill are derived from the shared storey datum; the
 * small offsets below are the authored cassette section, measured from those
 * window edges. Panels split at upper inner mullions outside the end seals. */
export function spandrel(a: Assembly, f: Frame, windows: Glazing[], lowerHead: number, upperSill: number): void {
  const bandBottom = lowerHead + 0.04;
  const bandTop = upperSill - 0.07;
  const plateBottom = bandBottom + 0.004;
  const plateTop = bandTop - 0.004;
  const clipCenter = (lowerHead + upperSill) / 2;
  const isAt = (actual: number, expected: number) => Math.abs(actual - expected) <= 1e-7;
  for (const lower of windows.filter(
    (w) => isAt(
      w.head,
      lowerHead
    )
  )) for (const upper of windows.filter((w) => isAt(w.sill, upperSill))) {
    const b0 = Math.max(lower.a, upper.a) - 0.04, b1 = Math.min(lower.b, upper.b) + 0.04;
    if (b1 <= b0) continue;
    const splits = edgesOf(upper).slice(1, -1).filter(
      (u) => u >= b0 + 0.08 - 1e-9 && u <= b1 - 0.08 + 1e-9
    );
    const lines = [b0, ...splits, b1];
    const id = f.id + "-spandrel-" + upper.id;
    for (const [j, line] of lines.entries()) {
      // Side seals own the full band height between panels and at both ends.
      const s0 = j === 0 ? line : line - 0.002, s1 = j === lines.length - 1 ? line : line + 0.002;
      block(
        a,
        f,
        id + "-seal-side-" + j,
        "house",
        "seal",
        s0,
        s1,
        bandBottom,
        bandTop,
        0.120,
        0.138
      );
    }
    for (let j = 0; j < lines.length - 1; j++) {
      const p0 = lines[j] + 0.002, p1 = lines[j + 1] - 0.002, pid = id + "-panel-" + j;
      block(
        a,
        f,
        pid + "-plate",
        "house",
        "cassette",
        p0,
        p1,
        plateBottom,
        plateTop,
        0.138,
        0.140
      );
      block(
        a,
        f,
        pid + "-return-a",
        "house",
        "cassette",
        p0,
        p0 + 0.002,
        plateBottom,
        plateTop,
        0.120,
        0.138
      );
      block(
        a,
        f,
        pid + "-return-b",
        "house",
        "cassette",
        p1 - 0.002,
        p1,
        plateBottom,
        plateTop,
        0.120,
        0.138
      );
      block(
        a,
        f,
        pid + "-return-top",
        "house",
        "cassette",
        p0 + 0.002,
        p1 - 0.002,
        plateTop - 0.002,
        plateTop,
        0.120,
        0.138
      );
      const slots = [0.25, 0.75].map((q) => p0 + (p1 - p0) * q);
      const cuts = [
        p0 + 0.002,
        ...slots.flatMap((q) => [q - 0.005, q + 0.005]),
        p1 - 0.002,
      ];
      for (let k = 0; k < cuts.length; k += 2) block(
        a,
        f,
        pid + "-return-bottom-" + k / 2,
        "house",
        "cassette",
        cuts[k],
        cuts[k + 1],
        plateBottom,
        plateBottom + 0.002,
        0.120,
        0.138
      );
      for (const [k, q] of slots.entries()) {
        // Drain slot: the bottom return keeps only its two faces around the opening.
        block(
          a,
          f,
          pid + "-slot-" + k + "-inner",
          "house",
          "cassette",
          q - 0.005,
          q + 0.005,
          plateBottom,
          plateBottom + 0.002,
          0.120,
          0.122
        );
        block(
          a,
          f,
          pid + "-slot-" + k + "-outer",
          "house",
          "cassette",
          q - 0.005,
          q + 0.005,
          plateBottom,
          plateBottom + 0.002,
          0.137,
          0.138
        );
        const cw = Math.min(0.05, (p1 - p0) / 6);
        block(
          a,
          f,
          pid + "-clip-" + k,
          "house",
          "metal",
          q - cw / 2,
          q + cw / 2,
          clipCenter - 0.01,
          clipCenter + 0.01,
          0.120,
          0.138
        );
        a.rod(
          pid + "-anchor-" + k,
          "house",
          "steel",
          at(f, q, clipCenter, 0.100),
          at(f, q, clipCenter, 0.138),
          0.003
        );
      }
      block(
        a,
        f,
        pid + "-seal-top",
        "house",
        "seal",
        p0,
        p1,
        plateTop,
        bandTop,
        0.120,
        0.140
      );
      block(
        a,
        f,
        pid + "-seal-bottom",
        "house",
        "seal",
        p0,
        p1,
        bandBottom,
        plateBottom,
        0.120,
        0.122
      );
    }
  }
}
