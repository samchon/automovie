import * as motions from "@automovie/motions";

/**
 * The parameter schemas of the installed `@automovie/motions`, read from its
 * `HUMAN_LEXICON_SCHEMAS`: each lexicon row's (`rows`) and each vocabulary
 * action's (`actions`), with every `$ref` into `components` followed. The
 * motion reference describes the members and the playground turns them into
 * fields, both from this one reader, so the two never disagree on what a
 * name takes. A release without the collection, or without one of its two
 * tables, reads as empty.
 */
export namespace MotionSchemas {
  /** A JSON schema, read loosely: only the members the site reads. */
  export interface ISchema {
    /** A reference into `components.schemas`, `#/components/schemas/<name>`. */
    $ref?: string;

    /** The JSON type. */
    type?: unknown;

    /** The one value it takes. */
    const?: unknown;

    /** The values it takes. */
    enum?: unknown[];

    /** The alternatives of a union. */
    oneOf?: ISchema[];

    /** An object's members. */
    properties?: Record<string, ISchema>;

    /** An object's required members. */
    required?: string[];

    /** What it means, from its JSDoc. */
    description?: string;

    /** An array's items. */
    items?: ISchema;

    /** A number's least value. */
    minimum?: number;

    /** A number's greatest value. */
    maximum?: number;

    /** The value it takes when left out. */
    default?: unknown;
  }

  /** One member of a name's parameters. */
  export interface IMember {
    /** The parameter's name. */
    name: string;

    /** Whether the name needs it. */
    required: boolean;

    /** Its schema with its reference followed. */
    schema: ISchema;

    /** What it means: the member's own description, else its schema's; empty when undocumented. */
    description: string;
  }

  /** The generated collection, as `HUMAN_LEXICON_SCHEMAS` holds it. */
  interface ICollection {
    rows?: Record<string, ISchema>;
    actions?: Record<string, ISchema>;
    components?: { schemas?: Record<string, ISchema> };
  }

  /**
   * Each lexicon row's parameters, by row name.
   *
   * @returns The members of every row with a schema; empty when the release ships none.
   */
  export function rows(): Record<string, IMember[]> {
    return table("rows");
  }

  /**
   * Each vocabulary action's parameters, by action name.
   *
   * @returns The members of every action with a schema; empty when the release ships none.
   */
  export function actions(): Record<string, IMember[]> {
    return table("actions");
  }

  /**
   * A schema with its reference followed, up to sixteen hops so a cycle
   * cannot hang the build.
   *
   * @param schema The schema.
   * @returns The schema it names, or itself when it names none or one the collection lacks.
   */
  export function resolve(schema: ISchema): ISchema {
    const named: Record<string, ISchema> =
      collection()?.components?.schemas ?? {};
    let at: ISchema = schema;
    for (let hops: number = 0; at.$ref !== undefined && hops < 16; hops++) {
      const found: ISchema | undefined =
        named[at.$ref.replace("#/components/schemas/", "")];
      if (found === undefined) break;
      at = found;
    }
    return at;
  }

  /** One table of the collection as members by name. */
  function table(key: "rows" | "actions"): Record<string, IMember[]> {
    const schemas: Record<string, ISchema> = collection()?.[key] ?? {};
    return Object.fromEntries(
      Object.entries(schemas).map(
        ([name, schema]: [string, ISchema]): [string, IMember[]] => [
          name,
          members(resolve(schema)),
        ],
      ),
    );
  }

  /** The members of an object schema, in its order. */
  function members(object: ISchema): IMember[] {
    const required: Set<string> = new Set(object.required ?? []);
    return Object.entries(object.properties ?? {}).map(
      ([name, member]: [string, ISchema]): IMember => {
        const schema: ISchema = resolve(member);
        return {
          name,
          required: required.has(name),
          schema,
          description: member.description ?? schema.description ?? "",
        };
      },
    );
  }

  /** The collection, read through a record so the bundler does not take it for a named import a release may lack. */
  function collection(): ICollection | null {
    const found: unknown = (motions as Readonly<Record<string, unknown>>)[
      "HUMAN_LEXICON_SCHEMAS"
    ];
    return typeof found === "object" && found !== null
      ? (found as ICollection)
      : null;
  }
}
