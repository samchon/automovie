import {
  IAutoMovieDesignScaleCandidate,
  IAutoMovieDesignSourceFrame,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
import { validateTransformScalars } from "../validation/validateTransformScalars";

/**
 * Validate how one source frame of an observed design reference is read.
 *
 * A frame states its own sheet: a known view, a whole page number from 1, a
 * null or non-blank level, a finite positive width and height, and an anchor
 * inside those bounds. Its scale readings need unique ids, a finite positive
 * `metersPerUnit`, a confidence in [0, 1] and a non-blank basis, and a settled
 * `scale` must name one of them; leaving it null is how an unknown scale is
 * recorded. `axisX`, `axisY`, `up` and a present `north` must be finite
 * non-zero directions, `axisX` and `axisY` must not be parallel, the origin
 * must be finite, and a present transform must have finite components, a unit
 * rotation and a positive scale. Every finding is pushed to `collector` under
 * `path`; nothing throws.
 *
 * @param frame Frame to validate.
 * @param path Violation path of the frame, such as `$input.frames[0]`.
 * @param collector Sink that receives the violations.
 */
export function validateDesignSourceFrame(
  frame: IAutoMovieDesignSourceFrame,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  const view: unknown = frame.view;
  if (typeof view !== "string" || !Object.hasOwn(DESIGN_FRAME_VIEWS, view))
    collector.push(
      "type",
      `${path}.view`,
      `unknown source frame view "${String(view)}"`,
      view,
    );
  if (frame.page < 1)
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
    if (frame.bounds[axis] <= 0)
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
    if (value < 0 || value > limit)
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
      if (candidate.metersPerUnit <= 0)
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
  if (
    axisXLength > AXIS_EPSILON &&
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
}

/** Drawing families recognized in raw frame data. */
const DESIGN_FRAME_VIEWS: Readonly<
  Record<IAutoMovieDesignSourceFrame["view"], true>
> = {
  plan: true,
  section: true,
  elevation: true,
  detail: true,
  perspective: true,
};

/** Direction length floor and unit-dot slack from parallel. */
const AXIS_EPSILON: number = 1e-12;
