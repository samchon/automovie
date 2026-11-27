import { classifyAutoMovieCameraInspection } from "@automovie/engine";
import type {
  IAutoMovieCameraInspection,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import type { Mesh, Object3D } from "three";

import type { IAutoMovieDrawScene } from "../../../draw/IAutoMovieDrawScene.js";
import { listAutoMovieCameraSubjectMeshes } from "./listAutoMovieCameraSubjectMeshes.js";
import { measureAutoMovieCameraFrameEdge } from "../measureAutoMovieCameraFrameEdge.js";
import { measureAutoMovieCameraNearClip } from "./measureAutoMovieCameraNearClip.js";
import { measureAutoMovieCameraOcclusionPixels } from "../measureAutoMovieCameraOcclusionPixels.js";
import { observeAutoMovieCameraInspection } from "./observeAutoMovieCameraInspection.js";

/** A source requirement active in the placed sample. */
interface ICameraRequirement {
  /** Stable path of the authored subject within its source scope. */
  readonly path: string;

  /** Source-resolved displayed object, absent when resolution failed. */
  readonly target: Object3D | undefined;

  /**
   * Authored maximum fraction, inclusive, when the source requires pixel
   * coverage.
   */
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
 * triangles the near-plane clip and then the frame-edge cut examine. Only
 * meshes whose box reaches in front of the near plane in view pay for the
 * first, and only subjects whose bounds cross a side of the frame for the
 * second.
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
 * Observe active, source-owned requirements on the host's original delivery
 * camera.
 *
 * The interactive Viewer checks each painted frame under fixed triangle budgets
 * and reports a check they stop as `deferred`. Capture and delivery run every
 * camera check without a budget, and they audit authored pixel coverage with
 * the host renderer, so they leave nothing deferred. A check that cannot run on
 * the subject at all is `unsupported` in every host.
 *
 * A subject whose bounds cross a side of the frame gets an optional
 * `camera-frame-edge` check: a cut by the frame edge is often the intended
 * composition, so it is a `frame-edge-cut` warning that never blocks delivery.
 *
 * @param props The placed sample and the requirements active at its time.
 * @returns Findings and one coverage row per check and requirement.
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
    if (
      grade === "outside" ||
      grade === "before-near" ||
      grade === "past-far"
    ) {
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
    const meshes: Mesh[] | undefined =
      target === undefined || sample.scene.overrideMaterial !== null
        ? undefined
        : listAutoMovieCameraSubjectMeshes(target, sample.camera);
    const clip: measureAutoMovieCameraNearClip.IResult =
      measureAutoMovieCameraNearClip({
        camera: sample.camera,
        meshes,
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

    // A frame side may cut a subject still in frame; the surface work shares
    // the near clip's triangle allowance, so one budget bounds both checks.
    const edge: IRow = {
      check: "camera-frame-edge",
      key: path,
      required: false,
    };
    if (grade === "possible") coverage.push({ ...edge, status: "checked" });
    else
      coverage.push(
        reportFrameEdge(
          findings,
          edge,
          measureAutoMovieCameraFrameEdge({
            camera: sample.camera,
            meshes,
            ...(targetBounds === undefined ? {} : { bounds: targetBounds }),
            triangleBudget:
              clip.status === "over-budget"
                ? 0
                : clip.status === "unmeasured"
                  ? clipTriangles
                  : clipTriangles - clip.triangles,
          }),
        ),
      );
    if (
      maxOcclusionRatio !== undefined &&
      (maxOcclusionRatio < 0 || maxOcclusionRatio > 1)
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

/**
 * Report an exact pixel count that breaks the authored limit or finds no
 * subject.
 */
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

/**
 * Report a cut by the frame's sides as a warning and return its coverage row.
 *
 * A cut confirmed on an opaque drawn surface is `confirmed`; one seen only on a
 * transparent surface, or inferred from bounds the surface could not check, is
 * a `candidate`. A budget stop leaves the row `deferred` and an unreadable
 * surface leaves it `unsupported`, each with its candidate.
 */
function reportFrameEdge(
  findings: IAutoMovieInspectionDiagnostics.IFinding[],
  row: IRow,
  result: measureAutoMovieCameraFrameEdge.IResult,
): IAutoMovieInspectionDiagnostics.ICoverage {
  if (result.status === "unmeasured")
    return { ...row, status: "unsupported", reason: result.reason };
  if (result.status === "inside" || result.surface.status === "clear")
    return { ...row, status: "checked" };
  const { crossings, surface } = result;
  const extents: number[] = crossings.flatMap(
    (crossing: measureAutoMovieCameraFrameEdge.ICrossing): number[] =>
      crossing.extent === undefined ? [] : [crossing.extent],
  );
  const sides: string = crossings
    .map(
      (crossing: measureAutoMovieCameraFrameEdge.ICrossing): string =>
        crossing.side,
    )
    .join(" ");
  const confirmed: boolean = surface.status === "cut" && surface.opaque;
  findings.push({
    check: row.check,
    key: row.key,
    code: "frame-edge-cut",
    paths: [row.key],
    category: "warning",
    confidence: confirmed ? "confirmed" : "candidate",
    message: `Required subject ${row.key} ${confirmed ? "is" : "may be"} cut by the ${sides.replaceAll(" ", " and ")} ${crossings.length > 1 ? "edges" : "edge"} of the delivery frame.`,
    witness: {
      rank: Math.max(...extents),
      measurements: [
        { name: "crossed-sides", value: sides, unit: "sides" },
        ...crossings.flatMap(
          (
            crossing: measureAutoMovieCameraFrameEdge.ICrossing,
          ): IAutoMovieInspectionDiagnostics.IMeasurement[] =>
            crossing.extent === undefined
              ? []
              : [
                  {
                    name: `${crossing.side}-edge-extent`,
                    value: crossing.extent,
                    unit: "normalized device units",
                  },
                ],
        ),
        ...(surface.status === "cut"
          ? [
              {
                name: "frame-edge-triangles",
                value: surface.triangles,
                unit: "triangles",
              },
              ...(surface.fraction === undefined
                ? []
                : [
                    {
                      name: "visible-fraction-by-projected-surface-area",
                      value: surface.fraction,
                      unit: "fraction",
                    },
                  ]),
            ]
          : []),
      ],
    },
  });
  return surface.status === "cut"
    ? { ...row, status: "checked" }
    : {
        ...row,
        status: surface.status === "over-budget" ? "deferred" : "unsupported",
        reason: surface.reason,
      };
}
