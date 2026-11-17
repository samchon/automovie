import type { IAutoMovieMotionHumanLexiconSchemas } from "@automovie/interface";

import { HUMAN_LEXICON_SCHEMA_DATA } from "./HUMAN_LEXICON_SCHEMA_DATA";

/**
 * The JSON schema of every lexicon row's open parameters, by row name: the
 * data `pnpm --filter @automovie/motions schemas` generates with typia from
 * interface's canonical parameter map and motions' numeric metadata, so a page lists a
 * row's parameters with their types, bounds, defaults and meanings as the
 * checker reads them, and every action's (`actions`), which a performance
 * checks an action's parameters against at its entry. A schema may be a
 * `$ref` into `components`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record holds, where it comes from and how a reference is read.
 * @evidence contracts/development/design.md#principled-representation The generated file as typed data: rows by name and the components their references name, OpenAPI 3.1 JSON schema.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one record the website reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is written by hand; a stale file fails CI.
 */
export const HUMAN_LEXICON_SCHEMAS: IAutoMovieMotionHumanLexiconSchemas.ICollection =
  HUMAN_LEXICON_SCHEMA_DATA;
