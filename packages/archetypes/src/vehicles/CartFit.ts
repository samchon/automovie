import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeEquine } from "../animals/AutoMovieArchetypeEquine";
import { EquineHarness } from "../animals/EquineHarness";
import { AutoMovieArchetypeHorse } from "../animals/AutoMovieArchetypeHorse";
import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  type AutoMovieArchetypeSpan,
  type IAutoMovieArchetypeBand,
} from "../core";
import { CART_MODELS } from "./CART_MODELS";
import { AutoMovieArchetypeCart } from "./AutoMovieArchetypeCart";

/**
 * A horse's cart fitted to its horse: the read models made for the horse an
 * author fixed, the girth and shafts the drawn horse gives the cart, and the
 * traces and driving lines between them. It is kept apart from `createCart` so
 * each file stays within its size.
 */
export namespace CartFit {
  /**
   * The models made for the horse an author fixed, each model without a stated
   * range of horses made for every one.
   *
   * @param models The kind's read models.
   * @param params The parameters, whose fixed withers height selects.
   * @returns The models whose range admits the fixed withers height, or every
   *   model when it is free.
   */
  export function models(
    models:
      | Readonly<
          Partial<
            Record<
              AutoMovieArchetypeCart.Model,
              Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>
            >
          >
        >
      | undefined,
    params: AutoMovieArchetypeCart.IParams,
  ):
    | Readonly<
        Partial<
          Record<
            AutoMovieArchetypeCart.Model,
            Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>
          >
        >
      >
    | undefined {
    const withers: number | undefined = params.withersHeight;
    if (models === undefined || withers === undefined) return models;
    return Object.fromEntries(
      Object.entries(models).filter(([name]: [string, unknown]): boolean => {
        const band: IAutoMovieArchetypeBand | undefined = Object.entries(
          CART_MODELS.ranges,
        ).find(([known]: [string, unknown]): boolean => known === name)?.[1]
          ?.withersHeight;
        return (
          band === undefined ||
          (band.minimum <= withers && withers <= band.maximum)
        );
      }),
    );
  }

  /**
   * A horse's cart fitted to the horse of its withers height: the girth that
   * height gives the horse, and, where the cart's shafts are not read, shafts
   * reaching from the horse's point of shoulder, where their tips stand, past
   * its point of buttock by the drawn clearance to the single tree (IVC
   * Carriage's 8 to 20 in from the horse to the vehicle's nearest part).
   *
   * @param draw The cart's draw, its height, clearance and any read shafts
   *   recorded; the girth and, where unread, the shafts' length are derived
   *   into it.
   */
  export function harness(
    draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCart.Dimension>,
  ): void {
    const drawn: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>> =
      draw.values;
    const girth: number = draw.derive(
      "girth",
      AutoMovieArchetypeHorse.PROFILE.girth(drawn.withersHeight!),
    );
    if (drawn.shaftLength !== undefined) return;
    const horse: AutoMovieArchetypeEquine.IRig = AutoMovieArchetypeEquine.rig({
      withersHeight: drawn.withersHeight!,
      girth,
    });
    draw.derive(
      "shaftLength",
      horse.limbs.leftFore[0]!.z - horse.buttock.z + drawn.clearance!,
    );
  }

  /**
   * The traces and the driving lines between a cart and the horse in harness
   * that draws it, for `AutoMovieArchetypeRide.towed`'s `lines`: a trace from
   * each point of draft at the breast collar's end to its end of the cart's
   * single tree, and a driving line from each bit ring through the neck strap's
   * ring and the saddle's terret to the driver's held run (Harness Stuff: the
   * reins pass from the bit through the rings on the breastplate's neck strap,
   * then the saddle's terrets, to the driver).
   *
   * @param cart A `cart` kind, built for the horse that draws it.
   * @param held Optional reader of the driver's displayed palm on each side at
   *   a film second, world metres: when given, each driving line's held run
   *   ends at that palm instead of the fixed material end, so the hand can
   *   shake, take up and give the line while it stays connected.
   * @returns The four lines, the traces first, left before right.
   * @throws {AutoMovieArchetypeRefusal} When the cart is not a horse's
   *   two-wheeled cart.
   */
  export function lines(
    cart: AutoMovieArchetype<AutoMovieArchetypeCart.Affordance, AutoMovieArchetypeCart.Dimension>,
    held?: AutoMovieArchetypeCart.Held,
  ): AutoMovieArchetypeRide.ILine[] {
    if (
      !cart.affordances.some(
        (a: { id: string }): boolean => a.id === "leftLine",
      )
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "cart",
        axis: "kind",
        value: cart.name,
        feasible: { kind: "alternatives", values: ["cart"] },
        reason: `the ${cart.name} has no single tree and no driving lines`,
        fix: "draw a cart kind built for a horse in harness",
      });
    const spread: number = AutoMovieArchetypeEquine.rig(cart.dimensions).draft
      .x;
    const ball = (part: string): AutoMovieArchetypeSpan.End => ({
      part,
      at: { x: 0, y: 0, z: 0 },
    });
    const traces: AutoMovieArchetypeRide.ILine[] = EquineHarness.SIDES.map(
      ([side, sign]: readonly [
        "left" | "right",
        number,
      ]): AutoMovieArchetypeRide.ILine => ({
        id: `trace-${side}`,
        radius: AutoMovieArchetypeCart.TRACE,
        points: [
          { leader: ball(EquineHarness.ENDS.draft[side]) },
          {
            trailer: {
              part: "single-tree",
              at: { x: 0, y: sign * spread, z: 0 },
            },
          },
        ],
      }),
    );
    const driving: AutoMovieArchetypeRide.ILine[] = EquineHarness.SIDES.map(
      ([side]: readonly [
        "left" | "right",
        number,
      ]): AutoMovieArchetypeRide.ILine => ({
        id: `line-${side}`,
        radius: AutoMovieArchetypeCart.LINE / 2,
        points: [
          { leader: ball(EquineHarness.ENDS.bit[side]) },
          { leader: ball(EquineHarness.ENDS.ring[side]) },
          { leader: ball(EquineHarness.ENDS.terret[side]) },
          held === undefined
            ? { trailer: { affordance: `${side}LineEnd` } }
            : {
                held: (seconds: number): IAutoMovieVector3 =>
                  held(side, seconds),
              },
        ],
      }),
    );
    return [...traces, ...driving];
  }
}
