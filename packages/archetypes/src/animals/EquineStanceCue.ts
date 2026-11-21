import type { EquineExpressionCue } from "./EquineExpressionCue";
import type { EquineStanceExtras } from "./EquineStanceExtras";
import type { QuadrupedBody } from "./QuadrupedBody";

/**
 * The authored whole-body responses of a halted equid: a weight shift, a startle, a baulk, a hoof lifted for a handler, a step aside, a rear and a buck.
 *
 * Each cue has a named entry, hold and exit on the film clock; the exit is the settle back to the stance it started from, except a step aside, which ends standing where it stepped. These are digital animation performances with authored outcomes, the responses observed in equine movement and expression (PMC7931104) and in the experimental reaction to a novel object (J Anim Sci Technol 2021, doi:10.5187/jast.2021.e51); their amplitudes and timings are the cue's or the planner's authored values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a cue is, its phases and where its vocabulary comes from.
 * @evidence contracts/development/design.md#principled-representation A discriminated union of responses sharing an entry, hold and exit in film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here and read by `EquineStance`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Alternatives are union members, never optional fields that combine into meaningless states.
 */
export namespace EquineStanceCue {
  /**
   * The phases every response shares.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Film seconds; each duration positive except a hold, which may be zero.
   * @evidence contracts/development/design.md#principled-representation A start and three durations, admitted at runtime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Extended by each response.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPhases {
    /** Film second the entry begins. */
    from: number;

    /** Seconds of entry. */
    entry: number;

    /** Seconds held. */
    hold: number;

    /** Seconds of exit, the settle. */
    exit: number;
  }

  /**
   * Shift the body over the planted hooves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The shift is in metres in the horse's own frame as it stands when the shift starts: X to its left, Y up, Z forward.
   * @evidence contracts/development/design.md#principled-representation Three components.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The weight-shift response.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IShift extends IPhases {
    /** Discriminator. */
    kind: "shift";

    /** Leftward shift, metres. */
    x: number;

    /** Upward shift, metres. */
    y: number;

    /** Forward shift, metres. */
    z: number;
  }

  /**
   * Startle in place: drop and draw back over the planted hooves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The planner's authored drop and draw.
   * @evidence contracts/development/design.md#principled-representation Phases only.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The startle response.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStartle extends IPhases {
    /** Discriminator. */
    kind: "startle";
  }

  /**
   * Baulk: brace back against going forward.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The planner's authored brace.
   * @evidence contracts/development/design.md#principled-representation Phases only.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The baulk response.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBaulk extends IPhases {
    /** Discriminator. */
    kind: "baulk";
  }

  /**
   * Lift one hoof, after moving the weight onto the other three.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the limb.
   * @evidence contracts/development/design.md#principled-representation Phases and a limb.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The response a handler's lifted-hoof care asks for.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IHoof extends IPhases {
    /** Discriminator. */
    kind: "hoof";

    /** The limb lifted. */
    limb: QuadrupedBody.Limb;
  }

  /**
   * Step sideways, one hoof at a time, each after the weight is on the other three.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The side is the horse's own; the width is metres.
   * @evidence contracts/development/design.md#principled-representation Phases, a side and a positive width.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The step-aside response; it ends where it stepped.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStepAside extends IPhases {
    /** Discriminator. */
    kind: "stepAside";

    /** The side stepped to. */
    side: EquineExpressionCue.Side;

    /** Metres stepped. */
    width: number;
  }

  /**
   * Rear: gather onto the hindquarters, then lift the forehand to a trunk pitch with the forelimbs folded, both hind hooves planted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The pitch is degrees, forehand up.
   * @evidence contracts/development/design.md#principled-representation Phases and a positive pitch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The rear response and the airs that hold it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRear extends IPhases {
    /** Discriminator. */
    kind: "rear";

    /** The held trunk pitch, degrees. */
    pitch: number;
  }

  /**
   * Buck: lower the forehand, then lift the hindquarters to a trunk pitch with the hind limbs kicking back, both fore hooves planted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The pitch is degrees, hindquarters up.
   * @evidence contracts/development/design.md#principled-representation Phases and a positive pitch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The buck response.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBuck extends IPhases {
    /** Discriminator. */
    kind: "buck";

    /** The held trunk pitch, degrees. */
    pitch: number;
  }

  /**
   * Spin on the haunches: turn about the middle of the hind hooves, every hoof stepping around in turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The turn is degrees about up, positive to the horse's left.
   * @evidence contracts/development/design.md#principled-representation Phases and a signed turn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The spin response; it ends facing its new heading.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISpin extends IPhases {
    /** Discriminator. */
    kind: "spin";

    /** The turn, degrees about up, positive to the left; at most a full turn either way. */
    degrees: number;
  }

  /**
   * Crow hops: small bucks one after another, the forehand planted and the hindquarters lifted and set down each time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The count of hops and each hop's pitch, degrees.
   * @evidence contracts/development/design.md#principled-representation Phases, a whole count and a positive pitch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The crow-hop response; it ends standing as it began.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICrowHops extends IPhases {
    /** Discriminator. */
    kind: "crowHops";

    /** How many hops, a whole number from one. */
    count: number;

    /** Each hop's trunk pitch, degrees, hindquarters up. */
    pitch: number;
  }

  /**
   * A held school air on the hindquarters: the pesade, the forehand raised to 45 degrees, or the levade, to about 30 to 35 (Airs above the ground, Wikipedia; IFCE Equipedia).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names both airs and their sourced trunk angles.
   * @evidence contracts/development/design.md#principled-representation Closed literals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The held air's name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Air = "pesade" | "levade";

  /**
   * Raise the forehand into a pesade or a levade and hold it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the air.
   * @evidence contracts/development/design.md#principled-representation Phases and an air whose angle is its source's.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The held airs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IAir extends IPhases {
    /** Discriminator. */
    kind: "air";

    /** Which air. */
    air: Air;
  }

  /**
   * The courbette: from the levade, leaps forward on the hind legs without the forelegs touching down, then the forehand comes down where the leaps end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the leap count; the hold is the leaping.
   * @evidence contracts/development/design.md#principled-representation Phases and a positive whole number of leaps, three or four usual and five or more for strong horses (Airs above the ground).
   * @evidence contracts/development/design.md#minimal-and-owned-surface The courbette.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICourbette extends IPhases {
    /** Discriminator. */
    kind: "courbette";

    /** How many leaps, a positive whole number. */
    leaps: number;
  }

  /**
   * The capriole: from a gathered halt, the whole horse leaps up, kicks out with the hind legs at the top and lands on all four.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The hold is the flight; its duration sets the ballistic height.
   * @evidence contracts/development/design.md#principled-representation Phases only.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The capriole.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICapriole extends IPhases {
    /** Discriminator. */
    kind: "capriole";
  }

  /**
   * A school air: a held pesade or levade, a courbette or a capriole.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the airs.
   * @evidence contracts/development/design.md#principled-representation A discriminated union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `EquineAirs.plan` takes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type School = IAir | ICourbette | ICapriole;

  /**
   * Any response.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The union of every response.
   * @evidence contracts/development/design.md#principled-representation Discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `EquineStance.after` takes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Cue =
    | IShift
    | IStartle
    | IBaulk
    | IHoof
    | IStepAside
    | IRear
    | IBuck
    | ISpin
    | ICrowHops
    | School
    | EquineStanceExtras.Row;
}
