import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanSocial,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every row of the lexicon is something a body can do: on the average man
 * and on the small woman, alone or on a partner of the other build, it is
 * accepted and planned, in its own name.
 *
 * A row writes no motion; it fixes parameters of an action that already
 * fits a body. So its first possible fault is a fixed combination that
 * action refuses on some body or at a natural distance, and this test is
 * the net for that across the whole lexicon. Whether what a planned row
 * shows keeps the physical bounds is the verdict net's, and what a row
 * should look like (a salute's arm) its own signature test's.
 *
 * Scenarios, for each performer of the two bodies:
 * 1. Each row performed alone (emblems, habits, stances, gaits taken 3 m,
 *    loads carried 3 m, tools worked on a point at bench height) plans, and
 *    the placed action carries the row's name.
 * 2. Each row on a partner at its own distance (0.35 m for slaps, 0.45 m for kisses
 *    and the whisper, 0.55 to 1 m for touches, grabs and strikes, 3 m
 *    for pursuit and throws) plans. A strike's planning is costly, so each
 *    strike is planned by one of the two performers.
 * 3. Each mutual record joins the two and plans.
 * 4. A person carried by another who walks 2 m plans, and so does a salute
 *    performed over a walk: rows of an action that rides a carrier ride
 *    one too.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers every lexicon row through the public input and builds a performance of it on real bodies; a row that is refused, or placed under another name, fails with the row, the body and the refusal's own message.
 * @evidence contracts/development/testing.md#independent-expectations That each row is humanly performable at these distances is what the row claims; nothing is compared with a value read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases Every row of the lexicon table, alone and on a partner at four distances, with the performer and the partner of opposite builds.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row and body; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the net catches, what it leaves to the verdict net and to signature tests, and the 3 scenarios.
 */
export function test_human_motion_lexicon_rows(): void {
  const bodies: Readonly<Record<string, IHumanBody>> = {
    "m-average": motionHumanBody("m-average"),
    "f-small": motionHumanBody("f-small"),
  };
  const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
  const on = (region: string): object => ({
    target: { kind: "person", subject: "b", region },
  });
  const at = (region: string): object => ({
    at: { kind: "person", subject: "b", region },
  });
  const ahead: object = { to: { x: 0.6, y: 0, z: -3 } };
  const bench: object = {
    on: {
      kind: "point",
      at: { x: 0, y: 0.9, z: 0.4 },
      frame: "world",
      normal: { x: 0, y: 1, z: 0 },
    },
  };

  const ball: object = {
    ball: { kind: "point", at: { x: 0, y: 0.11, z: 0.45 }, frame: "world" },
    toward: { kind: "point", at: { x: 0, y: 0, z: 5 }, frame: "world" },
  };

  // What a row done alone leaves open.
  const alone: Readonly<Record<string, object>> = {
    stroll: ahead,
    hurry: ahead,
    march: ahead,
    doubleTime: ahead,
    sneak: ahead,
    trudge: ahead,
    swagger: ahead,
    prowl: ahead,
    sad: ahead,
    proud: ahead,
    limp: ahead,
    stiffLimp: ahead,
    tiptoe: ahead,
    drunk: ahead,
    jog: ahead,
    sprint: ahead,
    carryBox: ahead,
    carryBag: ahead,
    carryOnHip: ahead,
    pushCart: ahead,
    haul: ahead,
    hammer: bench,
    saw: bench,
    stir: bench,
    screw: bench,
    scrub: bench,
    // The reload's palm goes to the performer's own abdomen, standing in
    // for a magazine well; a kick has its ball on the floor ahead.
    reloadFirearm: { target: { kind: "self", region: "abdomen" } },
    kickRight: ball,
    kickLeft: ball,
    leap: { to: { x: 0, y: 0, z: 0.6 } },
    dash: { to: { x: 0, y: 0, z: 4 } },
  };

  // The partner's distance and what a row done on a partner leaves open.
  const paired: Readonly<Record<string, readonly [number, object]>> = {
    slap: [0.35, on("jawLeft")],
    backhand: [0.35, on("jawRight")],
    shove: [0.6, on("sternum")],
    grab: [0.6, on("upperArmLeft")],
    poke: [0.6, on("sternum")],
    restrain: [0.55, { partner: "b" }],
    headlock: [0.55, { partner: "b" }],
    choke: [
      0.5,
      {
        ...on("neckRight"),
        other: { kind: "person", subject: "b", region: "neckLeft" },
      },
    ],
    // A hand in the hair is closed up to, as a slap is, and takes the hair
    // at the side of the head, which a small person reaches on a tall one.
    hairPull: [0.35, on("templeLeft")],
    struggle: [
      0.5,
      {
        ...on("forearmLeft"),
        other: { kind: "person", subject: "b", region: "forearmRight" },
      },
    ],
    whisper: [0.45, { partner: "b" }],
    cheekKiss: [0.45, { partner: "b" }],
    foreheadKiss: [0.45, { partner: "b" }],
    shoulderPat: [0.6, on("shoulderLeft")],
    comfort: [0.6, on("shoulderLeft")],
    firmPress: [0.6, on("shoulderLeft")],
    flickOff: [0.6, on("shoulderLeft")],
    fistBump: [0.7, { partner: "b" }],
    lowFive: [0.7, { partner: "b" }],
    pinkyPromise: [0.7, { partner: "b" }],
    follow: [3, on("sternum")],
    escort: [3, on("sternum")],
    chase: [3, on("sternum")],
    flee: [3, { from: "b" }],
    intercept: [3, { target: "b" }],
    confront: [3, on("sternum")],
    aim: [3, on("sternum")],
    takeAim: [3, on("sternum")],
    toss: [3, at("sternum")],
    hurl: [6, at("sternum")],
    pitch: [6, at("sternum")],
    underarmPitch: [3, at("sternum")],
    pushPass: [3, at("sternum")],
    cut: [0.7, { ...on("shoulderLeft"), advance: "step" }],
    // A rising cut lands on the flank; a hanging forearm of a small partner
    // lies below what a tall one's bare hand reaches without stooping.
    draw: [0.7, { ...on("ribsLeft"), advance: "step" }],
    slash: [0.7, { ...on("abdomen"), advance: "step" }],
    swordCut: [0.7, { ...on("shoulderLeft"), advance: "step" }],
    swordThrust: [0.75, { ...on("sternum"), advance: "step" }],
    jab: [0.75, at("jawLeft")],
    cross: [0.75, at("jawLeft")],
    hook: [0.65, at("jawLeft")],
    uppercut: [0.55, at("chin")],
    frontKick: [1, at("abdomen")],
    roundKick: [1, at("ribsLeft")],
    thrust: [0.75, on("sternum")],
  };
  const strikes: readonly string[] = [
    "jab",
    "cross",
    "hook",
    "uppercut",
    "frontKick",
    "roundKick",
    "thrust",
  ];

  // Rows that follow a person's placed path (`performer(...).root`).
  const tracking: readonly string[] = [
    "follow",
    "escort",
    "chase",
    "intercept",
  ];

  const complaints: string[] = [];
  const check = (
    label: string,
    names: readonly [string, string],
    gap: number | null,
    build: () => { node: HumanPerformance.IInput["composition"] },
    placed?: string,
  ): void => {
    try {
      const performance: HumanPerformance = new HumanPerformance({
        seed: "lexicon",
        laws,
        performers: [
          {
            subject: "a",
            body: bodies[names[0]]!,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          ...(gap === null
            ? []
            : [
                {
                  subject: "b",
                  body: bodies[names[1]]!,
                  at: { x: 0, y: 0, z: gap },
                  yaw: 180,
                  proficiency: { level: "trained" as const },
                },
              ]),
        ],
        composition: build().node,
      });
      const name: string | undefined = performance.segments("a")[1]?.name;
      if (placed !== undefined && name !== placed)
        complaints.push(
          `${label} on ${names[0]}: placed as ${name}, ${placed} expected`,
        );
    } catch (error) {
      complaints.push(
        `${label} on ${names[0]}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  const pairings: readonly (readonly [string, string])[] = [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ];
  pairings.forEach((names, turn: number): void => {
    const starting = (subject: string): HumanChain =>
      HumanChain.subject(subject).stand({ seconds: 0.3 });

    // 1 and 2. Every row, alone or on its partner.
    laws.forEach((law: IHumanActionLaw<never>, index: number): void => {
      // A ride and a carry need their support; each has its own scenario.
      // A firearm drawn or holstered needs the prop it takes, which the
      // firearm tests stage. A catch needs a throw to intercept, which the
      // throwing tests stage.
      if (
        [
          "ride",
          "carried",
          "drawFirearm",
          "holsterFirearm",
          "gloveCatch",
          "twoHandCatch",
        ].includes(law.name)
      )
        return;
      const scene: readonly [number, object] | undefined = paired[law.name];
      if (scene === undefined)
        check(
          law.name,
          names,
          null,
          () => starting("a").registered(law.name, alone[law.name] ?? {}),
          law.name,
        );
      else if (!strikes.includes(law.name) || index % 2 === turn)
        check(
          law.name,
          names,
          scene[0],
          () =>
            // A row that tracks its partner plans from where the partner's
            // placed actions take them, so the partner is composed first.
            tracking.includes(law.name)
              ? starting("b").with(
                  starting("a").registered(law.name, scene[1]),
                )
              : starting("a").registered(law.name, scene[1]).with(starting("b")),
          law.name,
        );
    });

    // 4. Carried by a walker, and a row over a walk.
    check("carried", names, 0.3, () =>
      starting("a")
        .walk({ to: { x: 0, y: 0, z: -2 } })
        .with(starting("b").registered("carried", { by: "a", seconds: 2 })),
    );
    check("a salute over a walk", names, null, () =>
      starting("a")
        .walk({ to: { x: 0, y: 0, z: 3 } })
        .over((o) => o.registered("salute")),
    );

    // 3. The mutual records.
    for (const mutual of [HumanSocial.bump, HumanSocial.toast])
      check(`the mutual ${mutual.name}`, names, 0.7, () =>
        HumanChain.mutual(mutual, {
          [mutual.roles[0]!]: starting("a"),
          [mutual.roles[1]!]: starting("b"),
        } as Record<(typeof mutual.roles)[number], HumanChain>),
      );
  });
  TestValidator.equals("every row is performable", complaints, []);
}
