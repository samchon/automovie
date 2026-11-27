import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPickUp,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { pickUp } from "../../handling/internal/pickUp";

/*
 * Take a mounted display object from its carrier with the ordinary pickup grip
 * and lift. Register this law in the composition that stages the carrier. A cut
 * to stand from grip closure through lift retains the hand's grip and the last
 * displayed pose, and a cut to `drawFromCarrier` from grip closure starts the
 * draw before the body straightens. The authored carrier and lift must allow
 * that pose to remain clear.
 *
 * The reach is the pick-up's, about 0.5 s for a 0.4 m reach, then a 0.15 s load
 * and a 0.1 m lift (`IAutoMovieMotionHumanPickUp`); taking a held item from its
 * carrier, a tray or a mannequin.
 */
export const HumanCarrierCustody: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanPickUp.IParams> =
  {
    name: "takeFromCarrier",
    family: pickUp.name,
    interrupts: {
      ...pickUp.interrupts,
      stand: [
        {
          window: { start: "gripClosed", end: "lifted" },
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
          window: { start: "gripClosed", end: 1 },
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
          window: { start: "gripClosed", end: 1 },
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
