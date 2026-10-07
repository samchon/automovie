import type { IAutoMovieHumanPersonChannelAlias } from "./IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonEndpointDriver } from "./IAutoMovieHumanPersonEndpointDriver";

/**
 * Inputs of `deriveHumanPersonGenerationFace`: the person, the body's endpoint
 * gains under its state, and the generation's aliases and drivers.
 *
 * @evidence contracts/common.md#principled-implementation The face document of a one-skin person depends on exactly these four inputs.
 * @evidence contracts/common.md#clear-and-simple-design Four fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The gains are the body's own, never recomputed for the face.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#parameter-channels Carries the alias and driver channel records the derivation applies.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The props define no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The props emit no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The props carry no value with a unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The props build no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The props are not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The props carry no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The props admit nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The props convert no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationFaceProps {
  /** The person document. */
  document: IAutoMovieHumanPersonDocument;

  /** Each body endpoint's gain under the body's endpoint state. */
  gains: ReadonlyMap<string, number>;

  /** Face channels the generation defines once through a body channel. */
  aliases: readonly IAutoMovieHumanPersonChannelAlias[];

  /** Body endpoints whose rows the face view holds, by driver channel. */
  drivers: readonly IAutoMovieHumanPersonEndpointDriver[];
}
