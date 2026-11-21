import type { EquineExpressionCue } from "./EquineExpressionCue";
import type { EquineStanceCue } from "./EquineStanceCue";
import type { QuadrupedLateralRestPlan } from "./QuadrupedLateralRestPlan";
import type { QuadrupedRestPlan } from "./QuadrupedRestPlan";

/**
 * A trained horse's liberty cue poses and its trained fall.
 *
 * The bow, kneel and sit are stance rows over a halt; the lie-down and the lateral "dead" hold are the shared sternal and lateral rests (`QuadrupedRest`, `QuadrupedLateralRest`) played from the halt; the fall goes down from a canter or gallop onto prepared ground (American Humane, horse guidelines for filmed media: trained horses only, prepared ground).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names every cue and its owner.
 * @evidence contracts/development/design.md#principled-representation Phases or a rest's authored timing, with the few parameters each needs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rows join the stance's cue union; the recline and fall are `EquineLiberty`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace EquineLibertyCue {
  /**
   * The bow: one foreleg stretched forward on the floor, the other knelt on its carpus, the hind legs standing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The side is the stretched foreleg's.
   * @evidence contracts/development/design.md#principled-representation Phases and a side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A stance row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBow extends EquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "bow";

    /** The stretched foreleg's side. */
    side: EquineExpressionCue.Side;
  }

  /**
   * The kneel: both forelegs knelt on their carpi, the hind legs standing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Phases only.
   * @evidence contracts/development/design.md#principled-representation Phases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A stance row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IKneel extends EquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "kneel";
  }

  /**
   * The sit: the haunches on the floor, the forelegs straight on their hooves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Phases only.
   * @evidence contracts/development/design.md#principled-representation Phases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A stance row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISit extends EquineStanceCue.IPhases {
    /** Discriminator. */
    kind: "sit";
  }

  /**
   * Any liberty row of the stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The union of the rows.
   * @evidence contracts/development/design.md#principled-representation Discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Joins the stance's cue union.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Row = IBow | IKneel | ISit;

  /**
   * A shared rest's authored timing and folding, without the carriers and floor the horse and its halt supply.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The rest plan's own authored members.
   * @evidence contracts/development/design.md#principled-representation The rest's parameters less what is read.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The recline's and the fall's rest.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Rest = Omit<
    QuadrupedRestPlan.IParams,
    "parts" | "contacts" | "floorY"
  >;

  /**
   * Lie down from the halt and stay, sternal, or roll onto a side and hold it still as if dead, then rise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Its start, the rest and, for the dead hold, the lateral roll.
   * @evidence contracts/development/design.md#principled-representation A start second, the rest and an optional lateral rest.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Played by `EquineLiberty.after` after any stance rows.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRecline {
    /** Film second it starts, the horse halted. */
    from: number;

    /** The sternal rest's timing and folding. */
    rest: Rest;

    /** The lateral roll for the dead hold; absent, the horse lies sternal. */
    lateral?: QuadrupedLateralRestPlan.IParams;
  }

  /**
   * A trained fall from a canter or gallop onto prepared ground: the horse checks, goes down on one side, slides to a stop, lies still and rises.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Seconds and metres; the side is the one it lands on.
   * @evidence contracts/development/design.md#principled-representation A start, the drop's length, the slide's distance, the ground's preparation and the rests it lies and rises through.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Played by `EquineFall.after`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ground must be declared prepared; no tripping device is modelled.
   */
  export interface IFall {
    /** Film second it goes down, while moving. */
    from: number;

    /** Seconds from the stride into lying on its side. */
    drop: number;

    /** Metres it slides from the fall's start to its stop. */
    slide: number;

    /** Whether the author has marked the ground prepared for a fall. */
    prepared: boolean;

    /** The sternal rest's timing and folding, which the rise plays. */
    rest: Rest;

    /** The lateral rest it lies in and rises from; its side is the side landed on. */
    lateral: QuadrupedLateralRestPlan.IParams;
  }
}
