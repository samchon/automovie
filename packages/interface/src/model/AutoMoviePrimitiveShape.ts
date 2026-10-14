import { IAutoMovieBoxShape } from "./IAutoMovieBoxShape";
import { IAutoMovieCapsuleShape } from "./IAutoMovieCapsuleShape";
import { IAutoMovieConeShape } from "./IAutoMovieConeShape";
import { IAutoMovieCylinderShape } from "./IAutoMovieCylinderShape";
import { IAutoMoviePlaneShape } from "./IAutoMoviePlaneShape";
import { IAutoMovieSphereShape } from "./IAutoMovieSphereShape";

/**
 * A compact parametric primitive shape.
 *
 * Where an {@link IAutoMovieMesh} carries explicit bulk vertex data, a primitive is a handful of named, bounded dimensions such as "a 0.4 m sphere" or "a 1.8 m tall capsule". It is the concise representation when a reviewed result needs no free-form topology. More complex deterministic source may generate an explicit mesh instead of pretending primitives can express it.
 *
 * Discriminated on `type`; each variant carries only the dimensions its shape needs. All dimensions are in meters and expected to be strictly positive (the engine rejects a zero/negative extent).
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union carries precisely each primitive's dimensions in local metres; validateExtents checks positive finite dimensions before tessellate dispatches to deterministic triangle construction.
 * @evidence contracts/common.md#clear-and-simple-design The six shape records keep unrelated dimensions out of each arm, while mesh geometry owns free-form topology; resolution is an engine concern rather than another authoring parameter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The union declares geometric shapes independently of fixtures or subjects; the current capsule tessellator still substitutes a cylinder, a consumer defect rather than a change to capsule semantics.
 * @evidence contracts/common.md#meaningful-documentation States the concise recipe-versus-explicit-mesh distinction, type discriminator, metre dimensions and strict positivity, with each arm documenting its axes and parameter meaning.
 * @author Samchon
 */
export type AutoMoviePrimitiveShape =
  | IAutoMovieBoxShape
  | IAutoMovieSphereShape
  | IAutoMovieCapsuleShape
  | IAutoMovieCylinderShape
  | IAutoMovieConeShape
  | IAutoMoviePlaneShape;
