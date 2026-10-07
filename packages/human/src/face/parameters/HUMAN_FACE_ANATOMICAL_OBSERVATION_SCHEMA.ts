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
 * @evidence contracts/common.md#principled-implementation The schema is generated from the one declared type, so its fields are that type's fields by construction.
 * @evidence contracts/common.md#clear-and-simple-design One constant, no hand-kept field list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is added to or removed from the declared type for a consumer.
 * @evidence contracts/common.md#meaningful-documentation States what the schema is generated from, who reads it and what it does not carry.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The schema describes a record, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Observations move no channel; the nested owners state each field's meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The schema emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Units and frames are stated by the nested field owners.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The schema builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The schema is not displayed geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The nested field owners carry each observation's source and protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range The schema admits nothing; the document admission and the face resolver do.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The schema restates the declared observation record and defines no input.
 * @author Samchon
 */
export const HUMAN_FACE_ANATOMICAL_OBSERVATION_SCHEMA =
  typia.json.schema<IAutoMovieHumanFaceAnatomicalParameters>();
