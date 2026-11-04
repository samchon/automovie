import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyBox } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyBox";
import type { IAutoMovieHumanBodyMeasures } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyMeasures";
import type { AutoMovieLoftContract } from "@automovie/engine";
import type { IAutoMovieHumanParameters } from "../../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/structures/body/IAutoMovieHumanBodyAnatomy";
import { HumanPeople } from "../../../internal/HumanPeople";

/** A trunk level and its three anatomy fields, written out here rather than read from the library. */
const LEVELS: readonly { level: string; breadth: keyof IAutoMovieHumanBodyAnatomy; depth: keyof IAutoMovieHumanBodyAnatomy; girth: keyof IAutoMovieHumanBodyAnatomy }[] = [
  { level: "chest", breadth: "chestBreadth", depth: "chestDepth", girth: "chestCircumference" },
  { level: "waist", breadth: "waistBreadth", depth: "waistDepth", girth: "waistCircumference" },
  { level: "hip", breadth: "hipBreadth", depth: "buttockDepth", girth: "hipCircumference" },
];

/**
 * Slack of the range test, mm: floating-point rounding of a default held at a
 * range end, far below any measurement error.
 */
const ROUNDING: number = 1e-6;

/**
 * Every trunk level's girth lies inside the box of its breadth and depth, the
 * range a convex section touching that box can take, and an input that breaks
 * it is reported at the input.
 *
 * Scenarios:
 * 1. Every person of `HumanPeople.everyone()` (the four references at their measured values and every population end, both sexes, with the new breadths and depths defaulted) resolves with each level's girth inside `2 sqrt(W^2 + D^2)` to `2 (W + D)` and no diagnostic.
 * 2. f1 with all three measures of a level supplied and consistent (the girth at the middle of its box's range) reads them back unchanged, with no diagnostic.
 * 3. f1 with a level's girth supplied 5 % above `2 (W + D)` gives exactly one diagnostic naming that level, and the level's section takes the box (fullness 1); 5 % below the rhombus gives one naming the level, the section at the rhombus (fullness 0). These are the made contradictions of each sign that prove the check red.
 * 4. f1 with one of W, D and the girth omitted and the other two supplied where the omitted measure's survey line would leave the range (one side at 0.45 of a girth 0.9 times f1's, so the rhombus nearly reaches the girth; or both sides 1.5 times f1's beside a stature-line girth), resolves the omitted one inside the range with no diagnostic and every supplied value unmoved; likewise with both W and D omitted beside a girth 1.6 and 0.6 times f1's.
 *
 * The calibration seeds the figure's diagnostics with `AutoMovieHumanBodyBox.diagnose` (`AutoMovieHumanBodyLaw.calibrate`); generating a figure to read it there is the universality tests' work.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves `AutoMovieHumanBodyAnatomy.resolve` and reads `AutoMovieHumanBodyBox.diagnose` and `AutoMovieHumanBodyBox.of` on public inputs: every person as authored, and f1 with each level's three measures supplied, contradicted on either side, or partly omitted. It fails with every person, level and case that misses, listing them all. It catches a default placed outside the range a person's own measures leave, a supplied value the resolver moves, a contradiction left unreported or reported at the wrong level or more than once, and a section that does not take the nearest end of the range.
 * @evidence contracts/testing.md#independent-expectations The range is computed here from its geometry, the rhombus through the four touch points and the box itself (`2 hypot(W, D)` and `2 (W + D)`), not from the library's range; the made inputs are fixed fractions of that range. Oracle limits: the range is the convex taut tape's; whether a real section's fullness inside it is right is the trunk's fullness solve and its tests.
 * @evidence contracts/testing.md#distinguishing-cases Consistent (scenario 2) against contradicted on each side (scenario 3) at each level; each single omission and the double omission (scenario 4); both sexes at both population ends and four measured references (scenario 1). A contradiction at one level must not report another.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_box_consistency`, reading public inputs only, with no generation, renderer, browser or GPU.
 */
export function test_human_input_box_consistency(): void {
  const failed: string[] = [];
  const range = (w: number, d: number): [number, number] => [2 * Math.hypot(w, d), 2 * (w + d)];
  const inside = (m: IAutoMovieHumanBodyMeasures, l: (typeof LEVELS)[number]): boolean => {
    const [low, high] = range(m[l.breadth] as number, m[l.depth] as number);
    const g: number = m[l.girth] as number;
    return g >= low - ROUNDING && g <= high + ROUNDING;
  };
  const resolved = (params: IAutoMovieHumanParameters, anatomy: IAutoMovieHumanBodyAnatomy): IAutoMovieHumanBodyMeasures =>
    AutoMovieHumanBodyAnatomy.resolve({ ...params, body: { ...params.body, anatomy } });

  // 1. Every person as authored is consistent at every level.
  for (const name of HumanPeople.everyone()) {
    const m: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(HumanPeople.params(name));
    for (const l of LEVELS)
      if (!inside(m, l))
        failed.push(`${name} ${l.level}: girth ${(m[l.girth] as number).toFixed(1)} outside ${range(m[l.breadth] as number, m[l.depth] as number).map((v: number): string => v.toFixed(1)).join(" to ")}`);
    const notes: AutoMovieLoftContract.IDiagnostic[] = AutoMovieHumanBodyBox.diagnose(m);
    if (notes.length !== 0) failed.push(`${name}: ${notes.length} diagnostics, ${notes.map((n: AutoMovieLoftContract.IDiagnostic): string => n.detail).join("; ")}`);
  }

  const f1: IAutoMovieHumanParameters = HumanPeople.params("f1");
  const base: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(f1);
  for (const l of LEVELS) {
    const w: number = base[l.breadth] as number;
    const d: number = base[l.depth] as number;
    const [low, high] = range(w, d);

    // 2. Consistent and supplied: read as given, no diagnostic.
    const consistent: IAutoMovieHumanBodyAnatomy = { ...f1.body.anatomy, [l.breadth]: w, [l.depth]: d, [l.girth]: (low + high) / 2 };
    const read: IAutoMovieHumanBodyMeasures = resolved(f1, consistent);
    for (const field of [l.breadth, l.depth, l.girth])
      if (read[field] !== consistent[field]) failed.push(`f1 ${l.level} supplied ${field} ${String(consistent[field])} read back as ${String(read[field])}`);
    if (AutoMovieHumanBodyBox.diagnose(read).length !== 0) failed.push(`f1 ${l.level}: a consistent supplied box is reported`);

    // 3. Contradictions of each sign: one diagnostic naming the level, the
    // section at the nearest end.
    for (const [sign, girth, end, fullness] of [
      ["above the box", 1.05 * high, high, 1],
      ["below the rhombus", 0.95 * low, low, 0],
    ] as const) {
      const made: IAutoMovieHumanBodyMeasures = resolved(f1, { ...f1.body.anatomy, [l.breadth]: w, [l.depth]: d, [l.girth]: girth });
      const notes: AutoMovieLoftContract.IDiagnostic[] = AutoMovieHumanBodyBox.diagnose(made);
      if (notes.length !== 1 || !notes[0]!.detail.startsWith(`${l.level}:`) || notes[0]!.producer !== "human.inputs")
        failed.push(`f1 ${l.level} girth ${sign}: ${notes.length} diagnostics (${notes.map((n: AutoMovieLoftContract.IDiagnostic): string => n.detail).join("; ")}), not one naming ${l.level}`);
      const box: AutoMovieHumanBodyBox.IBox | undefined = AutoMovieHumanBodyBox.of(made).find((b: AutoMovieHumanBodyBox.IBox): boolean => b.level === l.level);
      if (box === undefined || Math.abs(box.tape - end) > ROUNDING || Math.abs(box.fullness - fullness) > 1e-9)
        failed.push(`f1 ${l.level} girth ${sign}: section takes ${box?.tape.toFixed(1)} mm (fullness ${box?.fullness.toFixed(3)}), not the ${sign === "above the box" ? "box" : "rhombus"} ${end.toFixed(1)}`);
    }

    // 4. One measure omitted beside two supplied at the edge of plausibility,
    // and both sides omitted beside a far girth: every default lands inside.
    const { [l.breadth]: _w, [l.depth]: _d, [l.girth]: _g, ...rest } = f1.body.anatomy;
    const cases: [string, IAutoMovieHumanBodyAnatomy][] = [
      ["breadth omitted, depth 0.45 of a girth 0.9 times f1's", { ...rest, [l.depth]: 0.405 * (base[l.girth] as number), [l.girth]: 0.9 * (base[l.girth] as number) }],
      ["depth omitted, breadth 0.45 of a girth 0.9 times f1's", { ...rest, [l.breadth]: 0.405 * (base[l.girth] as number), [l.girth]: 0.9 * (base[l.girth] as number) }],
      ["girth omitted, breadth and depth 1.5 times f1's", { ...rest, [l.breadth]: 1.5 * w, [l.depth]: 1.5 * d }],
      ["breadth and depth omitted, girth 1.6 times f1's", { ...rest, [l.girth]: 1.6 * (base[l.girth] as number) }],
      ["breadth and depth omitted, girth 0.6 times f1's", { ...rest, [l.girth]: 0.6 * (base[l.girth] as number) }],
    ];
    for (const [label, anatomy] of cases) {
      const m: IAutoMovieHumanBodyMeasures = resolved(f1, anatomy);
      if (!inside(m, l))
        failed.push(`f1 ${l.level} ${label}: girth ${(m[l.girth] as number).toFixed(1)} outside ${range(m[l.breadth] as number, m[l.depth] as number).map((v: number): string => v.toFixed(1)).join(" to ")}`);
      if (AutoMovieHumanBodyBox.diagnose(m).length !== 0) failed.push(`f1 ${l.level} ${label}: a defaulted measure is reported as a contradiction`);
      for (const field of [l.breadth, l.depth, l.girth])
        if (anatomy[field] !== undefined && m[field] !== anatomy[field]) failed.push(`f1 ${l.level} ${label}: supplied ${field} moved`);
    }
  }
  if (failed.length !== 0) throw new Error(`${failed.length} box consistency findings:\n${failed.join("\n")}`);
}
