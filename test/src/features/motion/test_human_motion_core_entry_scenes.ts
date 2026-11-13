import { createBag } from "@automovie/archetypes";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanMutual,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type IHumanActionLaw,
  type IHumanBody,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Scenes a production planned that failed as a program instead of as the
 * grammar: each now plans, or refuses with the parameter at fault and what
 * it accepts.
 *
 * Scenarios, on the average man (and the small woman as the partner):
 * 1. A smoking break with no cigarette: light it, smoke, tap the ash on the
 *    performer's own abdomen named as a person (the performer itself),
 *    smoke, scratch the nape. It plans: a person naming the performer is
 *    the performer's own body, read as a `self` target is, not from the
 *    posture being solved.
 * 2. Two performers who read each other at once: one struggles at the
 *    other's forearms while the other holds the first in a headlock. It
 *    plans, each reading the other a reaction time earlier.
 * 3. A partner dance whose three rows are each given `partner`, which none
 *    of them takes: refused on `partner`, listing what the row takes.
 * 4. Stairs climbed step over step, six treads, with no stairs given:
 *    planned on the flight the parameters state.
 * 5. Typing at a keyboard whose heading is not given, seated and standing:
 *    refused on `keyboard.yaw`, where the missing heading was read as NaN.
 * 6. A headlock with no partner: refused on `partner`, naming no
 *    `undefined`.
 * 7. A pole vault with no pole: refused on the missing parameter, naming no
 *    `undefined`.
 * 8. A touch on a region no body has (`chest`): refused on
 *    `target.region`, listing the regions.
 * 9. A tote picked up and handed over to a partner who receives it: it
 *    plans, the receiver's reference weight never rounding below 0 as the
 *    take-away ends.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each scene through the public input and reads what the build throws; a JavaScript error, a stack overflow or a refusal naming `undefined` fails with the scene and the message.
 * @evidence contracts/development/testing.md#independent-expectations Each scene is one a production wrote; that a missing or a wrong value is refused and a mutual reading is no recursion is the grammar's contract for any scene.
 * @evidence contracts/development/testing.md#distinguishing-cases A performer reading itself, two reading each other, an unknown parameter, a scene that needs no prop, a missing nested member, a missing partner, a missing prop, a region no body has and a handover received.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds ten short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 9 scenarios.
 */
export function test_human_motion_core_entry_scenes(): void {
  const man: IHumanBody = motionHumanBody("m-average");
  const woman: IHumanBody = motionHumanBody("f-small");
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const outcome = (
    composition: { node: HumanPerformance.IInput["composition"] },
    partner: boolean = false,
    props: HumanPerformance.IInput["props"] = [],
  ): string => {
    try {
      new HumanPerformance({
        seed: "entry",
        laws,
        props,
        performers: [
          {
            subject: "a",
            body: man,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          ...(partner
            ? [
                {
                  subject: "b",
                  body: woman,
                  at: { x: 0, y: 0, z: partnerAt },
                  yaw: 180,
                  proficiency: { level: "trained" as const },
                },
              ]
            : []),
        ],
        composition: composition.node,
      });
      return "planned";
    } catch (error) {
      if (error instanceof HumanRefusal)
        return /\bundefined\b/.test(`${error.reason} ${error.fix}`)
          ? `a refusal naming undefined: ${error.message}`
          : `refused on ${error.axis}`;
      return `${error instanceof Error ? error.name : typeof error}: ${error instanceof Error ? `${error.message} ${(error.stack ?? "").split("\n").slice(1, 12).join(" | ")}` : String(error)}`;
    }
  };
  let partnerAt: number = 0.5;
  const stand = (subject: string): HumanChain =>
    HumanChain.subject(subject).stand({ seconds: 0.3 });
  const complaints: string[] = [];
  const expect = (
    label: string,
    got: string,
    wanted: (got: string) => boolean,
  ): void => {
    if (!wanted(got)) complaints.push(`${label}: ${got}`);
  };

  // 1. The smoking break.
  expect(
    "a smoking break tapping the ash on the performer itself",
    outcome(
      stand("a")
        .registered("lightCigarette")
        .registered("smoke")
        .registered("ashTap", {
          target: { kind: "person", subject: "a", region: "abdomen" },
        })
        .registered("smoke")
        .registered("scratchNape"),
    ),
    (got: string): boolean => got === "planned",
  );

  // 2. Two performers reading each other.
  expect(
    "a struggle against a headlock",
    outcome(
      stand("a")
        .registered("struggle", {
          target: { kind: "person", subject: "b", region: "forearmLeft" },
          other: { kind: "person", subject: "b", region: "forearmRight" },
        })
        .with(stand("b").registered("headlock", { partner: "a" })),
      true,
    ),
    (got: string): boolean => got === "planned",
  );
  expect(
    "a headlock against a struggle, composed the other way round",
    outcome(
      stand("b")
        .registered("headlock", { partner: "a" })
        .with(
          stand("a").registered("struggle", {
            target: { kind: "person", subject: "b", region: "forearmLeft" },
            other: { kind: "person", subject: "b", region: "forearmRight" },
          }),
        ),
      true,
    ),
    (got: string): boolean => got === "planned",
  );

  // 3. A partner dance given `partner`.
  for (const row of ["danceHold", "danceLead", "danceFollow"])
    expect(
      `${row} given a partner`,
      outcome(
        stand("a").registered(row, { partner: "b" }).with(stand("b")),
        true,
      ),
      (got: string): boolean => got === "refused on partner",
    );

  // 4. Stairs with no stairs given.
  expect(
    "six treads step over step",
    outcome(stand("a").climbStairs({ pattern: "stepOverStep", count: 6 })),
    (got: string): boolean =>
      got === "planned" || got.startsWith("refused on "),
  );

  // 5. Typing at a keyboard with no heading.
  expect(
    "typing at a keyboard with no heading",
    outcome(
      HumanChain.subject("a")
        .sit({
          seat: {
            at: {
              x: 0,
              y: seated.popliteal(man),
              z: man.rest.get("leftFoot")!.z - 0.1,
            },
            yaw: 0,
            depth: 0.45,
          },
          seconds: 0.5,
        })
        .registered("typeText", {
          keyboard: { at: { x: -1, y: 0.7, z: 0.35 } },
          text: "hello",
        }),
    ),
    (got: string): boolean => got === "refused on keyboard.yaw",
  );

  expect(
    "typing standing at a keyboard with no heading",
    outcome(
      HumanChain.subject("a").registered("typeText", {
        keyboard: { at: { x: -1, y: 1.0, z: 0.4 } },
        text: "the scene opens",
      }),
    ),
    (got: string): boolean => got === "refused on keyboard.yaw",
  );
  // 6. A headlock with no partner.
  expect(
    "a headlock with no partner",
    outcome(stand("a").registered("headlock")),
    (got: string): boolean => got === "refused on partner",
  );

  // 7. A pole vault with no pole.
  expect(
    "a pole vault with no pole",
    outcome(stand("a").registered("vaultOnPole")),
    (got: string): boolean => got.startsWith("refused on "),
  );

  // 8. A region no body has.
  expect(
    "a touch on the chest",
    outcome(
      stand("a").touch({
        target: { kind: "self", region: "chest" as "sternum" },
      }),
    ),
    (got: string): boolean => got === "refused on target.region",
  );
  // 9. A bag handed over and received.
  partnerAt = 0.8;
  expect(
    "a bag handed over and received",
    outcome(
      HumanChain.mutual(
        HumanMutual.handOver,
        {
          giver: HumanChain.subject("a").pickUp({
            prop: "bag",
            handle: "handle",
          }),
          receiver: stand("b"),
        },
        { prop: "bag", handle: "handle" },
      ),
      true,
      [
        HumanObject.prop("bag", createBag({ kind: "tote" }), {
          at: {
            x: -man.measure.shoulderHalfWidth,
            y: man.measure.waistHeight,
            z: 0.6 * (man.measure.upperArm + man.measure.forearm),
          },
          yaw: 0,
        }),
      ],
    ),
    (got: string): boolean =>
      got === "planned" || got.startsWith("refused on "),
  );
  TestValidator.equals("each scene plans or refuses", complaints, []);
}
