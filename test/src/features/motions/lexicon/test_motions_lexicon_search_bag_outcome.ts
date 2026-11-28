import {
  AutoMovieArchetypeBag,
  AutoMovieArchetypeFeedingBottle,
} from "@automovie/archetypes";
import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanSearch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { compositionIntents } from "../../internal/compositionIntents";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/**
 * A declared no-find searches without taking custody of an item.
 *
 * A later found-item search can follow the miss using the same hand. Each
 * attempt touches its own bag. Only the found attempt adds a pickup. A placed
 * pair of totes ties those intents to the played lift and the item's original
 * support. Both outcomes survive a seed change.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the authored miss, later retry and existing found outcome.
 * @evidence contracts/development/testing.md#behavioral-verification Inspects the public recipe's authored touch and pickup intents, then stages the miss and retry in Performance with a stored actor and stock props. Reads played order, lift time and the bottle's displayed world frame.
 * @evidence contracts/development/testing.md#independent-expectations The authored no-find selects one touch and leaves the bottle at its authored support. The found branch adds its specified grip and lift. The placed retry raises the bottle a physical bag height after a separate missed attempt.
 */
export async function test_motions_lexicon_search_bag_outcome(): Promise<void> {
  const entry = AutoMovieMotionHumanChain.subject("actor");
  const miss = AutoMovieMotionHumanSearch.searchBag(entry, {
    type: "no-find",
    bag: "first",
    hand: "left",
  });
  const found = AutoMovieMotionHumanSearch.searchBag(entry, {
    bag: "second",
    item: "token",
    handle: "grip",
    depth: 0.18,
  });
  const retry = AutoMovieMotionHumanSearch.searchBag(miss, {
    bag: "second",
    item: "token",
    handle: "grip",
    depth: 0.18,
    hand: "left",
  });
  const intents = (chain: typeof entry): unknown[] =>
    compositionIntents(chain.node).map((intent: IAutoMovieIntent): unknown => [
      intent.capability,
      intent.parameters?.params,
    ]);
  const touch = (subject: string, hand: string): unknown => [
    "touch",
    {
      target: { kind: "prop", subject, point: "inside" },
      hand,
      kind: "rub",
      effector: "fingertips",
      count: AutoMovieMotionHumanSearch.RUMMAGE,
    },
  ];
  const pickup = (hand: string): unknown => [
    "pickUp",
    {
      prop: "token",
      handle: "grip",
      hand,
      lift: 0.18,
    },
  ];
  TestValidator.equals("an empty attempt only touches", intents(miss), [
    touch("first", "left"),
  ]);
  TestValidator.equals(
    "a found item still uses the right hand by default",
    intents(found),
    [touch("second", "right"), pickup("right")],
  );
  TestValidator.equals("the retry alone picks up the item", intents(retry), [
    touch("first", "left"),
    touch("second", "left"),
    pickup("left"),
  ]);
  await verifyPlacedSearch();
}

/** Place two tote bags and follow the bottle through an empty attempt and retry. */
async function verifyPlacedSearch(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const base: number = 0.98;
  const height: number = 0.27;
  const tote = AutoMovieArchetypeBag.create({
    kind: "tote",
    width: 0.3,
    height,
    depth: 0.15,
  });
  const bag = (subject: string, x: number): IAutoMovieMotionHumanProp =>
    AutoMovieMotionHumanObject.prop(subject, tote, {
      at: { x, y: base, z: 0.34 },
      yaw: 0,
    });
  const at: IAutoMovieVector3 = {
    x: 0.19,
    y: base + AutoMovieArchetypeBag.WALL,
    z: 0.34,
  };
  const bottle: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "bottle",
    AutoMovieArchetypeFeedingBottle.create(),
    { at, yaw: 0 },
  );
  const miss = AutoMovieMotionHumanSearch.searchBag(
    AutoMovieMotionHumanChain.subject("actor").stand({ hold: 0.4 }),
    { type: "no-find", bag: "empty" },
  );
  const retry = AutoMovieMotionHumanSearch.searchBag(miss, {
    bag: "second",
    item: "bottle",
    handle: "grip",
    hand: "left",
    depth: height,
  });
  const rehearse = (chain: typeof miss, seed: string) =>
    new AutoMovieMotionHumanPerformance({
      seed,
      performers: [
        {
          subject: "actor",
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          body,
          proficiency: { level: "trained" },
        },
      ],
      props: [bag("empty", -0.17), bag("second", at.x), bottle],
      composition: chain.stand({ hold: 0.25 }).node,
    });
  const outcome = (seed: string) => {
    const scene = rehearse(retry, seed);
    const played: readonly IAutoMovieMotionHumanSegment[] =
      scene.segments("actor");
    TestValidator.equals(
      "one pickup follows both touches",
      played.map((segment) => segment.name),
      ["stand", "touch", "touch", "pickUp", "stand"],
    );
    TestValidator.equals(
      "after the played miss the bottle still rests on the second floor",
      scene.prop("bottle", played[1]!.end).position,
      at,
    );
    const miss = played[1]!;
    const pickup = played[3]!;
    TestValidator.predicate(
      "only the retry leaves a bottle in the hand",
      (miss.plan.holds ?? []).length === 0 &&
        pickup.plan.holds?.some(
          (hold) => hold.prop === "bottle" && hold.side === "left",
        ) === true,
    );
    const lift = scene.schedule.entries
      .find((entry) => entry.index === pickup.entry)!
      .events!.find((event) => event.name === "lifted")!.seconds;
    TestValidator.predicate(
      "the lift cue is within the placed pickup",
      pickup.entryTime <= lift && lift <= pickup.end,
    );
    const position = scene.prop("bottle", lift).position;
    TestValidator.predicate(
      "the played lift carries the bottle origin to the bag opening",
      vclose(position, { ...at, y: at.y + height }, 0.01),
    );
    return { lift, final: scene.prop("bottle", scene.duration) };
  };
  TestValidator.equals(
    "same cue and carry with the same seed",
    outcome("search"),
    outcome("search"),
  );
  outcome("search-variant");
}
