import type { IAutoMovieHumanBodyAnatomy } from "../structures/body/IAutoMovieHumanBodyAnatomy";

/**
 * Every body measure of one person under its published name, supplied or
 * derived, as `AutoMovieHumanBodyAnatomy.resolve` returns it: each field of
 * `IAutoMovieHumanBodyAnatomy`, present. World millimetres and percent.
 *
 * A piece reads its measures here rather than from the public input, so the
 * input can change shape while every reader keeps one record.
 */
export type IAutoMovieHumanBodyMeasures = Required<IAutoMovieHumanBodyAnatomy>;
