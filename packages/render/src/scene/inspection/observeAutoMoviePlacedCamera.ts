import { classifyAutoMovieCameraInspection } from "@automovie/engine";
import type {
  IAutoMovieCameraInspection,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import type { Object3D } from "three";

import type { IAutoMovieDrawScene } from "../../draw/IAutoMovieDrawScene.js";
import { listAutoMovieCameraSubjectMeshes } from "./listAutoMovieCameraSubjectMeshes.js";
import { measureAutoMovieCameraNearClip } from "./measureAutoMovieCameraNearClip.js";
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
 * Viewer-only cap, per painted frame and shared by its subjects, on candidate
 * triangles before each subject's at-most-nine-ray occlusion check.
 */
const PREVIEW_RAY_TRIANGLE_BUDGET: number = 3_000;

/**
 * Viewer-only cap, per painted frame and shared by its subjects, on drawn
 * triangles the near-plane clip examines. Only meshes whose box reaches in
 * front of the near plane in view pay.
 */
const PREVIEW_NEAR_CLIP_TRIANGLE_BUDGET: number = 200_000;

/** Independent diagnostic rows emitted by the placed camera observation. */
type IResult = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;

/** A coverage row's identity before its outcome. */
type IRow = Pick<
  IAutoMovieInspectionDiagnostics.ICoverage,
  "check" | "key" | "required"
>;

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
 * The interactive Viewer checks each painted frame under fixed triangle
 * budgets and reports a check they stop as `deferred`. Capture and delivery
 * run every camera check without a budget, and they audit authored pixel
 * coverage with the host renderer, so they leave nothing deferred. A check that
 * cannot run on the subject at all is `unsupported` in every host.
 *
 * @param props The placed sample and the requirements active at its time.
 * @returns Findings and one coverage row per check and requirement.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Bounds exclusion yields a confirmed framing error. A subject in frame whose drawn surface reaches in front of the near plane is cut open in the picture; on an opaque stock surface that is a confirmed error, witnessed on the near plane where the cut shows. Exact pixel counts from the host renderer confirm the authored coverage limit. Sparse ray witnesses can suggest occlusion but never satisfy a pixel obligation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The host mode decides the budgets once; framing, near clip and occlusion each emit their own coverage row, and each open row's status names its cause: a budget or missing renderer defers, an uncheckable subject is unsupported.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No budget applies in capture or delivery, so a dense subject cannot leave a required check open there; the Viewer's caps are named per-frame constants for interactivity, not tuned to a scene.
 * @evidence contracts/development/implementation.md#efficient-algorithms The Viewer runs no raster pass and divides its per-frame triangle caps among the distinct requirements. Capture and delivery cost one pixel audit per requirement with an authored ratio and near-clip work only for meshes reaching in front of the near plane.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each sample observes its own placement.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain rows; the pixel audit restores and releases what it borrows.
 * @evidence contracts/development/common.md#meaningful-documentation Names the original camera source, the per-host budgets, obligation scope, confidence boundaries and what each open status means.
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

  // Only the interactive preview is budgeted; capture and delivery must finish.
  const preview: boolean = sample.mode === "viewer";
  const share: (budget: number) => number = (budget: number): number =>
    preview ? Math.floor(budget / distinct.size) : Number.MAX_SAFE_INTEGER;
  const rayTriangles: number = share(PREVIEW_RAY_TRIANGLE_BUDGET);
  const clipTriangles: number = share(PREVIEW_NEAR_CLIP_TRIANGLE_BUDGET);
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
      !preview && maxOcclusionRatio !== undefined
        ? sample.auditRaster
        : undefined;
    const initial: IAutoMovieCameraInspection.IResult =
      observeAutoMovieCameraInspection({
        ...input,
        triangleBudget: raster === undefined ? rayTriangles : 0,
      });
    const grade: IAutoMovieCameraInspection.Framing = initial.framing;
    const framing: IRow = {
      check: "camera-framing",
      key: path,
      required: true,
    };
    const occlusion: IRow = {
      check: "camera-occlusion",
      key: path,
      required: maxOcclusionRatio !== undefined,
    };
    if (grade === "unavailable") {
      const reason: string =
        "No certified placed subject bounds for the delivery projection.";
      coverage.push({ ...framing, status: "unsupported", reason });
      if (occlusion.required)
        coverage.push({ ...occlusion, status: "unsupported", reason });
      continue;
    }
    coverage.push({ ...framing, status: "checked" });
    if (grade !== "possible") {
      const failure: { code: string; description: string } =
        FRAMING_FAILURES[grade];
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

    // A subject still in frame is cut open where the camera has entered it.
    const nearClip: IRow = {
      check: "camera-near-clip",
      key: path,
      required: true,
    };
    const clip: measureAutoMovieCameraNearClip.IResult =
      measureAutoMovieCameraNearClip({
        camera: sample.camera,
        meshes:
          target === undefined || sample.scene.overrideMaterial !== null
            ? undefined
            : listAutoMovieCameraSubjectMeshes(target, sample.camera),
        ...(targetBounds === undefined ? {} : { bounds: targetBounds }),
        triangleBudget: clipTriangles,
      });
    coverage.push(
      clip.status === "over-budget"
        ? { ...nearClip, status: "deferred", reason: clip.reason }
        : clip.status === "unmeasured"
          ? { ...nearClip, status: "unsupported", reason: clip.reason }
          : { ...nearClip, status: "checked" },
    );
    if (clip.status === "clipped")
      findings.push({
        check: nearClip.check,
        key: path,
        code: "camera-subject-clipped-near",
        paths: [path],
        category: "error",
        confidence: clip.opaque ? "confirmed" : "candidate",
        message: `The delivery near plane cuts ${clip.depth.toFixed(3)} m into required subject ${path}.`,
        witness: {
          point: clip.cut,
          rank: clip.depth,
          measurements: [
            { name: "near-plane-intrusion", value: clip.depth, unit: "metres" },
            {
              name: "near-clip-triangles",
              value: clip.triangles,
              unit: "triangles",
            },
          ],
        },
      });
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

    // An authored ratio needs exact pixels, which only a host renderer gives.
    let audit: string =
      "Matched pixel coverage needs the capture or delivery host's renderer audit.";
    if (
      raster !== undefined &&
      target !== undefined &&
      maxOcclusionRatio !== undefined
    ) {
      const attempt: measureAutoMovieCameraOcclusionPixels.IResult =
        measureAutoMovieCameraOcclusionPixels({
          ...raster,
          scene: sample.scene,
          camera: sample.camera,
          target,
          width: sample.width,
          height: sample.height,
        });
      if (attempt.status === "measured") {
        coverage.push({ ...occlusion, status: "checked" });
        reportPixels(findings, path, attempt, maxOcclusionRatio, grade);
        continue;
      }
      audit = attempt.reason;
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

    // A required ratio waits for a renderer or was refused by the audit; an
    // optional sparse check fails in unbudgeted hosts only on unsupported geometry.
    coverage.push(
      occlusion.required
        ? {
            ...occlusion,
            status: raster === undefined ? "deferred" : "unsupported",
            reason: audit,
          }
        : observation.status === "witnesses"
          ? { ...occlusion, status: "checked" }
          : {
              ...occlusion,
              status: preview ? "deferred" : "unsupported",
              reason: "No sparse delivery ray reached the subject's surface.",
            },
    );
  }
  return { findings, coverage };
}

/** Report an exact pixel count that breaks the authored limit or finds no subject. */
function reportPixels(
  findings: IAutoMovieInspectionDiagnostics.IFinding[],
  path: string,
  attempt: Extract<
    measureAutoMovieCameraOcclusionPixels.IResult,
    { status: "measured" }
  >,
  maxOcclusionRatio: number,
  grade: IAutoMovieCameraInspection.Framing,
): void {
  const result: IAutoMovieCameraInspection.Occlusion =
    classifyAutoMovieCameraInspection({
      framing: grade,
      pixels: attempt.pixels,
      maxOcclusionRatio,
    }).occlusion;
  if (result.status !== "above-limit" && result.status !== "no-target-pixels")
    return;
  const empty: boolean = result.status === "no-target-pixels";
  findings.push({
    check: "camera-occlusion",
    key: path,
    code: empty ? "camera-subject-no-pixels" : "camera-subject-occluded",
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
        { name: "camera-audit-passes", value: attempt.passes, unit: "passes" },
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
