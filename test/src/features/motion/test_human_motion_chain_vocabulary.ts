import type { AutoMovieComposition } from "@automovie/engine";
import {
  HUMAN_ACTIONS,
  type HumanActionName,
  HumanChain,
  type HumanChainCore,
  type IHumanActionParams,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/** `true` only when two types are each assignable to the other. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/** The action names whose chain method is absent or takes another parameter type than the action's own. */
type Mistyped = {
  [Name in HumanActionName]: HumanChain[Name] extends (
    params: infer Params,
    anchor?: string,
  ) => HumanChain
    ? Same<NonNullable<Params>, IHumanActionParams[Name]> extends true
      ? never
      : Name
    : Name;
}[HumanActionName];

/**
 * Every action of the vocabulary is a typed method of the chain, and the
 * named append is typed by the action it names.
 *
 * The chain is the surface a production's coding agent composes with. An
 * action that is only reachable through an untyped call gives that agent no
 * parameter list and no rejection of a wrong one, so each action must be a
 * method that takes its law's own parameters, and `act(name, params)` must
 * select the same type from the name.
 *
 * Scenarios:
 * 1. For every name of the dispatch table, the chain has a method of that
 *    name, and calling it appends one intent of that subject whose
 *    capability is that name, with the parameters and the anchor given: no
 *    method appends another action than its own.
 * 2. `act(name, params, anchor)` appends the same intent as the method.
 * 3. Compile time: no action name lacks a method or has a method typed with
 *    another parameter type than the action's own.
 * 4. Compile time: `act` takes the named action's parameters; a parameter
 *    the action does not declare (`hand` on `touch`) and a row its lexicon
 *    lacks (`patt` as a touch kind) are not part of the type; parameters may
 *    be left out only where all are optional (`stand`, not `walk`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls every vocabulary method through the public chain and reads the appended intent; a method wired to another action's name, or missing, fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected capability is the method's own name and the expected parameters are the object passed; the type pins compare the public types with each other, not with an implementation value.
 * @evidence contracts/development/testing.md#distinguishing-cases Every action name, both ways of appending, and the four type rejections an agent meets: a missing method, a wrong parameter type, an undeclared parameter and an unknown row.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit that builds compositions and performs nothing; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and why the chain must be typed for its reader.
 */
export function test_human_motion_chain_vocabulary(): void {
  const names: HumanActionName[] = Object.keys(
    HUMAN_ACTIONS,
  ) as HumanActionName[];
  const appended = (chain: HumanChain): AutoMovieComposition | undefined =>
    chain.node.kind === "sequence" ? chain.node.parts.at(-1) : chain.node;

  // 1. One method per action, each appending its own action.
  for (const name of names) {
    const method: unknown = HumanChain.subject("a")[name];
    TestValidator.predicate(
      `the chain has a method named ${name}`,
      typeof method === "function",
    );
    const params: object = { marker: name };
    const chain: HumanChain = (
      method as (this: HumanChain, params: object, anchor: string) => HumanChain
    ).call(HumanChain.subject("a"), params, `anchor-${name}`);
    const last: AutoMovieComposition | undefined = appended(chain);
    TestValidator.predicate(
      `${name} appends an intent`,
      last !== undefined && last.kind === "intent",
    );
    if (last === undefined || last.kind !== "intent") continue;
    TestValidator.equals(
      `${name} appends its own action`,
      last.intent.capability,
      name,
    );
    TestValidator.equals(
      `${name} appends for its subject`,
      last.intent.subject,
      "a",
    );
    TestValidator.equals(
      `${name} keeps the anchor`,
      last.intent.anchor,
      `anchor-${name}`,
    );
    TestValidator.predicate(
      `${name} keeps the parameters`,
      last.intent.parameters?.params === params,
    );
  }

  // 2. The named append gives the same intent as the method.
  const walked: HumanChain = HumanChain.subject("a").walk(
    { to: { x: 0, y: 0, z: 2 } },
    "w",
  );
  const acted: HumanChain = HumanChain.subject("a").act(
    "walk",
    { to: { x: 0, y: 0, z: 2 } },
    "w",
  );
  TestValidator.equals(
    "act and the method append the same composition",
    acted.node,
    walked.node,
  );
  TestValidator.equals(
    "an all-optional action appends with no parameters",
    HumanChain.subject("a").act("stand").node,
    HumanChain.subject("a").stand().node,
  );

  // 3. Compile time: every action has a method of its own parameter type.
  const mistyped: Same<Mistyped, never> = true;

  // 4. Compile time: the named append is typed by its name.
  const selected: Same<
    NonNullable<HumanChainCore.Arguments<"touch">[0]>,
    IHumanActionParams["touch"]
  > = true;
  const undeclared: "hand" extends keyof IHumanActionParams["touch"]
    ? false
    : true = true;
  const unknownRow: "patt" extends NonNullable<
    IHumanActionParams["touch"]["kind"]
  >
    ? false
    : true = true;
  const required: [] extends HumanChainCore.Arguments<"walk"> ? false : true =
    true;
  const optional: [] extends HumanChainCore.Arguments<"stand"> ? true : false =
    true;
  TestValidator.predicate(
    "the type pins hold",
    mistyped && selected && undeclared && unknownRow && required && optional,
  );
}
