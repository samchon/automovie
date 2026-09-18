import { IAutoMovieDesignSourceFrame, IAutoMovieVector3 } from "@automovie/interface";
import { validateTransformScalars } from "../validation/validateTransformScalars";
import { ViolationCollector } from "../validation/ViolationCollector";
import { AUTO_MOVIE_DESIGN_FRAME_VIEWS } from "./AUTO_MOVIE_DESIGN_FRAME_VIEWS";

/**
 * The metres-per-unit a frame has actually settled on, or null.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `designFrameScale` produces the metres-per-unit a frame has actually settled on, or null. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `designFrameScale` resolves the selected scale candidate to metres per source unit, or returns `null` while scale is unsettled.
 */
export const designFrameScale = (
  frame: IAutoMovieDesignSourceFrame,
): number | null => {
  if (frame.scale === null) return null;
  const candidate = frame.scaleCandidates.find(
    (entry) => entry.id === frame.scale,
  );
  return candidate === undefined ? null : candidate.metersPerUnit;
};

const validateFrame = (
  frame: IAutoMovieDesignSourceFrame,
  path: string,
  out: ViolationCollector,
): void => {
  if (
    !(AUTO_MOVIE_DESIGN_FRAME_VIEWS as readonly string[]).includes(frame.view)
  )
    out.push(
      "type",
      `${path}.view`,
      `unknown source frame view "${String(frame.view)}"`,
      frame.view,
    );
  if (!Number.isSafeInteger(frame.page) || frame.page < 1)
    out.push(
      "range",
      `${path}.page`,
      `source frame page must be a whole number >= 1, but was ${frame.page}`,
      frame.page,
    );
  if (frame.level !== null && frame.level.trim() === "")
    out.push(
      "type",
      `${path}.level`,
      "source frame level must be null or non-blank",
      frame.level,
    );
  for (const axis of ["width", "height"] as const)
    if (!Number.isFinite(frame.bounds[axis]) || frame.bounds[axis] <= 0)
      out.push(
        "range",
        `${path}.bounds.${axis}`,
        `source frame ${axis} must be a finite number > 0, but was ${frame.bounds[axis]}`,
        frame.bounds[axis],
      );
  for (const axis of ["x", "y"] as const) {
    const limit = axis === "x" ? frame.bounds.width : frame.bounds.height;
    const value = frame.anchor[axis];
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      (Number.isFinite(limit) && value > limit)
    )
      out.push(
        "range",
        `${path}.anchor.${axis}`,
        `source frame anchor ${axis} must lie inside the frame bounds, but was ${value}`,
        value,
      );
  }
  const scaleIds = collectIds(
    frame.scaleCandidates,
    `${path}.scaleCandidates`,
    "scale candidate",
    out,
  );
  frame.scaleCandidates.forEach((candidate, index) => {
    const candidatePath = `${path}.scaleCandidates[${index}]`;
    if (
      !Number.isFinite(candidate.metersPerUnit) ||
      candidate.metersPerUnit <= 0
    )
      out.push(
        "range",
        `${candidatePath}.metersPerUnit`,
        `scale candidate metersPerUnit must be a finite number > 0, but was ${candidate.metersPerUnit}`,
        candidate.metersPerUnit,
      );
    out.range(
      `${candidatePath}.confidence`,
      candidate.confidence,
      0,
      1,
      "scale candidate confidence",
    );
    nonEmpty(candidate.basis, `${candidatePath}.basis`, "scale basis", out);
  });
  if (frame.scale !== null && !scaleIds.has(frame.scale))
    out.push(
      "type",
      `${path}.scale`,
      `settled scale "${frame.scale}" names no recorded scale candidate; leave it null while the scale is unknown`,
      frame.scale,
    );
  direction(frame.axisX, `${path}.axisX`, "frame x axis", out);
  direction(frame.axisY, `${path}.axisY`, "frame y axis", out);
  direction(frame.up, `${path}.up`, "frame up", out);
  if (frame.north !== null)
    direction(frame.north, `${path}.north`, "frame north", out);
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(frame.origin[axis]))
      out.push(
        "range",
        `${path}.origin.${axis}`,
        `frame origin ${axis} must be finite, but was ${frame.origin[axis]}`,
        frame.origin[axis],
      );
  if (
    lengthOf(frame.axisX) > AXIS_EPSILON &&
    lengthOf(frame.axisY) > AXIS_EPSILON &&
    Math.abs(dot(unit(frame.axisX), unit(frame.axisY))) > 1 - AXIS_EPSILON
  )
    out.push(
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
      collector: out,
    });
};

const lengthOf = (value: IAutoMovieVector3): number =>
  Math.hypot(value.x, value.y, value.z);

const dot = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;

const unit = (value: IAutoMovieVector3): IAutoMovieVector3 => {
  const length = lengthOf(value);
  if (length <= AXIS_EPSILON) return value;
  return { x: value.x / length, y: value.y / length, z: value.z / length };
};

const direction = (
  value: IAutoMovieVector3,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(value[axis]))
      out.push(
        "range",
        `${path}.${axis}`,
        `${label} ${axis} must be finite, but was ${value[axis]}`,
        value[axis],
      );
  const length = lengthOf(value);
  if (Number.isFinite(length) && length <= AXIS_EPSILON)
    out.push("range", path, `${label} must be a non-zero direction`, value);
};

const collectIds = <T extends { id: string }>(
  records: readonly T[],
  path: string,
  label: string,
  out: ViolationCollector,
): Set<string> => {
  const ids = new Set<string>();
  records.forEach((record, index) => {
    nonEmpty(record.id, `${path}[${index}].id`, `${label} id`, out);
    if (ids.has(record.id))
      out.push(
        "type",
        `${path}[${index}].id`,
        `${label} id "${record.id}" must be unique`,
        record.id,
      );
    ids.add(record.id);
  });
  return ids;
};

const validateReferences = (
  references: readonly string[],
  targets: ReadonlySet<string>,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  const seen = new Set<string>();
  references.forEach((reference, index) => {
    if (!targets.has(reference))
      out.push(
        "type",
        `${path}[${index}]`,
        `${label} "${reference}" does not resolve`,
        reference,
      );
    if (seen.has(reference))
      out.push(
        "type",
        `${path}[${index}]`,
        `${label} "${reference}" is duplicated`,
        reference,
      );
    seen.add(reference);
  });
};

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    out.push("type", path, `${label} must be non-empty`, value);
};

const lengthOf = (value: IAutoMovieVector3): number =>
  Math.hypot(value.x, value.y, value.z);

const dot = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
  a.x * b.x + a.y * b.y + a.z * b.z;
