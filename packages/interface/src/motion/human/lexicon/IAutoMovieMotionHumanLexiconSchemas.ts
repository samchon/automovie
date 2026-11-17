/**
 * Contracts used by follow, read, HUMAN_LEXICON_SCHEMAS, HUMAN_LEXICON_SCHEMA_DATA.
 *
 * @evidence contracts/development/common.md#meaningful-documentation $comment: The command that writes the file. version: The OpenAPI version of the schemas. rows: Each row's parameter schema, or a reference into `components`, by row name.
 * @evidence contracts/development/design.md#principled-representation $comment: The command that writes the file. version: The OpenAPI version of the schemas. rows: Each row's parameter schema, or a reference into `components`, by row name.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceParams.ts (follow, schema); perform/HumanPerformanceParams.ts (read, schema); lexicon/HUMAN_LEXICON_SCHEMAS.ts (HUMAN_LEXICON_SCHEMAS); lexicon/HUMAN_LEXICON_SCHEMA_DATA.ts (HUMAN_LEXICON_SCHEMA_DATA); perform/HumanPerformanceParams.ts (HumanPerformanceParams.check); perform/HumanPerformanceParams.ts (constants).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The schema collection is serializable data. HumanPerformanceParams narrows keyword values at each read; interface does not import typia's implementation types.
 */
export namespace IAutoMovieMotionHumanLexiconSchemas {
  /**
   * The generated collection.
   *
   * @evidence contracts/development/common.md#meaningful-documentation $comment: The command that writes the file. version: The OpenAPI version of the schemas. rows: Each row's parameter schema, or a reference into `components`, by row name.
   * @evidence contracts/development/design.md#principled-representation $comment: The command that writes the file. version: The OpenAPI version of the schemas. rows: Each row's parameter schema, or a reference into `components`, by row name.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HUMAN_LEXICON_SCHEMAS.ts (HUMAN_LEXICON_SCHEMAS); lexicon/HUMAN_LEXICON_SCHEMA_DATA.ts (HUMAN_LEXICON_SCHEMA_DATA).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLexiconSchemas.ISchema identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ICollection {
    /** The command that writes the file. */
    $comment: string;

    /** The OpenAPI version of the schemas. */
    version: string;

    /** Each row's parameter schema, or a reference into `components`, by row name. */
    rows: Record<string, IAutoMovieMotionHumanLexiconSchemas.ISchema>;

    /** Each action's parameter schema, or a reference into `components`, by action name, for an action named directly. */
    actions: Record<string, IAutoMovieMotionHumanLexiconSchemas.ISchema>;

    /** The named schemas the rows' references point to. */
    components: {
      /** Named JSON Schema components referenced by collected row schemas; omitted when no component definitions are needed. */
      schemas?: Record<string, IAutoMovieMotionHumanLexiconSchemas.ISchema>;
    };
  }

  /**
   * One JSON schema, read loosely: the members a reader of row parameters uses, each to be narrowed where read, since a schema's members take many forms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation $ref: A reference into `components.schemas`, `#/components/schemas/<name>`. type: The JSON type. properties: An object's members.
   * @evidence contracts/development/design.md#principled-representation $ref: A reference into `components.schemas`, `#/components/schemas/<name>`. type: The JSON type. properties: An object's members.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceParams.ts (follow, schema); perform/HumanPerformanceParams.ts (read, schema); perform/HumanPerformanceParams.ts (HumanPerformanceParams.check); perform/HumanPerformanceParams.ts (constants); perform/HumanPerformanceParams.ts (read.faults); perform/HumanPerformanceParams.ts (read.kinds).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts unknown keyword values reflect untrusted serialized schema data and are narrowed by HumanPerformanceParams before use; this is the reader's small schema vocabulary, not a copied validator SDK.
   */
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

    /** The member whose value names a union's alternative, with each value's schema, when the union is tagged (OpenAPI 3.1's Discriminator Object). */
    discriminator?: unknown;

    /** A number's least value, when a named component is itself a bounded number. */
    minimum?: unknown;

    /** A number's greatest value, when a named component is itself a bounded number. */
    maximum?: unknown;

    /** The value a parameter takes when it is left out. */
    default?: unknown;

    /** The unit a number is in (`HumanUnit`), `""` for a pure number. */
    "x-unit"?: unknown;
  }
}
