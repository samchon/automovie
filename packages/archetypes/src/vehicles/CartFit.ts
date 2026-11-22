import type { IAutoMovieVector3 } from "@automovie/interface";

import { EquineHarness } from "../animals/EquineHarness";
import { createHorse } from "../animals/createHorse";
import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  type AutoMovieArchetypeSpan,
  type IAutoMovieArchetypeBand,
} from "../core";
import { CART_MODELS } from "./CART_MODELS";
import { createCart } from "./createCart";

/**
 * A horse's cart fitted to its horse: the read models made for the horse an author fixed, the girth and shafts the drawn horse gives the cart, and the traces and driving lines between them. It is kept apart from `createCart` so each file stays within its size.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what fits a cart to its horse and why it is its own file.
 * @evidence contracts/development/design.md#principled-representation Two steps of the cart's draw: the models a fixed horse admits, and the dimensions the drawn horse gives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `models` and `harness`, which `createCart` calls for a horse's cart, and `lines`, which `createCart.lines` gives the towing ride.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The horse's sizes come from `createHorse` itself, never a copy.
 */
export namespace CartFit {
  /**
   * The models made for the horse an author fixed, each model without a stated range of horses made for every one.
   *
   * @param models The kind's read models.
   * @param params The parameters, whose fixed withers height selects.
   * @returns The models whose range admits the fixed withers height, or every model when it is free.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which models it keeps and when it keeps them all.
   * @evidence contracts/development/implementation.md#principled-implementation A model without a read range of horses is made for every horse; one with a range keeps the fixed height inside it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter over the kind's models.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: every model is kept or left by its read range.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over a handful of models.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call filters one kind's models.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function models(
    models:
      | Readonly<
          Partial<
            Record<
              createCart.Model,
              Readonly<Partial<Record<createCart.Dimension, number>>>
            >
          >
        >
      | undefined,
    params: createCart.IParams,
  ):
    | Readonly<
        Partial<
          Record<
            createCart.Model,
            Readonly<Partial<Record<createCart.Dimension, number>>>
          >
        >
      >
    | undefined {
    const withers: number | undefined = params.withersHeight;
    if (models === undefined || withers === undefined) return models;
    return Object.fromEntries(
      Object.entries(models).filter(([name]: [string, unknown]): boolean => {
        const band: IAutoMovieArchetypeBand | undefined =
          CART_MODELS.ranges[name as createCart.Model]?.withersHeight;
        return (
          band === undefined ||
          (band.minimum <= withers && withers <= band.maximum)
        );
      }),
    );
  }

  /**
   * A horse's cart fitted to the horse of its withers height: the girth that height gives the horse, and, where the cart's shafts are not read, shafts reaching from the horse's point of shoulder, where their tips stand, past its point of buttock by the drawn clearance to the single tree (IVC Carriage's 8 to 20 in from the horse to the vehicle's nearest part).
   *
   * @param draw The cart's draw, its height, clearance and any read shafts recorded; the girth and, where unread, the shafts' length are derived into it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is derived and from what.
   * @evidence contracts/development/implementation.md#principled-implementation The girth from the horse's own profile at the drawn height, and the shafts from the horse's rig, its point of shoulder to its point of buttock and the drawn clearance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The girth, then the shafts where none were read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read shafts are kept, never replaced by the derived length.
   * @evidence contracts/development/implementation.md#efficient-algorithms One rig.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call fits one cart.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function harness(
    draw: AutoMovieArchetypeDrawSession<createCart.Dimension>,
  ): void {
    const drawn: Readonly<Partial<Record<createCart.Dimension, number>>> =
      draw.values;
    const girth: number = draw.derive(
      "girth",
      createHorse.PROFILE.girth(drawn.withersHeight!),
    );
    if (drawn.shaftLength !== undefined) return;
    const horse: createHorse.IRig = createHorse.rig({
      withersHeight: drawn.withersHeight!,
      girth,
    });
    draw.derive(
      "shaftLength",
      horse.limbs.leftFore[0]!.z - horse.buttock.z + drawn.clearance!,
    );
  }

  /**
   * The traces and the driving lines between a cart and the horse in harness that draws it, for `AutoMovieArchetypeRide.towed`'s `lines`: a trace from each point of draft at the breast collar's end to its end of the cart's single tree, and a driving line from each bit ring through the neck strap's ring and the saddle's terret to the driver's held run (Harness Stuff: the reins pass from the bit through the rings on the breastplate's neck strap, then the saddle's terrets, to the driver).
   *
   * @param cart A `cart` kind, built for the horse that draws it.
   * @param held Optional reader of the driver's displayed palm on each side at a film second, world metres: when given, each driving line's held run ends at that palm instead of the fixed material end, so the hand can shake, take up and give the line while it stays connected.
   * @returns The four lines, the traces first, left before right.
   * @throws {AutoMovieArchetypeRefusal} When the cart is not a horse's two-wheeled cart.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four lines, where each runs and when it refuses.
   * @evidence contracts/development/implementation.md#principled-implementation Each trace goes from the collar's point of draft to the single tree at the horse's draft spread. Each driving line runs through the bit ring, the neck strap's ring and the terret to the material end behind the modeled hand station, or to the driver's displayed palm when a hand reader is given.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Refuse a cart without lines, then the traces, then the driving lines.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lines are straight runs between their points, the ride's to lay.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four lines of a few points.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call lays one cart's lines.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lines(
    cart: AutoMovieArchetype<createCart.Affordance, createCart.Dimension>,
    held?: createCart.Held,
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
    const spread: number = createHorse.rig(cart.dimensions).draft.x;
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
        radius: createCart.TRACE,
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
        radius: createCart.LINE / 2,
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
