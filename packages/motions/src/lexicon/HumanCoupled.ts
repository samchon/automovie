import type { AutoMovieHumanoidRegion } from "@automovie/interface";

import { getUp } from "../floor/getUp";
import type { IHumanMutual } from "../law/IHumanMutual";
import type { HumanCarried } from "./HumanCarried";

/**
 * The two-body compositions of #3440: carries with their lift and set-down,
 * a supported walk, and throws and takedowns, each a mutual record over
 * shipped laws, with no law per hold.
 *
 * - **carry**: the bearer performs `bearing` with the borne person named,
 *   the borne person `borne` on the bearer, so the pair is one coupled
 *   meeting (#3437): a fireman's carry (`overShoulder`), a piggyback, a
 *   cradle, a supported walk (`supported`), a drag, each with the lift into
 *   it and the set-down out of it as the borne body's support sequence.
 * - **throw**: the thrower takes a collar-and-sleeve grip and enters under
 *   the thrown body, its fulcrum lowered to the height of the thrown body's
 *   front (`clinch` with `under`, tsukuri), and the thrown person answers
 *   the pull through it (`perturb`, #3439) with
 *   the author's outcome, turning over the throw's fulcrum on the thrower
 *   when thrown. The pull itself is the performance's force input
 *   (`HumanPerformance.IInput.forces`, sized by
 *   `HumanForceExchange.breaking` or `pull`), since a force starts no
 *   action.
 *
 * The fulcrum of each throw is the thrower's region the thrown body turns
 * over in the throw's common description: seoi-nage over the upper back and
 * shoulder, o-goshi over the hip at the lower back, o-soto-gari backward
 * over the reaping thigh, the single-leg takedown over the shoulder driven
 * into the hip.
 *
 * - **carry** also gives the dance's waist lift and overhead lift
 *   (`waistLift`, `overheadLift`: the lifted body coupled to the lifter,
 *   the overhead one held an arm's length above the shoulders).
 * - **supportWalk**: one person walked between two helpers, each with
 *   `bearing` on its side of a supported walk and the helped person `borne`
 *   on both, one coupled meeting of three roles.
 * - **helpUp**: helping someone up from the floor, both performing
 *   `support` (#3435), the helped hand gripping the helper's palm until the
 *   feet bear alone.
 *
 * Arm wrestling is `HumanSocial.armWrestle` with the author's winner; the
 * loser's trunk turn the winner's torque gives is owed to #3439. A tug of
 * war is #3451's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each record's roles and actions, where the force comes from, the fulcrum table's source and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation Each composition is a mutual record over shipped laws, the vocabulary's form for one thing several people do.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four records, the throws' fulcrum table and the thrown region that lies on it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law is written per hold: the coupling, the response and the support sequence are their owners'.
 */
export namespace HumanCoupled {
  /** The shared parameters of a carry. */
  export interface ICarry {
    /** The carry; `piggyback` when absent. */
    carry?: HumanCarried.Carry;

    /** Seconds carried; the laws' own when absent. */
    seconds?: number;

    /** Seconds of the lift into the carry; none when absent. */
    lift?: number;

    /** Seconds of the set-down; none when absent. */
    setDown?: number;

    /** Kilograms the borne person carries besides their body; none when absent. */
    mass?: number;
  }

  /** One person carries another: the bearer `bearing`, the borne `borne`, coupled. */
  export const carry: IHumanMutual<ICarry, "bearer" | "borne"> = {
    name: "carry",
    roles: ["bearer", "borne"],
    act: (
      role: "bearer" | "borne",
      params: ICarry,
      cast: Readonly<Record<"bearer" | "borne", string>>,
    ): IHumanMutual.IAct => {
      const shared: object = {
        ...(params?.carry === undefined ? {} : { carry: params.carry }),
        ...(params?.seconds === undefined ? {} : { seconds: params.seconds }),
        ...(params?.mass === undefined ? {} : { mass: params.mass }),
      };
      return role === "bearer"
        ? { name: "bearing", params: { ...shared, of: cast.borne } }
        : {
            name: "borne",
            params: {
              ...shared,
              by: cast.bearer,
              ...(params?.lift === undefined ? {} : { lift: params.lift }),
              ...(params?.setDown === undefined
                ? {}
                : { setDown: params.setDown }),
            },
          };
    },
  };

  /** The shared parameters of helping someone up from the floor. */
  export interface IHelpUp {
    /** The hand both hold by, the helper's and the helped's alike, as a handshake takes them; `right` when absent. */
    hand?: "left" | "right";
  }

  /**
   * Help someone up from the floor: both perform `support` (#3435). The
   * helper, from the squat, grips the helped person's wrist where it lies; the
   * helped person rises through sitting and squatting to standing with
   * that hand gripping the helper's palm, which bears on the helper while
   * the hand holds and lets go once the feet bear alone.
   */
  export const helpUp: IHumanMutual<IHelpUp, "helper" | "helped"> = {
    name: "helpUp",
    roles: ["helper", "helped"],
    act: (
      role: "helper" | "helped",
      params: IHelpUp,
      cast: Readonly<Record<"helper" | "helped", string>>,
    ): IHumanMutual.IAct => {
      const side: "left" | "right" = params?.hand ?? "right";
      const part: "leftHand" | "rightHand" =
        side === "left" ? "leftHand" : "rightHand";
      const feet = [
        { part: "leftFoot", kind: "bear" },
        { part: "rightFoot", kind: "bear" },
      ] as const;
      if (role === "helper")
        return {
          name: "support",
          params: {
            stances: [
              {
                contacts: [
                  ...feet,
                  {
                    part,
                    kind: "grip",
                    target: {
                      kind: "person",
                      subject: cast.helped,
                      region: side === "left" ? "wristLeft" : "wristRight",
                    },
                  },
                ],
                // The hand goes down to a wrist on the floor: the fit starts
                // from the squat, as `getUp` keys it.
                prefer: getUp.POSES.squat,
              },
            ],
          },
        };
      const grip = {
        part,
        kind: "grip",
        target: {
          kind: "person",
          subject: cast.helper,
          region: side === "left" ? "palmLeft" : "palmRight",
        },
      } as const;
      return {
        name: "support",
        params: {
          stances: [
            {
              contacts: [{ part: "seat", kind: "bear" }, ...feet, grip],
              prefer: getUp.POSES.sit,
            },
            { contacts: [...feet, grip], prefer: getUp.POSES.squat },
            { contacts: feet },
          ],
        },
      };
    },
  };

  /** The shared parameters of a walk between two helpers. */
  export interface ISupportWalk {
    /** Seconds supported; the laws' own when absent. */
    seconds?: number;
  }

  /** One person walked between two helpers: each helper `bearing` on its side of a supported walk, the helped person `borne` on both. */
  export const supportWalk: IHumanMutual<
    ISupportWalk,
    "helper" | "second" | "helped"
  > = {
    name: "supportWalk",
    roles: ["helper", "second", "helped"],
    act: (
      role: "helper" | "second" | "helped",
      params: ISupportWalk,
      cast: Readonly<Record<"helper" | "second" | "helped", string>>,
    ): IHumanMutual.IAct => {
      const seconds: object =
        params?.seconds === undefined ? {} : { seconds: params.seconds };
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

  /** A throw or a takedown by its common name. */
  export type Throw = "seoiNage" | "oGoshi" | "oSotoGari" | "singleLeg";

  /** The thrower's region each throw turns the thrown body over. */
  export const FULCRUMS: Readonly<Record<Throw, AutoMovieHumanoidRegion>> = {
    seoiNage: "upperBack",
    oGoshi: "lowerBack",
    oSotoGari: "thighOuterRight",
    singleLeg: "shoulderRight",
  };

  /** The thrown body's region that lies on the fulcrum: the front of the trunk, as a hip or a shoulder throw loads it. */
  export const ON: AutoMovieHumanoidRegion = "abdomen";

  /** The shared parameters of a throw. */
  export interface IThrow {
    /** The throw; `seoiNage` when absent. */
    kind?: Throw;

    /** The author's outcome: thrown, resisted or yielded; `thrown` when absent. */
    outcome?: "thrown" | "resist" | "yield";

    /** Seconds the thrower holds the grip; the clinch's own when absent. */
    hold?: number;
  }

  /** One person throws another: the thrower grips (`clinch`), the thrown answers the pull (`perturb`). */
  export const throwing: IHumanMutual<IThrow, "thrower" | "thrown"> = {
    name: "throw",
    roles: ["thrower", "thrown"],
    act: (
      role: "thrower" | "thrown",
      params: IThrow,
      cast: Readonly<Record<"thrower" | "thrown", string>>,
    ): IHumanMutual.IAct =>
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
