import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ArchetypeRide } from "../core";
import type { EquineExpressionCue } from "./EquineExpressionCue";
import type { EquineStanceCue } from "./EquineStanceCue";

/**
 * Two horses' agonistic encounter: threats, rearing foreleg strikes, bites, double-barrel kicks and a retreat, each aimed at a named body region of the other horse (Przewalski's horse ethogram, BMC Zoology 2022, Table 3; equine social behaviour video ethogram, 2024).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every cue and its sources.
 * @evidence contracts/development/design.md#principled-representation Which horse acts, when, and at which region.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `EquineEncounter.stage` takes; the strike and kick rows join the stance's cue union.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed literals, not free text.
 */
export namespace EquineEncounterCue {
  /**
   * One of the two horses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The first or the second horse given.
   * @evidence contracts/development/design.md#principled-representation An index.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every act's actor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Horse = 0 | 1;

  /**
   * A body region a strike, bite or kick is aimed at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each region; each is a bar of the actual body.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The aim of the contact acts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Region = "neck" | "head" | "shoulder" | "barrel" | "hindquarters";

  /**
   * A threat: both ears pinned back while the head faces the other horse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Its actor and window.
   * @evidence contracts/development/design.md#principled-representation An actor and an expression window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IThreat extends EquineExpressionCue.IWindow {
    /** Discriminator. */
    kind: "threat";

    /** Who threatens. */
    horse: Horse;
  }

  /**
   * A bite: the muzzle onto a region of the other horse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Its actor, window and region.
   * @evidence contracts/development/design.md#principled-representation An actor, an expression window and a region.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBite extends EquineExpressionCue.IWindow {
    /** Discriminator. */
    kind: "bite";

    /** Who bites. */
    horse: Horse;

    /** Where on the other horse. */
    region: Region;
  }

  /**
   * A rearing foreleg strike at a region of the other horse, both hind hooves planted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Its actor, phases, striking leg and region.
   * @evidence contracts/development/design.md#principled-representation An actor, stance phases, a side and a region.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStrikeAct extends EquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "strike";

    /** Who strikes. */
    horse: Horse;

    /** The striking foreleg's side. */
    side: EquineExpressionCue.Side;

    /** Where on the other horse. */
    region: Region;
  }

  /**
   * A double-barrel kick with both hind hooves at a region of the other horse, both fore hooves planted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Its actor, phases and region.
   * @evidence contracts/development/design.md#principled-representation An actor, stance phases and a region.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IKickAct extends EquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "kick";

    /** Who kicks. */
    horse: Horse;

    /** Where on the other horse. */
    region: Region;
  }

  /**
   * Any act of the encounter.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The union of the acts.
   * @evidence contracts/development/design.md#principled-representation Discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `EquineEncounter.stage` takes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Act = IThreat | IBite | IStrikeAct | IKickAct;

  /**
   * The stance row of a rearing strike: the striking hoof placed at a point, the other foreleg folded, both hinds planted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The point is the struck surface in the striker's base model space.
   * @evidence contracts/development/design.md#principled-representation Phases, a side and a point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A stance row the encounter plans.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStrike extends EquineStanceCue.IPhases, IContact {
    /** Discriminator. */
    kind: "strike";

    /** The striking foreleg's side. */
    side: EquineExpressionCue.Side;
  }

  /**
   * A hoof's contact: a point on the other horse's surface and its outward normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both in the attacker's base model space.
   * @evidence contracts/development/design.md#principled-representation A point and a unit normal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The strike's and each kicking hoof's aim.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IContact {
    /** The point, base model space. */
    point: IAutoMovieVector3;

    /** The surface's outward normal there, base model space. */
    normal: IAutoMovieVector3;
  }

  /**
   * The stance row of a double-barrel kick: each hind hoof placed at its own point, both fore hooves planted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each hind hoof's contact on the kicked surface.
   * @evidence contracts/development/design.md#principled-representation Phases and two contacts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A stance row the encounter plans.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IKick extends EquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "kick";

    /** Each hind hoof's contact, by side. */
    hooves: Readonly<Record<EquineExpressionCue.Side, IContact>>;
  }

  /**
   * Any encounter row of the stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The union of the rows.
   * @evidence contracts/development/design.md#principled-representation Discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Joins the stance's cue union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Row = IStrike | IKick;

  /**
   * One horse of the encounter.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Its producer's model, its ride to the encounter and an optional retreat.
   * @evidence contracts/development/design.md#principled-representation A model, a ride and an optional retreat.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `EquineEncounter.stage` takes per horse.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHorse<Id extends string, D extends string> {
    /** The ride into the encounter, ending halted where it fights. */
    ride: ArchetypeRide.IRide<Id, D>;

    /** A retreat ridden from its film second on, starting from the halt. */
    retreat?: IRetreat<Id, D>;
  }

  /**
   * A retreat: a ride from the encounter's halt, played from a film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The ride's own clock starts at `from`.
   * @evidence contracts/development/design.md#principled-representation A start second and a ride.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A horse's optional retreat.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRetreat<Id extends string, D extends string> {
    /** Film second the retreat starts. */
    from: number;

    /** The retreat's ride, starting from the halt. */
    ride: ArchetypeRide.IRide<Id, D>;
  }
}
