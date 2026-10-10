import type { IAutoMovieHumanFaceLowerLashPair } from "./IAutoMovieHumanFaceLowerLashPair";
import type { IAutoMovieHumanFaceUpperLashPair } from "./IAutoMovieHumanFaceUpperLashPair";

/**
 * A document's independent lash profiles, upper and lower rows separately.
 *
 * A present row replaces that row's lash cards with numerical lashes rooted on
 * the registered live anterior lid edge, distinct from the posterior contact
 * margin. Count is explicit for each side, including zero. It needs the
 * basis's periocular and anterior root registrations; without them the builder refuses the document by name. An
 * omitted row keeps the basis's cards byte for byte.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLashes {
  /** Upper lash row, or omitted to keep the basis's upper cards. */
  upper?: IAutoMovieHumanFaceUpperLashPair;

  /** Lower lash row, or omitted to keep the basis's lower cards. */
  lower?: IAutoMovieHumanFaceLowerLashPair;
}
