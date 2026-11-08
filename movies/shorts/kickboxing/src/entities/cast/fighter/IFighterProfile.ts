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

  /** His habits as rules, by settings anchor. */
  habits: readonly IFighterProfile.IHabit[];
}

/** Companion types of {@link IFighterProfile}. */
export namespace IFighterProfile {
  /** A habit of the settings, as a rule over what he sees or does. */
  export type IHabit = ITell | ILinger;

  /**
   * A tell: when the opponent's technique shows the features he reads, he
   * gives a response, complete by the kick's chamber key or by the contact.
   */
  export interface ITell {
    /** Rule kind. */
    kind: "tell";

    /** The settings fact's anchor, such as `drops-left-arm`. */
    id: string;

    /** What he reads in the opponent's technique; every stated feature must match. */
    sees: {
      /** The throwing limb. */
      limb?: "arm" | "leg";
      /** The opponent's throwing side. */
      side?: KickboxingTechnique.Side;
      /** Height bands of the technique; a knee chambered above the hip rises for body and head kicks. */
      levels?: readonly KickboxingTechnique.Level[];
      /** Performance families, such as `feint`. */
      families?: readonly KickboxingTechnique.Family[];
    };

    /** The answer he gives. */
    response: KickboxingAction.Answer;

    /** When the answer is complete: the chamber key for a tell to the rising knee; the contact otherwise. */
    ready?: "chamber";

    /** Share of triggers that draw it, in [0, 1]. */
    reliability: number;
  }

  /** A linger: after his own technique meets a given outcome he stays on the limb a beat before returning it. */
  export interface ILinger {
    /** Rule kind. */
    kind: "linger";

    /** The settings fact's anchor, such as `stays-on-leg`. */
    id: string;

    /** His techniques it follows: the limb and height band. */
    after: { limb: "arm" | "leg"; level: KickboxingTechnique.Level };

    /** The outcome of the opponent's answer that draws it. */
    outcome: string;
  }
}
