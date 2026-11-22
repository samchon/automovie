import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPickUp,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { pickUp } from "../handling/pickUp";

/**
 * Take a mounted display object from its carrier with the ordinary pickup
 * grip and lift. Register this law in the composition that stages the carrier.
 * A cut to stand from grip closure through lift retains the hand's grip
 * and the last displayed pose, and a cut to `drawFromCarrier` from grip
 * closure starts the draw before the body straightens. The authored carrier and lift must allow
 * that pose to remain clear.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the staged motion, registration, retained grip and clearance premise.
 * @evidence contracts/development/design.md#principled-representation The ordinary pickup produces the same grip, lift and declared phases. Two additional windows make a stand cut retain the grip while the object is clearing the carrier and let a draw start at grip closure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This law supplies its own name and cut window and borrows the original typed pickup plan. Aperture placement owns the return.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The prop uses the existing hand and socket custody readers and the existing inertialized stand transition.
 */
export const HumanCarrierCustody: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPickUp.IParams> =
  {
    name: "takeFromCarrier",
    family: pickUp.name,
    interrupts: {
      ...pickUp.interrupts,
      stand: [
        {
          window: ["gripClosed", "lifted"],
          kind: "inertialize",
          entry: 0,
          blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
          keep: ["grip"],
        },
        ...pickUp.interrupts.stand!,
      ],
      // A draw begins at grip closure, before a lowered or turned body
      // straightens and moves the carrier away from the gripped prop.
      drawFromCarrier: [
        {
          window: ["gripClosed", 1],
          kind: "inertialize",
          entry: 0,
          blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
          keep: ["grip"],
        },
      ],
      // The other hand takes the hilt once this hand holds the carrier's
      // throat, both kept, as a long draw grips the scabbard first.
      takeFromCarrier: [
        {
          window: ["gripClosed", 1],
          kind: "inertialize",
          entry: 0,
          blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
          keep: ["grip"],
        },
      ],
    },
    // Over a carrier the pick-up claims only the reaching arm (`pickUpOver`).
    overlay: true,
    plan: pickUp.plan,
  };
