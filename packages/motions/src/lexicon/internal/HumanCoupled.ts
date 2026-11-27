import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanCoupled,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";

import { supportAssist } from "../../actions/internal/supportAssist";
import { getUp } from "../../floor/internal/getUp";

/**
 * The two-body compositions: carries with their lift and set-down, a supported
 * walk, and throws and takedowns, each a mutual record over shipped laws, with
 * no law per hold.
 *
 * - **carry**: the bearer performs `bearing` with the borne person named, the
 *   borne person `borne` on the bearer, so the pair is one coupled meeting: a
 *   fireman's carry (`overShoulder`), a piggyback, a cradle, a supported walk
 *   (`supported`), a drag, each with the lift into it and the set-down out of
 *   it as the borne body's support sequence.
 * - **throw**: the thrower takes a collar-and-sleeve grip and enters under the
 *   thrown body, its fulcrum lowered to the height of the thrown body's front
 *   (`clinch` with `under`, tsukuri), and the thrown person answers the pull
 *   through it (`perturb`) with the author's outcome, turning over the throw's
 *   fulcrum on the thrower when thrown. The pull itself is the performance's
 *   force input (`HumanPerformance.IInput.forces`, sized by
 *   `HumanForceExchange.breaking` or `pull`), since a force starts no action.
 *
 * The fulcrum of each throw is the thrower's region the thrown body turns over
 * in the throw's common description: seoi-nage over the upper back and
 * shoulder, o-goshi over the hip at the lower back, o-soto-gari backward over
 * the reaping thigh, the single-leg takedown over the shoulder driven into the
 * hip.
 *
 * - **carry** also gives the dance's waist lift and overhead lift (`waistLift`,
 *   `overheadLift`: the lifted body coupled to the lifter, the overhead one
 *   held an arm's length above the shoulders).
 * - **supportWalk**: one person walked between two helpers, each with `bearing`
 *   on its side of a supported walk and the helped person `borne` on both, one
 *   coupled meeting of three roles.
 * - **helpUp**: helping someone up from the floor, both performing `support`, the
 *   helped hand gripping the helper's palm until the feet bear alone.
 * - **grappling**: both performers follow one authored grappling scene, including
 *   its lead side, result and clock.
 *
 * Arm wrestling is `HumanSocial.armWrestle` with the author's winner; the
 * loser's trunk turn the winner's torque gives is not planned. A tug of war has
 * no law.
 */
export namespace HumanCoupled {
  /**
   * Place both roles of an authored grappling scene on the same clock. The
   * performance registers the `grapple` law for both roles.
   *
   * Timing is the authored scene's clock (`IAutoMovieMotionHumanGrapple`); no
   * timing of its own.
   */
  export const grappling: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanGrapple.IScene,
    IAutoMovieMotionHumanGrapple.Role
  > = {
    name: "grappling",
    roles: ["initiator", "receiver"],
    act: (
      role: IAutoMovieMotionHumanGrapple.Role,
      params: IAutoMovieMotionHumanGrapple.IScene,
      cast: Readonly<Record<IAutoMovieMotionHumanGrapple.Role, string>>,
    ): IAutoMovieMotionHumanMutual.IAct => ({
      name: "grapple",
      params: {
        ...params,
        role,
        partner: cast[role === "initiator" ? "receiver" : "initiator"],
      },
    }),
  };

  /**
   * One person carries another: the bearer `bearing`, the borne `borne`,
   * coupled. It lasts `seconds`, 2 s when absent, lift and set-down inside
   * (`IAutoMovieMotionHumanCoupled.ICarry`, provisional); a rescue, a
   * piggyback, carrying a child or a casualty.
   */
  export const carry: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanCoupled.ICarry,
    Carry
  > = {
    name: "carry",
    roles: ["bearer", "borne"],
    act: (
      role: CarryRole,
      params: IAutoMovieMotionHumanCoupled.ICarry,
      cast: Readonly<Record<CastEntryItem, string>>,
    ): IAutoMovieMotionHumanMutual.IAct => {
      const shared: object = {
        ...(params?.carry === undefined ? {} : { carry: params.carry }),
        ...(params?.hold === undefined ? {} : { hold: params.hold }),
        ...(params?.mass === undefined ? {} : { mass: params.mass }),
        lift: params?.lift ?? 0,
        ...(params?.setDown === undefined ? {} : { setDown: params.setDown }),
      };
      return role === "bearer"
        ? { name: "bearing", params: { ...shared, of: cast.borne } }
        : {
            name: "borne",
            params: {
              ...shared,
              partner: cast.bearer,
            },
          };
    },
  };

  /**
   * Help someone up from the floor: both perform `support`. The helper, from
   * the squat, grips the helped person's wrist where it lies; the helped person
   * rises through sitting and squatting to standing with that hand gripping the
   * helper's palm, which bears on the helper while the hand holds and lets go
   * once the feet bear alone.
   *
   * The helped person rises through sitting and squatting to standing; no
   * timing of its own, the support planner's `support.SECONDS`, 1 s a stance
   * (provisional).
   */
  export const helpUp: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanCoupled.IHelpUp,
    IAutoMovieMotionHumanSupport.AssistRole
  > = {
    name: "helpUp",
    roles: ["helper", "helped"],
    act: (
      role: IAutoMovieMotionHumanSupport.AssistRole,
      params: IAutoMovieMotionHumanCoupled.IHelpUp,
      cast: Readonly<Record<IAutoMovieMotionHumanSupport.AssistRole, string>>,
    ): IAutoMovieMotionHumanMutual.IAct => {
      const side: AutoMovieHumanSide = params?.hand ?? "right";
      const part: IAutoMovieMotionHumanSupport.Part = `${side}Hand`;
      const feet: readonly IAutoMovieMotionHumanSupport.IContact[] = [
        { part: "leftFoot", kind: "bear" },
        { part: "rightFoot", kind: "bear" },
      ] as const;
      const partner: string = cast[role === "helper" ? "helped" : "helper"];
      const grip: IAutoMovieMotionHumanSupport.IContact = {
        part,
        kind: "grip",
        target: {
          kind: "person",
          subject: partner,
          region: side === "left" ? "palmLeft" : "palmRight",
        },
      };
      const seconds: number = supportAssist.step();
      const paramsOf: IAutoMovieMotionHumanSupport.IParams = {
        assist: { role, partner, hand: side },
        stances: [
          {
            contacts:
              role === "helped"
                ? [{ part: "back", kind: "bear" }, grip]
                : [...feet, grip],
            ...(role === "helped" ? {} : { prefer: getUp.POSES.squat }),
            seconds,
            event: "take",
          },
          {
            contacts:
              role === "helped"
                ? [{ part: "seat", kind: "bear" }, ...feet, grip]
                : [...feet, grip],
            prefer: role === "helped" ? getUp.POSES.sit : getUp.POSES.squat,
            seconds,
            event: "seat",
          },
          {
            contacts: [...feet, grip],
            prefer: getUp.POSES.squat,
            seconds,
            event: "lift",
          },
          {
            contacts: feet,
            prefer: getUp.POSES.stood,
            seconds,
            event: "standing",
          },
        ],
      };
      return {
        name: "support",
        params: paramsOf,
      };
    },
  };

  /**
   * One person walked between two helpers: each helper `bearing` on its side of
   * a supported walk, the helped person `borne` on both. The walk speed is the
   * bearers' own walk's (use the slow pace of `IAutoMovieMotionHumanWalkParams`
   * for a frail person), and the pair lasts `seconds`, 2 s when absent
   * (provisional); helping a frail or injured person walk.
   */
  export const supportWalk: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanCoupled.ISupportWalk,
    SupportWalk
  > = {
    name: "supportWalk",
    roles: ["helper", "second", "helped"],
    act: (
      role: SupportWalkRole,
      params: IAutoMovieMotionHumanCoupled.ISupportWalk,
      cast: Readonly<Record<CastEntryItem2, string>>,
    ): IAutoMovieMotionHumanMutual.IAct => {
      const seconds: object =
        params?.duration === undefined ? {} : { seconds: params.duration };
      return role === "helped"
        ? {
            name: "borne",
            params: {
              ...seconds,
              carry: "supported",
              by: cast.helper,
              with: cast.second,
            },
          }
        : {
            name: "bearing",
            params: {
              ...seconds,
              carry: role === "helper" ? "supported" : "supportedLeft",
              of: cast.helped,
              beside: role === "helper" ? cast.second : cast.helper,
            },
          };
    },
  };

  /** The thrower's region each throw turns the thrown body over. */
  export const FULCRUMS: Readonly<
    Record<IAutoMovieMotionHumanCoupled.Throw, AutoMovieHumanoidRegion>
  > = {
    seoiNage: "upperBack",
    oGoshi: "lowerBack",
    oSotoGari: "thighOuterRight",
    singleLeg: "shoulderRight",
  };

  /**
   * The thrown body's region that lies on the fulcrum: the front of the trunk,
   * as a hip or a shoulder throw loads it.
   */
  export const ON: AutoMovieHumanoidRegion = "abdomen";

  /**
   * One person throws another: the thrower grips (`clinch`), the thrown answers
   * the pull (`perturb`). Timing is the clinch's and the force input's
   * (`clinch`, `HumanForceExchange`); no timing of its own (provisional); a
   * judo or wrestling throw.
   */
  export const throwing: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanCoupled.IThrow,
    Throwing
  > = {
    name: "throw",
    roles: ["thrower", "thrown"],
    act: (
      role: ThrowingRole,
      params: IAutoMovieMotionHumanCoupled.IThrow,
      cast: Readonly<Record<CastEntryItem3, string>>,
    ): IAutoMovieMotionHumanMutual.IAct =>
      role === "thrower"
        ? {
            name: "clinch",
            params: {
              partner: cast.thrown,
              grip: "collarSleeve",
              ...(params?.hold === undefined ? {} : { hold: params.hold }),
              under: {
                fulcrum: FULCRUMS[params?.kind ?? "seoiNage"],
                on: ON,
              },
            },
          }
        : {
            name: "perturb",
            params: {
              outcome: params?.outcome ?? "thrown",
              by: cast.thrower,
              fulcrum: FULCRUMS[params?.kind ?? "seoiNage"],
              on: ON,
            },
          },
  };
}

/** The alternatives of `CastEntryItem3`'s site. */
type CastEntryItem3 = "thrower" | "thrown";

/** The alternatives of `ThrowingRole`'s site. */
type ThrowingRole = "thrower" | "thrown";

/** The alternatives of `Throwing`'s site. */
type Throwing = "thrower" | "thrown";

/** The alternatives of `CastEntryItem2`'s site. */
type CastEntryItem2 = "helper" | "second" | "helped";

/** The alternatives of `SupportWalkRole`'s site. */
type SupportWalkRole = "helper" | "second" | "helped";

/** The alternatives of `SupportWalk`'s site. */
type SupportWalk = "helper" | "second" | "helped";

/** The alternatives of `CastEntryItem`'s site. */
type CastEntryItem = "bearer" | "borne";

/** The alternatives of `CarryRole`'s site. */
type CarryRole = "bearer" | "borne";

/** The alternatives of `Carry`'s site. */
type Carry = "bearer" | "borne";
