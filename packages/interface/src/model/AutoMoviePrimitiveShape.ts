import { IAutoMovieBoxShape } from "./IAutoMovieBoxShape";
import { IAutoMovieCapsuleShape } from "./IAutoMovieCapsuleShape";
import { IAutoMovieConeShape } from "./IAutoMovieConeShape";
import { IAutoMovieCylinderShape } from "./IAutoMovieCylinderShape";
import { IAutoMoviePlaneShape } from "./IAutoMoviePlaneShape";
import { IAutoMovieSphereShape } from "./IAutoMovieSphereShape";

/**
 * A compact parametric primitive shape.
 *
 * Where an {@link IAutoMovieMesh} carries explicit bulk vertex data, a
 * primitive is a handful of named, bounded dimensions such as "a 0.4 m sphere"
 * or "a 1.8 m tall capsule". It is the concise representation when a reviewed
 * result needs no free-form topology. More complex deterministic source may
 * generate an explicit mesh instead of pretending primitives can express it.
 *
 * Discriminated on `type`; each variant carries only the dimensions its shape
 * needs. All dimensions are in meters and expected to be strictly positive (the
 * engine rejects a zero/negative extent).
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Exposes `AutoMoviePrimitiveShape` as the portable data boundary for the asset primitive freeform geometry requirement.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `AutoMoviePrimitiveShape` for the asset spec geometry inputs system contract.
 * @author Samchon
 */
export type AutoMoviePrimitiveShape =
  | IAutoMovieBoxShape
  | IAutoMovieSphereShape
  | IAutoMovieCapsuleShape
  | IAutoMovieCylinderShape
  | IAutoMovieConeShape
  | IAutoMoviePlaneShape;
