import type { MotionAction } from "../motion/core/MotionAction";
import { FilmEvents } from "./FilmEvents";
import { FilmSteps } from "./FilmSteps";

/**
 * The consumed three-minute bout, including its actual edit and event intentions.
 *
 * @evidence contracts/common.md#implementation-and-ownership One immutable sequence supplies the runtime, camera, audio dependency manifest and export schedule. Technique names select reusable modules; nominal contact intentions remain requests until an actual geometry receipt exists. The final kick is scheduled by its observed local interception so that its witnessed impact occupies film second 150.
 * @evidence contracts/common.md#authoring-interface World metres, film seconds and 30 output frames per second are explicit. Fighters remain independent actors. Action windows include recovery; no fifteen-second boundary resets pose or position. This plan is staging, not physical or visual acceptance.
 */
export namespace FilmPlan {
  /** Exactly three minutes of delivered media. */
  export const duration: number = 180;
  /** Fixed output raster cadence; browser review may draw at another cadence. */
  export const fps: number = 30;
  /** Half-open output schedule includes frames zero through 5399. */
  export const frames: number = 5400;
  /** Actual witnessed finishing kick, independent of its module-local clock. */
  export const koSeconds: number = 150;
  /** Referee opens the count after the winner reaches the neutral corner. */
  export const countStart: number = 157;
  /** Ten full seconds expire before the knockout decision. */
  export const countEnd: number = 167;
  /** Separate visible signal follows the tenth count. */
  export const decisionSeconds: number = 167.6;
  /** Actual finishing setup and finite handoff inspection; technique modules own their motion. */
  export const finishing: Readonly<{
    setupDisplacement: Point;
    handoffStepSeconds: number;
    lowCover: Readonly<MotionAction.Timing>;
  }> = Object.freeze({
    setupDisplacement: Object.freeze([-0.015, 0, 0.04]) as unknown as Point,
    handoffStepSeconds: 1 / 240,
    lowCover: Object.freeze({
      preparation: 0,
      delivery: 0.12,
      contact: 0.45,
      retraction: 0.18,
      recovery: 0.1,
    }),
  });
  /** Supported celebration begins after the complete count and visible decision. */
  export const victory: Readonly<{
    start: number;
    turnEnd: number;
    secondEnd: number;
    end: number;
    turnRadians: number;
    inwardMetres: number;
    forwardMetres: number;
    returnMetres: number;
  }> = Object.freeze({
    start: 168.1,
    turnEnd: 172.9,
    secondEnd: 176.5,
    end: 180,
    turnRadians: -Math.PI / 2,
    inwardMetres: 0.65,
    forwardMetres: 0.28,
    returnMetres: 0.16,
  });

  /** Stable performer identities, separate from anatomical left and right.
   * @evidence contracts/common.md#implementation-and-ownership A closed production-owned set connects actual actors, plans and audio without putting bout policy in Human.
   * @evidence contracts/common.md#authoring-interface IDs name the red fighter, cyan fighter and independently supported male official; they never name an anatomical side.
   */
  export type ActorId = "a" | "b" | "referee";
  /** Original module families admitted by the actual shared consumer.
   * @evidence contracts/common.md#implementation-and-ownership The finite union selects existing reusable punch, combination and roundhouse producers rather than embedding motion in the film plan.
   * @evidence contracts/common.md#authoring-interface A selected name requests that module; actual support, shape and contact admission remain separate and may refuse.
   */
  export type Technique =
    | "jab"
    | "cross"
    | "hook"
    | "uppercut"
    | "one-two"
    | "low-kick"
    | "body-kick"
    | "high-kick";
  /** Fixed triplet in the containing member's stated metre frame.
   * @evidence contracts/common.md#implementation-and-ownership An ordinary three-number tuple keeps coordinate conversion with the owning camera or route instead of introducing a runtime vector wrapper.
   * @evidence contracts/common.md#authoring-interface Camera fields are world metres; route displacement is actor-local metres. The field's frame governs interpretation.
   */
  export type Point = [number, number, number];

  /**
   * One independent attack and its receiving performance on a common clock.
   *
   * @evidence contracts/common.md#implementation-and-ownership The film selects module families, participants and original targets while the shared consumer owns their actual continuation, contact and recovery. Approach is separately visible through an independent supported route. A slot cannot shorten a module to make it fit.
   * @evidence contracts/common.md#authoring-interface start/end are film seconds. impactSeconds optionally aligns a real locally measured impact, never inventing one. A required finish must be an actual head interception. Original full-surface queries and support admission remain mandatory.
   */
  export interface Exchange {
    /** Unique action placement; its jab and cross keep distinct suffixes. */
    id: string;
    /** Meaningful fifteen-second screenplay group; it does not reset time. */
    beat: number;
    /** Closed local review window inside the shared film clock. */
    start: number;
    /** Next exchange begins only after this window's continuous ending. */
    end: number;
    /** Independent attacker; the other fighter reacts. */
    actorId: "a" | "b";
    /** Consumed reusable technique. */
    technique: Technique;
    /** Actual selected attacking limb or first hand of an overlapping pair. */
    side: "left" | "right";
    /** Original intended receiving surface or deliberate evasion. */
    target: "guard" | "body" | "head" | "leg" | "miss";
    /** Actual independent receiving module. */
    defense: "cover" | "catch" | "parry" | "slip" | "weave" | "check" | "none";
    /** Fixed bounded variation seed, independent of seek history. */
    seed: number;
    /** Named exact finishing impact; normal strikes retain their measured times. */
    impactSeconds?: number;
    /** The immediately preceding attack whose real recovery this counter overlaps. */
    counterOf?: string;
  }

  /**
   * An independently supported step between exchanges.
   *
   * @evidence contracts/common.md#implementation-and-ownership Each actor owns a different displacement and clock. The runtime clips neither a planted foot nor the body to its opponent; actual sole routes and public support fitting realize these requests.
   * @evidence contracts/common.md#authoring-interface Displacement is actor-local horizontal metres. No interpolation of paired roots or teleportation supplies this route. Duration includes unload, swing, load, follow and settle.
   */
  export interface Step {
    /** Unique reusable route placement. */ id: string;
    /** Independent performer. */ actorId: ActorId;
    /** Absolute film onset. */ start: number;
    /** Absolute complete supported ending. */ end: number;
    /** Actor-local movement, with Y exactly zero. */ displacement: Point;
    /** Geometry-dependent destination, replacing displacement only after actual KO. */ destination?:
      | "farthest-neutral-corner"
      | "fallen-fighter";
  }

  /**
   * One intended audible or visible consequence, with explicit contact dependency.
   *
   * @evidence contracts/common.md#implementation-and-ownership Events retain stable action and participant relationships. Hit audio and impact-triggered performance require an independent matching contact receipt; an attempt or nominal target alone cannot authorize them. Count events have ten ordered absolute timestamps.
   * @evidence contracts/common.md#authoring-interface seconds uses the film clock. requiresContact names a real action placement. Actual receipt time supersedes a normal strike's nominal time; the finishing receipt must be aligned to second 150 by the runtime.
   */
  export interface Event {
    /** Stable cue identity shared by Viewer and export. */ id: string;
    /** Absolute intended film second. */ seconds: number;
    /** Narrative or audible consequence. */ kind:
      | "bell"
      | "touch"
      | "attempt"
      | "contact"
      | "miss"
      | "step"
      | "count"
      | "decision"
      | "celebration"
      | "speech"
      | "fall"
      | "ambience"
      | "breath";
    /** Acting performer. */ actorId: ActorId;
    /** Receiving performer, when relevant. */ targetId?: ActorId;
    /** Exact reusable action placement. */ actionId?: string;
    /** Requested contact classification; actual observation has final authority. */ relation?:
      | "guard"
      | "body"
      | "head"
      | "shin-check";
    /** Spoken integer in [1,10]. */ count?: number;
    /** Short official speech, separate from nonverbal impact recordings. */ speech?:
      | "fight"
      | "down"
      | "neutral"
      | "decision";
    /** Optional audible window; the mixer clips retained source material to this duration. */ durationSeconds?: number;
    /** Required actual action receipt; absence suppresses dependent audio. */ requiresContact?: string;
  }

  /**
   * The adopted shot's physical camera, shared by live display and export.
   *
   * @evidence contracts/common.md#implementation-and-ownership Camera position and aim remain explicit world coordinates with a continuous slow ringside drift. The KO stays in an uninterrupted wider shot that includes both feet, the fallen man and referee; inspection controls do not alter this delivered view.
   * @evidence contracts/common.md#authoring-interface FOV is vertical degrees. position and target are owned tuples. A camera request does not prove pixel visibility or occlusion; the actual Viewer review must establish those properties.
   */
  export interface Camera {
    /** Stable edit identity for inspection. */ shotId: string;
    /** World camera centre, metres. */ position: Point;
    /** World look-at point, metres. */ target: Point;
    /** Vertical perspective field, degrees. */ fovDegrees: number;
  }

  /** Fixed technique rows in each screenplay group, preserving different pressure/counter roles. */
  const rows: readonly (readonly [
    "a" | "b",
    Technique,
    Exchange["target"],
    Exchange["defense"],
  ])[][] = [
    [
      ["a", "one-two", "guard", "parry"],
      ["a", "hook", "head", "weave"],
      ["a", "low-kick", "leg", "check"],
      ["b", "one-two", "guard", "cover"],
      ["b", "hook", "head", "weave"],
      ["a", "cross", "body", "none"],
    ],
    [
      ["b", "one-two", "head", "parry"],
      ["a", "cross", "head", "slip"],
      ["a", "hook", "body", "catch"],
      ["b", "jab", "head", "cover"],
      ["b", "one-two", "head", "cover"],
      ["a", "body-kick", "body", "catch"],
    ],
    [
      ["b", "jab", "guard", "parry"],
      ["b", "cross", "body", "catch"],
      ["b", "hook", "head", "weave"],
      ["b", "low-kick", "leg", "check"],
      ["a", "uppercut", "head", "cover"],
      ["a", "hook", "body", "catch"],
    ],
    [
      ["b", "one-two", "head", "cover"],
      ["b", "uppercut", "head", "catch"],
      ["b", "low-kick", "leg", "check"],
      ["a", "cross", "body", "catch"],
      ["a", "one-two", "guard", "parry"],
      ["b", "hook", "head", "slip"],
    ],
    [
      ["a", "one-two", "head", "cover"],
      ["a", "hook", "body", "catch"],
      ["a", "body-kick", "body", "catch"],
      ["b", "cross", "head", "slip"],
      ["b", "hook", "head", "cover"],
      ["a", "jab", "guard", "parry"],
    ],
    [
      ["b", "one-two", "guard", "parry"],
      ["b", "cross", "body", "catch"],
      ["b", "low-kick", "leg", "check"],
      ["a", "cross", "head", "cover"],
      ["a", "hook", "body", "catch"],
      ["b", "jab", "head", "slip"],
    ],
    [
      ["a", "jab", "guard", "parry"],
      ["a", "cross", "body", "catch"],
      ["a", "hook", "head", "cover"],
      ["a", "low-kick", "leg", "check"],
      ["b", "cross", "head", "slip"],
      ["b", "hook", "body", "catch"],
    ],
    [
      ["b", "one-two", "head", "cover"],
      ["b", "hook", "body", "catch"],
      ["b", "body-kick", "body", "catch"],
      ["a", "jab", "guard", "parry"],
      ["a", "one-two", "head", "slip"],
      ["b", "cross", "body", "catch"],
    ],
    [
      ["a", "cross", "body", "catch"],
      ["a", "hook", "body", "catch"],
      ["a", "body-kick", "body", "catch"],
      ["b", "one-two", "guard", "parry"],
      ["b", "cross", "head", "slip"],
      ["a", "cross", "head", "cover"],
    ],
    [
      ["b", "one-two", "head", "cover"],
      ["b", "hook", "head", "weave"],
      ["b", "low-kick", "leg", "check"],
      ["a", "cross", "body", "catch"],
      ["a", "hook", "body", "catch"],
      ["a", "high-kick", "head", "none"],
    ],
  ];

  /** Build fixed chronological windows without allocating mutable runtime actor state. */
  function makeExchanges(): Exchange[] {
    const result: Exchange[] = [];
    for (let beat: number = 0; beat < rows.length; beat++) {
      const base: number = beat * 15;
      const begin: number = beat === 0 ? 1.55 : base + 0.7;
      const expanded: (readonly [
        "a" | "b",
        Technique,
        Exchange["target"],
        Exchange["defense"],
      ])[] = rows[beat]!.flatMap(
        (
          row: readonly [
            "a" | "b",
            Technique,
            Exchange["target"],
            Exchange["defense"],
          ],
          index: number,
        ): (readonly [
          "a" | "b",
          Technique,
          Exchange["target"],
          Exchange["defense"],
        ])[] => {
          const normalized: readonly [
            "a" | "b",
            Technique,
            Exchange["target"],
            Exchange["defense"],
          ] = [
            row[0],
            row[1],
            row[2],
            row[1] === "hook" && row[3] === "slip"
              ? "weave"
              : row[2] === "body" && (beat + index) % 3 === 0
                ? "none"
                : row[3],
          ];
          return [0, 1, 3, 4].includes(index) && !(beat === 9 && index === 4)
            ? [
                normalized,
                [
                  row[0] === "a" ? "b" : "a",
                  index % 2 === 0 ? "jab" : "cross",
                  "head",
                  "slip",
                ],
              ]
            : [normalized];
        },
      );
      const weights: number[] = expanded.map(
        (
          row: readonly [
            "a" | "b",
            Technique,
            Exchange["target"],
            Exchange["defense"],
          ],
        ): number =>
          row[1] === "one-two" ? 1.35 : row[1].endsWith("kick") ? 1.7 : 1,
      );
      const unit: number =
        (base + 15 - begin) /
        weights.reduce((sum: number, value: number): number => sum + value, 0);
      let cursor: number = begin;
      for (let index: number = 0; index < expanded.length; index++) {
        const row: readonly [
          "a" | "b",
          Technique,
          Exchange["target"],
          Exchange["defense"],
        ] = expanded[index]!;
        const technique: Technique = row[1];
        const end: number =
          index === expanded.length - 1
            ? base + 15
            : cursor + unit * weights[index]!;
        const previous: Exchange | undefined = result.at(-1);
        const counterSide: Exchange["side"] =
          previous?.technique === "one-two"
            ? previous.side
            : previous?.side === "left"
              ? "right"
              : "left";
        result.push({
          id: `beat-${beat + 1}-exchange-${index + 1}`,
          beat: beat + 1,
          start: cursor,
          end,
          actorId: row[0],
          technique,
          side:
            (technique === "cross" || technique.endsWith("kick")) &&
            !(beat === 9 && technique === "high-kick")
              ? "right"
              : "left",
          target: row[2],
          defense: row[3],
          seed: 3040 + beat * 37 + index * 13,
          ...([1, 3, 6, 8].includes(index) &&
          row[0] !== previous?.actorId &&
          previous !== undefined &&
          !previous.technique.endsWith("kick")
            ? {
                counterOf: previous.id,
                side: counterSide,
                technique: (counterSide === "left" ? "jab" : "cross") as
                  | "jab"
                  | "cross",
              }
            : {}),
          ...(beat === 9 && index === expanded.length - 1
            ? { impactSeconds: koSeconds }
            : {}),
        });
        cursor = end;
      }
    }
    return result;
  }
  /** Immutable chronological requests consumed directly by the actual runtime. */
  export const exchanges: readonly Readonly<Exchange>[] = Object.freeze(
    makeExchanges().map(
      (value: Exchange): Readonly<Exchange> => Object.freeze(value),
    ),
  );
  /** Actual independent routes retain their separate typed plan owner. */
  export const steps: readonly Readonly<Step>[] = FilmSteps.build();

  /** Conditional event intentions, resolved with actual receipts by the runtime. */
  export const events: readonly Readonly<Event>[] = FilmEvents.build(
    exchanges,
    { countStart, decisionSeconds },
  );

  /**
   * Map one delivered frame identity to the half-open film schedule.
   * @evidence contracts/common.md#implementation-and-ownership Integer frame identity divided once by the fixed cadence prevents accumulated wall-time drift. The exact duration endpoint is inspectable but is not a 5401st delivered frame.
   * @evidence contracts/common.md#authoring-interface Requires an integer in [0,5399]; invalid or out-of-range input throws. Returns film seconds from zero through 179+29/30.
   */
  export function frameSeconds(index: number): number {
    if (!Number.isInteger(index) || index < 0 || index >= frames)
      throw new Error("Film frame index must be an integer in [0,5399]");
    return index / fps;
  }

  /**
   * Resolve the shared delivered camera independently of play, seek and capture history.
   * @evidence contracts/common.md#implementation-and-ownership One continuous low-amplitude ringside move retains the same side of the action. A wider uninterrupted closing view includes the count and neutral corner; no inspection camera is exported.
   * @evidence contracts/common.md#authoring-interface Finite seconds must be inside [0,180]. The returned camera is a new owned value. Actual visibility and contact readability require the moving Viewer inspection.
   */
  export function camera(seconds: number): Camera {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > duration)
      throw new Error("Camera time is outside the film");
    const close: number = Math.max(0, Math.min(1, (seconds - 143) / 5));
    const smooth: number = close * close * (3 - 2 * close);
    return {
      shotId:
        seconds < 148 ? "ringside-continuous" : "knockout-and-count-unbroken",
      position: [
        1.6 + 0.18 * Math.sin(seconds / 19),
        2.25 + smooth * 0.55,
        5.4 + smooth * 1.4,
      ],
      target: [-smooth * 0.25, 0.88 - smooth * 0.22, -0.1],
      fovDegrees: 43 + smooth * 4,
    };
  }
}
