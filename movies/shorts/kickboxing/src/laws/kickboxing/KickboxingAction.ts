import type { IAutoMovieIntent } from "@automovie/engine";
import type { KickboxingTechnique } from "./KickboxingTechnique";

/**
 * The bout's action vocabulary: what a fighter's intent asks for, as a typed
 * record carried in `IAutoMovieIntent.parameters`. Capability methods write
 * these records; timing, outcome, state and pose laws read them back through
 * `read`, which refuses anything else, so no consumer casts parameters.
 *
 * ```ts
 * const intent = { subject: "a", capability: "strike", parameters: { action: { kind: "strike", technique: "jab" } } };
 * KickboxingAction.read(intent).kind; // "strike"
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#defenses The answers are the defenses of the study plus `take`, the absence of a defense.
 * @evidence docs/research/kickboxing/ring-generalship.md#movements The movements are the studied ring movements plus the stance holds, corner walk and celebration the screenplay needs.
 * @evidence contracts/development/common.md#meaningful-documentation States where the record lives, who writes and who reads it.
 * @evidence contracts/development/design.md#principled-representation A discriminated union by `kind` keeps each action's fields apart; seconds are film seconds, steps are whole steps.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only fields the laws read exist; the engine's intent type is imported, not copied.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional field combines into a meaningless state; each kind carries exactly its own data.
 */
export namespace KickboxingAction {
  /** A defense, or `take` for none. */
  export type Answer =
    | "parry"
    | "cover"
    | "slip"
    | "roll"
    | "sway"
    | "elbow-block"
    | "high-block"
    | "check"
    | "take";

  /** A ring movement. */
  export type Movement =
    | "circle"
    | "press"
    | "give"
    | "escape"
    | "pivot"
    | "centre"
    | "approach"
    | "separate"
    | "switch"
    | "corner"
    | "celebrate";

  /** One action. */
  export type IAction =
    | {
        /** A strike or feint. */
        kind: "strike";
        /** The technique. */
        technique: KickboxingTechnique.Name;
        /** The same fighter's previous strike when this one continues its combination. */
        follows?: KickboxingTechnique.Name;
      }
    | {
        /** A defense or the absence of one. */
        kind: "answer";
        /** The answer. */
        answer: Answer;
        /** The technique it answers. */
        against: KickboxingTechnique.Name;
        /** Seconds from the answered strike's launch to its contact. */
        lead: number;
        /** Anchor id of the answered strike. */
        strike: string;
        /** When a habit fires it: complete by the kick's chamber key instead of the contact. */
        ready?: "chamber";
      }
    | {
        /** A defense a capability offers before an exchange pairs it with an attack. */
        kind: "defend";
        /** The answer. */
        answer: Answer;
        /** When a habit fires it: complete by the kick's chamber key instead of the contact. */
        ready?: "chamber";
      }
    | {
        /** A ring movement. */
        kind: "move";
        /** The movement. */
        movement: Movement;
        /** Whole steps it takes. */
        steps: number;
        /** For `approach`: stance-origin distance to reach, metres. */
        range?: number;
        /** For a step-in riding a strike's delivery: the seconds it takes instead of the stepping cadence. */
        seconds?: number;
      }
    | {
        /** The opening glove touch. */
        kind: "touch";
        /** Seconds from its start to the gloves meeting, a screenplay anchor. */
        reach: number;
        /** Seconds from its start until both are back at kicking distance, a screenplay anchor. */
        seconds: number;
      }
    | {
        /** A whole-body performance phase without an opponent relation: guard, fall, attempt to rise, lying still, victory. */
        kind: "phase";
        /** The phase. */
        phase: "guard" | "fall" | "attempt" | "lie" | "victory" | "attend";
        /** Seconds it lasts. */
        seconds: number;
      };

  /**
   * The action an intent carries.
   *
   * @param intent An intent written by a bout capability.
   * @returns Its action.
   * @throws When the intent carries no action record.
   * @evidence docs/research/kickboxing/techniques.md#laws Every law reads its inputs from these records.
   * @evidence contracts/development/common.md#meaningful-documentation States the input, output and refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Checks the discriminator before returning the record, so a foreign intent fails loudly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader for every consumer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No default action is invented for a malformed intent.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws It only exposes the studied vocabulary.
   * @evidence contracts/development/behaviors.md#relational-goals No position is read.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function read(intent: IAutoMovieIntent): IAction {
    const action: unknown = intent.parameters?.action;
    if (
      typeof action !== "object" ||
      action === null ||
      !["strike", "answer", "defend", "move", "touch", "phase"].includes(
        (action as { kind?: unknown }).kind as string,
      )
    )
      throw new Error(
        `Intent ${intent.subject}.${intent.capability} carries no bout action`,
      );
    return action as IAction;
  }

  /**
   * An intent carrying an action.
   *
   * @param subject The acting subject's id.
   * @param action The action.
   * @param anchor Optional anchor id.
   * @returns The frozen intent.
   * @evidence docs/research/kickboxing/techniques.md#laws The record is the input every law reads.
   * @evidence contracts/development/common.md#meaningful-documentation States the arguments and that the result is frozen.
   * @evidence contracts/development/implementation.md#principled-implementation The capability name is the action kind, so schedules read as the vocabulary.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned record is the caller's.
   * @evidence contracts/development/behaviors.md#studied-laws It only carries the studied vocabulary.
   * @evidence contracts/development/behaviors.md#relational-goals No position is written.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function intent(
    subject: string,
    action: IAction,
    anchor?: string,
  ): IAutoMovieIntent {
    return Object.freeze({
      subject,
      capability: action.kind,
      ...(anchor === undefined ? {} : { anchor }),
      parameters: Object.freeze({ action: Object.freeze({ ...action }) }),
    });
  }
}
