import type { IAutoMovieHumanBodyAnatomy } from "../body/IAutoMovieHumanBodyAnatomy";

/**
 * Every body measure of one person under its published name, supplied or
 * derived, as `AutoMovieHumanBodyAnatomy.resolve` returns it: each field of
 * `IAutoMovieHumanBodyAnatomy`, present. World millimetres and percent.
 *
 * A piece reads its measures here rather than from the public input, so the
 * input can change shape while every reader keeps one record.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Every body measure of one person under its published name, supplied or derived, as `AutoMovieHumanBodyAnatomy.resolve` returns it: each field of `IAutoMovieHumanBodyAnatomy`, present.
 * @evidence contracts/development/design.md#principled-representation Every body measure of one person under its published name, supplied or derived, as `AutoMovieHumanBodyAnatomy.resolve` returns it: each field of `IAutoMovieHumanBodyAnatomy`, present. Required<IAutoMovieHumanBodyAnatomy> retains the referenced owner's constraints and mutability.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyAnatomy.resolve. Read by AutoMovieHumanBackProfile.of, AutoMovieHumanBackProfile.at, AutoMovieHumanBodyAnatomy.adiposity. Also types AutoMovieHumanBodyLaneInterim.measures, AutoMovieHumanBodyLaw.measures.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanArmSources.measures, AutoMovieHumanBackProfile.of, AutoMovieHumanBackProfile.at, AutoMovieHumanBodyAnatomy.resolve for every body measure of one person under its published name, supplied or derived, as `AutoMovieHumanBodyAnatomy.resolve` returns it: each field of `IAutoMovieHumanBodyAnatomy`, present.
 */
export type IAutoMovieHumanBodyMeasures = Required<IAutoMovieHumanBodyAnatomy>;
