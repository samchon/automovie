import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * The standing horse's rest, comfort and elimination behaviours: the stance
 * rows they pose and the acts a scene authors.
 *
 * The stance rows are whole-body responses of `AutoMovieArchetypeEquineStance`:
 * a hind limb rested on its toe with the hips tilted, a fore hoof pawing, a
 * stamp, a cow-kick, a whole-body shake and the camped-out stance. The acts are
 * what a scene or a seeded idle cycle authors: each act is one behaviour over a
 * window, which `AutoMovieArchetypeEquineComfort` expands into stance rows and
 * expression cues (Equine posture and weight-bearing ethogram, Animals 2021;
 * Przewalski's horse ethogram, BMC Zoology 2022; EquiFACS).
 */
export namespace AutoMovieArchetypeEquineComfortCue {
  /**
   * Rest one hind limb on its toe while the other carries the hindquarters
   * locked, the hips tilted to the resting side (the stay apparatus's patellar
   * lock).
   */
  export interface IRest extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "rest";

    /** The resting hind limb's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /**
   * Paw with one fore hoof: each stroke swings it forward and scrapes it back
   * along the floor.
   */
  export interface IPaw extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "paw";

    /** The pawing fore limb's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;

    /** The scraping strokes, a positive whole number. */
    strokes: number;
  }

  /** Stamp one hoof: lift it and strike it down where it stood. */
  export interface IStamp extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "stamp";

    /** The stamping limb. */
    limb: AutoMovieArchetypeQuadrupedBody.Limb;
  }

  /**
   * Cow-kick at an insect: swing one hind hoof forward toward the belly and
   * back.
   */
  export interface ICowKick extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "cowKick";

    /** The kicking hind limb's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /** Shake the trunk from side to side with all four hooves planted. */
  export interface IShake extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "shake";
  }

  /** Camp out: step both hind hooves back and lower the back, as for urination. */
  export interface ICamp extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "camp";
  }

  /** Any comfort row of the stance. */
  export type Row = IRest | IPaw | IStamp | ICowKick | IShake | ICamp;

  /** An act's window. */
  export interface IWindow {
    /** Film second the act starts; the horse must be standing. */
    from: number;

    /** Its length, seconds, ending in the neutral stance. */
    seconds: number;
  }

  /** A facial act: a doze, the flehmen or a yawn. */
  export type Face = "doze" | "flehmen" | "yawn";

  /**
   * An elimination: urination in the camped-out stance with the tail raised, or
   * defecation with the tail lifted.
   */
  export type Elimination = "urinate" | "defecate";

  /** Rest a hind limb, the hips tilted, for the window. */
  export interface IRestAct extends IWindow {
    /** Discriminator. */
    kind: "rest";

    /** The resting hind's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /** Paw with a fore hoof. */
  export interface IPawAct extends IWindow {
    /** Discriminator. */
    kind: "paw";

    /** The pawing fore's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;

    /** The strokes. */
    strokes: number;
  }

  /** Stamp a hoof. */
  export interface IStampAct extends IWindow {
    /** Discriminator. */
    kind: "stamp";

    /** The limb. */
    limb: AutoMovieArchetypeQuadrupedBody.Limb;
  }

  /** Cow-kick at an insect with a hind hoof. */
  export interface ICowKickAct extends IWindow {
    /** Discriminator. */
    kind: "cowKick";

    /** The kicking hind's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /** Shake the whole body, the neck leading the trunk. */
  export interface IShakeAct extends IWindow {
    /** Discriminator. */
    kind: "shake";
  }

  /** A doze, the flehmen or a yawn. */
  export interface IFaceAct extends IWindow {
    /** Discriminator. */
    kind: Face;
  }

  /** Swish the tail at flies. */
  export interface ISwishAct extends IWindow {
    /** Discriminator. */
    kind: "swish";
  }

  /** Twitch the skin at a region, marked at the window's start. */
  export interface ITwitchAct extends IWindow {
    /** Discriminator. */
    kind: "twitch";

    /** The region. */
    region: AutoMovieArchetypeEquineExpressionCue.Region;
  }

  /** Urinate or defecate. */
  export interface IEliminationAct extends IWindow {
    /** Discriminator. */
    kind: Elimination;
  }

  /** Any act. */
  export type Act =
    | IRestAct
    | IPawAct
    | IStampAct
    | ICowKickAct
    | IShakeAct
    | IFaceAct
    | ISwishAct
    | ITwitchAct
    | IEliminationAct;
}
