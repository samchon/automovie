import { IAutoMovieProductionRepaintShotSource } from "./IAutoMovieProductionRepaintShotSource";
import path from "node:path";
import { productionRepaintServiceNormalizeSlash } from "./productionRepaintServiceNormalizeSlash";
import { productionRepaintServicePhysicalFiles } from "./productionRepaintServicePhysicalFiles";
import { AutoMovieGuidePass, IAutoMovieRenderBundleManifest } from "@automovie/interface";
import { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { compareCodeUnits } from "./contentIdentity";

/**
 * Discovers physical manifests, verifies current compile/dialogue/renderer identity and complete beauty plus one structural pass, then deterministically chooses the largest frame population and code-unit bundle tie break.
 *
 * @evidence contracts/common.md#principled-implementation Discovers physical manifests, verifies current compile/dialogue/renderer identity and complete beauty plus one structural pass, then deterministically chooses the largest frame population and code-unit bundle tie break.
 * @evidence contracts/common.md#clear-and-simple-design This stage owns deterministic complete beauty/control-grid selection; verified manifest admission and physical discovery remain delegated to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Manifest/frame arrays are local and only one selected source escapes; discovered entry links refuse, but enumeration alone does not admit the supplied root or resident bytes, which remain with verified project readers.
 * @evidence contracts/performance.md#efficient-algorithms For C manifests, N expected indices and F frame records per candidate, repeated grid scans can cost O(C*N*F), besides recursive discovery, verified metadata/byte reads and O(C log C) candidate sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses a completed resident bundle only after compile/dialogue/renderer identity, render dimensions/rate and complete beauty/control-grid admission; a path match or watcher quietness cannot replace that verification.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Candidate/frame/path arrays grow with resident discovery and only one selected source escapes; verified project readers own byte buffers and descriptor cleanup, with no new fixed discovery-population bound.
 */
export const productionRepaintServiceCurrentShotSource: (services: IAutoMovieProductionServices, shot: string, compileFingerprint: string, expected: { width: number; height: number; fps: number; frameCount: number; }, runtime: Pick<IAutoMovieRenderBundleManifest, "dialogueRuntimeIdentity" | "rendererIdentity">) => IAutoMovieProductionRepaintShotSource | null = (
  services: IAutoMovieProductionServices,
  shot: string,
  compileFingerprint: string,
  expected: {
    width: number;
    height: number;
    fps: number;
    frameCount: number;
  },
  runtime: Pick<
    IAutoMovieRenderBundleManifest,
    "dialogueRuntimeIdentity" | "rendererIdentity"
  >,
): IAutoMovieProductionRepaintShotSource | null => {
  const candidates: IAutoMovieProductionRepaintShotSource[] = productionRepaintServicePhysicalFiles(services.project.renderRoot())
    .filter((file: string): boolean => path.basename(file) === "manifest.json")
    .flatMap((manifestPath: string): IAutoMovieProductionRepaintShotSource[] => {
      const manifest: IAutoMovieRenderBundleManifest | null = services.project.verifiedRenderManifest(manifestPath);
      const frames: { index: number; time: number; pass: AutoMovieGuidePass; path: string; digest: string; width: number; height: number; }[] =
        manifest?.frames.filter(
          (frame: { index: number; time: number; pass: AutoMovieGuidePass; path: string; digest: string; width: number; height: number; }): boolean => frame.index >= 0 && frame.index < expected.frameCount,
        ) ?? [];
      const structuralPasses: readonly ["depth", "mask", "normal", "outline", "pose"] = [
        "depth",
        "mask",
        "normal",
        "outline",
        "pose",
      ] as const;
      if (
        manifest === null ||
        manifest.compileFingerprint !== compileFingerprint ||
        manifest.dialogueRuntimeIdentity !== runtime.dialogueRuntimeIdentity ||
        manifest.rendererIdentity !== runtime.rendererIdentity ||
        manifest.target.kind !== "shot" ||
        manifest.target.id !== shot ||
        manifest.renderSpec.frameFormat.width !== expected.width ||
        manifest.renderSpec.frameFormat.height !== expected.height ||
        manifest.renderSpec.frameFormat.fps !== expected.fps ||
        Array.from({ length: expected.frameCount }, (_: unknown, index: number): number => index).some(
          (index: number): boolean =>
            frames.some(
              (frame: { index: number; time: number; pass: AutoMovieGuidePass; path: string; digest: string; width: number; height: number; }): boolean => frame.index === index && frame.pass === "beauty",
            ) === false,
        ) ||
        structuralPasses.some((pass: "depth" | "mask" | "normal" | "outline" | "pose"): boolean =>
          Array.from(
            { length: expected.frameCount },
            (_: unknown, index: number): number => index,
          ).every((index: number): boolean =>
            frames.some(
              (frame: { index: number; time: number; pass: AutoMovieGuidePass; path: string; digest: string; width: number; height: number; }): boolean => frame.index === index && frame.pass === pass,
            ),
          ),
        ) === false
      )
        return [];
      return [
        {
          manifestPath,
          bundle: productionRepaintServiceNormalizeSlash(
            path.relative(
              services.project.renderRoot(),
              path.dirname(manifestPath),
            ),
          ),
          manifest,
          frames,
        },
      ];
    })
    .sort(
      (left: IAutoMovieProductionRepaintShotSource, right: IAutoMovieProductionRepaintShotSource): number =>
        right.frames.length - left.frames.length ||
        compareCodeUnits(left.bundle, right.bundle),
    );
  return candidates[0] ?? null;
};
