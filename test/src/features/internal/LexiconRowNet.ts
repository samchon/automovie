import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanSocial,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The net every lexicon family's test casts over its rows: each row is
 * registered through the public input and a performance of it is built on
 * the average man and on the small woman, alone or on a partner of the
 * other build at the row's own distance, and a row that is refused, or
 * placed under another name, is returned as a complaint with the row, the
 * body and the refusal's message.
 *
 * The tables say what a row leaves open: what a row done alone needs (a
 * place to go, a bench, a ball), the partner's distance and the target a
 * row done on a partner needs, which rows are costly strikes planned by one
 * of the two performers only, which follow a partner's placed path, and
 * which need a prop or a thrower their own tests stage.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the net does, what a complaint carries and what each table says.
 * @evidence contracts/development/design.md#principled-representation One table-walking function and the tables it walks, so every family's test is the same net over its own rows and no scene is restated per family.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four casts the family tests call: a family's rows, the carried scene, a row over a walk, and the mutual records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A family or part with no row is a complaint, so a renamed family cannot pass by walking nothing.
 */
export namespace LexiconRowNet {
  /** A row's target on the partner. */
  const on = (region: string): object => ({
    target: { kind: "person", subject: "b", region },
  });

  /** A throw's or a strike's aim on the partner. */
  const at = (region: string): object => ({
    at: { kind: "person", subject: "b", region },
  });

  /** A place to go, 3 m away. */
  const ahead: object = { to: { x: 0.6, y: 0, z: -3 } };

  /** A point at bench height before the performer. */
  const bench: object = {
    on: {
      kind: "point",
      at: { x: 0, y: 0.9, z: 0.4 },
      frame: "world",
      normal: { x: 0, y: 1, z: 0 },
    },
  };

  /** A ball on the floor ahead and where it is kicked. */
  const ball: object = {
    ball: { kind: "point", at: { x: 0, y: 0.11, z: 0.45 }, frame: "world" },
    toward: { kind: "point", at: { x: 0, y: 0, z: 5 }, frame: "world" },
  };

  /** What a row done alone leaves open. */
  const ALONE: Readonly<Record<string, object>> = {
    // Mimed without a cigarette: the hand itself on the performer's belly.
    ashTap: { target: { kind: "self", region: "abdomen" } },
    stubOut: { target: { kind: "self", region: "abdomen" } },
    danceLead: ahead,
    farmersWalk: ahead,
    readingWalk: ahead,
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
    // Onto an imagined box 0.4 m high, with an apex above the climb.
    boxJump: { to: { x: 0, y: 0.4, z: 0.6 }, apex: 0.55 },
    dash: { to: { x: 0, y: 0, z: 4 } },
    strides: ahead,
    frontSalto: { to: { x: 0, y: 0, z: 0.8 } },
    backSalto: { to: { x: 0, y: 0, z: 0.2 } },
    // A flop over a 1.4 m bar onto the floor 2.5 m ahead: a bar above
    // either build's take-off centre of mass.
    fosburyFlop: { to: { x: 0, y: 0, z: 2.5 }, bar: 1.4 },
  };

  /** The partner's distance and what a row done on a partner leaves open. */
  const PAIRED: Readonly<Record<string, readonly [number, object]>> = {
    slap: [0.35, on("jawLeft")],
    backhand: [0.35, on("jawRight")],
    stageSlap: [0.35, on("jawLeft")],
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
    // A relay pass performed standing, mimed with no baton: the instant is
    // stated after the net's 0.3 s stand and the pass's reach.
    relayIncoming: [0.6, { partner: "b", at: 1 }],
    relayOutgoing: [0.6, { partner: "b", at: 1 }],
    danceFollow: [3, on("sternum")],
    danceHold: [0.6, on("shoulderRight")],
    judoGrip: [0.6, { partner: "b" }],
    judoBroken: [0.6, { partner: "b" }],
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

  /** Rows whose planning is costly, each planned by one of the two performers. */
  const STRIKES: readonly string[] = [
    "jab",
    "cross",
    "hook",
    "uppercut",
    "frontKick",
    "roundKick",
    "thrust",
  ];

  /** Rows that follow a person's placed path, so the partner is composed first. */
  const TRACKING: readonly string[] = [
    "follow",
    "escort",
    "chase",
    "intercept",
    "danceFollow",
  ];

  /** Rows that need a support, a prop or a thrower, which their own tests stage. */
  export const STAGED: readonly string[] = [
    // Loads held at the sides need the props in the hands, which `test_human_motion_sport_carry` stages; a sled push needs the sled, which `test_human_motion_sport_sled` stages.
    "farmersHold",
    "sledPush",
    // A photograph needs the camera in hand, which `test_human_motion_hand_verdicts_photograph` stages.
    "photograph",
    // A doorway, a car and a door's leaf need an obstacle, an opening or a door, which `test_human_motion_travel_obstacles`, `test_human_motion_travel_car` and `test_human_motion_travel_door_leaf` stage.
    "passThrough",
    "getIn",
    "openDoor",
    "ride",
    "carried",
    "drawFirearm",
    "holsterFirearm",
    "gloveCatch",
    "twoHandCatch",
    // A vault needs its prop and a pole vault a held pole and a run-up,
    // which `test_human_motion_gymnastics_airborne` and
    // `test_human_motion_gymnastics_jumps` stage.
    "handspringVault",
    "vaultOnPole",
  ];

  /** The two builds, each performing with the other as its partner. */
  const PAIRINGS: readonly (readonly [string, string])[] = [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ];

  /** The two polygon men, prepared at the first cast and kept for the test process. */
  let prepared: Record<string, IHumanBody> | undefined;

  /** Every row of the lexicon, registered for each performance. */
  const laws = (): IHumanActionLaw<never>[] =>
    Object.values(HUMAN_LEXICON).flat();

  /** A performer's chain out of a short stand. */
  const starting = (subject: string): HumanChain =>
    HumanChain.subject(subject).stand({ seconds: 0.3 });

  /** Build one performance and note its refusal or its misplaced name. */
  const check = (
    complaints: string[],
    label: string,
    names: readonly [string, string],
    gap: number | null,
    build: () => { node: HumanPerformance.IInput["composition"] },
    placed?: string,
  ): void => {
    prepared ??= {
      "m-average": motionHumanBody("m-average"),
      "f-small": motionHumanBody("f-small"),
    };
    const body = (name: string): IHumanBody => prepared![name]!;
    try {
      const performance: HumanPerformance = new HumanPerformance({
        seed: "lexicon",
        laws: laws(),
        performers: [
          {
            subject: "a",
            body: body(names[0]),
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          ...(gap === null
            ? []
            : [
                {
                  subject: "b",
                  body: body(names[1]),
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

  /**
   * Cast the net over a family's rows, or over one part of them.
   *
   * @param family The family's key in `HUMAN_LEXICON`.
   * @param part Which rows of the family, as `[index, parts]`: those whose position leaves `index` when divided by `parts`; all of them when absent.
   * @returns The complaints; none when every row is performable.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, how a part is chosen and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each row is built alone, or on its partner at its own distance, for both pairings of the two builds; a strike is planned by one performer, chosen by its position.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two pairings, one pass over the rows, one build each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A family or a part that holds no row is itself a complaint, so nothing passes by walking nothing.
   * @evidence contracts/development/implementation.md#efficient-algorithms One performance per row and pairing.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The two polygon men are prepared once per process and shared by every cast.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each performance is dropped after its name is read.
   */
  export function rows(
    family: string,
    part?: readonly [number, number],
  ): string[] {
    const complaints: string[] = [];
    const chosen: IHumanActionLaw<never>[] = (
      HUMAN_LEXICON[family] ?? []
    ).filter(
      (_: IHumanActionLaw<never>, index: number): boolean =>
        part === undefined || index % part[1] === part[0],
    );
    if (chosen.length === 0)
      complaints.push(`the family ${family} holds no row to perform`);
    PAIRINGS.forEach((names: readonly [string, string], turn: number): void => {
      chosen.forEach((law: IHumanActionLaw<never>, index: number): void => {
        if (STAGED.includes(law.name)) return;
        const scene: readonly [number, object] | undefined = PAIRED[law.name];
        if (scene === undefined)
          check(
            complaints,
            law.name,
            names,
            null,
            () => starting("a").registered(law.name, ALONE[law.name] ?? {}),
            law.name,
          );
        else if (!STRIKES.includes(law.name) || index % 2 === turn)
          check(
            complaints,
            law.name,
            names,
            scene[0],
            () =>
              TRACKING.includes(law.name)
                ? starting("b").with(
                    starting("a").registered(law.name, scene[1]),
                  )
                : starting("a")
                    .registered(law.name, scene[1])
                    .with(starting("b")),
            law.name,
          );
      });
    });
    return complaints;
  }

  /**
   * Build one row in the scene the net stages it in, on the average man
   * with the small woman as the partner, with some of its parameters
   * replaced, and return what the build threw.
   *
   * @param row The row's name.
   * @param replaced Parameters laid over what the net's tables give the row.
   * @returns The error the build threw; null when it planned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the scene, the replacement and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The same tables and the same partner placement as `rows`, so a refusal read here is the row's own and not the staging's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup of the scene, one build.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A row the net stages elsewhere is built alone, as the caller asked.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One performance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the polygon men prepared for `rows`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The performance is dropped.
   */
  export function attempt(row: string, replaced: object): unknown {
    const scene: readonly [number, object] | undefined = PAIRED[row];
    const params: object = { ...(scene?.[1] ?? ALONE[row] ?? {}), ...replaced };
    let caught: unknown = null;
    prepared ??= {
      "m-average": motionHumanBody("m-average"),
      "f-small": motionHumanBody("f-small"),
    };
    try {
      new HumanPerformance({
        seed: "lexicon",
        laws: laws(),
        performers: [
          {
            subject: "a",
            body: prepared["m-average"]!,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          ...(scene === undefined
            ? []
            : [
                {
                  subject: "b",
                  body: prepared["f-small"]!,
                  at: { x: 0, y: 0, z: scene[0] },
                  yaw: 180,
                  proficiency: { level: "trained" as const },
                },
              ]),
        ],
        composition: (scene === undefined
          ? starting("a").registered(row, params)
          : TRACKING.includes(row)
            ? starting("b").with(starting("a").registered(row, params))
            : starting("a").registered(row, params).with(starting("b"))
        ).node,
      });
    } catch (error) {
      caught = error;
    }
    return caught;
  }

  /**
   * Cast the net over the scenes a row alone cannot show: a person carried
   * by another who walks 2 m, a salute performed over a walk, and each
   * mutual record joining the two.
   *
   * @returns The complaints; none when every scene plans.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three scenes and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Rows of an action that rides a carrier ride one here, and a mutual record is joined through `HumanChain.mutual`, for both pairings of the two builds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two pairings, three scenes each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; a refusal is returned with its message.
   * @evidence contracts/development/implementation.md#efficient-algorithms One performance per scene and pairing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing repeats.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each performance is dropped after it is built.
   */
  export function scenes(): string[] {
    const complaints: string[] = [];
    for (const names of PAIRINGS) {
      check(complaints, "carried", names, 0.3, () =>
        starting("a")
          .walk({ to: { x: 0, y: 0, z: -2 } })
          .with(starting("b").registered("carried", { by: "a", seconds: 2 })),
      );
      check(complaints, "a salute over a walk", names, null, () =>
        starting("a")
          .walk({ to: { x: 0, y: 0, z: 3 } })
          .over((o) => o.registered("salute")),
      );
      // Each record is joined on its own: their roles and parameters
      // differ, so one loop over both does not type.
      check(complaints, `the mutual ${HumanSocial.bump.name}`, names, 0.7, () =>
        HumanChain.mutual(HumanSocial.bump, {
          one: starting("a"),
          other: starting("b"),
        }),
      );
      check(
        complaints,
        `the mutual ${HumanSocial.toast.name}`,
        names,
        0.7,
        () =>
          HumanChain.mutual(HumanSocial.toast, {
            guest: starting("a"),
            host: starting("b"),
          }),
      );
    }
    return complaints;
  }
}
