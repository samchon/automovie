import type { IAutoMovieComposition, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieMotionTarget } from "@automovie/interface";
import { createHeavyBag } from "@automovie/archetypes";
import { AutoMovieComposition } from "@automovie/engine";

import { HumanChain, HumanDefence, HumanObject, HumanPerformance, HumanStrike } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * #3362's composition matrix, first draft: strike rows by effector, by
 * target kind and by defence outcome plan, and an undefended strike that
 * reaches a person is a hit on them.
 *
 * Scenarios, the average man striking the average man (or a heavy bag, or
 * the air) at arm's length:
 * 1. Each of `jab`, `rearHook`, `roundKick`, `pushKick` and `leadKnee`
 *    plans against a person's region, a prop's point and no target.
 * 2. A `jab` answered by `parry` with each forced outcome, in time, late
 *    and failed, plans; the failed one leaves a hit on the defender and the
 *    one in time none.
 * 3. An undefended `cross` at the chin is a hit on the receiver.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the matrix through the public chain and reads the plans and the hit record; a strike row that refuses a target kind, a defence outcome that does not plan, a parried strike that still lands or a landed strike with no hit fails.
 * @evidence contracts/development/testing.md#independent-expectations The outcomes are forced by the scene; a parry in time keeps the strike off the body by the outcome law's own contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Five effectors by three target kinds, three defence outcomes, one undefended strike.
 * @evidence contracts/development/testing.md#execution-ownership Builds about twenty performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the three numbered scenarios.
 */
export function test_human_motion_strike_matrix(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const reach: number = body.measure.upperArm + body.measure.forearm;
  const bag: ReturnType<typeof createHeavyBag> = createHeavyBag();
  const rows: IAutoMovieMotionHumanActionLaw<never>[] = [
    HumanStrike.jab,
    HumanStrike.rearHook,
    HumanStrike.roundKick,
    HumanStrike.pushKick,
    HumanStrike.leadKnee,
    HumanStrike.cross,
  ] as IAutoMovieMotionHumanActionLaw<never>[];
  const targets: [string, IAutoMovieMotionTarget | undefined][] = [
    ["person", { kind: "person", subject: "b", region: "chin" }],
    ["prop", { kind: "prop", subject: "bag", point: "target" }],
    ["none", { kind: "none" } as IAutoMovieMotionTarget],
  ];
  const perform = (composition: IAutoMovieComposition): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "matrix",
      laws: [...rows, HumanDefence.parry as IAutoMovieMotionHumanActionLaw<never>],
      props: [
        HumanObject.prop("bag", bag, {
          at: { x: 1.2, y: 0, z: reach + 0.25 },
          yaw: 180,
          fixed: true,
        }),
      ],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body,
          at: { x: 0, y: 0, z: reach + 0.25 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition,
    });

  // 1. Effectors by target kinds.
  for (const row of rows.slice(0, 5))
    for (const [kind, at] of targets) {
      let planned: boolean = true;
      let reason: string = "";
      try {
        perform(
          AutoMovieComposition.parallel(
            HumanChain.subject("a").registered(row.name, { at }).node,
            HumanChain.subject("b").stand({ seconds: 2 }).node,
          ),
        );
      } catch (error) {
        planned = false;
        reason = error instanceof Error ? error.message : String(error);
      }
      TestValidator.predicate(
        `${row.name} at a ${kind} plans ${reason}`,
        planned,
      );
    }

  // 2. A jab and a parry by outcome.
  for (const outcome of ["inTime", "late", "fail"] as const) {
    let performance: IAutoMovieMotionHumanPerformance | undefined;
    let reason: string = "";
    try {
      performance = perform(
        AutoMovieComposition.sequence(
          HumanChain.subject("a").registered(
            "jab",
            { at: targets[0]![1] },
            "strike",
          ).node,
          HumanChain.subject("b").registered("parry", {
            against: "strike",
            outcome,
          }).node,
        ),
      );
    } catch (error) {
      reason = error instanceof Error ? error.message : String(error);
    }
    TestValidator.predicate(
      `a parry ${outcome} plans ${reason}`,
      performance !== undefined,
    );
    if (performance === undefined) continue;
    const hits: number = performance.hits("b").length;
    if (outcome === "fail")
      TestValidator.predicate(
        `a failed parry leaves a hit (${hits})`,
        hits >= 1,
      );
    if (outcome === "inTime")
      TestValidator.predicate(
        `a parry in time leaves no hit (${hits})`,
        hits === 0,
      );
  }

  // 3. An undefended cross lands.
  let landed: IAutoMovieMotionHumanPerformance | undefined;
  try {
    landed = perform(
      AutoMovieComposition.parallel(
        HumanChain.subject("a").registered("cross", { at: targets[0]![1] })
          .node,
        HumanChain.subject("b").stand({ seconds: 2 }).node,
      ),
    );
  } catch {
    landed = undefined;
  }
  TestValidator.predicate(
    "an undefended cross is a hit on the receiver",
    landed !== undefined && landed.hits("b").length >= 1,
  );
}
