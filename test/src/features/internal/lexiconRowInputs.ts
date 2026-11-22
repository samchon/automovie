/**
 * The test fixtures for lexicon rows that need a destination, surface or partner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the values each table supplies and who stages their actors.
 * @evidence contracts/development/design.md#principled-representation The public law receives the same prepared inputs in the positive and invalid-region tests.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the solo and paired inputs shared by LexiconRowNet are exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Supplies the existing fixture parameters and distances directly, with no display or solver overrides.
 */
export namespace lexiconRowInputs {
  /** Partner distance in metres and action parameters for one staged row. */
  export type Pair = readonly [distance: number, params: object];

  /** A row's target on the partner. */
  const on: (region: string) => object = (region: string): object => ({
    target: { kind: "person", subject: "b", region },
  });

  /** A throw's or a strike's aim on the partner. */
  const at: (region: string) => object = (region: string): object => ({
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

  /** What a row done alone leaves open. */
  export const ALONE: Readonly<Record<string, object>> = {
    // Mimed without a cigarette: the hand itself on the performer's belly.
    ashTap: { target: { kind: "self", region: "abdomen" } },
    stubOut: { target: { kind: "self", region: "abdomen" } },
    danceLead: ahead,
    farmersWalk: ahead,
    readingWalk: ahead,
    stroll: ahead,
    // The gun crew's step clear of the wheels: a walk to the place given.
    standClear: ahead,
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
    scrub: bench,
    // The reload's palm goes to the performer's own abdomen, standing in
    // for a magazine well.
    reloadFirearm: { target: { kind: "self", region: "abdomen" } },

    leap: { to: { x: 0, y: 0, z: 0.6 } },
    // Onto an imagined box 0.4 m high, with an apex above the climb.
    boxJump: { to: { x: 0, y: 0.4, z: 0.6 }, apex: 0.55 },
    dash: { to: { x: 0, y: 0, z: 4 } },
    strides: ahead,
    frontSalto: { to: { x: 0, y: 0, z: 0.8 } },
    backSalto: { to: { x: 0, y: 0, z: 0.2 } },
  };

  /** The partner's distance and what a row done on a partner leaves open. */
  export const PAIRED: Readonly<Record<string, Pair>> = {
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
}
