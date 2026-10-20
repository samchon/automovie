import { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

import { deriveCenterOfMass } from "./deriveCenterOfMass";

/**
 * The model's center of mass: its declared {@link IAutoMovieBody.centerOfMass}
 * when given, else the volume-weighted centroid derived from geometry
 * ({@link deriveCenterOfMass}). `null` when neither is available (no body and no
 * primitive volume to weigh). The single entry point support/balance checks use
 * so an explicit COM (a weighted base) always wins over the geometric one.
 *
 *
 * @evidence contracts/common.md#principled-implementation An authored body.centerOfMass takes precedence; otherwise deriveCenterOfMass estimates a uniform-density primitive aggregate. Mesh-only or zero-volume geometry has no derived center.
 * @evidence contracts/common.md#clear-and-simple-design One precedence decision delegates geometry mathematics to its canonical owner and leaves missing-body policy to the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit centers are an authored override, not a measurement workaround; the derived branch cannot infer articulated bone placement or mesh density.
 * @evidence contracts/common.md#meaningful-documentation The comment states model-local metre coordinates, explicit override precedence and null derivation; an override is borrowed while a derived vector is new.
 * @evidence contracts/performance.md#efficient-algorithms The explicit branch is O(1); deriving scans P parts with constant auxiliary accumulation and primitive-volume work per part.
 * @evidence contracts/performance.md#reuse-equivalent-work The authored center is reused directly; derived values are recomputed because mutable parts, scales and transforms determine equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a returned center escapes; no model cache, native handle or background task is retained.
 */
export const bodyCenterOfMass: (
  model: IAutoMovieModel,
) => IAutoMovieVector3 | null = (
  model: IAutoMovieModel,
): IAutoMovieVector3 | null =>
  model.body?.centerOfMass ?? deriveCenterOfMass(model);
