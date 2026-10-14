import typia from "typia";

import type { IAutoMovieHumanFaceAnatomicalParameters } from "./IAutoMovieHumanFaceAnatomicalParameters";

/**
 * The JSON schema of a face document's clinical observations, generated from
 * `IAutoMovieHumanFaceAnatomicalParameters` by the compiler transform.
 *
 * The schema describes declared number, closed-choice and boolean fields
 * with their descriptions for a future editor. No current editor consumes
 * this constant. Document admission separately applies observation rules,
 * which can refuse states this type represents; the schema does not encode
 * that policy. It carries no observation value, default or additional range,
 * and generating it changes no geometry.
 *
 * @author Samchon
 */
export const HUMAN_FACE_ANATOMICAL_OBSERVATION_SCHEMA: ReturnType<
  typeof typia.json.schema<IAutoMovieHumanFaceAnatomicalParameters>
> = typia.json.schema<IAutoMovieHumanFaceAnatomicalParameters>();
