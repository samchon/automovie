// Lay the baked stills out on one contact sheet, for looking at them.
//
//   pnpm run posters [--kind scenes|motions] [--columns 6] [--width 1800]
//     [id ...]
//
// Reads `public/baked/<kind>/*.svg` (every one, or the ids given), places
// them in a grid with their ids under them, and saves the sheet as
// `.shots/posters-<kind>.png` through a headless browser. `pnpm run bake`
// must have run first.
import fs from "node:fs";
import path from "node:path";
import { type Browser, type Page, chromium } from "playwright-core";

const argv: string[] = process.argv.slice(2);

/** The value after a named option, removed from the arguments, or the fallback. */
const option: (name: string, fallback: string) => string = (name: string, fallback: string): string => {
  const at: number = argv.indexOf(name);
  if (at === -1) return fallback;
  const value: string = argv[at + 1]!;
  argv.splice(at, 2);
  return value;
};
const kind: string = option("--kind", "scenes");
const columns: number = Number(option("--columns", "6"));
const width: number = Number(option("--width", "1800"));

/** Draw the contact sheet. */
const main: () => Promise<void> = async (): Promise<void> => {
  const folder: string = path.resolve(__dirname, "..", "public", "baked", kind);
  const ids: string[] =
    argv.length !== 0
      ? argv
      : fs
          .readdirSync(folder)
          .filter((file: string): boolean => file.endsWith(".svg"))
          .map((file: string): string => file.slice(0, -4))
          .sort();
  const cells: string = ids
    .map(
      (id: string): string =>
        `<figure><img src="data:image/svg+xml;base64,${fs
          .readFileSync(path.join(folder, `${id}.svg`))
          .toString("base64")}"/><figcaption>${id}</figcaption></figure>`,
    )
    .join("");
  const out: string = path.resolve(__dirname, "..", ".shots");
  fs.mkdirSync(out, { recursive: true });
  const browser: Browser = await chromium.launch();
  try {
    const page: Page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.setContent(
      `<style>body{margin:8px;font:12px monospace;display:grid;grid-template-columns:repeat(${columns},1fr);gap:8px}figure{margin:0}img{width:100%;display:block}</style>${cells}`,
    );
    const file: string = path.join(out, `posters-${kind}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`${ids.length} stills: ${file}`);
  } finally {
    await browser.close();
  }
};
void main();
