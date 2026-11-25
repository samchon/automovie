import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeRide } from "../core";

/**
 * The authored cues of an equid's expression layer: where it looks and puts its
 * muzzle, how each ear and the tail are carried, what the jaw does, and when it
 * calls.
 *
 * Every cue but a vocalization holds over a window of film seconds and blends
 * in and out over its `ease` on a minimum-jerk share, so a channel returns
 * exactly to the base ride's pose when its cue ends. A vocalization is one
 * instant: the audio synchronization mark a sound designer lays the snort or
 * neigh on. The vocabulary follows the equine behaviour and facial-action
 * literature: attention and orientation, sniffing and naso-nasal greeting,
 * grazing, eating hay, drinking, self-rubbing and mutual grooming (the equine
 * social video ethogram, PMC11047489), and the ear actions EquiFACS codes, ears
 * forward (EAD101), ear rotator (EAD104) and ear flattener (EAD103) (Wathan et
 * al. 2015, PLoS ONE 10:e0131738).
 */
export namespace AutoMovieArchetypeEquineExpressionCue {
  /**
   * A world target: a fixed point, or a point that moves, such as another
   * horse's withers.
   */
  export type Target = IPoint | ITrack;

  /** A fixed world point, metres. */
  export interface IPoint {
    /** Discriminator. */
    kind: "point";

    /** The point in the world, metres. */
    point: IAutoMovieVector3;
  }

  /** A world point that moves with film seconds. */
  export interface ITrack {
    /** Discriminator. */
    kind: "track";

    /** The point in the world at a film second, metres. */
    at: (seconds: number) => IAutoMovieVector3;
  }

  /** The window every held cue shares. */
  export interface IWindow {
    /** Film second the cue begins to blend in. */
    from: number;

    /** Film second it has blended back out to the base pose. */
    to: number;

    /** Seconds the blend in, and again the blend out, take. */
    ease: number;
  }

  /** Turn the head and neck to face a target, keeping their carriage. */
  export interface IAttend extends IWindow {
    /** Discriminator. */
    kind: "attend";

    /** What the horse turns to. */
    target: Target;
  }

  /**
   * What a muzzle reach is: sniffing keeps a clearance; greeting, grazing,
   * eating hay, drinking, rubbing and grooming touch.
   */
  export type Act =
    | "sniff"
    | "greet"
    | "graze"
    | "hay"
    | "drink"
    | "rub"
    | "groom"
    | "bite"
    | "suckle";

  /** Bring the muzzle to a target and hold it there. */
  export interface IReach extends IWindow {
    /** Discriminator. */
    kind: "reach";

    /** What the reach is. */
    act: Act;

    /** The point on the target's surface the muzzle goes to. */
    target: Target;

    /**
     * The clearance held between the muzzle's surface and the target, metres:
     * zero for every act but `sniff`, positive for `sniff`.
     */
    gap: number;
    /**
     * The other body the neck and head course around on the way in and out, if
     * any.
     */
    around?: IAround;
  }

  /**
   * Another body a reach plans its course around: its displayed pose by film
   * second.
   */
  export interface IAround {
    /** The body's displayed pose at a film second. */
    at(seconds: number): AutoMovieArchetypeRide.IPose<string, string>;
  }

  /** One side. */
  export type Side = "left" | "right";

  /**
   * An ear's carriage: pricked forward (EAD101), turned out to the side or back
   * (EAD104), drooped out to the side and down as in a doze, or pinned flat
   * (EAD103).
   */
  export type EarCarriage = "forward" | "lateral" | "droop" | "back" | "pinned";

  /** Carry one ear, independently of the other. */
  export interface IEar extends IWindow {
    /** Discriminator. */
    kind: "ear";

    /** Which ear. */
    side: Side;

    /** How it is carried. */
    carriage: EarCarriage;
  }

  /** The tail's carriage: raised, clamped down, or swishing side to side. */
  export type TailCarriage = "raised" | "clamped" | "swish";

  /** Carry the tail. */
  export interface ITail extends IWindow {
    /** Discriminator. */
    kind: "tail";

    /** How it is carried. */
    carriage: TailCarriage;
  }

  /** What the jaw does: chew in a rhythm, hold open, or open wide in a yawn. */
  export type JawAction = "chew" | "open" | "yawn";

  /** Move the jaw, independently of the head's carriage. */
  export interface IJaw extends IWindow {
    /** Discriminator. */
    kind: "jaw";

    /** What the jaw does. */
    action: JawAction;
  }

  /** A call: a snort or a neigh. */
  export type Call = "snort" | "neigh";

  /** One authored call: exactly one audio synchronization mark at its onset. */
  export interface IVocalize {
    /** Discriminator. */
    kind: "vocalize";

    /** Which call. */
    call: Call;

    /** Film second the call's sound begins. */
    at: number;
  }

  /**
   * A held carriage of the neck and head: lowered toward horizontal in a doze,
   * raised with the muzzle up for the flehmen, or stretched forward in a yawn.
   */
  export type HeadCarriage = "doze" | "flehmen" | "yawn";

  /** Carry the neck and head in a held carriage, on the head channel. */
  export interface ICarriage extends IWindow {
    /** Discriminator. */
    kind: "carriage";

    /** The carriage. */
    carriage: HeadCarriage;
  }

  /**
   * What the lips do: the upper lip curled up (EquiFACS AU10, the flehmen) or
   * the lower lip hanging slack (AU16-like relaxation, as in a doze).
   */
  export type LipAction = "curl" | "slack";

  /** Move the lips. */
  export interface ILip extends IWindow {
    /** Discriminator. */
    kind: "lip";

    /** What the lips do. */
    action: LipAction;
  }

  /**
   * Shake the neck and head: a roll about the neck that leads a whole-body
   * shake.
   */
  export interface IShake extends IWindow {
    /** Discriminator. */
    kind: "shake";
  }

  /** A body region whose skin can twitch. */
  export type Region = "neck" | "shoulder" | "barrel" | "flank" | "croup";

  /**
   * A local skin twitch (the panniculus reflex at an insect): one mark at its
   * onset, `twitch:<region>`.
   */
  export interface ITwitch {
    /** Discriminator. */
    kind: "twitch";

    /** Where the skin twitches. */
    region: Region;

    /** Film second of the twitch. */
    at: number;
  }

  /** Any cue. * */
  export type Cue =
    | IAttend
    | IReach
    | ICarriage
    | IEar
    | ITail
    | IJaw
    | ILip
    | IShake
    | IVocalize
    | ITwitch;

  /** An audio synchronization mark. */
  export interface IMark {
    /** The call. */
    call: Call;

    /** Film second of its onset. */
    seconds: number;

    /** The instant label, `vocal:<call>`. */
    label: string;
  }
}
