import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Inputs shared by two actors in a preplanned sport grappling scene. The
 * scene is one law and one parameter set for judo, wrestling, MMA mat work
 * and sumo: a paired clock of reach, take, release and rest beats whose
 * length is `seconds`, and an authored outcome. The scene takes 3 to 6 s
 * at the lengths on {@link Kind}; no skill or strength
 * is read. A kind is a staging, not a rulebook: the award is not inferred
 * from the pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States that both roles share one authored scene.
 * @evidence contracts/development/design.md#principled-representation A closed scene kind and explicit staged outcome separate choreography from partner identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the shared scene settings and the settings of each action role.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither the venue nor the rulebook's award is inferred from a pose.
 */
export namespace IAutoMovieMotionHumanGrapple {
  /**
   * Staged entries and mat exchanges distinguished by their displayed movement.
   * The sumo bouts crouch at the shikiri lines, charge at the tachiai and end
   * with a push out of the ring (`oshiDashi`), a belt-grip force-out
   * (`yoriKiri`) or an overarm belt throw (`uwateNage`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each literal names one selectable judo, wrestling or mat scene.
   * @evidence contracts/development/design.md#principled-representation Closed scene kinds select the named staging rows and their corresponding support movements.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The scene input uses these fourteen names to select its choreography.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scene kind and scene outcome are separate inputs.
   */
  export type Kind =
    /** Judo shoulder throw, 3.5 s by default. */
    | "seoiNage"
    /** Judo hip throw, 3.8 s. */
    | "oGoshi"
    /** Judo major outer reap, 3.4 s. */
    | "oSotoGari"
    /** Judo forward foot sweep timed to the step, the quickest scene, 3 s. */
    | "deAshiHarai"
    /** Wrestling single-leg takedown, 3.8 s. */
    | "singleLeg"
    /** Wrestling double-leg takedown, 3.6 s. */
    | "doubleLeg"
    /** Greco-Roman upper-body throw, 3.8 s. */
    | "grecoRoman"
    /** Judo hold on the mat, 5 s. */
    | "judoHold"
    /** Wrestling fall to the back, 5 s. */
    | "wrestlingFall"
    /** Mat guard pass, the longest scene, 6 s. */
    | "guardPass"
    /** MMA reset after a mat exchange, 4.2 s. */
    | "mmaReset"
    /** Sumo push out, 4.5 s: a charge from the shikiri lines 0.7 m apart, a drive of 2.1 m in 0.35 m steps over the 4.55 m ring ({@link grappleSumo}). */
    | "oshiDashi"
    /** Sumo belt-grip force-out, 5 s, driven the same way. */
    | "yoriKiri"
    /** Sumo overarm belt throw, 4 s. */
    | "uwateNage";

  /**
   * The two parts of a scene played on the same clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The initiator supplies the moving hand goals and the receiver supplies their partner-relative frames.
   * @evidence contracts/development/design.md#principled-representation Each actor plays one of two distinct position and contact schedules.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two roles are sufficient for the paired composition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Actor identities are bound separately from their chosen roles.
   */
  export type Role = "initiator" | "receiver";

  /**
   * Whether the planned movement settles or is interrupted and released.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A complete scene proceeds to its selected finish and a denied scene returns to standing.
   * @evidence contracts/development/design.md#principled-representation The two outcomes select the shared completion or interruption path.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One authored outcome is shared by both roles.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A contact distance or a score never chooses the outcome.
   */
  export type Outcome = "complete" | "denied";

  /**
   * Settings common to both roles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each input describes its staging meaning and default.
   * @evidence contracts/development/design.md#principled-representation A named scene, lead side, selected branch and per-scene duration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface These four settings are the inputs common to the two actors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The outcome is an input, independent of body dimensions or performance sampling.
   */
  export interface IScene {
    /** Which authored scene to stage. */
    kind: Kind;

    /** Author's result, `complete` when absent. */
    outcome?: Outcome;

    /** Lead side of the staged scene, right when absent. */
    side?: AutoMovieHumanSide;

    /** Total scene duration in seconds, positive and finite. Absent, each kind takes its own length listed on {@link Kind} ({@link grappleStances.seconds}, {@link grappleSumo.seconds}); every one is an authored staging length, provisional: no study of a bout's phase times was read. The phases keep their shares of it, so a longer scene is the same beats slower. */
    seconds?: number;
  }

  /**
   * One actor's action in a shared grappling scene.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the role and the other actor.
   * @evidence contracts/development/design.md#principled-representation The scene is common, while role and reciprocal subject identify this actor's part.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The motion law consumes the shared settings and the two actor-specific fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No participant placement or score is embedded in the inputs.
   */
  export interface IParams extends IScene {
    /** The actor's part in the paired scene. */
    role: Role;

    /** The other actor's subject in the same performance. */
    partner: string;
  }
}
