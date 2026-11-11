import type { IAutoMovieRasterImage } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { CaptureDirectory } from "../../../../packages/template/scaffold/production/src/executable/CaptureDirectory";

/**
 * Pin the folder a capture run writes: its stills, sheets, manifest, rounds and comparison.
 *
 * Scenarios:
 * 1. A run without a round writes its stills, a sheet per filled group with a cell index, and a manifest that lists both, into the base folder.
 * 2. A second run in the same folder replaces the first run's files and leaves an unrelated file and the rounds beneath it.
 * 3. A round is written under `rounds/<name>`, and a later run compared against it reports the unchanged still, the changed still with its difference image and numbers, and the still the round does not have.
 * 4. A difference within the tolerance counts as unchanged, and the difference image of the earlier comparison is gone.
 * 5. Several views at one second share a sheet whose index names each view.
 * 6. A malformed round name, a round compared against itself, a round that does not exist, an impossible tolerance, a sheet whose cell, column or view count is not a positive integer, a sheet with fewer cells than one second has views and a sheet too large for the stated raster are refused before anything is deleted; the same too large sheet without a stated raster, a second handed over more often than its view count so that two sheets take one name, and a pair of different sizes are refused when they occur.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the six scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Opens, fills and closes real runs in an owned temporary folder and asserts the folder listings, the parsed manifest, sheet index and comparison record, and the returned report; a still written to the wrong folder, a stale file left behind, a deleted round, a missing still counted as unchanged or a refusal at open that already deleted the previous run fails.
 * @evidence contracts/development/testing.md#independent-expectations File names follow the documented `t<seconds>` and `sheet-<from>-<to>` forms written by hand, the cell size from the documented 320 pixel longer side, the too large sheet from 2000 cells of 320 by 180 pixels in ten columns against the sheet's documented 64 megapixels, and the changed pixel count, share, largest difference and box from the three pixels this test repaints by 40 levels.
 * @evidence contracts/development/testing.md#distinguishing-cases A full and a partial sheet, a run with and without sheets, with and without a round, an unchanged, a changed and a missing still, a tolerance at the difference, one and two views, a cell size learnt from the first still and from a stated raster, a too large sheet refused at open with a stated raster and at the first still without one, and each refusal at open with the folder listed before and after; drawing the stills and laying out a sheet's pixels belong to the viewer's own tests.
 * @evidence contracts/development/testing.md#execution-ownership Calls the folder owner with pictures built in memory; it mounts no film, draws nothing and starts no process, and removes its temporary folder in finally.
 */
export async function test_viewer_capture_directory(): Promise<void> {
  const root: string = fs.mkdtempSync(
    path.join(os.tmpdir(), "automovie-capture-directory-"),
  );
  const base: string = path.join(root, "capture");

  // A grey picture with the listed pixels repainted 40 levels redder.
  const picture = (
    width: number,
    height: number,
    repainted: readonly (readonly [number, number])[] = [],
  ): IAutoMovieRasterImage => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(
      width * height * 4,
    ).fill(100);
    for (let index: number = 3; index < pixels.length; index += 4)
      pixels[index] = 255;
    for (const [x, y] of repainted) pixels[(y * width + x) * 4] = 140;
    return { width, height, pixels };
  };
  const cell = (seconds: number, view?: string): CaptureDirectory.ICell => ({
    file: `t00${seconds.toFixed(3)}${view === undefined ? "" : `-${view}`}.png`,
    seconds,
    view,
    caption: `${seconds.toFixed(2)}s`,
  });
  const layout = (
    overrides: Partial<CaptureDirectory.ILayout>,
  ): CaptureDirectory.ILayout => ({
    base,
    round: undefined,
    compare: undefined,
    tolerance: 0,
    sheet: null,
    ...overrides,
  });
  // A sheet layout; the raster is left out when only the first still is to tell it.
  const sheet = (
    perSheet: number,
    columns: number,
    views: number = 1,
    raster?: { width: number; height: number },
  ): NonNullable<CaptureDirectory.ILayout["sheet"]> => ({
    perSheet,
    columns,
    views,
    raster,
  });
  // Names in code-unit order, which is how the expected lists below are written.
  const ordered = (names: readonly string[]): string[] =>
    [...names].sort((a: string, b: string): number =>
      a < b ? -1 : a > b ? 1 : 0,
    );
  const listing = (directory: string): string[] =>
    ordered(fs.readdirSync(directory));
  const record = (file: string): unknown =>
    JSON.parse(fs.readFileSync(file, "utf8"));

  try {
    // 1. A plain run: three stills fill one sheet of two and leave one of one.
    const plain: CaptureDirectory = await CaptureDirectory.open(
      layout({ sheet: sheet(2, 2) }),
    );
    for (const seconds of [0, 0.2, 0.4])
      await plain.add(picture(8, 4), cell(seconds));
    const written: CaptureDirectory.IReport = await plain.close({
      film: "unit",
    });
    const stills: string[] = ["t000.000.png", "t000.200.png", "t000.400.png"];
    const sheets: string[] = [
      "sheet-000.000-000.200.png",
      "sheet-000.400-000.400.png",
    ];
    TestValidator.equals("a plain run writes into the base", written, {
      directory: base,
      frames: stills,
      sheets: sheets.map((sheet: string): string => path.join(base, sheet)),
      comparison: null,
    });
    TestValidator.equals(
      "files of a plain run",
      listing(base),
      ordered([
        ...stills,
        ...sheets,
        ...sheets.map((sheet: string): string => `${sheet}.json`),
        "manifest.json",
      ]),
    );
    TestValidator.equals("manifest", record(path.join(base, "manifest.json")), {
      film: "unit",
      frames: stills,
      sheets,
    });
    TestValidator.equals(
      "index of the full sheet",
      record(path.join(base, `${sheets[0]!}.json`)),
      {
        columns: 2,
        cellWidth: 320,
        cellHeight: 160,
        cells: [
          { row: 0, column: 0, seconds: 0, file: "t000.000.png" },
          { row: 0, column: 1, seconds: 0.2, file: "t000.200.png" },
        ],
      },
    );

    // 2. The next run replaces those files and nothing else.
    const earlier: CaptureDirectory = await CaptureDirectory.open(
      layout({ round: "before" }),
    );
    await earlier.add(picture(8, 4), cell(0));
    await earlier.add(picture(8, 4), cell(0.2));
    const kept: CaptureDirectory.IReport = await earlier.close({});
    const round: string = path.join(base, "rounds", "before");
    TestValidator.equals("a round has its own folder", kept.directory, round);
    TestValidator.equals(
      "a round leaves the base alone",
      listing(base).includes("t000.400.png"),
      true,
    );
    fs.writeFileSync(path.join(base, "notes.txt"), "kept", "utf8");
    const second: CaptureDirectory = await CaptureDirectory.open(layout({}));
    await second.add(picture(8, 4), cell(0));
    await second.close({});
    TestValidator.equals("files after the replacing run", listing(base), [
      "manifest.json",
      "notes.txt",
      "rounds",
      "t000.000.png",
    ]);
    const before: string[] = ["manifest.json", "t000.000.png", "t000.200.png"];
    TestValidator.equals("the round is intact", listing(round), before);

    // 3. A compared run: one still unchanged, one repainted, one new.
    const compared: CaptureDirectory = await CaptureDirectory.open(
      layout({ compare: "before" }),
    );
    await compared.add(picture(8, 4), cell(0));
    await compared.add(
      picture(8, 4, [
        [1, 1],
        [2, 1],
        [5, 3],
      ]),
      cell(0.2),
    );
    await compared.add(picture(8, 4), cell(0.4));
    const report: CaptureDirectory.IReport = await compared.close({});
    TestValidator.equals("comparison summary", report.comparison, {
      file: path.join(base, "comparison.json"),
      compared: 2,
      changed: 1,
      missing: ["t000.400.png"],
    });
    TestValidator.equals(
      "comparison record",
      record(path.join(base, "comparison.json")),
      {
        reference: round,
        tolerance: 0,
        compared: 2,
        changed: 1,
        missing: ["t000.400.png"],
        frames: [
          {
            frame: "t000.000.png",
            changed: 0,
            ratio: 0,
            maximum: 0,
            bounds: null,
          },
          {
            frame: "t000.200.png",
            changed: 3,
            ratio: 3 / 32,
            maximum: 40,
            bounds: { left: 1, top: 1, right: 5, bottom: 3 },
          },
        ],
      },
    );
    TestValidator.equals(
      "only the changed still has a difference image",
      listing(base).filter((name: string): boolean => name.startsWith("diff-")),
      ["diff-t000.200.png"],
    );
    TestValidator.equals(
      "the compared round is intact",
      listing(round),
      before,
    );

    // 4. The same repaint inside the tolerance.
    const tolerated: CaptureDirectory = await CaptureDirectory.open(
      layout({ compare: "before", tolerance: 40 }),
    );
    await tolerated.add(picture(8, 4, [[1, 1]]), cell(0.2));
    TestValidator.equals(
      "a difference at the tolerance is unchanged",
      (await tolerated.close({})).comparison,
      {
        file: path.join(base, "comparison.json"),
        compared: 1,
        changed: 0,
        missing: [],
      },
    );
    TestValidator.equals(
      "the earlier difference image is replaced",
      listing(base).filter((name: string): boolean => name.startsWith("diff-")),
      [],
    );

    // 5. Two views at one second share a sheet, whose cell size comes from the stated raster.
    const views: CaptureDirectory = await CaptureDirectory.open(
      layout({
        round: "views",
        sheet: sheet(2, 2, 2, { width: 4, height: 8 }),
      }),
    );
    await views.add(picture(4, 8), cell(0, "front"));
    await views.add(picture(4, 8), cell(0, "top"));
    const viewed: CaptureDirectory.IReport = await views.close({});
    TestValidator.equals(
      "index of a sheet of views",
      record(`${viewed.sheets[0]!}.json`),
      {
        columns: 2,
        cellWidth: 160,
        cellHeight: 320,
        cells: [
          {
            row: 0,
            column: 0,
            seconds: 0,
            view: "front",
            file: "t000.000-front.png",
          },
          {
            row: 0,
            column: 1,
            seconds: 0,
            view: "top",
            file: "t000.000-top.png",
          },
        ],
      },
    );

    // 6. Refusals at open leave the previous run readable.
    const standing: string[] = listing(base);
    for (const [label, refused] of [
      ["round outside the folder", { round: "../before" }],
      ["round with a space", { round: "be fore" }],
      ["compared round with a separator", { compare: "rounds/before" }],
      ["round compared against itself", { round: "x", compare: "x" }],
      ["compared round that does not exist", { compare: "never" }],
      ["negative tolerance", { tolerance: -1 }],
      ["undefined tolerance", { tolerance: Number.NaN }],
      ["sheet of no cells", { sheet: sheet(0, 2) }],
      ["sheet of no columns", { sheet: sheet(2, 0) }],
      ["sheet of a fractional count", { sheet: sheet(2.5, 2) }],
      ["sheet of no views", { sheet: sheet(2, 2, 0) }],
      ["sheet of a fractional view count", { sheet: sheet(2, 2, 1.5) }],
      ["sheet smaller than one second's views", { sheet: sheet(1, 1, 2) }],
      // 2000 cells of 320 by 180 pixels in ten columns are 3200 by 36000 pixels, over the sheet's 64 megapixels.
      [
        "sheet too large for the stated raster",
        { sheet: sheet(2000, 10, 1, { width: 16, height: 9 }) },
      ],
    ] as const)
      await TestValidator.error(
        label,
        async (): Promise<CaptureDirectory> =>
          CaptureDirectory.open(layout(refused)),
      );
    TestValidator.equals(
      "a refused run deletes nothing",
      listing(base),
      standing,
    );

    // The same sheet without a stated raster opens, and is refused once the first still tells its size.
    const oversized: CaptureDirectory = await CaptureDirectory.open(
      layout({ round: "large", sheet: sheet(2000, 10) }),
    );
    await TestValidator.error(
      "sheet too large for the first still",
      async (): Promise<void> => oversized.add(picture(16, 9), cell(0)),
    );

    // One second handed over twice where the layout states one view names a one-cell sheet twice.
    const clashing: CaptureDirectory = await CaptureDirectory.open(
      layout({ round: "clash", sheet: sheet(1, 1) }),
    );
    await clashing.add(picture(8, 4), cell(0, "front"));
    await TestValidator.error(
      "two sheets of one name",
      async (): Promise<void> => clashing.add(picture(8, 4), cell(0, "top")),
    );

    // A round drawn at another raster cannot be compared.
    const resized: CaptureDirectory = await CaptureDirectory.open(
      layout({ compare: "before" }),
    );
    await resized.add(picture(4, 4), cell(0.2));
    let message: string = "";
    try {
      await resized.close({});
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : "";
    }
    TestValidator.predicate(
      "a pair of different sizes is refused by name",
      message.includes("t000.200.png"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
