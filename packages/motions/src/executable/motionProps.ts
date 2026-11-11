import { readAutoMovieCaptureArguments } from "@automovie/render";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import { buildMotionCaptureCases } from "./buildMotionCaptureCases";
import { planMotionCaptureProps } from "./planMotionCaptureProps";

/** The motions package, whose `media/props/` holds the written files by default. */
const ROOT: string = path.join(__dirname, "..", "..");

/**
 * Write motion cases' page data as files, so the `automovie` commands draw a case through `src/executable/subjects.ts` with `--props`.
 *
 * `pnpm --dir packages/motions node:props -- --case <name>[,<name>…] [--only <regex>] [--out <folder>]` builds the named cases as the capture harness does and writes each one's `planMotionCaptureProps` at a 720 by 720 raster as `<case>.json` into `--out`, by default `packages/motions/media/props/`, printing each path. Then, for example, `automovie render --module src/executable/subjects.ts --props media/props/<case>.json` renders the case's whole clock, and `automovie inspect` shows it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the command, the options, what is written where, and how the files are used.
 * @evidence contracts/development/implementation.md#principled-implementation The data is the same the capture harness hands its page, so every host draws a case from one plan.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read options, build cases, write one file each.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown options are refused by the shared argument reader's form and this list.
 * @evidence contracts/development/implementation.md#efficient-algorithms One plan and one write per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each run writes afresh.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each case's data is written and dropped.
 */
export async function motionProps(): Promise<void> {
  const options: Map<string, string> = readAutoMovieCaptureArguments(
    process.argv.slice(2).filter((argument: string): boolean => argument !== "--"),
  );
  for (const key of options.keys())
    if (!["case", "only", "out"].includes(key)) throw new Error(`Unknown option --${key}; node:props takes --case, --only and --out`);
  const names: string[] = (options.get("case") ?? "").split(",").filter((name: string): boolean => name !== "");
  if (names.length === 0) throw new Error("Name cases with --case a,b");
  const only: string | undefined = options.get("only");
  const cases: IMotionCaptureCase[] = buildMotionCaptureCases(names, only === undefined ? null : new RegExp(only));
  const out: string = path.resolve(options.get("out") ?? path.join(ROOT, "media", "props"));
  await mkdir(out, { recursive: true });
  for (const capture of cases) {
    const file: string = path.join(out, `${capture.name}.json`);
    await writeFile(file, JSON.stringify(planMotionCaptureProps(capture, { width: 720, height: 720 })));
    console.log(file);
  }
}

void motionProps().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
