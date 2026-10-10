import typia from "typia";

import type { IAutoMovieHumanFaceAnatomicalParameters } from "./IAutoMovieHumanFaceAnatomicalParameters";

/**
 * The JSON schema of a face document's clinical observations, generated from
 * `IAutoMovieHumanFaceAnatomicalParameters` by the compiler transform.
 *
 * An editor reads it to offer each observation as the number, closed choice
 * or yes/no its declaration states, with the declaration's own description,
 * instead of accepting free text. It is the same type the document admission
 * checks, so the form and the admission cannot name different fields. The
 * schema describes the record's shape only: it carries no value, no default
 * and no range beyond what the declarations themselves state, and an
 * observation still changes no geometry.
 *
 * @author Samchon
 */
export const HUMAN_FACE_ANATOMICAL_OBSERVATION_SCHEMA =
  typia.json.schema<IAutoMovieHumanFaceAnatomicalParameters>();
