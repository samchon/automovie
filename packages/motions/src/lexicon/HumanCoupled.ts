import type { AutoMovieHumanoidRegion } from "@automovie/interface";

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
 * - **throw**: the thrower takes a collar-and-sleeve grip (`clinch`) and
 *   the thrown person answers the pull through it (`perturb`, #3439) with
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
 * First pass: the dance lifts, helping someone up, a walk with two helpers
 * and arm wrestling are not written here (a lift overhead needs a key pose
 * of the lifter's raised arms, help-up a support sequence whose hand bears
 * on the helper's grip, two helpers a borne body on two bearers, and arm
 * wrestling is `armWrestle`'s with its torque owed to #3439); a tug of war
 * is #3451's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each record's roles and actions, where the force comes from, the fulcrum table's source and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation Each composition is a mutual record over shipped laws, the vocabulary's form for one thing several people do.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two records and the throws' fulcrum table.
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

  /** A throw or a takedown by its common name. */
  export type Throw = "seoiNage" | "oGoshi" | "oSotoGari" | "singleLeg";

  /** The thrower's region each throw turns the thrown body over. */
  export const FULCRUMS: Readonly<Record<Throw, AutoMovieHumanoidRegion>> = {
    seoiNage: "upperBack",
    oGoshi: "lowerBack",
    oSotoGari: "thighOuterRight",
    singleLeg: "shoulderRight",
  };

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
            },
          }
        : {
            name: "perturb",
            params: {
              outcome: params?.outcome ?? "thrown",
              by: cast.thrower,
              fulcrum: FULCRUMS[params?.kind ?? "seoiNage"],
            },
          },
  };
}
