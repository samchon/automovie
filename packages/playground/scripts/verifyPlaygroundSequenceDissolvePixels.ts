import {
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import {
  IAutoMovieSequenceRenderAdapters,
  IAutoMovieSequenceRenderAndSeeResult,
  IAutoMovieSequenceRenderFrame,
  IAutoMovieSequenceRenderPlan,
  IAutoMovieSequenceRenderTransitionSpan,
  renderSequenceAndSee,
} from "@automovie/render";
import * as HME from "h264-mp4-encoder";
import fs from "node:fs/promises";
import path from "node:path";
import { type Locator, type Page, chromium } from "playwright-core";
import { PNG } from "pngjs";

import { DEFAULT_CHROME_EXECUTABLE } from "./DEFAULT_CHROME_EXECUTABLE";
import type { IAutoMoviePlaygroundSequenceMetadata } from "./IAutoMoviePlaygroundSequenceMetadata";
import type { IAutoMoviePlaygroundSequenceRenderArtifact } from "./IAutoMoviePlaygroundSequenceRenderArtifact";
import type { IAutoMoviePlaygroundSequenceRenderOptions } from "./IAutoMoviePlaygroundSequenceRenderOptions";
import type { IAutoMovieSequenceDissolvePixelCheck } from "./IAutoMovieSequenceDissolvePixelCheck";
import { preserveCleanupFailure } from "./preserveCleanupFailure";

/**
 * Observe each declared dissolve using the sampled blend nearest alpha 0.5, the existing saved PNG and two isolated-shot PNGs at their local times. Mean absolute RGB byte distances use the existing baseline>0.1 and probe-distance>0.01/<baseline predicate; alpha/distance reports round to three decimals. False observations carry a reason and do not throw merely because the heuristic fails.
 *
 *
 * @author Samchon
 */
export const verifyPlaygroundSequenceDissolvePixels: (props: {
  /** Saved mixed-frame PNG paths keyed by their canonical sequence frame index. */
  captured: Map<number, string>;

  /** Canonical sampled sequence frames used to choose the nearest midpoint blend. */
  frames: IAutoMovieSequenceRenderFrame[];

  /** Declared transition spans whose sampled blends receive diagnostic observations. */
  transitions: IAutoMovieSequenceRenderPlan["transitionSpans"];

  /** Draw and return an isolated original shot PNG through the borrowed capture session. */
  captureShot(sample: {
    /** Known shot identity from the compiled page metadata. */
    shot: string;

    /** Shot-local time in seconds, matching the chosen mixed frame's sample. */
    shotTimeSeconds: number;
  }): Promise<Uint8Array>;
}) => Promise<IAutoMovieSequenceDissolvePixelCheck[]> = async (props: {
  /** Saved mixed-frame PNG paths keyed by their canonical sequence frame index. */
  captured: Map<number, string>;

  /** Canonical sampled sequence frames used to choose the nearest midpoint blend. */
  frames: IAutoMovieSequenceRenderFrame[];

  /** Declared transition spans whose sampled blends receive diagnostic observations. */
  transitions: IAutoMovieSequenceRenderPlan["transitionSpans"];

  /** Draw and return an isolated original shot PNG through the borrowed capture session. */
  captureShot(sample: {
    /** Known shot identity from the compiled page metadata. */
    shot: string;

    /** Shot-local time in seconds, matching the chosen mixed frame's sample. */
    shotTimeSeconds: number;
  }): Promise<Uint8Array>;
}): Promise<IAutoMovieSequenceDissolvePixelCheck[]> => {
  const checks: IAutoMovieSequenceDissolvePixelCheck[] = [];
  for (const transition of props.transitions) {
    const candidates: IAutoMovieSequenceRenderFrame[] = props.frames.filter(
      (frame: IAutoMovieSequenceRenderFrame): boolean =>
        frame.blend !== null &&
        frame.timeSeconds >= transition.start &&
        frame.timeSeconds < transition.end &&
        frame.blend.alpha > 0 &&
        frame.blend.alpha < 1,
    );
    const frame: IAutoMovieSequenceRenderFrame | null =
      nearestMidBlend(candidates);
    if (frame === null || frame.blend === null) {
      checks.push(emptyDissolveCheck(transition, "no blended frame sampled"));
      continue;
    }
    const actualPath: string | undefined = props.captured.get(frame.index);
    if (actualPath === undefined) {
      checks.push(emptyDissolveCheck(transition, "captured frame missing"));
      continue;
    }
    const actual: ReturnType<typeof PNG.sync.read> = PNG.sync.read(
      await fs.readFile(actualPath),
    );
    const outgoing: ReturnType<typeof PNG.sync.read> = PNG.sync.read(
      Buffer.from(
        await props.captureShot({
          shot: frame.blend.shot,
          shotTimeSeconds: frame.blend.shotTimeSeconds,
        }),
      ),
    );
    const incoming: ReturnType<typeof PNG.sync.read> = PNG.sync.read(
      Buffer.from(
        await props.captureShot({
          shot: frame.shot,
          shotTimeSeconds: frame.shotTimeSeconds,
        }),
      ),
    );
    const baseline: number = rgbDistance(outgoing, incoming);
    const actualToIncoming: number = rgbDistance(actual, incoming);
    const actualToOutgoing: number = rgbDistance(actual, outgoing);
    const verified: boolean =
      baseline > 0.1 &&
      actualToIncoming > 0.01 &&
      actualToOutgoing > 0.01 &&
      actualToIncoming < baseline &&
      actualToOutgoing < baseline;
    checks.push({
      transition: transitionSlice(transition),
      frame: frame.index,
      alpha: round(frame.blend.alpha),
      baselineDistance: round(baseline),
      actualToIncoming: round(actualToIncoming),
      actualToOutgoing: round(actualToOutgoing),
      verified,
      reason: verified
        ? null
        : "captured dissolve frame did not sit between outgoing and incoming probes",
    });
  }
  return checks;
};
const nearestMidBlend: (
  frames: IAutoMovieSequenceRenderFrame[],
) => IAutoMovieSequenceRenderFrame | null = (
  frames: IAutoMovieSequenceRenderFrame[],
): IAutoMovieSequenceRenderFrame | null => {
  let best: IAutoMovieSequenceRenderFrame | null = null;
  for (const frame of frames)
    if (
      frame.blend !== null &&
      (best === null ||
        Math.abs(frame.blend.alpha - 0.5) < Math.abs(best.blend!.alpha - 0.5))
    )
      best = frame;
  return best;
};
const emptyDissolveCheck: (
  transition: IAutoMovieSequenceRenderTransitionSpan,
  reason: string,
) => IAutoMovieSequenceDissolvePixelCheck = (
  transition: IAutoMovieSequenceRenderTransitionSpan,
  reason: string,
): IAutoMovieSequenceDissolvePixelCheck => ({
  transition: transitionSlice(transition),
  frame: null,
  alpha: null,
  baselineDistance: 0,
  actualToIncoming: 0,
  actualToOutgoing: 0,
  verified: false,
  reason,
});
const transitionSlice: (
  transition: IAutoMovieSequenceRenderTransitionSpan,
) => IAutoMovieSequenceDissolvePixelCheck["transition"] = (
  transition: IAutoMovieSequenceRenderTransitionSpan,
): IAutoMovieSequenceDissolvePixelCheck["transition"] => ({
  from: transition.from,
  to: transition.to,
  start: transition.start,
  end: transition.end,
});
const rgbDistance: (a: PNG, b: PNG) => number = (a: PNG, b: PNG): number => {
  if (a.width !== b.width || a.height !== b.height)
    throw new Error("cannot compare dissolve probes with different dimensions");
  let sum: number = 0;
  const pixels: number = a.width * a.height;
  for (let i: number = 0; i < a.data.length; i += 4) {
    sum += Math.abs(a.data[i]! - b.data[i]!);
    sum += Math.abs(a.data[i + 1]! - b.data[i + 1]!);
    sum += Math.abs(a.data[i + 2]! - b.data[i + 2]!);
  }
  return sum / (pixels * 3);
};
const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
