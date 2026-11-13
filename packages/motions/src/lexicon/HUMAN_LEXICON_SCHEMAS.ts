import { HUMAN_LEXICON_SCHEMA_DATA } from "./HUMAN_LEXICON_SCHEMA_DATA";

/**
 * The JSON schema of every lexicon row's open parameters, by row name: the
 * data `pnpm --filter @automovie/motions schemas` generates with typia from
 * the laws' own parameter types (`IHumanLexiconParams`), so a page lists a
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
export const HUMAN_LEXICON_SCHEMAS: HUMAN_LEXICON_SCHEMAS.ICollection =
  HUMAN_LEXICON_SCHEMA_DATA;

/**
 * Companion types of {@link HUMAN_LEXICON_SCHEMAS}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation Plain JSON records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a reader needs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace HUMAN_LEXICON_SCHEMAS {
  /** The generated collection. */
  export interface ICollection {
    /** The command that writes the file. */
    $comment: string;

    /** The OpenAPI version of the schemas. */
    version: string;

    /** Each row's parameter schema, or a reference into `components`, by row name. */
    rows: Record<string, ISchema>;

    /** Each action's parameter schema, or a reference into `components`, by action name, for an action named directly. */
    actions: Record<string, ISchema>;

    /** The named schemas the rows' references point to. */
    components: { schemas?: Record<string, ISchema> };
  }

  /** One JSON schema, read loosely: the members a reader of row parameters uses, each to be narrowed where read, since a schema's members take many forms. */
  export interface ISchema {
    /** A reference into `components.schemas`, `#/components/schemas/<name>`. */
    $ref?: string;

    /** The JSON type. */
    type?: unknown;

    /** An object's members. */
    properties?: Record<string, unknown>;

    /** An object's required members. */
    required?: unknown;

    /** Whether members beyond `properties` are accepted. */
    additionalProperties?: unknown;

    /** What the member means, from its JSDoc. */
    description?: unknown;

    /** The alternatives of a union, such as a row whose parameters take one of several forms. */
    oneOf?: unknown;
  }
}
