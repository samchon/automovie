import { classifyAutoMovieCameraInspection } from "@automovie/engine";
import type {
  IAutoMovieCameraInspection,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import type { Object3D } from "three";

import type { IAutoMovieDrawScene } from "../../draw/IAutoMovieDrawScene.js";
import { measureAutoMovieCameraOcclusionPixels } from "./measureAutoMovieCameraOcclusionPixels.js";
import { observeAutoMovieCameraInspection } from "./observeAutoMovieCameraInspection.js";

/** A source requirement active in the placed sample. */
interface ICameraRequirement {
  /** Stable path of the authored subject within its source scope. */
  readonly path: string;

  /** Source-resolved displayed object, absent when resolution failed. */
  readonly target: Object3D | undefined;

  /** Authored maximum fraction, inclusive, when the source requires pixel coverage. */
  readonly maxOcclusionRatio?: number;

  /** Optional certified envelope of the whole posed subject in world metres. */
  readonly targetBounds?: IAutoMovieSubjectBox;
}

/**
 * Native samples all subjects of one frame may render, across both passes:
 * two 2×-supersampled 1080p frames. Each subject pays only for its own
 * projected region, so a 4K frame fits whenever its subjects do.
 */
const FRAME_PIXEL_BUDGET: number = 2 * 2 * 2 * 1920 * 1080;

/** Per-frame admission cap on geometry entries, in triangles, across exact passes. */
const FRAME_MASK_TRIANGLE_BUDGET: number = 200_000;

/** Per-frame candidate geometry cap before each subject's at-most-nine-ray check. */
const FRAME_RAY_TRIANGLE_BUDGET: number = 3_000;

/** Independent diagnostic rows emitted by the placed camera observation. */
type IResult = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;

/** A stable diagnostic text for each confirmed framing exclusion. */
const FRAMING_FAILURES: Readonly<
  Record<
    "outside" | "before-near" | "past-far",
    { code: string; description: string }
  >
> = {
  outside: {
    code: "camera-subject-outside-frame",
    description: "is wholly outside the delivery frame",
  },
  "before-near": {
    code: "camera-subject-before-near",
    description: "is wholly before the delivery near plane",
  },
  "past-far": {
    code: "camera-subject-past-far",
    description: "is wholly beyond the delivery far plane",
  },
};

/**
 * Observe active, source-owned requirements on the host's original delivery camera.
 *
 * @evidence contracts/development/implementation.md#principled-implementation
 * Bounds exclusion yields a confirmed framing error. Exact delivery pixel
 * counts can confirm the authored coverage limit. Sparse ray witnesses can
 * suggest occlusion and leave an authored pixel obligation deferred.
 * @evidence contracts/development/implementation.md#efficient-algorithms
 * Viewer/capture run no extra raster passes. Delivery audit is only attempted
 * for a resolved in-frame candidate with a valid authored threshold. All
 * targets share a native-sample budget, paying for the samples they actually
 * rendered, and the per-frame triangle limits. A target the remaining budget
 * cannot admit keeps its own deferred reason with the samples it needed.
 * @evidence contracts/development/common.md#meaningful-documentation Names
 * the original camera source, obligation scope, and confidence boundaries.
 */
export function observeAutoMoviePlacedCamera(props: {
  /** Settled original scene and delivery projection, before inspection effects. */
  sample: IAutoMovieDrawScene.IPlacedSample;

  /** Source-owned requirements active at this sample's exact time. */
  targets: readonly ICameraRequirement[];
}): IResult {
  const { sample, targets } = props;
  const findings: IAutoMovieInspectionDiagnostics.IFinding[] = [];
  const coverage: IAutoMovieInspectionDiagnostics.ICoverage[] = [];
  const distinct: Map<string, ICameraRequirement> = new Map(
    targets.map(
      (requirement: ICameraRequirement): [string, ICameraRequirement] => [
        requirement.path,
        requirement,
      ],
    ),
  );
  if (distinct.size === 0) return { findings, coverage };
  const maskTriangles: number = Math.floor(
    FRAME_MASK_TRIANGLE_BUDGET / distinct.size,
  );
  const rayTriangles: number = Math.floor(
    FRAME_RAY_TRIANGLE_BUDGET / distinct.size,
  );
  let pixelBudget: number = FRAME_PIXEL_BUDGET;
  for (const requirement of distinct.values()) {
    const { path, target, targetBounds, maxOcclusionRatio } = requirement;
    const input: Parameters<typeof observeAutoMovieCameraInspection>[0] = {
      scene: sample.scene,
      camera: sample.camera,
      target,
      ...(targetBounds === undefined ? {} : { targetBounds }),
      ...(maxOcclusionRatio === undefined ? {} : { maxOcclusionRatio }),
    };
    const raster: IAutoMovieDrawScene.IPlacedSample["auditRaster"] =
      sample.mode === "delivery" && maxOcclusionRatio !== undefined
        ? sample.auditRaster
        : undefined;
    const initial: IAutoMovieCameraInspection.IResult =
      observeAutoMovieCameraInspection({
        ...input,
        triangleBudget: raster === undefined ? rayTriangles : 0,
      });
    const grade: IAutoMovieCameraInspection.Framing = initial.framing;
    const framing: { check: string; key: string; required: true } = {
      check: "camera-framing",
      key: path,
      required: true,
    };
    const occlusion: { check: string; key: string; required: boolean } = {
      check: "camera-occlusion",
      key: path,
      required: maxOcclusionRatio !== undefined,
    };
    if (grade === "unavailable") {
      const reason: string =
        "No certified placed subject bounds for the delivery projection.";
      coverage.push({ ...framing, status: "deferred", reason });
      if (occlusion.required)
        coverage.push({ ...occlusion, status: "deferred", reason });
      continue;
    }
    coverage.push({ ...framing, status: "checked" });
    if (grade !== "possible") {
      const failure = FRAMING_FAILURES[grade];
      findings.push({
        check: framing.check,
        key: path,
        code: failure.code,
        paths: [path],
        category: "error",
        confidence: "confirmed",
        message: `Required subject ${path} ${failure.description}.`,
        witness: {},
      });
      if (occlusion.required)
        coverage.push({
          ...occlusion,
          status: "excluded",
          reason: "Framing already excludes the required subject.",
        });
      continue;
    }
    if (
      maxOcclusionRatio !== undefined &&
      (!Number.isFinite(maxOcclusionRatio) ||
        maxOcclusionRatio < 0 ||
        maxOcclusionRatio > 1)
    ) {
      coverage.push({
        ...occlusion,
        status: "unsupported",
        reason: "The authored maximum occlusion ratio must be in [0, 1].",
      });
      continue;
    }

    let reason: string =
      "Matched pixel coverage requires an authoritative delivery audit.";
    if (
      raster !== undefined &&
      target !== undefined &&
      maxOcclusionRatio !== undefined
    ) {
      const attempt: ReturnType<typeof measureAutoMovieCameraOcclusionPixels> =
        measureAutoMovieCameraOcclusionPixels({
          ...raster,
          scene: sample.scene,
          camera: sample.camera,
          target,
          width: sample.width,
          height: sample.height,
          maxSamples: pixelBudget,
          maxTriangles: maskTriangles,
        });
      pixelBudget -= attempt.samples;
      if (attempt.status === "measured") {
        const result: IAutoMovieCameraInspection.Occlusion =
          classifyAutoMovieCameraInspection({
            framing: grade,
            pixels: attempt.pixels,
            maxOcclusionRatio,
          }).occlusion;
        coverage.push({ ...occlusion, status: "checked" });
        if (
          result.status === "above-limit" ||
          result.status === "no-target-pixels"
        ) {
          const empty: boolean = result.status === "no-target-pixels";
          findings.push({
            check: occlusion.check,
            key: path,
            code: empty
              ? "camera-subject-no-pixels"
              : "camera-subject-occluded",
            paths: [path],
            category: "error",
            confidence: "confirmed",
            message: empty
              ? `Required subject ${path} covers no pixels in the isolated delivery image.`
              : `Required subject ${path} exceeds its maximum delivery pixel occlusion.`,
            witness: {
              rank: result.status === "above-limit" ? result.ratio : 0,
              measurements: [
                {
                  name: "isolated-target-pixels",
                  value: attempt.pixels.isolated,
                  unit: "pixels",
                },
                {
                  name: "visible-target-pixels",
                  value: attempt.pixels.visible,
                  unit: "pixels",
                },
                {
                  name: "camera-audit-passes",
                  value: attempt.passes,
                  unit: "passes",
                },
                ...(result.status === "above-limit"
                  ? [
                      {
                        name: "occlusion-ratio",
                        value: result.ratio,
                        limit: maxOcclusionRatio,
                        unit: "fraction",
                      },
                    ]
                  : []),
              ],
            },
          });
        }
        continue;
      }
      reason = attempt.reason;
    }

    const observation: IAutoMovieCameraInspection.Occlusion =
      raster === undefined
        ? initial.occlusion
        : observeAutoMovieCameraInspection({
            ...input,
            triangleBudget: rayTriangles,
          }).occlusion;
    if (
      observation.status === "witnesses" &&
      observation.samples.blocked > 0 &&
      observation.samples.clear === 0
    ) {
      const { blocked, clear, blocker } = observation.samples;
      findings.push({
        check: occlusion.check,
        key: path,
        code: "camera-subject-occluded",
        paths: [path],
        category: "error",
        confidence: "candidate",
        message: `Opaque geometry interrupts the sampled delivery rays to required subject ${path}.`,
        witness: {
          ...(blocker === undefined ? {} : { point: blocker }),
          rank: blocked,
          measurements: [
            { name: "blocked-rays", value: blocked, unit: "rays" },
            { name: "clear-rays", value: clear, unit: "rays" },
          ],
        },
      });
    }
    coverage.push(
      occlusion.required || observation.status !== "witnesses"
        ? { ...occlusion, status: "deferred", reason }
        : { ...occlusion, status: "checked" },
    );
  }
  return { findings, coverage };
}
