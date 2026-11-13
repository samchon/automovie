import {
  HUMAN_LEXICON,
  HUMAN_LEXICON_SCHEMAS,
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
 *    own name.
 * 2. Every row's schema, its reference followed, is an object schema (or,
 *    for a row whose parameters take one of several forms, each form is)
 *    that accepts no member beyond its properties, so a call with a misspelt
 *    parameter (`toe` for `to`, or any name the row lacks) is rejected by
 *    it.
 * 3. Every row, built in the scene the lexicon's row net stages it in (the
 *    average man, the small woman as the partner where it has one), is
 *    refused past each bound its schema states for a numeric member: a
 *    tenth below a least value, at an exclusive least value, a tenth above
 *    a greatest value, and half a unit off a whole number. The refusal is a
 *    `HumanRefusal` on that member whose feasible range names the same
 *    value. A row the net stages in a test of its own is not built here.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the exported schemas and builds every row through the public chain past each stated bound; a row without a schema, an open object, a bound the law does not refuse or a refusal naming another range fails.
 * @evidence contracts/development/testing.md#independent-expectations The rows are the lexicon's own and the refusals the laws' own; the test only checks that the generated and the hand-written readings agree, neither being taken as the other's oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Every row for coverage and closure; every tagged member past each least, exclusive least, greatest and whole-number bound.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men once and builds refused plans only, never a displayed pose.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why it matters and the 3 scenarios.
 */
export function test_human_motion_lexicon_schemas(): void {
  const complaints: string[] = [];
  type ISchema = HUMAN_LEXICON_SCHEMAS.ISchema;
  const resolved = (schema: ISchema | undefined): ISchema | undefined =>
    schema?.$ref === undefined
      ? schema
      : HUMAN_LEXICON_SCHEMAS.components.schemas?.[
          schema.$ref.split("/").at(-1)!
        ];
  for (const [family, laws] of Object.entries(HUMAN_LEXICON))
    for (const law of laws) {
      // 1. Coverage.
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
        const member: {
          type?: unknown;
          minimum?: number;
          exclusiveMinimum?: number;
          maximum?: number;
        } = (resolved(value as ISchema) ?? {}) as {
          type?: unknown;
          minimum?: number;
          exclusiveMinimum?: number;
          maximum?: number;
        };
        const least: number | undefined =
          member.minimum ?? member.exclusiveMinimum;
        const asks: (readonly [string, number, "minimum" | "maximum"])[] = [
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
          const thrown: unknown = LexiconRowNet.attempt(law.name, {
            [key]: asked,
          });
          const range: { minimum?: number | null; maximum?: number | null } =
            thrown instanceof HumanRefusal && thrown.feasible?.kind === "range"
              ? thrown.feasible
              : {};
          const named: number | undefined =
            end === "minimum" ? least : member.maximum;
          if (
            !(thrown instanceof HumanRefusal) ||
            thrown.axis !== key ||
            range[end] !== named
          )
            complaints.push(
              `${family} ${law.name}: ${key} ${asked} (${what} ${named}) expected a refusal on ${key} naming ${named}, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
            );
        }
      }
    }
  TestValidator.equals("the schemas match the lexicon", complaints, []);
}
