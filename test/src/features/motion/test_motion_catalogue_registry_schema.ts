import type { IAutoMovieMotionHumanLexiconSchemas } from "@automovie/interface";
import {
  HUMAN_ACTIONS,
  HUMAN_LEXICON,
  HUMAN_LEXICON_SCHEMAS,
  HumanPerformanceParams,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/** JSON Schema keywords used to construct a minimally inhabited parameter object. */
interface IParameterSchema extends IAutoMovieMotionHumanLexiconSchemas.ISchema {
  const?: unknown;
  oneOf?: IParameterSchema[];
  properties?: Record<string, IParameterSchema>;
  required?: string[];
  prefixItems?: IParameterSchema[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  "x-unit"?: string;
}

/** Resolve a named component before reading its constraints. */
function resolve(input: IParameterSchema): IParameterSchema {
  if (input.$ref === undefined) return input;
  const key: string = input.$ref.split("/").at(-1)!;
  const component = HUMAN_LEXICON_SCHEMAS.components.schemas?.[key];
  if (component === undefined)
    throw new Error("Missing schema component " + key);
  return resolve(component as IParameterSchema);
}

/** Construct a legal value from required members, tuple positions and scalar constraints. */
function example(input: IParameterSchema): unknown {
  const schema: IParameterSchema = resolve(input);
  if (Object.hasOwn(schema, "const")) return schema.const;
  if (schema.oneOf !== undefined) return example(schema.oneOf[0]!);
  switch (schema.type) {
    case "object":
      return Object.fromEntries(
        (schema.required ?? []).map((key: string) => [
          key,
          example(schema.properties![key]!),
        ]),
      );
    case "array":
      return (schema.prefixItems ?? []).map(example);
    case "integer":
    case "number": {
      const lower: number | undefined =
        schema.minimum ?? schema.exclusiveMinimum;
      const upper: number | undefined =
        schema.maximum ?? schema.exclusiveMaximum;
      if (schema.minimum !== undefined) return schema.minimum;
      if (schema.maximum !== undefined && lower === undefined)
        return schema.maximum;
      if (lower !== undefined && upper !== undefined)
        return (upper + lower) / 2;
      return lower !== undefined
        ? lower + 1
        : upper !== undefined
          ? upper - 1
          : 0;
    }
    case "string":
      return "fixture";
    case "boolean":
      return false;
    default:
      return null;
  }
}

/** Read a parameter refusal while allowing an unexpected program error to fail the test. */
function admission(name: string, params: object): HumanRefusal | undefined {
  try {
    HumanPerformanceParams.check(name, params);
    return undefined;
  } catch (error) {
    if (error instanceof HumanRefusal) return error;
    throw error;
  }
}

/**
 * Every registered name advertises closed parameters that runtime admission accepts and enforces.
 *
 * Scenarios:
 * 1. Compare both published schema tables with the public action registry and every category.
 * 2. Construct the required members of each published object form. An extra member is refused.
 * 3. Submit an invalid value for every scalar numeric boundary. Verify the refused axis, bound and unit.
 * 4. Check omitted required and optional arguments, the selected target alternative's nested error path and the staged catch's exclusive interception parameter.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names schema publication, closure, valid inhabitants and numeric refusal units.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public admission function for every row and base action.
 * @evidence contracts/development/testing.md#independent-expectations The published schema determines accepted fields, required members, bounds and measurement units without asking a law to plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes every published object form, fixed aliases, empty inputs, nested alternatives and numeric bounds.
 * @evidence contracts/development/testing.md#execution-ownership Walks typed declarations and plain authoring data without performers or scene fixtures.
 */
export function test_motion_catalogue_registry_schema(): void {
  const issues: string[] = [];
  const names = Object.values(HUMAN_LEXICON)
    .flat()
    .map((row) => row.name);
  const compare = (left: string, right: string): number =>
    left < right ? -1 : left > right ? 1 : 0;
  TestValidator.equals(
    "schemas for all registered rows",
    Object.keys(HUMAN_LEXICON_SCHEMAS.rows).sort(compare),
    names.sort(compare),
  );
  TestValidator.equals(
    "schemas for all base actions",
    Object.keys(HUMAN_LEXICON_SCHEMAS.actions).sort(compare),
    Object.keys(HUMAN_ACTIONS).sort(compare),
  );
  for (const [name, input] of Object.entries({
    ...HUMAN_LEXICON_SCHEMAS.actions,
    ...HUMAN_LEXICON_SCHEMAS.rows,
  })) {
    const outer: IParameterSchema = resolve(input as IParameterSchema);
    for (const arm of outer.oneOf ?? [outer]) {
      const form: IParameterSchema = resolve(arm);
      if (form.type !== "object" || form.additionalProperties !== false) {
        issues.push(name + " does not declare a closed object");
        continue;
      }
      const params: Record<string, unknown> = example(form) as Record<
        string,
        unknown
      >;
      const valid = admission(name, params);
      if (valid !== undefined)
        issues.push(name + " valid form: " + valid.message);
      if (admission(name, { ...params, unknownParameter: true }) === undefined)
        issues.push(name + " allowed an extra parameter");
      for (const [key, property] of Object.entries(form.properties ?? {})) {
        const field: IParameterSchema = resolve(property);
        if (
          Object.hasOwn(property, "default") &&
          admission(name, { ...params, [key]: property.default }) !== undefined
        )
          issues.push(name + "." + key + " refuses its published default");
        if (field.type !== "number" && field.type !== "integer") continue;
        for (const [bound, value] of [
          ["minimum", field.minimum],
          ["maximum", field.maximum],
          ["exclusiveMinimum", field.exclusiveMinimum],
          ["exclusiveMaximum", field.exclusiveMaximum],
        ] as const) {
          if (value === undefined) continue;
          const invalid: number =
            bound === "minimum"
              ? value - 1
              : bound === "maximum"
                ? value + 1
                : value;
          const error = admission(name, { ...params, [key]: invalid });
          const edge =
            bound === "minimum" || bound === "exclusiveMinimum"
              ? "minimum"
              : "maximum";
          if (
            field["x-unit"] === undefined ||
            error?.axis !== key ||
            error.feasible?.kind !== "range" ||
            error.feasible[edge] !== value ||
            error.feasible.unit !== field["x-unit"]
          )
            issues.push(
              name +
                "." +
                key +
                " " +
                bound +
                " " +
                value +
                ": " +
                (error?.message ?? "accepted"),
            );
        }
        if (field.type === "integer") {
          const integer: number = Math.ceil(
            (field.minimum ?? field.exclusiveMinimum ?? 0) + 1,
          );
          const error = admission(name, { ...params, [key]: integer + 0.5 });
          if (
            error?.axis !== key ||
            error.feasible?.kind !== "range" ||
            !error.feasible.whole
          )
            issues.push(name + "." + key + " must require a whole number");
        }
      }
    }
  }
  TestValidator.equals("schema admission disagreements", issues, []);
  const catchAt: object = { from: "pass", ball: "ball", intercept: 0.4 };
  TestValidator.equals(
    "a staged catch accepts an elapsed interception",
    admission("stageCatch", catchAt),
    undefined,
  );
  for (const name of ["catchObject", "gloveCatch", "twoHandCatch"])
    TestValidator.equals(
      `${name} refuses the staged-only interception`,
      admission(name, catchAt)?.axis,
      "intercept",
    );
  TestValidator.equals("stand has defaults", admission("stand", {}), undefined);
  for (const name of ["walk", "stroll"])
    TestValidator.equals(
      name + " requires a destination",
      admission(name, {})?.axis,
      "to",
    );
  for (const target of [
    { kind: "self" },
    { kind: "person", subject: "other" },
  ]) {
    HumanPerformanceParams.check("touchTap", {
      target: { ...target, region: "chin" },
    });
    const error = admission("touchTap", {
      target: { ...target, region: "missingRegion" },
    });
    TestValidator.equals(
      target.kind + " region path",
      error?.axis,
      "target.region",
    );
  }
}
