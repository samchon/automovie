/**
 * Shared by validateDesignReference, designFrameScale, which were one file until each public identity took its own.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` fixes every container family a design reference may declare. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` bounds the auto movie design reference media policy while the engine closes a reviewed reference from source identity through downstream consumers.
 * @author Samchon
 */
export const validateFrame = (
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
