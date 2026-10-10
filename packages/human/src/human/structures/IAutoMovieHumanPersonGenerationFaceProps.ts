import type { IAutoMovieHumanPersonChannelAlias } from "./IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonEndpointDriver } from "./IAutoMovieHumanPersonEndpointDriver";

/**
 * Inputs of `deriveHumanPersonGenerationFace`: the person, the body's endpoint
 * gains under its state, and the generation's aliases and drivers.
 *
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
