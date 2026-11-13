import * as motions from "@automovie/motions";
import { HUMAN_ACTIONS } from "@automovie/motions";

import type { IMotionReference } from "../structures/IMotionReference";

/**
 * The motion vocabulary as the reference pages list it, read from the
 * installed `@automovie/motions` while the site is exported: the actions of
 * `HUMAN_ACTIONS`, the lexicon's families and rows from `HUMAN_LEXICON`,
 * each row's parameters from `HUMAN_LEXICON_SCHEMAS`, and the grammar from
 * `HUMAN_GRAMMAR`. A table the installed release lacks is left empty, so a
 * release that adds one fills the pages with no change here.
 */
export namespace MotionReference {
  /** The package's exports by name, for the tables only some releases have. */
  const EXPORTS: Readonly<Record<string, unknown>> = motions as Readonly<
    Record<string, unknown>
  >;

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
    items?: ISchema;
    minimum?: number;
    maximum?: number;
    default?: unknown;
  }

  /** The generated schema collection, as `HUMAN_LEXICON_SCHEMAS` holds it. */
  interface ICollection {
    rows: Record<string, ISchema>;
    components: { schemas?: Record<string, ISchema> };
  }

  /**
   * Everything the reference lists.
   *
   * @returns The reference.
   */
  export function read(): IMotionReference {
    const lexicon: unknown = EXPORTS["HUMAN_LEXICON"];
    const families: Record<string, { name: string }[]> =
      typeof lexicon === "object" && lexicon !== null
        ? (lexicon as Record<string, { name: string }[]>)
        : {};
    const collection: unknown = EXPORTS["HUMAN_LEXICON_SCHEMAS"];
    const schemas: ICollection | null =
      typeof collection === "object" && collection !== null
        ? (collection as ICollection)
        : null;
    const grammar: unknown = EXPORTS["HUMAN_GRAMMAR"];
    return {
      actions: Object.keys(HUMAN_ACTIONS),
      families: Object.entries(families).map(
        ([name, rows]: [
          string,
          { name: string }[],
        ]): IMotionReference.IFamily => ({
          name,
          rows: rows.map(
            (row: { name: string }): IMotionReference.IRow => ({
              name: row.name,
              parameters:
                schemas === null || schemas.rows[row.name] === undefined
                  ? null
                  : parameters(schemas.rows[row.name]!, schemas),
            }),
          ),
        }),
      ),
      grammar:
        typeof grammar === "object" && grammar !== null
          ? (grammar as IMotionReference["grammar"])
          : null,
    };
  }

  /** A row's parameters, one entry per member of its schema. */
  function parameters(
    schema: ISchema,
    collection: ICollection,
  ): IMotionReference.IParameter[] {
    const object: ISchema = resolve(schema, collection);
    const required: Set<string> = new Set(object.required ?? []);
    return Object.entries(object.properties ?? {}).map(
      ([name, member]: [string, ISchema]): IMotionReference.IParameter => {
        const resolved: ISchema = resolve(member, collection);
        return {
          name,
          required: required.has(name),
          type: describe(resolved, collection, 0),
          description: member.description ?? resolved.description ?? "",
        };
      },
    );
  }

  /** A schema with its reference followed. */
  function resolve(schema: ISchema, collection: ICollection): ISchema {
    let at: ISchema = schema;
    for (let hops: number = 0; at.$ref !== undefined && hops < 16; hops++) {
      const name: string = at.$ref.replace("#/components/schemas/", "");
      const found: ISchema | undefined = collection.components.schemas?.[name];
      if (found === undefined) break;
      at = found;
    }
    return at;
  }

  /** A short description of a schema's type: a set of values, a number's bounds, an object's members. */
  function describe(
    schema: ISchema,
    collection: ICollection,
    depth: number,
  ): string {
    const s: ISchema = resolve(schema, collection);
    if (s.const !== undefined) return JSON.stringify(s.const);
    if (s.enum !== undefined)
      return s.enum.map((v: unknown): string => JSON.stringify(v)).join(" | ");
    if (s.oneOf !== undefined)
      return s.oneOf
        .map((option: ISchema): string =>
          describe(option, collection, depth + 1),
        )
        .join(" | ");
    if (s.type === "number" || s.type === "integer") {
      const bounds: string =
        s.minimum !== undefined && s.maximum !== undefined
          ? ` ${s.minimum} to ${s.maximum}`
          : s.minimum !== undefined
            ? ` from ${s.minimum}`
            : s.maximum !== undefined
              ? ` up to ${s.maximum}`
              : "";
      return `${String(s.type)}${bounds}`;
    }
    if (s.type === "array")
      return `${s.items === undefined ? "unknown" : describe(s.items, collection, depth + 1)}[]`;
    if (s.type === "object" && s.properties !== undefined) {
      if (depth >= 1) return "object";
      const kind: ISchema | undefined = s.properties["kind"];
      if (kind !== undefined)
        return `{ kind: ${describe(kind, collection, depth + 1)}, … }`;
      return `{ ${Object.keys(s.properties).join(", ")} }`;
    }
    return typeof s.type === "string" ? s.type : "value";
  }
}
