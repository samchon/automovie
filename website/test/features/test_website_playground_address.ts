import { TestValidator } from "@nestia/e2e";
import { compressToEncodedURIComponent } from "lz-string";

import { PlaygroundAddress } from "../../src/playground/PlaygroundAddress";
import { changePlaygroundPerformer } from "../../src/playground/changePlaygroundPerformer";
import type { IPlaygroundComposition } from "../../src/playground/structures/IPlaygroundComposition";
import { SCENES } from "../../src/scenes/SCENES";
import type { IScene } from "../../src/scenes/structures/IScene";

/**
 * A playground address reproduces the composition it was written from, and refuses one it cannot read by saying why.
 *
 * Scenarios:
 * 1. Every scene's composition, a composition using every member an action can carry, its version 2 objects, and version 3 impulses with region and bone-local points read back deep-equal. Signed finite clocks, zero impulses and an empty impulse list remain valid; version 1 and 2 addresses still read.
 * 2. A fragment without a composition gives null, so the page opens its default.
 * 3. A composition of another version is refused with a message naming that version and the versions the page reads.
 * 4. A fragment whose text is not a compressed composition is refused, not read as an empty one.
 * 5. A composition of the right version whose performer lacks its actions, whose overlaid action lacks its parameters, or whose placed object lacks its producer, is refused, so a damaged link never reaches the editor.
 * 6. Both writing and reading refuse forces in legacy versions, non-impulse forces, absent subjects, empty anatomical tokens and damaged vectors or clocks. Numeric JSON overflow is refused even when JSON parsing itself succeeds.
 * 7. The editor's performer change retains impulses across renaming, removes only the deleted person's impulses, and leaves ordinary force data and legacy field absence intact. Both edited compositions remain shareable and the source stays untouched.
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
  const forced: IPlaygroundComposition = {
    ...placed,
    version: 3,
    forces: [
      {
        kind: "impulse",
        subject: "a",
        at: "sternum",
        seconds: 0.5,
        impulse: { x: 0, y: 0, z: 3 },
      },
      {
        kind: "impulse",
        subject: "b",
        at: { bone: "hips", point: { x: 0.01, y: 0, z: 0 } },
        seconds: -0.25,
        impulse: { x: 0, y: 0, z: 0 },
      },
    ],
  };
  for (const composition of [
    ...SCENES.flatMap((scene: IScene): IPlaygroundComposition[] =>
      scene.composition === null ? [] : [scene.composition],
    ),
    full,
    placed,
    forced,
    { ...forced, forces: [] },
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

  // 6. An address must not silently drop an authored force.
  const first: NonNullable<IPlaygroundComposition["forces"]>[number] =
    forced.forces![0]!;
  const damagedForces: unknown[] = [
    { ...forced, version: 1 },
    { ...forced, version: 2 },
    ...[
      null,
      {},
      [null],
      [{ ...first, kind: "sustained" }],
      [{ ...first, subject: "" }],
      [{ ...first, subject: "missing" }],
      [{ ...first, at: "  " }],
      [{ ...first, at: 0 }],
      [{ ...first, at: { bone: "", point: { x: 0, y: 0, z: 0 } } }],
      [{ ...first, at: { bone: "hips" } }],
      [{ ...first, at: { bone: "hips", point: { x: 0, y: null, z: 0 } } }],
      [{ ...first, impulse: { x: 0, y: 0 } }],
      [{ ...first, impulse: { x: 0, y: "0", z: 3 } }],
      [{ ...first, seconds: null }],
      [{ ...first, seconds: "0.5" }],
      [{ ...first, seconds: Infinity }],
      [{ ...first, impulse: { x: 0, y: NaN, z: 3 } }],
    ].map((forces: unknown): unknown => ({ ...forced, forces })),
  ];
  for (const value of damagedForces) {
    TestValidator.predicate(
      "writing refuses damaged or unsupported forces before JSON loses them",
      thrown((): void => {
        PlaygroundAddress.encode(value as IPlaygroundComposition);
      }) !== "",
    );
    TestValidator.predicate(
      "reading refuses damaged or unsupported forces",
      thrown((): void => {
        PlaygroundAddress.decode(
          `#c=${compressToEncodedURIComponent(JSON.stringify(value))}`,
        );
      }) !== "",
    );
  }
  for (const forces of [
    [{ ...first, seconds: "OVERFLOW" }],
    [{ ...first, impulse: { x: 0, y: 0, z: "OVERFLOW" } }],
  ]) {
    const overflowing: string = JSON.stringify({ ...forced, forces }).replace(
      '"OVERFLOW"',
      "1e309",
    );
    TestValidator.predicate(
      "numeric overflow is refused after JSON parsing",
      thrown((): void => {
        PlaygroundAddress.decode(
          `#c=${compressToEncodedURIComponent(overflowing)}`,
        );
      }) !== "",
    );
  }

  // 7. The editor updates force references before the address admits them.
  const renamed: IPlaygroundComposition = changePlaygroundPerformer(forced, 0, {
    subject: "renamed",
  });
  const removed: IPlaygroundComposition = changePlaygroundPerformer(
    forced,
    0,
    null,
  );
  TestValidator.equals(
    "renaming moves only that person's impulse subject",
    renamed.forces,
    [{ ...first, subject: "renamed" }, forced.forces![1]!],
  );
  TestValidator.equals(
    "removing a person removes only that person's impulses",
    [
      removed.performers.map(
        (p: IPlaygroundComposition.IPerformer): string => p.subject,
      ),
      removed.forces,
    ],
    [["b"], [forced.forces![1]!]],
  );
  for (const edited of [renamed, removed])
    TestValidator.equals(
      "the edited force references round trip",
      PlaygroundAddress.decode(PlaygroundAddress.encode(edited)),
      edited,
    );
  TestValidator.equals(
    "changing a body preserves authored impulses",
    changePlaygroundPerformer(forced, 0, { body: "m2" }).forces,
    forced.forces,
  );
  TestValidator.predicate(
    "editing a legacy composition adds no forces field",
    !("forces" in changePlaygroundPerformer(full, 0, { subject: "renamed" })),
  );
  TestValidator.equals(
    "the source subjects and impulses stay untouched",
    [forced.performers[0]!.subject, forced.forces![0]!.subject],
    ["a", "a"],
  );
}

/** The message a call throws, or the empty text when it throws nothing. */
const thrown: (call: () => void) => string = (call: () => void): string => {
  try {
    call();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return "";
};
