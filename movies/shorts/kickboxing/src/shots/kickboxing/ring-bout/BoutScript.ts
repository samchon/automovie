/**
 * The screenplay's exchanges as executable data: who attacks with what, when it
 * lands or misses, and how the opponent answers.
 *
 * Every row transcribes one sentence group of
 * `docs/body/screenplay/kickboxing.md`, in the same order and fifteen-second
 * group. `at` is the film second of contact (or of the closest pass for an
 * evasion); motion modules derive their own wind-up and recovery around it.
 *
 * @evidence contracts/common.md#implementation-and-ownership Pure authored data, frozen at load. The performer, contact measurement and soundtrack all read this one table, so changing a row changes picture and sound together.
 * @evidence contracts/common.md#authoring-interface Times are film seconds. Sides follow from the technique for orthodox fighters (jab, hook, uppercut and body hook are left; cross, body cross, low and body kicks are right; the finishing high kick is left). The defence names the receiver's answer; "hit" means a clean landing.
 */
export namespace BoutScript {
  /**
   * Striking techniques the performer can realize.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed set realized by Fighter (punches) and Strike (kicks); adding one requires both a spec and a motion.
   * @evidence contracts/common.md#authoring-interface Names, not anatomy: the side comes from `specs`.
   */
  export type Technique =
    | "jab"
    | "cross"
    | "hook"
    | "uppercut"
    | "body-cross"
    | "body-hook"
    | "low-kick"
    | "body-kick"
    | "high-kick";

  /**
   * The receiver's answer to one attack.
   *
   * @evidence contracts/common.md#implementation-and-ownership Closed set realized by Reaction and resolved against geometry in Resolve; it also selects the contact relation for sound.
   * @evidence contracts/common.md#authoring-interface `hit` is a clean landing; `slip` and `weave` are misses with no contact receipt.
   */
  export type Defense =
    | "parry"
    | "cover"
    | "catch"
    | "block"
    | "check"
    | "slip"
    | "weave"
    | "hit";

  /**
   * One fighter.
   *
   * @evidence contracts/common.md#implementation-and-ownership Identity of the two performers in the exchange table.
   * @evidence contracts/common.md#authoring-interface `a` wears red, `b` cyan; the referee is not a fighter.
   */
  export type Fighter = "a" | "b";

  /**
   * One attack and its answer.
   *
   * @evidence contracts/common.md#implementation-and-ownership One frozen row of the screenplay table; ids are stable so receipts and cues match across runs.
   * @evidence contracts/common.md#authoring-interface `at` is the film second of contact or closest pass; wind-up and recovery come from `specs`.
   */
  export interface Action {
    /** Stable identity shared with sound cues and contact receipts. */ id: string;
    /** Film second of contact or closest pass. */ at: number;
    /** Attacker. */ actor: Fighter;
    /** Technique. */ technique: Technique;
    /** Receiver's answer. */ defense: Defense;
  }

  /** Raw rows: [at, attacker, technique, defense]. */
  const rows: readonly (readonly [number, Fighter, Technique, Defense])[] = [
    // 0–15 Touch into the first counter.
    [2.5, "a", "jab", "parry"],
    [2.85, "a", "cross", "cover"],
    [3.3, "b", "jab", "slip"],
    [4.35, "a", "hook", "weave"],
    [4.95, "b", "cross", "slip"],
    [6.5, "a", "low-kick", "check"],
    [8.0, "b", "jab", "cover"],
    [8.35, "b", "cross", "cover"],
    [8.9, "a", "jab", "slip"],
    [9.6, "b", "hook", "weave"],
    [10.2, "a", "cross", "slip"],
    [11.5, "a", "body-cross", "hit"],
    // 15–30 A finds the body.
    [16.2, "b", "jab", "parry"],
    [16.55, "b", "cross", "cover"],
    [17.05, "a", "jab", "slip"],
    [17.45, "a", "cross", "slip"],
    [18.0, "b", "jab", "slip"],
    [19.3, "a", "body-hook", "hit"],
    [20.4, "b", "jab", "cover"],
    [20.95, "a", "cross", "slip"],
    [22.2, "b", "jab", "cover"],
    [22.55, "b", "cross", "cover"],
    [23.1, "a", "jab", "hit"],
    [25.0, "a", "body-kick", "hit"],
    [27.6, "b", "jab", "parry"],
    // 30–45 B answers below the guard.
    [31.0, "b", "jab", "parry"],
    [31.45, "a", "cross", "slip"],
    [32.1, "b", "body-cross", "hit"],
    [32.75, "a", "jab", "slip"],
    [33.8, "b", "hook", "weave"],
    [35.2, "b", "low-kick", "check"],
    [36.3, "a", "cross", "slip"],
    [37.4, "a", "uppercut", "cover"],
    [37.95, "b", "cross", "hit"],
    [38.6, "a", "body-hook", "catch"],
    [41.6, "a", "jab", "parry"],
    // 45–60 Pressure changes hands.
    [46.0, "b", "jab", "cover"],
    [46.35, "b", "cross", "cover"],
    [46.9, "a", "jab", "slip"],
    [47.6, "b", "uppercut", "cover"],
    [48.15, "a", "cross", "slip"],
    [49.6, "b", "low-kick", "check"],
    [50.6, "a", "body-cross", "hit"],
    [51.15, "b", "jab", "slip"],
    [52.4, "a", "jab", "parry"],
    [52.75, "a", "cross", "cover"],
    [53.25, "b", "jab", "slip"],
    [53.85, "b", "hook", "hit"],
    // 60–75 The body kick returns.
    [61.3, "a", "jab", "cover"],
    [61.65, "a", "cross", "cover"],
    [62.15, "b", "jab", "slip"],
    [62.9, "a", "body-hook", "catch"],
    [63.5, "b", "cross", "slip"],
    [65.2, "a", "body-kick", "hit"],
    [66.4, "b", "cross", "slip"],
    [66.95, "a", "jab", "slip"],
    [68.0, "b", "hook", "cover"],
    [68.55, "a", "cross", "slip"],
    [69.5, "a", "jab", "parry"],
    // 75–90 Counters between the hands.
    [76.3, "b", "jab", "parry"],
    [76.65, "b", "cross", "cover"],
    [77.15, "a", "jab", "slip"],
    [77.9, "b", "body-cross", "hit"],
    [78.5, "a", "jab", "slip"],
    [79.9, "b", "low-kick", "check"],
    [80.8, "a", "cross", "cover"],
    [81.25, "b", "jab", "slip"],
    [82.4, "a", "body-hook", "hit"],
    [82.95, "b", "cross", "slip"],
    [83.7, "b", "jab", "slip"],
    // 90–105 Fighting for the center.
    [91.2, "a", "jab", "parry"],
    [91.6, "b", "cross", "slip"],
    [92.45, "a", "body-cross", "catch"],
    [93.0, "b", "jab", "slip"],
    [94.0, "a", "hook", "cover"],
    [95.2, "a", "low-kick", "check"],
    [96.3, "b", "cross", "slip"],
    [96.85, "a", "jab", "hit"],
    [98.1, "b", "body-hook", "catch"],
    // 105–120 B drives A back.
    [106.2, "b", "jab", "cover"],
    [106.55, "b", "cross", "cover"],
    [107.05, "a", "jab", "slip"],
    [107.7, "b", "body-hook", "catch"],
    [108.2, "a", "cross", "slip"],
    [109.7, "b", "body-kick", "hit"],
    [110.8, "a", "jab", "parry"],
    [111.25, "b", "cross", "slip"],
    [112.4, "a", "jab", "slip"],
    [112.75, "a", "cross", "slip"],
    [113.3, "b", "jab", "hit"],
    [113.75, "b", "body-cross", "hit"],
    // 120–135 A turns back into range.
    [121.4, "a", "body-cross", "catch"],
    [121.95, "b", "jab", "slip"],
    [122.7, "a", "body-hook", "hit"],
    [123.25, "b", "cross", "slip"],
    [124.9, "a", "body-kick", "block"],
    [126.2, "b", "jab", "parry"],
    [126.55, "b", "cross", "cover"],
    [127.05, "a", "jab", "slip"],
    [128.3, "b", "cross", "slip"],
    [128.85, "a", "jab", "hit"],
    [129.25, "a", "cross", "cover"],
    // 135–150 The kick climbs.
    [137.0, "b", "jab", "cover"],
    [137.35, "b", "cross", "cover"],
    [137.85, "a", "jab", "slip"],
    [138.7, "b", "hook", "weave"],
    [139.3, "a", "cross", "hit"],
    [141.0, "b", "low-kick", "check"],
    [142.3, "a", "body-cross", "hit"],
    [142.9, "b", "jab", "slip"],
    [148.9, "a", "body-hook", "catch"],
    [150.0, "a", "high-kick", "hit"],
  ];

  /** All attacks in film order. */
  export const actions: readonly Action[] = Object.freeze(
    rows.map(
      (
        [at, actor, technique, defense]: readonly [
          number,
          Fighter,
          Technique,
          Defense,
        ],
        index: number,
      ): Action =>
        Object.freeze({
          id: `x${String(index + 1).padStart(3, "0")}-${actor}-${technique}`,
          at,
          actor,
          technique,
          defense,
        }),
    ),
  );

  /** The knockout kick. */
  export const finish: Action = actions[actions.length - 1]!;

  /**
   * Ring geography: [film second, centre X, centre Z, axis angle].
   *
   * The axis angle is the world heading from A toward B (0 = +X). The pair
   * drifts and turns slowly; camera framing follows these keys.
   */
  export const geography: readonly (readonly [
    number,
    number,
    number,
    number,
  ])[] = [
    [0, 0, 0, 0],
    [15, 0.35, 0.25, 0.25],
    [30, 0.1, -0.35, -0.2],
    [45, -0.4, -0.1, 0.15],
    [60, -0.2, 0.3, 0.35],
    [75, 0.3, 0.1, -0.1],
    [90, 0.2, -0.4, -0.35],
    [105, -0.1, 0.0, 0.0],
    [120, -0.6, 0.15, 0.3],
    [135, -0.1, 0.2, 0.05],
    [150, 0.05, -0.1, -0.15],
  ];

  /**
   * Attack and recovery timing and the root distance each technique needs.
   *
   * Durations are seconds; `range` is the A–B stance-origin distance at contact, metres.
   */
  export const specs: Readonly<
    Record<
      Technique,
      {
        side: "left" | "right";
        windup: number;
        recovery: number;
        range: number;
        target: "head" | "body" | "leg";
      }
    >
  > = Object.freeze({
    jab: {
      side: "left",
      windup: 0.14,
      recovery: 0.18,
      range: 1.08,
      target: "head",
    },
    cross: {
      side: "right",
      windup: 0.18,
      recovery: 0.22,
      range: 1.04,
      target: "head",
    },
    hook: {
      side: "left",
      windup: 0.21,
      recovery: 0.25,
      range: 0.9,
      target: "head",
    },
    uppercut: {
      side: "left",
      windup: 0.2,
      recovery: 0.24,
      range: 0.88,
      target: "head",
    },
    "body-cross": {
      side: "right",
      windup: 0.23,
      recovery: 0.27,
      range: 0.92,
      target: "body",
    },
    "body-hook": {
      side: "left",
      windup: 0.23,
      recovery: 0.27,
      range: 0.88,
      target: "body",
    },
    "low-kick": {
      side: "right",
      windup: 0.3,
      recovery: 0.4,
      range: 0.95,
      target: "leg",
    },
    "body-kick": {
      side: "right",
      windup: 0.34,
      recovery: 0.45,
      range: 0.9,
      target: "body",
    },
    "high-kick": {
      side: "left",
      windup: 0.44,
      recovery: 0.5,
      range: 0.78,
      target: "head",
    },
  });

  /**
   * Stance-origin distance when neither fighter is attacking, metres: outside
   * kicking range, so every exchange needs a step in and the heads stay about
   * 1.6 m apart between exchanges.
   */
  export const neutralRange: number = 1.82;
}
