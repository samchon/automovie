import type { motionHumanLawSolo } from "./motionHumanLawSolo";

const row = (
  law: motionHumanLawSolo.IRow["law"],
  label: string,
  params: object,
  more: Partial<motionHumanLawSolo.IRow> = {},
): motionHumanLawSolo.IRow => ({
  label: `${law} ${label}`,
  law,
  params,
  ...more,
});
const kinds = (
  law: motionHumanLawSolo.IRow["law"],
  names: readonly string[],
  params: object = {},
  more: Partial<motionHumanLawSolo.IRow> = {},
): motionHumanLawSolo.IRow[] =>
  names.map(
    (kind: string): motionHumanLawSolo.IRow =>
      row(law, kind, { kind, ...params }, more),
  );
const ahead = { kind: "point", at: { x: 0.6, y: 1.2, z: 1.5 } };

/**
 * Every action a person performs alone with no prop, as an author writes it,
 * by family: each kind, side and variant the vocabulary offers, with what
 * the generic reading cannot know about it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a row is and how the table is grouped.
 * @evidence contracts/development/design.md#principled-representation Plain rows of the action's own parameters, grouped by the family a test reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the solo law tests only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every kind is written out; none is sampled.
 */
export const MOTION_HUMAN_LAW_SOLO_ROWS: Readonly<
  Record<string, motionHumanLawSolo.IRow[]>
> = {
  stand: [
    row("stand", "2 s", { seconds: 2 }),
    ...kinds(
      "rest",
      [
        "side",
        "pocket",
        "hip",
        "crossed",
        "claspedFront",
        "claspedBehind",
        "behindHead",
        "chinRest",
        "elbowSupport",
      ].map((place: string): string => place),
    ).map(
      (r: motionHumanLawSolo.IRow): motionHumanLawSolo.IRow => ({
        ...r,
        params: {
          left: (r.params as { kind: string }).kind,
          right: (r.params as { kind: string }).kind,
          seconds: 2,
        },
      }),
    ),
    ...["auto", "eyes", "head", "trunk"].map(
      (recruit: string): motionHumanLawSolo.IRow =>
        row("look", recruit, { target: ahead, with: recruit }),
    ),
    ...kinds("brace", ["impact", "push", "catchBody"]),
  ],
  gesture: kinds("gesture", [
    "wave",
    "raiseHand",
    "cheer",
    "stopPalm",
    "point",
    "palmsUp",
    "beckon",
    "clap",
    "rubHands",
    "touchFace",
    "pushGlasses",
    "palmsTogether",
    "thumbsDown",
    "scratchHead",
    "shrug",
    "nod",
  ]),
  locomotion: [
    ...["slow", "normal", "fast"].map(
      (pace: string): motionHumanLawSolo.IRow =>
        row("walk", pace, { to: { x: 0, y: 0, z: 3 }, pace }),
    ),
    row("walk", "turning", { to: { x: 2, y: 0, z: 2 } }),
    ...["jog", "run", "sprint"].map(
      (pace: string): motionHumanLawSolo.IRow =>
        row("run", pace, { to: { x: 0, y: 0, z: 6 }, pace }),
    ),
    row("jump", "ahead", { to: { x: 0, y: 0, z: 1 } }),
    row("jump", "in place", { to: { x: 0, y: 0, z: 0 } }),
    ...["forward", "back", "left", "right"].map(
      (direction: string): motionHumanLawSolo.IRow =>
        row("step", direction, { direction }),
    ),
    row("guard", "orthodox", { seconds: 2 }),
    row("guard", "southpaw", { seconds: 2, stance: "southpaw" }),
  ],
  reaction: [
    row("flinch", "default", {}),
    row("flinch", "strong", { intensity: 1 }),
    row("stagger", "1 m/s", { speed: 1 }),
    row("knockdown", "default", {}),
  ],
  floor: [
    ...kinds("crouch", ["partial", "full"]).map(
      (r: motionHumanLawSolo.IRow): motionHumanLawSolo.IRow => ({
        ...r,
        params: { depth: (r.params as { kind: string }).kind },
      }),
    ),
    ...kinds("kneel", ["one", "both", "sitBack"]),
    ...["supine", "prone", "lateralLeft", "lateralRight"].map(
      (position: string): motionHumanLawSolo.IRow =>
        row("lieDown", position, { position }),
    ),
    row("crawl", "2 cycles", { cycles: 2 }),
  ],
  self: kinds("selfAction", [
    "stretch",
    "victory",
    "fistPump",
    "neckRoll",
    "shoulderRoll",
  ]),
  exercise: [
    ...kinds("exercise", ["squat", "lunge", "highKnees", "jumpingJack"], {
      reps: 3,
    }),
    ...kinds(
      "stretch",
      ["neckSide", "crossBody", "overheadSide", "quadriceps", "tree"],
      { seconds: 4 },
    ),
    ...kinds("dance", ["bounce", "sway", "stepTouch"]),
  ],
  sport: [
    row("athletics", "default", {}),
    row("gymnastics", "default", {}),
    ...kinds("martialArt", ["horseStance", "chokuZuki", "taiChiPush"]),
    ...kinds("ballSport", ["dribble", "dig", "set", "throwIn"]),
    ...kinds("baseball", ["catcherCrouch", "groundBall", "battingStance"]),
    ...kinds("racket", ["readyPosition", "splitStep", "golfAddress"]),
    ...kinds("swim", ["treadWater", "frontCrawl"]),
  ],
};
