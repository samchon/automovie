import { IAutoMovieModel } from "@automovie/interface";
import { tessellate } from "../geometry/tessellate";
import { computeModelRestExtent } from "./computeModelRestExtent";

/**
 * A model's rest-pose vertical extent in model space: the world-Y range of the
 * geometry a renderer would actually draw.
 *
 * This is the subject height the framing grammar needs, and the reason it is
 * not {@link computeRestHeight}. A rig stops at the joints animation requires;
 * the figure does not. The generated `stickman` has no foot bone and no
 * head-top bone, so its joint span is 0.680 of the declared height, and a
 * `full` shot solved from that number shows an actor from the shins up.
 *
 * Every part is placed the way the renderer places it — its own transform, then
 * its attached bone's rest frame, or model space when it rides no bone — and
 * primitives are measured through {@link tessellate}, the same code that
 * produces the vertices, so the extent cannot drift from the picture. Returns
 * null when a model has nothing to measure, leaving the caller's own fallback
 * in charge rather than inventing a height.
 *
 * @evidence requirements/camera/framing-and-shot-size.md#camera-landmark-framing computeModelRestExtentY measures drawn geometry in model space so landmark framing uses the subject's visible vertical extent.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-framing-landmark-relations computeModelRestExtentY realizes landmark-based framing: A model's rest-pose vertical extent in model space: the world-Y range of the geometry a renderer would actually draw. This is the subject height the framing grammar needs, and the reason it is not {@link computeRestHeight}. A rig stops at the joints animation requires; the figure does not. The generated `stickman` has no foot bone and no head-top bone, so its joint span is 0.680 of the declared height, and a `full` shot solved from that number shows an actor from the shins up. Every part is placed the way the renderer places it — its own transform, then its attached bone's rest frame, or model space when it rides no bone — and primitives are measured through {@link tessellate}, the same code that produces the vertices, so the extent cannot drift from the picture. Returns null when a model has nothing to measure, leaving the caller's own fallback in charge rather than inventing a height.
 */
export const computeModelRestExtentY = (
  model: IAutoMovieModel,
): { min: number; max: number } | null => {
  const extent = computeModelRestExtent(model);
  return extent === null ? null : { min: extent.min.y, max: extent.max.y };
};
