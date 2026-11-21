import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The authored cues of an equid's expression layer: where it looks and puts its muzzle, how each ear and the tail are carried, what the jaw does, and when it calls.
 *
 * Every cue but a vocalization holds over a window of film seconds and blends in and out over its `ease` on a minimum-jerk share, so a channel returns exactly to the base ride's pose when its cue ends. A vocalization is one instant: the audio synchronization mark a sound designer lays the snort or neigh on. The vocabulary follows the equine behaviour and facial-action literature: attention and orientation, sniffing and naso-nasal greeting, grazing, eating hay, drinking, self-rubbing and mutual grooming (the equine social video ethogram, PMC11047489), and the ear actions EquiFACS codes, ears forward (EAD101), ear rotator (EAD104) and ear flattener (EAD103) (Wathan et al. 2015, PLoS ONE 10:e0131738).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a cue is, its film-second window, its blending and where its vocabulary comes from.
 * @evidence contracts/development/design.md#principled-representation A discriminated union of window cues and one instant cue, each on the film clock in seconds, with targets in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here and read by `EquineExpression`; each member is a channel the layer poses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are union members, never optional fields that combine into meaningless states.
 */
export namespace EquineExpressionCue {
  /**
   * A world target: a fixed point, or a point that moves, such as another horse's withers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units and frame of both forms.
   * @evidence contracts/development/design.md#principled-representation A union of a fixed point and a function of film seconds, both in world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the attention and reach cues.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A tracked target is read at each sample, never frozen.
   */
  export type Target = IPoint | ITrack;

  /**
   * A fixed world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and frame.
   * @evidence contracts/development/design.md#principled-representation One world point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A `Target` member.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPoint {
    /** Discriminator. */
    kind: "point";

    /** The point in the world, metres. */
    point: IAutoMovieVector3;
  }

  /**
   * A world point that moves with film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and the result's frame.
   * @evidence contracts/development/design.md#principled-representation A pure function of film seconds giving world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A `Target` member, for a partner's body region.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITrack {
    /** Discriminator. */
    kind: "track";

    /**
     * The point in the world at a film second, metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and the result's frame.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature; the author's function owns its computation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature; the author's function owns its structure.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature; nothing is implemented here.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature; the layer calls it once per sample that reads the target.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; nothing is implemented here.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; the layer retains only the function.
     */
    at: (seconds: number) => IAutoMovieVector3;
  }

  /**
   * The window every held cue shares.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the film-second window and the blend time with its bound.
   * @evidence contracts/development/design.md#principled-representation Start, end and blend in film seconds; `0 < ease` and `2 ease <= to - from` are runtime admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Extended by each held cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IWindow {
    /** Film second the cue begins to blend in. */
    from: number;

    /** Film second it has blended back out to the base pose. */
    to: number;

    /** Seconds the blend in, and again the blend out, take. */
    ease: number;
  }

  /**
   * Turn the head and neck to face a target, keeping their carriage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what turns and what is kept.
   * @evidence contracts/development/design.md#principled-representation A window and a target.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The orientation cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IAttend extends IWindow {
    /** Discriminator. */
    kind: "attend";

    /** What the horse turns to. */
    target: Target;
  }

  /**
   * What a muzzle reach is: sniffing keeps a clearance; greeting, grazing, eating hay, drinking, rubbing and grooming touch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each act and whether it touches.
   * @evidence contracts/development/design.md#principled-representation Closed literals from the social and feeding ethograms.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The reach cue's act, which decides its contact rule and instants.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed literals, not free text.
   */
  export type Act =
    | "sniff"
    | "greet"
    | "graze"
    | "hay"
    | "drink"
    | "rub"
    | "groom";

  /**
   * Bring the muzzle to a target and hold it there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the act, the target and the clearance's unit.
   * @evidence contracts/development/design.md#principled-representation A window, an act, a target and the held clearance in metres, zero for a touching act and positive for a sniff, checked at admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The muzzle cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IReach extends IWindow {
    /** Discriminator. */
    kind: "reach";

    /** What the reach is. */
    act: Act;

    /** The point on the target's surface the muzzle goes to. */
    target: Target;

    /** The clearance held between the muzzle's surface and the target, metres: zero for every act but `sniff`, positive for `sniff`. */
    gap: number;
  }

  /**
   * One side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the animal's own left and right.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The ear cue's side.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Side = "left" | "right";

  /**
   * An ear's carriage: pricked forward (EAD101), turned out to the side or back (EAD104), or pinned flat (EAD103).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each carriage with its EquiFACS action unit.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The ear cue's carriage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type EarCarriage = "forward" | "lateral" | "back" | "pinned";

  /**
   * Carry one ear, independently of the other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the side and the carriage.
   * @evidence contracts/development/design.md#principled-representation A window, a side and a carriage.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The ear cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One ear per cue, so the two are independent channels.
   */
  export interface IEar extends IWindow {
    /** Discriminator. */
    kind: "ear";

    /** Which ear. */
    side: Side;

    /** How it is carried. */
    carriage: EarCarriage;
  }

  /**
   * The tail's carriage: raised, clamped down, or swishing side to side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each carriage.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The tail cue's carriage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type TailCarriage = "raised" | "clamped" | "swish";

  /**
   * Carry the tail.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the carriage.
   * @evidence contracts/development/design.md#principled-representation A window and a carriage.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The tail cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITail extends IWindow {
    /** Discriminator. */
    kind: "tail";

    /** How it is carried. */
    carriage: TailCarriage;
  }

  /**
   * What the jaw does: chew in a rhythm, or hold open.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names both actions.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The jaw cue's action.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type JawAction = "chew" | "open";

  /**
   * Move the jaw, independently of the head's carriage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the action.
   * @evidence contracts/development/design.md#principled-representation A window and an action.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The jaw cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IJaw extends IWindow {
    /** Discriminator. */
    kind: "jaw";

    /** What the jaw does. */
    action: JawAction;
  }

  /**
   * A call: a snort or a neigh.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names both calls.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The vocalization cue's call and its mark.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Call = "snort" | "neigh";

  /**
   * One authored call: exactly one audio synchronization mark at its onset.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the call and its onset second.
   * @evidence contracts/development/design.md#principled-representation A call and one film second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The vocalization cue.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It poses nothing: a jaw opening for a neigh is its own jaw cue.
   */
  export interface IVocalize {
    /** Discriminator. */
    kind: "vocalize";

    /** Which call. */
    call: Call;

    /** Film second the call's sound begins. */
    at: number;
  }

  /**
   * Any cue.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The union of every cue.
   * @evidence contracts/development/design.md#principled-representation Discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `EquineExpression.layer` takes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Cue = IAttend | IReach | IEar | ITail | IJaw | IVocalize;

  /**
   * An audio synchronization mark.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the call, its film second and its instant label.
   * @evidence contracts/development/design.md#principled-representation A call, a second and the label it also carries among the ride's instants.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Published by the layered ride for sound.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IMark {
    /** The call. */
    call: Call;

    /** Film second of its onset. */
    seconds: number;

    /** The instant label, `vocal:<call>`. */
    label: string;
  }
}
