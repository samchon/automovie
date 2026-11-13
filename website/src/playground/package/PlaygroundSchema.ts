import * as motions from "@automovie/motions";

import type { IPlaygroundVocabulary } from "../structures/IPlaygroundVocabulary";

/**
 * The parameters of each lexicon row as the editor's fields, read from the
 * installed package's `HUMAN_LEXICON_SCHEMAS`: a member whose schema is a
 * closed set becomes a choice, a number a number with its bounds, a text a
 * text, a boolean a switch, and anything structured a JSON field.
 */
export namespace PlaygroundSchema {
  /** A JSON schema, read loosely. */
  interface ISchema {
    $ref?: string;
    type?: unknown;
    const?: unknown;
    enum?: unknown[];
    oneOf?: ISchema[];
    properties?: Record<string, ISchema>;
    required?: string[];
    description?: string;
    minimum?: number;
    maximum?: number;
  }

  /** The generated collection. */
  interface ICollection {
    rows: Record<string, ISchema>;
    components: { schemas?: Record<string, ISchema> };
  }

  /**
   * Every row's fields, by row name.
   *
   * @returns The fields; empty when the installed package ships no schemas.
   */
  export function rows(): Record<string, IPlaygroundVocabulary.IParameter[]> {
    // Read through a record, so the bundler does not take the member for a
    // named import a release may lack.
    const exported: Readonly<Record<string, unknown>> = motions as Readonly<
      Record<string, unknown>
    >;
    const collection: unknown = exported["HUMAN_LEXICON_SCHEMAS"];
    if (typeof collection !== "object" || collection === null) return {};
    const schemas: ICollection = collection as ICollection;
    return Object.fromEntries(
      Object.entries(schemas.rows).map(
        ([row, schema]: [string, ISchema]): [
          string,
          IPlaygroundVocabulary.IParameter[],
        ] => [row, fields(resolve(schema, schemas), schemas)],
      ),
    );
  }

  /** The fields of an object schema. */
  function fields(
    object: ISchema,
    schemas: ICollection,
  ): IPlaygroundVocabulary.IParameter[] {
    const required: Set<string> = new Set(object.required ?? []);
    return Object.entries(object.properties ?? {}).map(
      ([name, member]: [string, ISchema]): IPlaygroundVocabulary.IParameter => {
        const s: ISchema = resolve(member, schemas);
        const base: Pick<
          IPlaygroundVocabulary.IParameter,
          "name" | "required" | "description"
        > = {
          name,
          required: required.has(name),
          description: member.description ?? s.description ?? "",
        };
        const choices: string[] | null = closed(s, schemas);
        if (choices !== null)
          return { ...base, kind: "choice", values: choices };
        if (s.type === "number" || s.type === "integer")
          return {
            ...base,
            kind: "number",
            values: [],
            integer: s.type === "integer",
            ...(s.minimum === undefined ? {} : { minimum: s.minimum }),
            ...(s.maximum === undefined ? {} : { maximum: s.maximum }),
          };
        if (s.type === "string") return { ...base, kind: "text", values: [] };
        if (s.type === "boolean")
          return { ...base, kind: "switch", values: [] };
        return { ...base, kind: "json", values: [] };
      },
    );
  }

  /** The values of a closed set of strings, or null when the schema is not one. */
  function closed(s: ISchema, schemas: ICollection): string[] | null {
    if (
      s.enum !== undefined &&
      s.enum.every((v: unknown): boolean => typeof v === "string")
    )
      return s.enum as string[];
    if (s.oneOf === undefined) return null;
    const values: unknown[] = s.oneOf.map(
      (option: ISchema): unknown => resolve(option, schemas).const,
    );
    return values.every((v: unknown): boolean => typeof v === "string")
      ? (values as string[])
      : null;
  }

  /** A schema with its reference followed. */
  function resolve(schema: ISchema, schemas: ICollection): ISchema {
    let at: ISchema = schema;
    for (let hops: number = 0; at.$ref !== undefined && hops < 16; hops++) {
      const found: ISchema | undefined =
        schemas.components.schemas?.[
          at.$ref.replace("#/components/schemas/", "")
        ];
      if (found === undefined) break;
      at = found;
    }
    return at;
  }
}
