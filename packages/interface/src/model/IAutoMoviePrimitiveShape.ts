import type { IAutoMovieBoxShape } from "./IAutoMovieBoxShape";
import type { IAutoMovieCapsuleShape } from "./IAutoMovieCapsuleShape";
import type { IAutoMovieConeShape } from "./IAutoMovieConeShape";
import type { IAutoMovieCylinderShape } from "./IAutoMovieCylinderShape";
import type { IAutoMoviePlaneShape } from "./IAutoMoviePlaneShape";
import type { IAutoMovieSphereShape } from "./IAutoMovieSphereShape";

/**
 * A compact parametric primitive shape.
 *
 * Where an {@link IAutoMovieMesh} carries explicit bulk vertex data, a primitive
 * is a handful of named, bounded dimensions such as "a 0.4 m sphere" or "a 1.8
 * m tall capsule". It is the concise representation when a reviewed result
 * needs no free-form topology. More complex deterministic source may generate
 * an explicit mesh instead of pretending primitives can express it.
 *
 * Discriminated on `type`; each variant carries only the dimensions its shape
 * needs. All dimensions are in meters and expected to be strictly positive (the
 * engine rejects a zero/negative extent).
 */
export type IAutoMoviePrimitiveShape =
  | IAutoMovieBoxShape
  | IAutoMovieSphereShape
  | IAutoMovieCapsuleShape
  | IAutoMovieCylinderShape
  | IAutoMovieConeShape
  | IAutoMoviePlaneShape;
