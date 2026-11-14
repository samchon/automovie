import { TestValidator } from "@nestia/e2e";
import { compressToEncodedURIComponent } from "lz-string";

import { PlaygroundAddress } from "../../src/playground/PlaygroundAddress";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../../src/scenes/SCENES";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * A playground address reproduces the composition it was written from, and refuses one it cannot read by saying why.
 *
 * Scenarios:
 * 1. Every scene's composition, a composition using every member an action can carry (an anchor, a cut, a timing, an overlay, a mutual action), and that composition as version 2 with placed objects (one with a kind and a seed, one with neither) read back deep-equal after being written as a fragment; a version 1 address still reads.
 * 2. A fragment without a composition gives null, so the page opens its default.
 * 3. A composition of another version is refused with a message naming that version and the versions the page reads.
 * 4. A fragment whose text is not a compressed composition is refused, not read as an empty one.
 * 5. A composition of the right version whose performer lacks its actions, whose overlaid action lacks its parameters, or whose placed object lacks its producer, is refused, so a damaged link never reaches the editor.
 */
export function test_website_playground_address(): void {
  // 1. Round trip.
  const full: IPlaygroundComposition = {
    version: 1,
    seed: "scene-12",
    performers: [
      {
        subject: "a",
        body: "m1",
        x: -0.5,
        z: 1.25,
        yaw: 90,
        proficiency: "novice",
        actions: [
          {
            name: "walk",
            params: { to: { x: 0, y: 0, z: 3 }, pace: "slow" },
            anchor: "stroll",
            until: { share: 0.5 },
            over: [{ name: "handToFace", params: { task: "read" } }],
          },
          {
            name: "gesture",
            params: { kind: "wave" },
            sync: { of: "dialogue", event: "accent", index: 2 },
          },
        ],
      },
      {
        subject: "b",
        body: "f1",
        x: 1,
        z: 0,
        yaw: 0,
        proficiency: "elite",
        actions: [],
      },
    ],
    mutuals: [
      { name: "handshake", cast: { one: "a", other: "b" }, params: {} },
    ],
  };
  const placed: IPlaygroundComposition = {
    ...full,
    version: 2,
    objects: [
      {
        subject: "chair",
        producer: "createSeat",
        kind: "dining",
        seed: "7",
        x: 0.5,
        z: 1,
        yaw: 180,
      },
      { subject: "mug", producer: "createDrinkware", x: 0, z: 1.4, yaw: 0 },
    ],
  };
  for (const composition of [
    ...SCENES.flatMap((scene: IScene): IPlaygroundComposition[] =>
      scene.composition === null ? [] : [scene.composition],
    ),
    full,
    placed,
  ])
    TestValidator.equals(
      `the composition seeded ${composition.seed} reads back equal`,
      PlaygroundAddress.decode(PlaygroundAddress.encode(composition)),
      composition,
    );

  // 2. No composition.
  TestValidator.equals("an empty fragment", PlaygroundAddress.decode(""), null);
  TestValidator.equals(
    "a fragment with another key",
    PlaygroundAddress.decode("#section"),
    null,
  );

  // 3. Another version.
  const message: string = thrown((): void => {
    PlaygroundAddress.decode(
      `#c=${compressToEncodedURIComponent(JSON.stringify({ ...full, version: 7 }))}`,
    );
  });
  TestValidator.predicate(
    "another version is refused with both versions named",
    message.includes("7") &&
      message.includes(String(PlaygroundAddress.VERSION)),
  );

  // 4. Unreadable text.
  TestValidator.predicate(
    "an unreadable fragment is refused",
    thrown((): void => {
      PlaygroundAddress.decode("#c=not-a-composition");
    }) !== "",
  );

  // 5. Damaged structure.
  const damaged: unknown[] = [
    {
      ...full,
      performers: [{ ...full.performers[0]!, actions: undefined }],
    },
    {
      ...full,
      performers: [
        {
          ...full.performers[0]!,
          actions: [{ name: "walk", params: {}, over: [{ name: "wave" }] }],
        },
      ],
    },
    {
      ...placed,
      objects: [{ subject: "chair", x: 0, z: 0, yaw: 0 }],
    },
  ];
  for (const value of damaged)
    TestValidator.predicate(
      "a damaged composition is refused",
      thrown((): void => {
        PlaygroundAddress.decode(
          `#c=${compressToEncodedURIComponent(JSON.stringify(value))}`,
        );
      }) !== "",
    );
}

/** The message a call throws, or the empty text when it throws nothing. */
const thrown = (call: () => void): string => {
  try {
    call();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return "";
};
