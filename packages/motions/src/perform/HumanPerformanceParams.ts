import { HumanRefusal } from "../law/HumanRefusal";
import { HUMAN_LEXICON_SCHEMAS } from "../lexicon/HUMAN_LEXICON_SCHEMAS";

/**
 * A lexicon row's or an action's parameters read against its own schema
 * before its law plans: what an author left out of what the row needs, or gave outside
 * what it accepts, is refused at the row's entry with the parameter's path,
 * the value given and what it accepts, instead of failing deep in a law
 * that read it unchecked.
 *
 * The schema is the one the website and the generator read
 * (`HUMAN_LEXICON_SCHEMAS`), typia's from the laws' own parameter types, so
 * the check reads the contract the checker reads: its required members,
 * its constants and unions, its types and its numeric bounds. Members it
 * does not list are refused by name; a name the file does not list is
 * planned unchecked, which the lexicon's absent-parameter net forbids for
 * every row.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is checked, against what and what is left to the law.
 * @evidence contracts/development/design.md#principled-representation Input validation at the boundary against the generated schema of the parameter type, the one contract every reader shares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One check, read by `HumanPerformancePlace` for each intent.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row is named: every rule comes from the schema.
 */
export namespace HumanPerformanceParams {
  /**
   * Refuse a row's parameters that its schema does not accept.
   *
   * @param row The row's registered name.
   * @param given The parameters as the author gave them, before the row's fixed ones.
   * @throws {HumanRefusal} A `parameter` refusal, for a row or an action the schema lists, on the first member, by its path, that it does not name, that is missing, of another type, not one of its alternatives or outside its bounds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A JSON schema walk over the keywords typia writes (`$ref`, `type`, `properties`, `required`, `oneOf`, `const`, numeric bounds, `items`, `prefixItems`); a union refuses through the alternative its discriminator names, or with the alternatives when none is named.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One recursive reader returning the first fault, one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A row the schema does not list is not guessed at.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parameters given and the union's alternatives.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per placed intent.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure check that retains nothing.
   */
  export function check(row: string, given: object): void {
    const schema: HUMAN_LEXICON_SCHEMAS.ISchema | undefined =
      HUMAN_LEXICON_SCHEMAS.rows[row] ?? HUMAN_LEXICON_SCHEMAS.actions[row];
    if (schema === undefined) return;
    const fault: IFault | null = read(schema, given, "", undefined);
    if (fault === null) return;
    throw new HumanRefusal({
      kind: "parameter",
      axis: fault.path,
      value: fault.value,
      feasible: fault.feasible,
      reason: `${row} ${fault.reason}`,
      fix: fault.fix,
    });
  }
}

/** The first member a schema does not accept. */
interface IFault {
  /** The member's path, `target.region`. */
  path: string;

  /** The value given; undefined when it is missing. */
  value: unknown;

  /** What the member accepts. */
  feasible: HumanRefusal.Feasible | null;

  /** Why, after the row's name. */
  reason: string;

  /** What to change. */
  fix: string;
}

/** A schema's own record: the referenced component's, followed. */
const follow = (
  schema: HUMAN_LEXICON_SCHEMAS.ISchema,
): Record<string, unknown> => {
  let at: Record<string, unknown> = schema as Record<string, unknown>;
  for (let hops: number = 0; typeof at.$ref === "string" && hops < 16; hops++) {
    const name: string = (at.$ref as string).split("/").at(-1)!;
    const found: unknown = HUMAN_LEXICON_SCHEMAS.components.schemas?.[name];
    if (typeof found !== "object" || found === null) break;
    at = found as Record<string, unknown>;
  }
  return at;
};

/** The constants of a union whose every alternative is one; null otherwise. */
const constants = (alternatives: readonly unknown[]): string[] | null => {
  const out: string[] = [];
  for (const alternative of alternatives) {
    const own: Record<string, unknown> = follow(
      alternative as HUMAN_LEXICON_SCHEMAS.ISchema,
    );
    if (!Object.hasOwn(own, "const")) return null;
    out.push(String(own.const));
  }
  return out;
};

/** A member's path below its parent's. */
const below = (path: string, key: string | number): string =>
  typeof key === "number"
    ? `${path}[${key}]`
    : path === ""
      ? key
      : `${path}.${key}`;

/** Whether a value has a JSON schema type. */
const typed = (value: unknown, type: string): boolean => {
  switch (type) {
    case "object":
      return (
        typeof value === "object" && value !== null && !Array.isArray(value)
      );
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return true;
  }
};

/** A number's bounds as the range a refusal offers, in the unit its type carries into the schema (`HumanUnit`, `x-unit`); null when it has none. */
const bounds = (own: Record<string, unknown>): HumanRefusal.IRange | null => {
  const low: number | undefined =
    typeof own.minimum === "number"
      ? own.minimum
      : typeof own.exclusiveMinimum === "number"
        ? own.exclusiveMinimum
        : undefined;
  const high: number | undefined =
    typeof own.maximum === "number"
      ? own.maximum
      : typeof own.exclusiveMaximum === "number"
        ? own.exclusiveMaximum
        : undefined;
  if (low === undefined && high === undefined && own.type !== "integer")
    return null;
  return {
    kind: "range",
    minimum: low ?? null,
    maximum: high ?? null,
    unit: typeof own["x-unit"] === "string" ? own["x-unit"] : "",
    ...(own.type === "integer" ? { whole: true } : {}),
    ...(typeof own.exclusiveMinimum === "number" &&
    typeof own.exclusiveMaximum === "number"
      ? { open: "both" as const }
      : typeof own.exclusiveMinimum === "number"
        ? { open: "minimum" as const }
        : typeof own.exclusiveMaximum === "number"
          ? { open: "maximum" as const }
          : {}),
  };
};

/** The first fault of a value against a schema; null when it is accepted. */
const read = (
  schema: HUMAN_LEXICON_SCHEMAS.ISchema,
  value: unknown,
  path: string,
  meaning: string | undefined,
): IFault | null => {
  const own: Record<string, unknown> = follow(schema);
  const what: string =
    meaning ?? (typeof own.description === "string" ? own.description : "");
  const said: string = what === "" ? "" : ` (${what.split("\n").join(" ")})`;

  // A union: accepted by any alternative.
  if (Array.isArray(own.oneOf)) {
    const alternatives: readonly unknown[] = own.oneOf;
    const faults: (IFault | null)[] = alternatives.map(
      (alternative: unknown): IFault | null =>
        read(alternative as HUMAN_LEXICON_SCHEMAS.ISchema, value, path, what),
    );
    if (faults.some((fault: IFault | null): boolean => fault === null))
      return null;
    const values: string[] | null = constants(alternatives);
    if (values !== null)
      return {
        path,
        value,
        feasible: { kind: "alternatives", values },
        reason: `takes ${path} as one of ${values.join(", ")}, not ${JSON.stringify(value)}`,
        fix: `set ${path} to one of ${values.join(", ")}`,
      };
    // Alternatives told apart by their `kind`: the one the value names, or
    // the kinds when it names none.
    const kinds: string[] = alternatives.map((alternative: unknown): string => {
      const properties: unknown = follow(
        alternative as HUMAN_LEXICON_SCHEMAS.ISchema,
      ).properties;
      const kind: unknown =
        typeof properties === "object" && properties !== null
          ? (properties as Record<string, unknown>).kind
          : undefined;
      const fixed: Record<string, unknown> =
        typeof kind === "object" && kind !== null
          ? follow(kind as HUMAN_LEXICON_SCHEMAS.ISchema)
          : {};
      return Object.hasOwn(fixed, "const") ? String(fixed.const) : "";
    });
    if (kinds.every((kind: string): boolean => kind !== "")) {
      const named: number =
        typeof value === "object" && value !== null
          ? kinds.indexOf(String((value as Record<string, unknown>).kind))
          : -1;
      if (named >= 0) return faults[named]!;
      return {
        path: below(path, "kind"),
        value:
          typeof value === "object" && value !== null
            ? (value as Record<string, unknown>).kind
            : value,
        feasible: { kind: "alternatives", values: kinds },
        reason: `takes ${path}${said} of the kinds ${kinds.join(", ")}`,
        fix: `give ${path} with its kind one of ${kinds.join(", ")}`,
      };
    }
    return faults[0]!;
  }

  if (Object.hasOwn(own, "const") && value !== own.const)
    return {
      path,
      value,
      feasible: { kind: "alternatives", values: [String(own.const)] },
      reason: `takes ${path} as ${JSON.stringify(own.const)}, not ${JSON.stringify(value)}`,
      fix: `set ${path} to ${JSON.stringify(own.const)}`,
    };

  // A value of another type; a number of the wrong kind (a fraction for
  // a whole number) is offered the number's range.
  if (typeof own.type === "string" && !typed(value, own.type))
    return {
      path,
      value,
      feasible:
        own.type === "integer" || own.type === "number" ? bounds(own) : null,
      reason: `takes ${path}${said} as ${own.type === "object" ? "an object" : own.type === "integer" ? "a whole number" : `a ${own.type}`}, not ${JSON.stringify(value)}`,
      fix: `give ${path} as ${own.type === "object" ? "an object" : own.type === "integer" ? "a whole number" : `a ${own.type}`}`,
    };

  // Numeric bounds.
  if (typeof value === "number") {
    const range: HumanRefusal.IRange | null = bounds(own);
    const under: boolean =
      range !== null &&
      range.minimum !== null &&
      (typeof own.exclusiveMinimum === "number"
        ? value <= range.minimum
        : value < range.minimum);
    const over: boolean =
      range !== null &&
      range.maximum !== null &&
      (typeof own.exclusiveMaximum === "number"
        ? value >= range.maximum
        : value > range.maximum);
    if (range !== null && (under || over))
      return {
        path,
        value,
        feasible: range,
        reason: `takes ${path}${said} ${range.minimum === null ? "" : `from ${range.minimum}`}${range.minimum !== null && range.maximum !== null ? " " : ""}${range.maximum === null ? "" : `up to ${range.maximum}`}, not ${value}`,
        fix: `set ${path} inside its range`,
      };
  }

  // An object's members: none it does not take, the required ones present,
  // each given one read against its own schema, or against the schema of
  // the members it takes beyond those it names.
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const properties: Record<string, unknown> =
      typeof own.properties === "object" && own.properties !== null
        ? (own.properties as Record<string, unknown>)
        : {};
    const required: readonly unknown[] = Array.isArray(own.required)
      ? own.required
      : [];
    const extra: unknown = own.additionalProperties;
    const given: Record<string, unknown> = value as Record<string, unknown>;
    if (extra === false)
      for (const key of Object.keys(given))
        if (!Object.hasOwn(properties, key) && given[key] !== undefined)
          return {
            path: below(path, key),
            value: given[key],
            feasible: { kind: "alternatives", values: Object.keys(properties) },
            reason: `takes no ${below(path, key)}; it takes ${Object.keys(properties).join(", ") || "nothing"} there`,
            fix: `leave out ${below(path, key)}, or name one of the members it takes`,
          };
    for (const key of required) {
      if (typeof key !== "string" || given[key] !== undefined) continue;
      const member: unknown = properties[key];
      const meaning: string =
        typeof member === "object" &&
        member !== null &&
        typeof (member as Record<string, unknown>).description === "string"
          ? ((member as Record<string, unknown>).description as string)
          : "";
      return {
        path: below(path, key),
        value: undefined,
        feasible: null,
        reason: `needs ${below(path, key)}${meaning === "" ? "" : ` (${meaning.split("\n").join(" ")})`}, and none was given`,
        fix: `give ${below(path, key)}`,
      };
    }
    for (const [key, item] of Object.entries(given)) {
      const member: unknown = Object.hasOwn(properties, key)
        ? properties[key]
        : extra;
      if (item === undefined || typeof member !== "object" || member === null)
        continue;
      const fault: IFault | null = read(
        member as HUMAN_LEXICON_SCHEMAS.ISchema,
        item,
        below(path, key),
        undefined,
      );
      if (fault !== null) return fault;
    }
  }

  // An array's items: a tuple's every position given and none beyond it
  // when the schema closes it, each item read against its own schema.
  if (Array.isArray(value)) {
    const prefix: readonly unknown[] = Array.isArray(own.prefixItems)
      ? own.prefixItems
      : [];
    if (value.length < prefix.length)
      return {
        path: below(path, value.length),
        value: undefined,
        feasible: {
          kind: "range",
          minimum: prefix.length,
          maximum: null,
          unit: "",
          whole: true,
        },
        reason: `needs ${prefix.length} items in ${path}${said}, and ${value.length} were given`,
        fix: `give ${path} its ${prefix.length} items`,
      };
    const closed: boolean =
      prefix.length > 0 &&
      (own.items === false || own.additionalItems === false);
    if (closed && value.length > prefix.length)
      return {
        path: below(path, prefix.length),
        value: value[prefix.length],
        feasible: {
          kind: "range",
          minimum: prefix.length,
          maximum: prefix.length,
          unit: "",
          whole: true,
        },
        reason: `takes ${prefix.length} items in ${path}${said}, and ${value.length} were given`,
        fix: `give ${path} exactly its ${prefix.length} items`,
      };
    for (let i: number = 0; i < value.length; i++) {
      const item: unknown =
        i < prefix.length
          ? prefix[i]
          : typeof own.items === "object" && own.items !== null
            ? own.items
            : undefined;
      if (item === undefined) continue;
      const fault: IFault | null = read(
        item as HUMAN_LEXICON_SCHEMAS.ISchema,
        value[i],
        below(path, i),
        undefined,
      );
      if (fault !== null) return fault;
    }
  }
  return null;
};
