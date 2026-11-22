import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * The standing horse's rest, comfort and elimination behaviours: the stance rows they pose and the acts a scene authors.
 *
 * The stance rows are whole-body responses of `AutoMovieArchetypeEquineStance`: a hind limb rested on its toe with the hips tilted, a fore hoof pawing, a stamp, a cow-kick, a whole-body shake and the camped-out stance. The acts are what a scene or a seeded idle cycle authors: each act is one behaviour over a window, which `AutoMovieArchetypeEquineComfort` expands into stance rows and expression cues (Equine posture and weight-bearing ethogram, Animals 2021; Przewalski's horse ethogram, BMC Zoology 2022; EquiFACS).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the rows, the acts and their sources.
 * @evidence contracts/development/design.md#principled-representation Discriminated unions of phases or windows with their few parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rows join the stance's cue union; the acts are what `AutoMovieArchetypeEquineComfort` takes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed literals, not free text.
 */
export namespace AutoMovieArchetypeEquineComfortCue {
  /**
   * Rest one hind limb on its toe while the other carries the hindquarters locked, the hips tilted to the resting side (the stay apparatus's patellar lock).
   *
   * @evidence contracts/development/common.md#meaningful-documentation The side is the resting hind's.
   * @evidence contracts/development/design.md#principled-representation Phases and a side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The standing-rest row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRest extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "rest";

    /** The resting hind limb's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /**
   * Paw with one fore hoof: each stroke swings it forward and scrapes it back along the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The side is the pawing fore's; the strokes are a positive whole number spread over the hold.
   * @evidence contracts/development/design.md#principled-representation Phases, a side and a count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The pawing row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPaw extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "paw";

    /** The pawing fore limb's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;

    /** The scraping strokes, a positive whole number. */
    strokes: number;
  }

  /**
   * Stamp one hoof: lift it and strike it down where it stood.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the limb.
   * @evidence contracts/development/design.md#principled-representation Phases and a limb.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The stamping row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStamp extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "stamp";

    /** The stamping limb. */
    limb: AutoMovieArchetypeQuadrupedBody.Limb;
  }

  /**
   * Cow-kick at an insect: swing one hind hoof forward toward the belly and back.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The side is the kicking hind's.
   * @evidence contracts/development/design.md#principled-representation Phases and a side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The cow-kick row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICowKick extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "cowKick";

    /** The kicking hind limb's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /**
   * Shake the trunk from side to side with all four hooves planted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The shake fills the hold; the neck's leading shake is the expression layer's.
   * @evidence contracts/development/design.md#principled-representation Phases only.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The trunk-shake row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IShake extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "shake";
  }

  /**
   * Camp out: step both hind hooves back and lower the back, as for urination.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The hinds step back one at a time and return through the exit.
   * @evidence contracts/development/design.md#principled-representation Phases only.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The camped-out row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICamp extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "camp";
  }

  /**
   * Any comfort row of the stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The union of the rows.
   * @evidence contracts/development/design.md#principled-representation Discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Joins the stance's cue union and is planned by `EquineComfortRows`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Row = IRest | IPaw | IStamp | ICowKick | IShake | ICamp;

  /**
   * An act's window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Film seconds.
   * @evidence contracts/development/design.md#principled-representation A start and a positive length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every act's base.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IWindow {
    /** Film second the act starts; the horse must be standing. */
    from: number;

    /** Its length, seconds, ending in the neutral stance. */
    seconds: number;
  }

  /**
   * A facial act: a doze, the flehmen or a yawn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The face act's kind.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Face = "doze" | "flehmen" | "yawn";

  /**
   * An elimination: urination in the camped-out stance with the tail raised, or defecation with the tail lifted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The elimination act's kind.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Elimination = "urinate" | "defecate";

  /**
   * Rest a hind limb, the hips tilted, for the window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The side is the resting hind's.
   * @evidence contracts/development/design.md#principled-representation A window and a side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRestAct extends IWindow {
    /** Discriminator. */
    kind: "rest";

    /** The resting hind's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /**
   * Paw with a fore hoof.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The side and the strokes.
   * @evidence contracts/development/design.md#principled-representation A window, a side and a count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPawAct extends IWindow {
    /** Discriminator. */
    kind: "paw";

    /** The pawing fore's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;

    /** The strokes. */
    strokes: number;
  }

  /**
   * Stamp a hoof.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The limb.
   * @evidence contracts/development/design.md#principled-representation A window and a limb.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStampAct extends IWindow {
    /** Discriminator. */
    kind: "stamp";

    /** The limb. */
    limb: AutoMovieArchetypeQuadrupedBody.Limb;
  }

  /**
   * Cow-kick at an insect with a hind hoof.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The side.
   * @evidence contracts/development/design.md#principled-representation A window and a side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICowKickAct extends IWindow {
    /** Discriminator. */
    kind: "cowKick";

    /** The kicking hind's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /**
   * Shake the whole body, the neck leading the trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A window.
   * @evidence contracts/development/design.md#principled-representation A window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IShakeAct extends IWindow {
    /** Discriminator. */
    kind: "shake";
  }

  /**
   * A doze, the flehmen or a yawn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Which face.
   * @evidence contracts/development/design.md#principled-representation A window and a face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFaceAct extends IWindow {
    /** Discriminator. */
    kind: Face;
  }

  /**
   * Swish the tail at flies.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A window.
   * @evidence contracts/development/design.md#principled-representation A window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISwishAct extends IWindow {
    /** Discriminator. */
    kind: "swish";
  }

  /**
   * Twitch the skin at a region, marked at the window's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The region.
   * @evidence contracts/development/design.md#principled-representation A window and a region.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITwitchAct extends IWindow {
    /** Discriminator. */
    kind: "twitch";

    /** The region. */
    region: AutoMovieArchetypeEquineExpressionCue.Region;
  }

  /**
   * Urinate or defecate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Which elimination.
   * @evidence contracts/development/design.md#principled-representation A window and a kind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IEliminationAct extends IWindow {
    /** Discriminator. */
    kind: Elimination;
  }

  /**
   * Any act.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The union of the acts.
   * @evidence contracts/development/design.md#principled-representation Discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `AutoMovieArchetypeEquineComfort.after` takes and `AutoMovieArchetypeEquineComfort.idle` returns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
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
