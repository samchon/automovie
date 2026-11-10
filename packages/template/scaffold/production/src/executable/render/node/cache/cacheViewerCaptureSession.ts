import {
  type IAutoMovieArtifactPlan,
  type IAutoMovieArtifactResolution,
  planAutoMovieArtifacts,
  resolveAutoMovieArtifact,
} from "@automovie/engine";
import { frameName } from "@automovie/render";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import type { IAutoMovieHeadlessCaptureSession } from "../../headlessCapture/IAutoMovieHeadlessCaptureSession";
import type { IAutoMovieHeadlessPage } from "../../headlessCapture/IAutoMovieHeadlessPage";
import type { IAutoMovieDirectoryArtifactStore } from "./IAutoMovieDirectoryArtifactStore";
import type { IAutoMovieViewerFrameCacheReport } from "./IAutoMovieViewerFrameCacheReport";
import { composeViewerFrameKeys } from "./composeViewerFrameKeys";
import { digestAutoMovieSourceTree } from "./digestAutoMovieSourceTree";
import { readViewerFrameStates } from "./readViewerFrameStates";

/**
 * Wrap a capture session so frames whose key is stored are copied instead of
 * captured.
 *
 * On the first capture call, after any preparation, the wrapper reads every
 * frame's state digest and the GL identity from the page, composes the keys
 * with `composeViewerFrameKeys` and plans them against the store. Each frame
 * then resolves through the engine: a verified entry is written to the frame
 * path through `write` (the same validator and accounting captured frames
 * use); otherwise the inner session captures it and its PNG is stored before
 * the next frame, so an interrupted run resumes from its last stored frame.
 * Sampled frames (`verifyEvery`) are captured anyway and compared. `finish`,
 * called only after a successful encode, deletes entries this run did not
 * reference and returns the report.
 *
 * @param options.session Inner session; ownership moves to the wrapper, whose close closes it.
 * @param options.page Capture page for the digest call.
 * @param options.store Opened directory store.
 * @param options.times Frame seconds in capture order, as renderVideo will request them.
 * @param options.digestFunction Page hook returning each frame's state digest.
 * @param options.browser Browser build string, part of every key.
 * @param options.inputs Run-level capture inputs that affect pixels (route, raster, selectors, hooks).
 * @param options.write Writes reused PNG bytes exactly as a captured frame would be written.
 * @param options.verifyEvery Recapture every n-th reused frame and compare.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Keys follow the engine's constructive-trace schema with toolchain (Render, Viewer and engine package versions, Render and Viewer source digests, browser build, GL vendor/renderer) and per-frame purity inputs; reuse requires the engine's content verification, and storing each frame before the next makes a crash lose at most the frame in flight.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The wrapper keeps renderVideo's adapter shape so scheduling, preparation, encoding and cleanup stay unchanged; observation, key composition, planning, resolution and storage are separate modules.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A time that differs from the planned schedule throws; a missing hook throws; mismatches are reported, not hidden.
 * @evidence contracts/development/implementation.md#efficient-algorithms Planning is O(F); each reused frame costs one read, one SHA-256 and one write instead of a seek and screenshot; each captured frame adds one read, one SHA-256 and one store write.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares a stored frame only when its full key matches and its bytes verify; the encoder still consumes the complete merged sequence, so encoding is never partially reused.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains F keys and the plan for the run and one frame's bytes at a time; close delegates to the inner session on every outcome; finish bounds disk to this run's distinct frames.
 * @evidence contracts/development/common.md#meaningful-documentation States the call order, resume property, verification, ownership and finish semantics.
 */
export function cacheViewerCaptureSession(options: {
  session: IAutoMovieHeadlessCaptureSession;
  page: Pick<IAutoMovieHeadlessPage, "evaluate">;
  store: IAutoMovieDirectoryArtifactStore;
  times: readonly number[];
  digestFunction: string;
  browser: string;
  inputs: Readonly<Record<string, string>>;
  write: (file: string, bytes: Uint8Array) => Promise<void>;
  verifyEvery?: number;
}): {
  session: IAutoMovieHeadlessCaptureSession;
  finish: () => Promise<IAutoMovieViewerFrameCacheReport>;
} {
  let keys: string[] | undefined;
  let plan: IAutoMovieArtifactPlan | undefined;
  const report: IAutoMovieViewerFrameCacheReport = {
    directory: options.store.directory,
    reused: 0,
    computed: 0,
    repaired: 0,
    verified: 0,
    mismatched: 0,
    removed: 0,
  };

  // Keys need the prepared page, so they are composed at the first frame.
  const prepare: () => Promise<void> = async (): Promise<void> => {
    const states: { digests: string[]; graphics: string } =
      await readViewerFrameStates(
        options.page,
        options.digestFunction,
        options.times,
      );
    keys = composeViewerFrameKeys(
      {
        toolchain: {
          "@automovie/render": PACKAGES.render.version,
          "@automovie/render#src": await digestAutoMovieSourceTree([
            PACKAGES.render.source,
          ]),
          "@automovie/viewer": PACKAGES.viewer.version,
          "@automovie/viewer#src": await digestAutoMovieSourceTree([
            PACKAGES.viewer.source,
          ]),
          "@automovie/engine": PACKAGES.engine.version,
          browser: options.browser,
          graphics: states.graphics,
        },
        inputs: options.inputs,
      },
      options.times,
      states.digests,
    );
    plan = planAutoMovieArtifacts(
      keys,
      await options.store.keys(),
      options.verifyEvery,
    );
  };

  return {
    session: {
      captureFrame: async (
        seconds: number,
        index: number,
        dir: string,
      ): Promise<string> => {
        if (keys === undefined) await prepare();
        if (options.times[index] !== seconds)
          throw new Error(
            `Frame ${index} at ${seconds}s differs from the cached schedule`,
          );
        let captured: string | undefined;
        const resolved: IAutoMovieArtifactResolution =
          await resolveAutoMovieArtifact(
            options.store,
            keys![index]!,
            async (): Promise<Uint8Array> => {
              captured = await options.session.captureFrame(
                seconds,
                index,
                dir,
              );
              return readFile(captured);
            },
            plan!.actions[index] === "verify",
          );
        ++report[resolved.outcome];
        if (captured !== undefined) return captured;
        const file: string = `${dir.replace(/[\\/]+$/, "")}/${frameName(index)}`;
        await options.write(file, resolved.bytes);
        return file;
      },
      close: (): Promise<void> => options.session.close(),
    },
    finish: async (): Promise<IAutoMovieViewerFrameCacheReport> => {
      if (keys !== undefined)
        report.removed = (
          await options.store.collect({ keep: new Set(keys) })
        ).removed;
      return report;
    },
  };
}

/**
 * Installed package versions and source directories. A workspace never bumps
 * its versions, so the Render and Viewer sources (capture and drawing code)
 * are also digested into every key; engine code reaches pixels through the
 * scene state the page's digest covers.
 */
const PACKAGES: Record<
  "render" | "viewer" | "engine",
  { version: string; source: string }
> = ((): Record<
  "render" | "viewer" | "engine",
  { version: string; source: string }
> => {
  const load: NodeJS.Require = createRequire(__filename);
  const locate: (name: string) => { version: string; source: string } = (
    name: string,
  ): { version: string; source: string } => {
    const manifest: string = load.resolve(`${name}/package.json`);
    return {
      version: (load(manifest) as { version: string }).version,
      source: path.join(path.dirname(manifest), "src"),
    };
  };
  return {
    render: locate("@automovie/render"),
    viewer: locate("@automovie/viewer"),
    engine: locate("@automovie/engine"),
  };
})();
