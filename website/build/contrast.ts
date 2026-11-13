// Check the contrast of the design tokens.
//
// Reads `src/app/tokens.css`, takes the light and the dark value of every
// colour token, and computes the WCAG 2.2 contrast ratio of each pair
// DESIGN.md relies on: 4.5 for text on the surface it sits on, 3 for a
// control's border and the focus ring against the surfaces around them.
// `pnpm build` runs this, so a token changed below its bound stops the build.
import fs from "node:fs";
import path from "node:path";

/** A pair that must reach a ratio: the foreground token, the background token and the least ratio. */
const PAIRS: readonly (readonly [string, string, number])[] = [
  // Text on every surface it is set on.
  ["fg", "bg", 4.5],
  ["fg", "bg-panel", 4.5],
  ["fg", "bg-inset", 4.5],
  ["fg", "bg-hover", 4.5],
  ["fg-muted", "bg", 4.5],
  ["fg-muted", "bg-panel", 4.5],
  ["fg-muted", "bg-inset", 4.5],
  ["fg-muted", "bg-hover", 4.5],
  ["accent", "bg", 4.5],
  ["accent", "bg-panel", 4.5],
  ["accent", "accent-soft", 4.5],
  ["accent-fg", "accent-bg", 4.5],
  ["danger", "bg", 4.5],
  ["danger", "bg-panel", 4.5],
  ["danger", "danger-soft", 4.5],
  ["fg", "danger-soft", 4.5],
  ["fg-muted", "danger-soft", 4.5],
  ["success", "success-soft", 4.5],
  ["viewport-tag-fg", "viewport-tag-bg", 4.5],
  ["fg", "viewport", 4.5],

  // What is not text but must be seen: control borders and the focus ring.
  ["border-control", "bg", 3],
  ["border-control", "bg-panel", 3],
  ["border-control", "bg-inset", 3],
  ["focus", "bg", 3],
  ["focus", "bg-panel", 3],
  ["focus", "viewport", 3],
];

/** The relative luminance of an sRGB colour written `#rrggbb`. */
const luminance = (hex: string): number => {
  const channel = (at: number): number => {
    const value: number = parseInt(hex.slice(at, at + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

/** The colour tokens of one rule block: every `--am-<name>: #rrggbb;`. */
const tokens = (block: string): Map<string, string> =>
  new Map(
    [...block.matchAll(/--am-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map(
      (match: RegExpMatchArray): [string, string] => [match[1]!, match[2]!],
    ),
  );

const css: string = fs.readFileSync(
  path.resolve(__dirname, "..", "src", "app", "tokens.css"),
  "utf8",
);
const split: number = css.indexOf(":root.dark");
if (split === -1) throw new Error("tokens.css has no :root.dark block");
const light: Map<string, string> = tokens(css.slice(0, split));
const dark: Map<string, string> = new Map([
  ...light,
  ...tokens(css.slice(split)),
]);

let failed: boolean = false;
for (const [theme, values] of [
  ["light", light],
  ["dark", dark],
] as const)
  for (const [front, back, least] of PAIRS) {
    const a: string | undefined = values.get(front);
    const b: string | undefined = values.get(back);
    if (a === undefined || b === undefined) {
      console.error(
        `${theme}: no token --am-${a === undefined ? front : back}`,
      );
      failed = true;
      continue;
    }
    const [hi, lo]: number[] = [luminance(a), luminance(b)].sort(
      (x: number, y: number): number => y - x,
    );
    const ratio: number = (hi! + 0.05) / (lo! + 0.05);
    if (ratio < least) {
      console.error(
        `${theme}: --am-${front} ${a} on --am-${back} ${b} is ${ratio.toFixed(2)}:1, below ${least}:1`,
      );
      failed = true;
    }
  }

if (failed) process.exit(1);
console.log(
  `contrast: ${PAIRS.length} pairs hold in the light and the dark theme`,
);
