import type { IAutoMovieHumanBodyBuild } from "@automovie/human/body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanPersonConstruction } from "@automovie/human/human/structures/IAutoMovieHumanPersonConstruction";

/**
 * Same-construction values supplied by the normal model archive owner.
 * A supplied person owns the body result used by the reading, so independent
 * body evaluations cannot be mixed into a whole-person record. The directory
 * is the already-created model archive, not another geometry output path.
 *
 * @evidence contracts/common.md#principled-implementation Keeps construction values and their source provenance with the caller that produced them.
 * @evidence contracts/common.md#clear-and-simple-design Explicit inputs expose the archive boundary and same-person authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Accepts actual build results rather than synthetic frame inputs.
 * @evidence contracts/common.md#meaningful-documentation States body/person ownership and the existing directory precondition.
 * @author Samchon
 */
export interface IWriteHumanBodyConstructionRigReadingProps {
  /** Existing complete model archive directory that owns the new reading. */
  directory: string;

  /** Actual paired generation retained by the model archive's provenance. */
  generation: string;

  /** Original source assembly digest already used by the construction record. */
  sourceAssemblySha256: string;

  /** Returned body result for the body-only archive. */
  body: IAutoMovieHumanBodyBuild;

  /** Whole-person result, when present, supplies its own body and person frames. */
  person?: IAutoMovieHumanPersonConstruction;
}
