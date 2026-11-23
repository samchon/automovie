import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeRide } from "../core";
import type { AutoMovieArchetypeEquineExpressionCue } from "./AutoMovieArchetypeEquineExpressionCue";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";

/**
 * Two horses' agonistic encounter: threats, rearing foreleg strikes, bites,
 * double-barrel kicks and a retreat, each aimed at a named body region of the
 * other horse (Przewalski's horse ethogram, BMC Zoology 2022, Table 3; equine
 * social behaviour video ethogram, 2024).
 */
export namespace AutoMovieArchetypeEquineEncounterCue {
  /** One of the two horses. */
  export type Horse = 0 | 1;

  /** A body region a strike, bite or kick is aimed at. */
  export type Region = "neck" | "head" | "shoulder" | "barrel" | "hindquarters";

  /** A threat: both ears pinned back while the head faces the other horse. */
  export interface IThreat
    extends AutoMovieArchetypeEquineExpressionCue.IWindow {
    /** Discriminator. */
    kind: "threat";

    /** Who threatens. */
    horse: Horse;
  }

  /** A bite: the muzzle onto a region of the other horse. */
  export interface IBite extends AutoMovieArchetypeEquineExpressionCue.IWindow {
    /** Discriminator. */
    kind: "bite";

    /** Who bites. */
    horse: Horse;

    /** Where on the other horse. */
    region: Region;
  }

  /**
   * A rearing foreleg strike at a region of the other horse, both hind hooves
   * planted.
   */
  export interface IStrikeAct
    extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "strike";

    /** Who strikes. */
    horse: Horse;

    /** The striking foreleg's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;

    /** Where on the other horse. */
    region: Region;
  }

  /**
   * A double-barrel kick with both hind hooves at a region of the other horse,
   * both fore hooves planted.
   */
  export interface IKickAct extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "kick";

    /** Who kicks. */
    horse: Horse;

    /** Where on the other horse. */
    region: Region;
  }

  /** Any act of the encounter. */
  export type Act = IThreat | IBite | IStrikeAct | IKickAct;

  /**
   * The stance row of a rearing strike: the striking hoof placed at a point,
   * the other foreleg folded, both hinds planted.
   */
  export interface IStrike
    extends AutoMovieArchetypeEquineStanceCue.IPhases, IContact {
    /** Discriminator. */
    kind: "strike";

    /** The striking foreleg's side. */
    side: AutoMovieArchetypeEquineExpressionCue.Side;
  }

  /**
   * A hoof's contact: a point on the other horse's surface and its outward
   * normal.
   */
  export interface IContact {
    /** The point, base model space. */
    point: IAutoMovieVector3;

    /** The surface's outward normal there, base model space. */
    normal: IAutoMovieVector3;
  }

  /**
   * The stance row of a double-barrel kick: each hind hoof placed at its own
   * point, both fore hooves planted.
   */
  export interface IKick extends AutoMovieArchetypeEquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "kick";

    /** Each hind hoof's contact, by side. */
    hooves: Readonly<
      Record<AutoMovieArchetypeEquineExpressionCue.Side, IContact>
    >;
  }

  /** Any encounter row of the stance. */
  export type Row = IStrike | IKick;

  /** One horse of the encounter. */
  export interface IHorse<Id extends string, D extends string> {
    /** The ride into the encounter, ending halted where it fights. */
    ride: AutoMovieArchetypeRide.IRide<Id, D>;

    /** A retreat ridden from its film second on, starting from the halt. */
    retreat?: IRetreat<Id, D>;
  }

  /** A retreat: a ride from the encounter's halt, played from a film second. */
  export interface IRetreat<Id extends string, D extends string> {
    /** Film second the retreat starts. */
    from: number;

    /** The retreat's ride, starting from the halt. */
    ride: AutoMovieArchetypeRide.IRide<Id, D>;
  }
}
