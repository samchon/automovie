import { AutoMovieRenderCapture } from "@automovie/render";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import { buildMotionCaptureCases } from "./buildMotionCaptureCases";
import { planMotionCaptureProps } from "./internal/planMotionCaptureProps";

/** The motions package, whose `media/props/` holds the written files by default. */
const ROOT: string = path.join(__dirname, "..", "..");

/**
 * Write motion cases' page data as files, so the `automovie` commands draw a
 * case through `src/executable/subjects.ts` with `--props`.
 *
 * `pnpm --dir packages/motions node:props -- --case <name>[,<name>…] [--only
 * <regex>] [--out <folder>]` builds the named cases as the capture harness does
 * and writes each one's `planMotionCaptureProps` at a 720 by 720 raster as
 * `<case>.json` into `--out`, by default `packages/motions/media/props/`,
 * printing each path. Then, for example, `automovie render --module
 * src/executable/subjects.ts --props media/props/<case>.json` renders the
 * case's whole clock, and `automovie inspect` shows it.
 */
export async function motionProps(): Promise<void> {
  const options: Map<string, string> = AutoMovieRenderCapture.readArguments(
    process.argv
      .slice(2)
      .filter((argument: string): boolean => argument !== "--"),
  );
  for (const key of options.keys())
    if (!["case", "only", "out"].includes(key))
      throw new Error(
        `Unknown option --${key}; node:props takes --case, --only and --out`,
      );
  const names: string[] = (options.get("case") ?? "")
    .split(",")
    .filter((name: string): boolean => name !== "");
  if (names.length === 0) throw new Error("Name cases with --case a,b");
  const only: string | undefined = options.get("only");
  const cases: Iterable<IMotionCaptureCase> = buildMotionCaptureCases(
    names,
    only === undefined ? null : new RegExp(only),
  );
  const out: string = path.resolve(
    options.get("out") ?? path.join(ROOT, "media", "props"),
  );
  await mkdir(out, { recursive: true });
  for (const capture of cases) {
    const file: string = path.join(out, `${capture.name}.json`);
    await writeFile(
      file,
      JSON.stringify(
        planMotionCaptureProps(capture, { width: 720, height: 720 }),
      ),
    );
    console.log(file);
  }
}

void motionProps().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
