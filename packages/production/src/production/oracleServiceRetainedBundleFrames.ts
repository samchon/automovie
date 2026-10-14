import { IAutoMovieRenderBundleManifest } from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { canonicalAutoMovieJsonBytes } from "./contentIdentity";

/**
 * Select existing frame records from a freshly verified bundle without rewriting their bytes.
 *
 * @evidence contracts/common.md#principled-implementation Resident byte/receipt verification precedes canonical target, runtime, dialogue and render-spec equality plus frame-grid/path checks.
 * @evidence contracts/common.md#clear-and-simple-design Project verification owns byte admission and this selector owns append-time metadata compatibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Aggregate compileFingerprint is accepted in expected metadata but deliberately not compared for target-local pixel reuse; failed frame stat/path checks drop that frame.
 * @evidence contracts/common.md#meaningful-documentation Returned records borrow the verified manifest's frames; target-local identity does not certify image composition or pixel variance.
 * @evidence contracts/performance.md#efficient-algorithms Delegated verification hashes/probes all frame bytes and sidecars, then canonical equality and a linear frame/stat pass add work.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing frames are not decoded a second time inside this selector or rewritten, but preview separately calls verifiedRenderManifest again for semantic metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned array is new while frame records are borrowed; parsed metadata/buffers are per-call and no resident-byte cache is owned here.
 */
export function oracleServiceRetainedBundleFrames(
  project: AutoMovieProductionProject,
  bundleRoot: string,
  expected: Pick<
    IAutoMovieRenderBundleManifest,
    | "target"
    | "compileFingerprint"
    | "dialogueRuntimeIdentity"
    | "rendererIdentity"
    | "targetFingerprint"
    | "renderSpec"
  >,
  duration: number
): IAutoMovieRenderBundleManifest["frames"] {
  const manifest: IAutoMovieRenderBundleManifest | null = project.verifiedRenderManifest(
    path.join(bundleRoot, "manifest.json"),
  );
  if (
    manifest === null ||
    Buffer.from(
      canonicalAutoMovieJsonBytes({
        target: manifest.target,
        dialogueRuntimeIdentity: manifest.dialogueRuntimeIdentity,
        rendererIdentity: manifest.rendererIdentity,
        targetFingerprint: manifest.targetFingerprint,
        renderSpec: manifest.renderSpec,
      }),
    ).equals(
      Buffer.from(
        canonicalAutoMovieJsonBytes({
          target: expected.target,
          dialogueRuntimeIdentity: expected.dialogueRuntimeIdentity,
          rendererIdentity: expected.rendererIdentity,
          targetFingerprint: expected.targetFingerprint,
          renderSpec: expected.renderSpec,
        }),
      ),
    ) === false
  )
    return [];
  const retained: IAutoMovieRenderBundleManifest["frames"] = [];
  const bundlePrefix: string = `${path.resolve(bundleRoot)}${path.sep}`;
  for (const frame of manifest.frames)
    try {
      if (
        Number.isSafeInteger(frame.index) === false ||
        frame.index < 0 ||
        frame.time !== frame.index / manifest.renderSpec.frameFormat.fps ||
        frame.time > duration
      )
        continue;
      const absolute: string = path.resolve(bundleRoot, frame.path);
      if (absolute.startsWith(bundlePrefix) === false) continue;
      if (fs.statSync(absolute).isFile() === false) continue;
      retained.push(frame);
    } catch {
      continue;
    }
  return retained;
}
