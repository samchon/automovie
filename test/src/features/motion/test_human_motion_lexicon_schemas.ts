import {
  HUMAN_LEXICON,
  HUMAN_LEXICON_SCHEMAS,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

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
 * 3. For every row of the `gait` family, performed alone toward a place
 *    3 m ahead, each numeric parameter whose schema states a least or a
 *    greatest value is refused, as a `HumanRefusal` on that parameter, a
 *    tenth past that value, and the refusal's feasible range names the
 *    same value.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the exported schemas and performs the gait rows through the public chain past each stated bound; a row without a schema, an open object, a bound the law does not refuse or a refusal naming another range fails.
 * @evidence contracts/development/testing.md#independent-expectations The rows are the lexicon's own and the refusals the laws' own; the test only checks that the two generated and hand-written readings agree, neither being taken as the other's oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Every row for coverage and closure; the gait rows past each least and greatest bound.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds refused plans only, never a displayed pose, so the whole lexicon is read in seconds.
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

  // 1 and 2. Coverage and closure.
  for (const [family, laws] of Object.entries(HUMAN_LEXICON))
    for (const law of laws) {
      const schema: ISchema | undefined = resolved(
        HUMAN_LEXICON_SCHEMAS.rows[law.name],
      );
      if (schema === undefined) {
        complaints.push(`${family} ${law.name}: no schema`);
        continue;
      }
      // A row whose parameters take one of several forms is closed in each.
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
    }

  // 3. The gait rows refuse past each bound their schema states.
  const body: IHumanBody = motionHumanBody("m-average");
  for (const law of HUMAN_LEXICON.gait! as readonly IHumanActionLaw<never>[]) {
    const schema: ISchema | undefined = resolved(
      HUMAN_LEXICON_SCHEMAS.rows[law.name],
    );
    if (!("to" in (schema?.properties ?? {}))) continue;
    for (const [key, member] of Object.entries(schema!.properties!)) {
      const bounds: { minimum?: number; maximum?: number } = member as {
        minimum?: number;
        maximum?: number;
      };
      for (const [end, value] of [
        ["minimum", bounds.minimum],
        ["maximum", bounds.maximum],
      ] as const) {
        if (value === undefined) continue;
        const asked: number = end === "minimum" ? value - 0.1 : value + 0.1;
        let thrown: unknown = null;
        try {
          new HumanPerformance({
            seed: "schemas",
            laws: [law],
            performers: [
              {
                subject: "a",
                body,
                at: { x: 0, y: 0, z: 0 },
                yaw: 0,
                proficiency: { level: "trained" },
              },
            ],
            composition: HumanChain.subject("a").registered(law.name, {
              to: { x: 0, y: 0, z: 3 },
              [key]: asked,
            }).node,
          });
        } catch (error) {
          thrown = error;
        }
        const range: { minimum?: number | null; maximum?: number | null } =
          thrown instanceof HumanRefusal && thrown.feasible?.kind === "range"
            ? thrown.feasible
            : {};
        if (
          !(thrown instanceof HumanRefusal) ||
          thrown.axis !== key ||
          range[end] !== value
        )
          complaints.push(
            `gait ${law.name}: ${key} ${asked} past the schema's ${end} ${value}, expected a refusal on ${key} naming ${value}, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
          );
      }
    }
  }
  TestValidator.equals("the schemas match the lexicon", complaints, []);
}
