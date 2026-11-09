import type { IAutoMovieIntent } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Gait } from "../everyday/Gait";

/**
 * The production's intent vocabulary: every action a student, prop or the
 * camera can be asked to perform, as one discriminated union carried in an
 * engine intent's `parameters.action`. Actions name relations (a place, a
 * subject, a prop), never coordinates or times, except the optional absolute
 * `start` and `contact` seconds a scene uses to place a screenplay anchor.
 *
 * ```ts
 * StageAction.intent("carina", { kind: "walk", to: { place: "bench.centreFront" }, pace: "hesitant" });
 * StageAction.read(entry.intent); // the action back
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the union carries and which members may hold absolute time.
 * @evidence contracts/development/design.md#principled-representation A closed union keyed by `kind`; targets are a closed union of place, subject and point; seconds are film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The engine owns the intent; this module owns only the production's action records and their encoding.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are union members, not optional fields of one record.
 */
export namespace StageAction {
  /** A person's own hand. */
  export type Hand = "left" | "right";

  /** What an action aims at: a named place of the set, a subject, or a world point. */
  export type Target =
    | { place: string }
    | { subject: string }
    | { point: IAutoMovieVector3 };

  /** Absolute film seconds an action may be pinned to: its start, or its contact instant. */
  export interface ITiming {
    /** Film second the action starts; the performer holds until then. */
    start?: number;

    /** Film second of the action's contact instant; the performer holds before starting so it lands there. */
    contact?: number;
  }

  /** Every action. */
  export type Action = ITiming &
    (
      | { kind: "scene"; id: string }
      | { kind: "enter"; at: Target; facing?: Target; heading?: number; seat?: boolean; holds?: Partial<Record<Hand, string>>; pockets?: boolean; riding?: string }
      | { kind: "hold"; seconds: number }
      | { kind: "until"; seconds: number }
      | { kind: "say"; words: string; seconds: number }
      | { kind: "walk"; to: Target; pace: Gait.Pace; facing?: Target; distance?: number; offset?: { forward: number; left: number }; pockets?: boolean; mood?: "embarrassed"; gesture?: { kind: "touchForehead" | "pushGlasses"; hand: Hand; after: number } }
      | { kind: "turn"; toward: Target }
      | { kind: "step"; direction: "back" | "forward" | "left" | "right"; metres: number; away?: Target; quick?: boolean }
      | { kind: "sit"; seat: string }
      | { kind: "rise" }
      | { kind: "shift"; toward: "left" | "right"; metres: number }
      | { kind: "look"; at: Target | null; waist?: boolean; part?: "head" | "leftHand" | "rightHand" }
      | { kind: "offer"; prop: string; to: Target; hand: Hand; height?: "chest" | "seatedChest" | "waist" }
      | { kind: "withdraw"; hand: Hand }
      | { kind: "receive"; prop: string; from: string; hand: Hand; pull?: boolean }
      | { kind: "release"; prop: string }
      | { kind: "openPalm"; hand: Hand; toward: Target }
      | { kind: "lowerHand"; hand: Hand; to?: "side" | "knee" }
      | { kind: "pocket"; hands: Hand[] }
      | { kind: "hide"; prop: string }
      | { kind: "drop"; prop: string }
      | { kind: "pickUp"; props: string[]; hands: Hand[] }
      | { kind: "putDown"; prop: string; on: string }
      | { kind: "unfold"; prop: string; until: "half" | "open" }
      | { kind: "fold"; prop: string }
      | { kind: "raise"; prop: string }
      | { kind: "drink"; prop: string }
      | { kind: "read"; prop: string }
      | { kind: "launch"; prop: string; toward: Target }
      | { kind: "reachAfter"; prop: string }
      | { kind: "drawBack"; hand: Hand }
      | { kind: "catch"; prop: string; hand: Hand }
      | { kind: "touchForehead"; hand: Hand }
      | { kind: "liftChin"; seconds: number }
      | { kind: "pushGlasses"; hand: Hand }
      | { kind: "giveRoom"; from: Target; metres: number }
      | { kind: "bend"; toward: Target; depth: number; meet?: string }
      | { kind: "straighten" }
      | { kind: "guard"; at: Target }
      | { kind: "footwork"; move: "advance" | "retreat" | "circleLeft" | "circleRight"; steps: number; facing: Target; to?: Target }
      | { kind: "cast"; spell: "jinx" | "disarm" | "levitate"; at: Target; aim?: "wand-hand" | "wand-shoulder" | "body" }
      | { kind: "deflect"; toward: Target | "floor" }
      | { kind: "shield"; seconds: number }
      | { kind: "grip"; of: string; part: "wrist" | "forearm" }
      | { kind: "turnUnder" }
      | { kind: "letGo" }
      | { kind: "run"; to: Target; distance?: number; wand?: "low"; pace?: "run" | "sprint" }
      | { kind: "guide"; partner: string; to: Target; steps: number; quick?: boolean }
      | { kind: "parry"; of: string }
      | { kind: "wand"; to: "hand" | "pocket" | "low" | "up" }
      | { kind: "levitate"; prop: string; to: Target }
      | { kind: "mount"; broom: string }
      | { kind: "fly"; route: Target[]; speed: number; lean?: number }
      | { kind: "reach"; for: Target; hand: Hand; close: boolean }
      | { kind: "slip"; hang: Hand }
      | { kind: "swingArm"; hand: Hand }
      | { kind: "offerRear"; to: string }
      | { kind: "transfer"; onto: string }
      | { kind: "pass"; to: string; ball: string }
      | { kind: "strike"; ball: string; toward: Target; hand?: Hand }
      | { kind: "stopPlay" }
      | { kind: "hover"; facing?: Target }
      | { kind: "escort"; subject: string; distance: number; side: "left" | "right"; seconds: number }
      | { kind: "rest"; at: Target }
      | { kind: "fail"; tipping: number }
      | { kind: "path"; route: Target[]; speed: number }
      | { kind: "shot"; shot: IShot }
    );

  /** A camera setup. */
  export interface IShot {
    /** Size of the frame. */
    size: "wide" | "full" | "medium" | "close";

    /** Subjects framed. */
    subjects: string[];

    /** Who must appear screen left and right, for a two-person setup. */
    screen?: { left: string; right: string };

    /** A named camera station of the set, or a side relative to the subjects. */
    from?: string;

    /** Lens height. */
    height: "standing" | "seated" | "low" | "high";

    /** How the camera moves within the shot. */
    motion: "hold" | "follow" | "push" | "pull" | "arc" | "alongside";

    /** Seconds over which a push, pull or arc completes. */
    seconds?: number;

    /** Whether the shot starts with a cut; otherwise the camera moves from the previous framing. */
    cut: boolean;

    /** For `alongside`: the side of the rider the camera rides and the bearing class. */
    alongside?: { side: "left" | "right"; view: "front" | "rear" | "side" | "behind"; distance: number; above?: number };

    /** Point of interest that must stay inside the margins, such as the hands. */
    keep?: "hands" | "faces" | "bodies";
  }

  /** The kinds of action. */
  export type Kind = Action["kind"];

  /** Kinds a student performs in everyday life. */
  export const EVERYDAY = [
    "enter", "hold", "until", "say", "walk", "turn", "step", "giveRoom", "sit", "rise", "shift", "look", "offer", "withdraw", "receive", "release",
    "openPalm", "lowerHand", "pocket", "hide", "drop", "pickUp", "putDown", "unfold", "fold", "raise", "drink", "read", "launch", "reachAfter",
    "drawBack", "catch", "touchForehead", "pushGlasses", "bend", "straighten", "liftChin",
  ] as const;

  /** Kinds of the duel. */
  export const DUEL = ["guard", "footwork", "cast", "deflect", "shield", "grip", "turnUnder", "letGo", "run", "parry", "guide", "wand", "levitate"] as const;

  /** Kinds of broom riding and Quidditch play. */
  export const FLIGHT = ["mount", "fly", "reach", "slip", "swingArm", "offerRear", "transfer", "pass", "strike", "stopPlay", "hover", "escort"] as const;

  /** An everyday action. */
  export type Everyday = Extract<Action, { kind: (typeof EVERYDAY)[number] }>;

  /** A duel action. */
  export type Duel = Extract<Action, { kind: (typeof DUEL)[number] }>;

  /** A flight or play action. */
  export type Flight = Extract<Action, { kind: (typeof FLIGHT)[number] }>;

  /** Whether an action is everyday. */
  export function isEveryday(action: Action): action is Everyday {
    return (EVERYDAY as readonly string[]).includes(action.kind);
  }

  /** Whether an action is a duel action. */
  export function isDuel(action: Action): action is Duel {
    return (DUEL as readonly string[]).includes(action.kind);
  }

  /** Whether an action is a flight or play action. */
  export function isFlight(action: Action): action is Flight {
    return (FLIGHT as readonly string[]).includes(action.kind);
  }

  /**
   * An engine intent carrying an action.
   *
   * @param subject The acting subject's id.
   * @param action The action.
   * @param anchor Optional anchor id.
   * @returns The intent.
   * @evidence contracts/development/common.md#meaningful-documentation States the encoding.
   * @evidence contracts/development/implementation.md#principled-implementation The capability is the action's kind; the frozen action rides in the parameters the engine copies untouched.
   */
  export function intent(
    subject: string,
    action: Action,
    anchor?: string,
  ): IAutoMovieIntent {
    return {
      subject,
      capability: action.kind,
      ...(anchor === undefined ? {} : { anchor }),
      parameters: Object.freeze({ action: Object.freeze(action) }),
    };
  }

  /**
   * The action an intent carries.
   *
   * @param intent An intent made by `intent`.
   * @returns The action.
   * @throws When the intent carries none.
   * @evidence contracts/development/common.md#meaningful-documentation States the failure.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the parameter `intent` wrote.
   */
  export function read(intent: IAutoMovieIntent): Action {
    const action: unknown = intent.parameters?.action;
    if (
      typeof action !== "object" ||
      action === null ||
      !("kind" in action)
    )
      throw new Error(`${intent.subject}.${intent.capability} carries no action`);
    return action as Action;
  }
}
