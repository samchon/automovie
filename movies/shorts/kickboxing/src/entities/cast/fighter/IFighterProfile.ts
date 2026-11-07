import type { IAutoMovieHumanParameters } from "@automovie/human";

import type { KickboxingAction } from "../../../laws/kickboxing/KickboxingAction";
import type { KickboxingTechnique } from "../../../laws/kickboxing/KickboxingTechnique";

/**
 * The settings facts a fighter entity is built from: identity, body controls,
 * kit colours, repertoire, defenses and habits. One record per fighter
 * settings file; the entity reads nothing else.
 *
 * @evidence docs/body/settings/cast/fighter-a.md#build The build, kit, repertoire and habits of A; B's record follows his own file.
 * @evidence contracts/development/common.md#meaningful-documentation States what the record holds and that it is the entity's only input.
 * @evidence contracts/development/design.md#principled-representation Colours are sRGB hex, mass in kilograms, the body as Human's own parameter record, techniques and answers as the laws' closed unions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the fighter, its body, figure and chain read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No scene or beat appears here.
 */
export interface IFighterProfile {
  /** Stable subject id used by intents and schedules. */
  id: string;

  /** The corner colour the referee names him by. */
  corner: "red" | "blue";

  /** Human body controls realizing the settings build. */
  parameters: IAutoMovieHumanParameters;

  /** Bare body mass, kilograms. */
  mass: number;

  /** Skin colour of the polygon figure. */
  skin: number;

  /** Glove colour. */
  gloves: number;

  /** Shorts colour. */
  shorts: number;

  /** Waistband or stripe colour. */
  trim: number;

  /** Techniques he throws. */
  repertoire: readonly KickboxingTechnique.Name[];

  /** Answers he uses. */
  defenses: readonly KickboxingAction.Answer[];

  /** Trigger-to-response habits, by settings anchor. */
  habits: readonly IFighterProfile.IHabit[];
}

/** Companion types of {@link IFighterProfile}. */
export namespace IFighterProfile {
  /** A habit: when the opponent shows a trigger, he gives a response, at a speed and reliability. */
  export interface IHabit {
    /** The settings fact's anchor, such as `drops-left-arm`. */
    id: string;

    /** The opponent's techniques that trigger it: what he sees. */
    trigger: readonly KickboxingTechnique.Name[];

    /** The answer he gives. */
    response: KickboxingAction.Answer;

    /** Share of triggers that draw it, in [0, 1]. */
    reliability: number;
  }
}
