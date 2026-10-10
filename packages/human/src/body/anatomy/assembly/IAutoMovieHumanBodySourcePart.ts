import type { IAutoMovieHumanBodyGeneratedPart } from "../generated/IAutoMovieHumanBodyGeneratedPart";
import type { IAutoMovieHumanBodySourcePartPayload } from "./IAutoMovieHumanBodySourcePartPayload";

type SourcePart<Part extends IAutoMovieHumanBodyGeneratedPart> =
  Part extends IAutoMovieHumanBodyGeneratedPart
    ? Pick<Part, "id" | "tissue"> & IAutoMovieHumanBodySourcePartPayload
    : never;

/**
 * A coarse source part retaining the actual generated catalogue's id/tissue pair.
 *
 * The source union derives from the maintained generated-part identity rather
 * than a second catalogue. Actual boundary surfaces are not asserted to be
 * independently validated volumetric solids or clinically resolved tissue.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodySourcePart =
  SourcePart<IAutoMovieHumanBodyGeneratedPart>;
