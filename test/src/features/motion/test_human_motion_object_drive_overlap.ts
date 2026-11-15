import { createStorage } from "@automovie/archetypes";
import { AutoMovieComposition } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Two acts that drive one articulation at overlapping seconds are refused,
 * naming both (#3476): no rule says which hand wins.
 *
 * Scenarios, two average men on either side of a chest of drawers:
 * 1. Both pull the same drawer at once: the performance is refused with a
 *    `cut` refusal on `drives` whose reason names both performers.
 * 2. The second pulls it only after the first has let go (synced to the
 *    first's end): the performance resolves, the drawer's state holding both
 *    pulls' travels at the end, 0.2 m: the second starts where the first
 *    left it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the overlapping and the sequential case through the public chain; a performance that lets two drives fight, or refuses a sequence, fails.
 * @evidence contracts/development/testing.md#independent-expectations The refusal's kind and axis are #3476's contract; the travels are the scene's asks.
 * @evidence contracts/development/testing.md#distinguishing-cases Overlapping against sequential drives of one articulation.
 * @evidence contracts/development/testing.md#execution-ownership Builds two performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the two numbered scenarios.
 */
export function test_human_motion_object_drive_overlap(): void {
  const chest: ReturnType<typeof createStorage> = createStorage({
    kind: "chest",
  });
  const placement: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const drawer = (chest.affordances ?? []).find((a) => a.kind === "slider");
  TestValidator.predicate("the chest has a drawer", drawer !== undefined);
  if (drawer === undefined) return;
  const handle = (chest.affordances ?? []).find((a) => a.rides === drawer.id);
  TestValidator.predicate("the drawer has a handle", handle !== undefined);
  if (handle === undefined) return;
  const at = chest.placed(handle.id as never, placement).translation;
  const body: IHumanBody = motionHumanBody("m-average");
  const pull = (who: string) =>
    HumanChain.subject(who).operate(
      {
        mechanism: {
          kind: "slider",
          at: { kind: "prop", subject: "chest", point: handle.id },
          travel: 0.1,
        },
      },
      `${who}-pull`,
    );
  const input = (composition: AutoMovieComposition) => ({
    seed: "overlap",
    props: [
      HumanObject.prop("chest", chest, {
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        fixed: true,
      }),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: at.x - 0.15, y: 0, z: at.z + 0.45 },
        yaw: 180,
        proficiency: { level: "trained" as const },
      },
      {
        subject: "b",
        body,
        at: { x: at.x + 0.15, y: 0, z: at.z + 0.45 },
        yaw: 180,
        proficiency: { level: "trained" as const },
      },
    ],
    composition,
  });

  // 1. At once: refused naming both.
  let refusal: unknown;
  try {
    new HumanPerformance(
      input(AutoMovieComposition.parallel(pull("a").node, pull("b").node)),
    );
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    `two drives at once are refused on drives (${refusal instanceof Error ? refusal.message : "accepted"})`,
    refusal instanceof HumanRefusal &&
      refusal.kind === "cut" &&
      refusal.axis === "drives" &&
      refusal.message.includes("a") &&
      refusal.message.includes("b"),
  );

  // 2. One after the other: resolved.
  let resolved: HumanPerformance | undefined;
  try {
    resolved = new HumanPerformance(
      input(
        AutoMovieComposition.parallel(
          pull("a").node,
          pull("b").sync({ of: "a-pull", event: "end" }).node,
        ),
      ),
    );
  } catch (error) {
    resolved = undefined;
    refusal = error;
  }
  TestValidator.predicate(
    `drives one after the other resolve (${resolved === undefined && refusal instanceof Error ? refusal.message : "resolved"})`,
    resolved !== undefined,
  );
  if (resolved !== undefined)
    TestValidator.predicate(
      "the drawer holds both pulls' travels",
      Math.abs(
        (resolved.state("chest", resolved.duration)[drawer.id] ?? 0) - 0.2,
      ) <= 1e-9,
    );
}
