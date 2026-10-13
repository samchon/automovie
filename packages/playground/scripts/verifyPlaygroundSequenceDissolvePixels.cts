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
import { preserveCleanupFailure } from "./preserveCleanupFailure";
import type { IAutoMoviePlaygroundSequenceRenderOptions } from "./IAutoMoviePlaygroundSequenceRenderOptions";
import type { IAutoMoviePlaygroundSequenceMetadata } from "./IAutoMoviePlaygroundSequenceMetadata";
import type { IAutoMovieSequenceDissolvePixelCheck } from "./IAutoMovieSequenceDissolvePixelCheck";
import type { IAutoMoviePlaygroundSequenceRenderArtifact } from "./IAutoMoviePlaygroundSequenceRenderArtifact";

/**
 * Observe each declared dissolve using the sampled blend nearest alpha 0.5, the existing saved PNG and two isolated-shot PNGs at their local times. Mean absolute RGB byte distances use the existing baseline>0.1 and probe-distance>0.01/<baseline predicate; alpha/distance reports round to three decimals. False observations carry a reason and do not throw merely because the heuristic fails.
 *
 * @evidence contracts/common.md#principled-implementation Actual captured/isolated pixel arrays provide a diagnostic witness independent of source prose, with matching image dimensions required before distance calculation.
 * @evidence contracts/common.md#clear-and-simple-design The original sequence CLI's comparison is preserved as one helper; it neither adds a production renderer nor certifies exact alpha-weighted output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thresholds are existing heuristic byte-distance tolerances, not measured perceptual or clinical targets. A frame lying between probes does not prove linear composition, correct alpha, linear-light blending or every transition frame.
 * @evidence contracts/common.md#meaningful-documentation The comment names the actual consumer, units, ownership, cost and interpretation limits.
 * @evidence contracts/performance.md#efficient-algorithms For T transitions and F frames the existing filter costs O(TF); each sampled transition performs two fresh draws and three full-image decodes/distance traversals. These costs and allocations remain visible rather than represented as constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The saved mixed frame is reused; isolated outgoing/incoming frames are captured independently for this transition and no cross-transition numerical/image cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A bounded three-image working set per transition is discarded after comparison; returned observations retain O(T) rows. The borrowed captureShot/browser owner remains responsible for renderer/page cleanup, while PNG files remain caller-owned artifacts.
 *
 * @author Samchon
 */
export const verifyPlaygroundSequenceDissolvePixels: (props: { captured: Map<number, string>; frames: IAutoMovieSequenceRenderFrame[]; transitions: IAutoMovieSequenceRenderPlan["transitionSpans"]; captureShot(sample: { shot: string; shotTimeSeconds: number; }): Promise<Uint8Array>; }) => Promise<IAutoMovieSequenceDissolvePixelCheck[]> = async (props: {
  captured: Map<number, string>;
  frames: IAutoMovieSequenceRenderFrame[];
  transitions: IAutoMovieSequenceRenderPlan["transitionSpans"];
  captureShot(sample: {
    shot: string;
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
    const frame: IAutoMovieSequenceRenderFrame | null = nearestMidBlend(candidates);
    if (frame === null || frame.blend === null) {
      checks.push(emptyDissolveCheck(transition, "no blended frame sampled"));
      continue;
    }
    const actualPath: string | undefined = props.captured.get(frame.index);
    if (actualPath === undefined) {
      checks.push(emptyDissolveCheck(transition, "captured frame missing"));
      continue;
    }
    const actual: ReturnType<typeof PNG.sync.read> = PNG.sync.read(await fs.readFile(actualPath));
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
const nearestMidBlend: (frames: IAutoMovieSequenceRenderFrame[]) => IAutoMovieSequenceRenderFrame | null = (
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
const emptyDissolveCheck: (transition: IAutoMovieSequenceRenderTransitionSpan, reason: string) => IAutoMovieSequenceDissolvePixelCheck = (
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
const transitionSlice: (transition: IAutoMovieSequenceRenderTransitionSpan) => IAutoMovieSequenceDissolvePixelCheck["transition"] = (
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
const round: (value: number) => number = (value: number): number => Math.round(value * 1_000) / 1_000;
