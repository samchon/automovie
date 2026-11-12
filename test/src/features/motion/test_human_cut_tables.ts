import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person standing still can be interrupted into any action, and a reflex
 * interrupts whatever the body was doing, while a voluntary cut still needs
 * a window its action declares.
 *
 * Quiet standing is what a body does between acts, so nothing about it has
 * to finish before the next act starts; and a startle, a shove or a blow
 * does not wait for a gesture's stroke to end. Before this rule a push could
 * not be staged at all: standing declared a cut only into standing and
 * walking, and no action listed the reactions.
 *
 * Scenarios, on the average man:
 * 1. Standing cut at 0.3 of its length into a flinch, a stagger, a
 *    knockdown, a brace, a gesture, a look and a walk: each plans.
 * 2. A wave cut at half its length, mid-stroke, into a flinch, a stagger and
 *    a knockdown: each plans.
 * 3. The same wave cut at half its length into standing is refused as a
 *    `cut`, on the stand it would enter, listing the wave's legal windows.
 * 4. A reaction cut early into standing is refused: accepting any source
 *    does not make a reaction leave to anything.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each performance through the public chain and constructor; a refused push, or a mid-stroke cut into standing that plans, fails.
 * @evidence contracts/development/testing.md#independent-expectations Which cuts a person can perform follows from what the acts are (rest, reflex, voluntary stroke), not from any table's contents.
 * @evidence contracts/development/testing.md#distinguishing-cases A source that yields to everything, targets that accept everything, a voluntary cut outside its window, and the reverse direction of an accepting target.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and plans without sampling a film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, what it made stageable and the 4 scenarios.
 */
export function test_human_cut_tables(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const outcome = (chain: HumanChain): unknown => {
    try {
      new HumanPerformance({
        seed: "cuts",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: chain.node,
      });
    } catch (error) {
      return error;
    }
    return null;
  };
  const complaints: string[] = [];
  const plans = (label: string, chain: HumanChain): void => {
    const thrown: unknown = outcome(chain);
    if (thrown !== null)
      complaints.push(
        `${label}: expected to plan, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  };
  const standing = (): HumanChain =>
    HumanChain.subject("a").stand({ seconds: 3 }).until({ share: 0.3 });
  const waving = (): HumanChain =>
    HumanChain.subject("a").gesture({ kind: "wave" }).until({ share: 0.5 });

  // 1. Standing yields to anything.
  plans("stand into flinch", standing().flinch());
  plans("stand into stagger", standing().stagger({ speed: 1 }));
  plans("stand into knockdown", standing().knockdown());
  plans("stand into brace", standing().brace());
  plans("stand into gesture", standing().gesture({ kind: "wave" }));
  plans(
    "stand into look",
    standing().look({
      target: { kind: "point", at: { x: 0.5, y: 1.5, z: 2 }, frame: "world" },
    }),
  );
  plans("stand into walk", standing().walk({ to: { x: 0, y: 0, z: 2 } }));

  // 2. A reflex interrupts a stroke.
  plans("wave into flinch", waving().flinch());
  plans("wave into stagger", waving().stagger({ speed: 1 }));
  plans("wave into knockdown", waving().knockdown());

  // 3 and 4. A voluntary cut still needs its window.
  for (const [label, chain] of [
    ["wave into stand mid-stroke", waving().stand()],
    [
      "flinch into stand at its start",
      HumanChain.subject("a").flinch().until({ share: 0.05 }).stand(),
    ],
  ] as const) {
    const thrown: unknown = outcome(chain);
    if (
      !(thrown instanceof HumanRefusal) ||
      thrown.kind !== "cut" ||
      thrown.act !== "stand"
    )
      complaints.push(
        `${label}: expected a cut refusal on stand, got ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      );
  }
  TestValidator.equals("the cut tables", complaints, []);
}
