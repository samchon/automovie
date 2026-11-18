import type {
  IAutoMovieMotionHumanLexiconSchemas,
  IAutoMovieMotionHumanRefusal,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HUMAN_LEXICON_SCHEMAS,
  HumanPerformanceParams,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * The lexicon's parameter schemas cover every row, reject a parameter a row
 * does not have, and state the same bounds the laws refuse outside.
 *
 * The schemas are generated from the laws' own parameter types, so a row
 * missing from them, an object that accepts any key, or a bound the schema
 * states that the law does not enforce (or the reverse) is a defect a page
 * reading them would pass on to an author.
 *
 * Scenarios:
 * 1. Every row of every family of `HUMAN_LEXICON` has a schema under its
 *    own name. Every advertised row schema has a publicly dispatchable row.
 * 2. Every row's schema, its reference followed, is an object schema (or,
 *    for a row whose parameters take one of several forms, each form is)
 *    that accepts no member beyond its properties, so a call with a misspelt
 *    parameter (`toe` for `to`, or any name the row lacks) is rejected by
 *    it.
 * 3. At its parameter gate, every row is refused past each bound its schema
 *    states for a numeric member: a
 *    tenth below a least value, at an exclusive least value, a tenth above
 *    a greatest value, and half a unit off a whole number. The refusal is a
 *    `HumanRefusal` on that member whose feasible range names the same
 *    value and unit. The gate runs before body planning. A registered
 *    walk additionally verifies that the public chain uses the gate.
 * 4. Every bounded number anywhere in the schemas states its unit
 *    (`x-unit`, empty for a pure number), so no refusal of a bound loses it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Mutates each bounded value at the real parameter gate and checks the refusal axis, range and unit. A public registered walk with a misspelled parameter checks that the same gate is reached in normal performance placement.
 * @evidence contracts/development/testing.md#independent-expectations The schema states the contract before a body plans. Numeric inputs on the wrong side of the stated boundaries must be refused at the named parameter, carrying the published limit and unit.
 * @evidence contracts/development/testing.md#distinguishing-cases Every row for coverage and closure; every tagged member past each least, exclusive least, greatest and whole-number bound, with its unit; every bounded number for a stated unit.
 * @evidence contracts/development/testing.md#execution-ownership Reads parameter contracts in memory and prepares one body for the public registration seam.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why it matters and the 4 scenarios.
 */
export function test_human_motion_lexicon_schemas(): void {
  const complaints: string[] = [];
  const advertised: Set<string> = new Set(Object.keys(HUMAN_LEXICON_SCHEMAS.rows));
  type ISchema = IAutoMovieMotionHumanLexiconSchemas.ISchema;
  const resolved = (schema: ISchema | undefined): ISchema | undefined =>
    schema?.$ref === undefined
      ? schema
      : HUMAN_LEXICON_SCHEMAS.components.schemas?.[
          schema.$ref.split("/").at(-1)!
        ];
  for (const [family, laws] of Object.entries(HUMAN_LEXICON))
    for (const law of laws) {
      // 1. Coverage.
      advertised.delete(law.name);
      const schema: ISchema | undefined = resolved(
        HUMAN_LEXICON_SCHEMAS.rows[law.name],
      );
      if (schema === undefined) {
        complaints.push(`${family} ${law.name}: no schema`);
        continue;
      }

      // 2. A row whose parameters take one of several forms is closed in each.
      const forms: (ISchema | undefined)[] = Array.isArray(schema.oneOf)
        ? (schema.oneOf as ISchema[]).map(resolved)
        : [schema];
      for (const form of forms)
        if (form?.type !== "object" || form.additionalProperties !== false)
          complaints.push(
            `${family} ${law.name}: a form of the schema is ${JSON.stringify(form?.type ?? "untyped")} with additional members ${JSON.stringify(form?.additionalProperties)}, a closed object expected`,
          );
        else if ("toe" in (form.properties ?? {}))
          complaints.push(
            `${family} ${law.name}: the schema has a member named toe, which no row should`,
          );
      if (LexiconRowNet.STAGED.includes(law.name) || forms.length !== 1)
        continue;

      // 3. Past each bound the schema states, the law refuses on that member, naming the same bound.
      for (const [key, value] of Object.entries(schema.properties ?? {})) {
        const member: INumeric = (resolved(value as ISchema) ?? {}) as INumeric;
        const least: number | undefined =
          member.minimum ?? member.exclusiveMinimum;
        const asks: BoundaryProbe[] = [
          ...(member.minimum !== undefined
            ? [["below its least", member.minimum - 0.1, "minimum"] as const]
            : []),
          ...(member.exclusiveMinimum !== undefined
            ? [
                [
                  "at its exclusive least",
                  member.exclusiveMinimum,
                  "minimum",
                ] as const,
              ]
            : []),
          ...(member.maximum !== undefined
            ? [["above its greatest", member.maximum + 0.1, "maximum"] as const]
            : []),
          ...(member.type === "integer"
            ? [["half off a whole", (least ?? 1) + 0.5, "minimum"] as const]
            : []),
        ];
        for (const [what, asked, end] of asks) {
          let thrown: unknown;
          try {
            HumanPerformanceParams.check(law.name, {
              ...LexiconRowNet.given(law.name),
              [key]: asked,
            });
          } catch (error) {
            thrown = error;
          }
          const range: IAutoMovieMotionHumanRefusal.IRange | undefined =
            thrown instanceof HumanRefusal && thrown.feasible?.kind === "range"
              ? thrown.feasible
              : undefined;
          const named: number | undefined =
            end === "minimum" ? least : member.maximum;
          if (
            !(thrown instanceof HumanRefusal) ||
            thrown.axis !== key ||
            range?.[end] !== named ||
            range?.unit !== (member["x-unit"] ?? "")
          )
            complaints.push(
              `${family} ${law.name}: ${key} ${asked} (${what} ${named}) expected a refusal on ${key} naming ${named} ${JSON.stringify(member["x-unit"] ?? "")}, got ${thrown instanceof HumanRefusal ? `${thrown.message} (unit ${JSON.stringify(range?.unit)})` : thrown instanceof Error ? thrown.message : String(thrown)}`,
            );
        }
      }
    }

  for (const name of advertised)
    complaints.push(name + " has a parameter schema but no registered law");
  // 4. Every bounded number states its unit, so its refusal names it.
  const visit = (node: unknown, where: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item: unknown, i: number): void =>
        visit(item, `${where}[${i}]`),
      );
      return;
    }
    if (typeof node !== "object" || node === null) return;
    const own: Record<string, unknown> = node as Record<string, unknown>;
    if (
      (own.type === "number" || own.type === "integer") &&
      ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum"].some(
        (bound: string): boolean => typeof own[bound] === "number",
      ) &&
      typeof own["x-unit"] !== "string"
    )
      complaints.push(`${where}: a bounded number states no unit (x-unit)`);
    for (const [key, child] of Object.entries(own))
      visit(child, `${where}.${key}`);
  };
  visit(HUMAN_LEXICON_SCHEMAS, "schemas");
  TestValidator.equals("the schemas match the lexicon", complaints, []);

  const misspelled: unknown = LexiconRowNet.attempt("stroll", { toe: true });
  TestValidator.predicate(
    "the registered walk refuses its misspelled parameter before planning",
    misspelled instanceof HumanRefusal &&
      misspelled.kind === "parameter" &&
      misspelled.axis === "toe" &&
      misspelled.value === true,
  );
}

/** The generated numeric terms this test reads for its boundary probes. */
interface INumeric {
  /** Runtime JSON schema type. */
  type?: unknown;

  /** Included lower endpoint. */
  minimum?: number;

  /** Excluded lower endpoint. */
  exclusiveMinimum?: number;

  /** Included upper endpoint. */
  maximum?: number;

  /** The expected unit named by the refusal. */
  "x-unit"?: string;
}

/** The named end of a refused range. */
type End = "minimum" | "maximum";

/** A value outside an independently stated numeric boundary. */
type BoundaryProbe = readonly [description: string, asked: number, end: End];
