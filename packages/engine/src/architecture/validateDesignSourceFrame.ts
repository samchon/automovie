import {
  IAutoMovieDesignScaleCandidate,
  IAutoMovieDesignSourceFrame,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
import { validateTransformScalars } from "../validation/validateTransformScalars";
import { AUTO_MOVIE_DESIGN_FRAME_VIEWS } from "./constants/AUTO_MOVIE_DESIGN_FRAME_VIEWS";

/** Below this, a direction carries no direction; above `1 - it`, two are parallel. */
const AXIS_EPSILON: number = 1e-12;

/**
 * Validate how one source frame of an observed design reference is read.
 *
 * A frame states its own sheet: a known view, a whole page number from 1, a
 * null or non-blank level, a finite positive width and height, and an anchor
 * inside those bounds. Its scale readings need unique non-blank ids, a finite
 * positive `metersPerUnit`, a confidence in [0, 1] and a non-blank basis, and a
 * settled `scale` must name one of them; leaving it null is how an unknown
 * scale is recorded. `axisX`, `axisY`, `up` and a present `north` must be
 * finite non-zero directions, `axisX` and `axisY` must not be parallel, the
 * origin must be finite, and a present transform must have finite components,
 * a unit rotation and a positive scale. Every finding is pushed to `collector`
 * under `path`; nothing throws.
 *
 * @param frame Frame to validate.
 * @param path Violation path of the frame, such as `$input.frames[0]`.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Checks each field against its reader's domain. Axis comparison uses `Math.hypot` lengths, refuses non-finite derived lengths, and divides components only by finite lengths above `1e-12`; this avoids squared-length overflow for representable large axes. Absolute cosine above `1 - 1e-12` is the parallelism policy, not an exact orientation certificate.
 * @evidence contracts/common.md#clear-and-simple-design The frame half of `validateDesignReference`, separated so that validator stays within one file's size, and built from the shared collector rules for blank strings, ranges and directions plus the shared id and transform checks instead of private copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No view, sheet or scale reading is special-cased, and an unknown scale is accepted as null rather than replaced with a guessed candidate.
 * @evidence contracts/common.md#meaningful-documentation The documentation lists every rule by field, how an unknown scale is recorded, the path the findings use, and that nothing throws.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the frame's scale-candidate count, with a constant amount of vector arithmetic for the axes and no search.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one frame per call; the reference validator calls it once per frame and coordinates no shared work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The candidate id set is local and released on return; findings are appended to the caller's collector, a constant number per field plus four per scale candidate.
 */
export const validateDesignSourceFrame: (
  frame: IAutoMovieDesignSourceFrame,
  path: string,
  collector: ViolationCollector,
) => void = (
  frame: IAutoMovieDesignSourceFrame,
  path: string,
  collector: ViolationCollector,
): void => {
  if (
    !(AUTO_MOVIE_DESIGN_FRAME_VIEWS as readonly string[]).includes(frame.view)
  )
    collector.push(
      "type",
      `${path}.view`,
      `unknown source frame view "${String(frame.view)}"`,
      frame.view,
    );
  if (!Number.isSafeInteger(frame.page) || frame.page < 1)
    collector.push(
      "range",
      `${path}.page`,
      `source frame page must be a whole number >= 1, but was ${frame.page}`,
      frame.page,
    );
  if (frame.level !== null && frame.level.trim() === "")
    collector.push(
      "type",
      `${path}.level`,
      "source frame level must be null or non-blank",
      frame.level,
    );
  for (const axis of ["width", "height"] as const)
    if (!Number.isFinite(frame.bounds[axis]) || frame.bounds[axis] <= 0)
      collector.push(
        "range",
        `${path}.bounds.${axis}`,
        `source frame ${axis} must be a finite number > 0, but was ${frame.bounds[axis]}`,
        frame.bounds[axis],
      );
  for (const axis of ["x", "y"] as const) {
    const limit: number =
      axis === "x" ? frame.bounds.width : frame.bounds.height;
    const value: number = frame.anchor[axis];
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      (Number.isFinite(limit) && value > limit)
    )
      collector.push(
        "range",
        `${path}.anchor.${axis}`,
        `source frame anchor ${axis} must lie inside the frame bounds, but was ${value}`,
        value,
      );
  }
  const scaleIds: Set<string> = collectDeclaredIds(
    frame.scaleCandidates,
    `${path}.scaleCandidates`,
    "scale candidate",
    collector,
  );
  frame.scaleCandidates.forEach(
    (candidate: IAutoMovieDesignScaleCandidate, index: number): void => {
      const candidatePath: string = `${path}.scaleCandidates[${index}]`;
      if (
        !Number.isFinite(candidate.metersPerUnit) ||
        candidate.metersPerUnit <= 0
      )
        collector.push(
          "range",
          `${candidatePath}.metersPerUnit`,
          `scale candidate metersPerUnit must be a finite number > 0, but was ${candidate.metersPerUnit}`,
          candidate.metersPerUnit,
        );
      collector.range(
        `${candidatePath}.confidence`,
        candidate.confidence,
        0,
        1,
        "scale candidate confidence",
      );
      collector.nonEmpty(
        `${candidatePath}.basis`,
        candidate.basis,
        "scale basis",
      );
    },
  );
  if (frame.scale !== null && !scaleIds.has(frame.scale))
    collector.push(
      "type",
      `${path}.scale`,
      `settled scale "${frame.scale}" names no recorded scale candidate; leave it null while the scale is unknown`,
      frame.scale,
    );
  collector.direction(`${path}.axisX`, frame.axisX, "frame x axis");
  collector.direction(`${path}.axisY`, frame.axisY, "frame y axis");
  collector.direction(`${path}.up`, frame.up, "frame up");
  if (frame.north !== null)
    collector.direction(`${path}.north`, frame.north, "frame north");
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(frame.origin[axis]))
      collector.push(
        "range",
        `${path}.origin.${axis}`,
        `frame origin ${axis} must be finite, but was ${frame.origin[axis]}`,
        frame.origin[axis],
      );
  const axisXLength: number = Math.hypot(
    frame.axisX.x,
    frame.axisX.y,
    frame.axisX.z,
  );
  const axisYLength: number = Math.hypot(
    frame.axisY.x,
    frame.axisY.y,
    frame.axisY.z,
  );
  if (!Number.isFinite(axisXLength))
    collector.push(
      "range",
      `${path}.axisX`,
      "frame x axis must have a finite computed length",
      frame.axisX,
    );
  if (!Number.isFinite(axisYLength))
    collector.push(
      "range",
      `${path}.axisY`,
      "frame y axis must have a finite computed length",
      frame.axisY,
    );
  if (
    Number.isFinite(axisXLength) &&
    axisXLength > AXIS_EPSILON &&
    Number.isFinite(axisYLength) &&
    axisYLength > AXIS_EPSILON &&
    Math.abs(
      Vector3.dot(
        Vector3.scale(frame.axisX, 1 / axisXLength),
        Vector3.scale(frame.axisY, 1 / axisYLength),
      ),
    ) >
      1 - AXIS_EPSILON
  )
    collector.push(
      "type",
      `${path}.axisY`,
      "frame x and y axes must span a plane, but they are parallel",
      frame.axisY,
    );
  if (frame.transform !== null)
    validateTransformScalars({
      transform: frame.transform,
      path: `${path}.transform`,
      label: "source frame transform",
      collector,
    });
};
