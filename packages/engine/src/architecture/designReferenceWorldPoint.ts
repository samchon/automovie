import { IAutoMovieDesignPoint, IAutoMovieDesignSourceFrame, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "../math/Quaternion";
import { designFrameScale } from "./designFrameScale";

/**
 * Map one source-space point onto world metres through its frame.
 *
 * The mapping is `origin + axisX * (x - anchor.x) * s + axisY * (y - anchor.y)
 *
 * - S`, with `s`the settled metres-per-unit, followed by the frame's optional
 *   placement transform. Axes are normalized here rather than demanded
 *   normalized from the author, so a hand-written`{ x: 0, y: 0, z: 2 }` means
 *   the direction it plainly means instead of doubling every measurement.
 *
 * Throws when the frame's scale is unsettled: producing a number there is the
 * exact failure this whole graph exists to prevent.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `designReferenceWorldPoint` maps one source-space point onto world metres through its frame. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `designReferenceWorldPoint` maps one frame-local source point through its settled scale, axes, origin, and optional transform into world metres.
 * @evidence requirements/external-inputs/identity-coordinates-and-units.md#external-identity-spatial-coordinates-units `designReferenceWorldPoint` explicitly applies the settled source-unit scale, source axes, anchor, origin, and optional placement transform when producing world metres.
 * @evidence specifications/interchange-and-adoption/identity-coordinates-and-units.md#interchange-spatial-transform-chain The point conversion implements the design-reference subset of an ordered source-to-world transform chain and refuses an unsettled scale.
 */
export const designReferenceWorldPoint = (
  frame: IAutoMovieDesignSourceFrame,
  point: IAutoMovieDesignPoint,
): IAutoMovieVector3 => {
  const meters = designFrameScale(frame);
  if (meters === null)
    throw new Error(
      `design frame "${frame.id}" has no settled scale, so source point (${point.x}, ${point.y}) has no world position.`,
    );
  const x = unit(frame.axisX);
  const y = unit(frame.axisY);
  const dx = (point.x - frame.anchor.x) * meters;
  const dy = (point.y - frame.anchor.y) * meters;
  const mapped: IAutoMovieVector3 = {
    x: frame.origin.x + x.x * dx + y.x * dy,
    y: frame.origin.y + x.y * dx + y.y * dy,
    z: frame.origin.z + x.z * dx + y.z * dy,
  };
  const transform = frame.transform;
  if (transform === null) return mapped;
  const scaled: IAutoMovieVector3 = {
    x: mapped.x * transform.scale.x,
    y: mapped.y * transform.scale.y,
    z: mapped.z * transform.scale.z,
  };
  const rotated = Quaternion.rotateVector(
    Quaternion.normalize(transform.rotation),
    scaled,
  );
  return {
    x: rotated.x + transform.translation.x,
    y: rotated.y + transform.translation.y,
    z: rotated.z + transform.translation.z,
  };
};
