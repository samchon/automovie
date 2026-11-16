import fs from "node:fs/promises";
import path from "node:path";
import { type Canvas, type Image, type SKRSContext2D, createCanvas, loadImage } from "@napi-rs/canvas";

/** Compare complete diagnostic captures without drawing or modifying their geometry. */
export namespace FamilyConicSheets {
  /**
   * Read two absolute capture directories and write one before/after sheet per case and zone under an absolute output directory.
   * Each row holds the original camera view on the left and the candidate's on the right; input names must match exactly.
   * Originals remain unchanged. Sheets only locate findings; full-size originals decide a small defect.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives argument units, ordering, missing-input behavior and the limit of thumbnails.
   * @evidence contracts/development/implementation.md#principled-implementation Pairs identical filenames, preserves each image's aspect ratio and writes labels outside the images; no camera or geometry is inferred.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass groups filenames, then each group is composed and released before the next.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing originals fail instead of omitting a cell; no existing output is overwritten.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in input image pixels plus sheet pixels; filenames are sorted once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses completed PNGs without another geometry realization or render.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each sheet retains one canvas and decodes one image at a time; files use promise-based whole-file operations with no retained handle.
   */
  export async function main(): Promise<void> {
    const [before, after, out]: (string | undefined)[] = process.argv.slice(2);
    if (before === undefined || after === undefined || out === undefined || ![before, after, out].every((directory: string): boolean => path.isAbsolute(directory)))
      throw new Error("usage: FamilyConicSheets <absolute-before> <absolute-after> <absolute-output>");
    const groups: Map<string, string[]> = new Map();
    for (const file of (await fs.readdir(after)).filter((file: string): boolean => file.endsWith(".png")).sort((a: string, b: string): number => a.localeCompare(b))) {
      const pieces: string[] = file.split(".");
      if (pieces.length !== 4) throw new Error(`Unexpected capture filename: ${file}`);
      const key: string = `${pieces[0]}.${pieces[2]}`;
      const files: string[] = groups.get(key) ?? [];
      files.push(file);
      groups.set(key, files);
    }
    if (groups.size === 0) throw new Error("No captured PNGs to compare");
    await fs.mkdir(out, { recursive: true });
    for (const [key, files] of groups) {
      const whole: boolean = key.startsWith("figure.");
      const [width, height]: [number, number] = whole ? [288, 480] : [360, 360];
      const caption: number = 26;
      const canvas: Canvas = createCanvas(2 * width, files.length * (height + caption));
      const context: SKRSContext2D = canvas.getContext("2d");
      context.fillStyle = "#eef1f5";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = "14px Arial";
      for (const [row, file] of files.entries()) {
        for (const [column, directory] of [before, after].entries()) {
          const original: Image = await loadImage(await fs.readFile(path.join(directory, file)));
          const scale: number = Math.min(width / original.width, height / original.height);
          const left: number = column * width + (width - original.width * scale) / 2;
          const top: number = row * (height + caption);
          context.drawImage(original, left, top, original.width * scale, original.height * scale);
          context.fillStyle = "#172337";
          context.fillText(`${column === 0 ? "BEFORE" : "AFTER"} | ${file}`, column * width + 4, top + height + 18, width - 8);
        }
      }
      await fs.writeFile(path.join(out, key + ".png"), canvas.toBuffer("image/png"), { flag: "wx" });
    }
    process.stdout.write(`${groups.size} paired sheets written to ${out}\n`);
  }
}

void FamilyConicSheets.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
  process.exitCode = 1;
});