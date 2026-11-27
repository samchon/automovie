import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import type { AutoMovieArchetypeTransitBus } from "../AutoMovieArchetypeTransitBus";

/*
 * Adds forward-facing passenger rows and the aisle-side seat contact in
 * bus-local metres.
 */
export function addTransitBusSeating(
  builder: BusBuilder,
  floor: number,
  aisle: number,
  support: AutoMovieArchetypeBuilder.IOptions,
): void {
  for (const z of [-2.42, -1.57, -0.72, 0.13, 0.98, 1.83, 2.68])
    addSeatRow(1, z);
  for (const z of [-2.42, 0.98, 1.83, 2.68]) addSeatRow(-1, z);
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(
      v(aisle / 2 + SEAT_WIDTH / 2, floor + SEAT_HEIGHT, 0.98),
    ),
    extent: null,
    width: SEAT_WIDTH,
    depth: SEAT_DEPTH,
    back: BACK_HEIGHT,
  });

  /*
   * Adds a forward-facing pair with its front edge at frontZ.
   */
  function addSeatRow(side: -1 | 1, frontZ: number): void {
    const key: string = (side === -1 ? "curb-" : "street-") + frontZ;
    const backZ: number = frontZ - SEAT_DEPTH;
    const x: number = side * (aisle / 2 + SEAT_WIDTH);
    const y: number = floor + SEAT_HEIGHT;
    builder.box(
      key + "-support",
      v(0.1, SEAT_HEIGHT - 0.06, 0.26),
      v(x, (floor + y - 0.06) / 2, (frontZ + backZ) / 2),
      support,
    );
    for (const seat of [-1, 1] as const) {
      const centre: number = x + (seat * SEAT_WIDTH) / 2;
      const width: number = side === seat ? SEAT_WIDTH - 0.012 : SEAT_WIDTH;
      builder.box(
        key + "-cushion-" + seat,
        v(width, 0.06, SEAT_DEPTH),
        v(centre, y - 0.03, (frontZ + backZ) / 2),
        SEAT,
      );
      builder.box(
        key + "-back-" + seat,
        v(width, BACK_HEIGHT, 0.07),
        v(centre, y + BACK_HEIGHT / 2, backZ - 0.035),
        SEAT,
      );
    }
  }
}

/*
 * Bus geometry and affordances share the same builder.
 */
type BusBuilder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeTransitBus.Affordance,
  AutoMovieArchetypeTransitBus.Dimension
>;
/*
 * Nominal seat width including the gap between pads.
 */
const SEAT_WIDTH: number = 0.41;
/*
 * Seat pad depth measured back from its front edge.
 */
const SEAT_DEPTH: number = 0.43;
/*
 * Surface height of a seat pad above the deck.
 */
const SEAT_HEIGHT: number = 0.46;
/*
 * Passenger backrest height above the pad.
 */
const BACK_HEIGHT: number = 0.46;
/*
 * Upholstery marking the seat contact surfaces.
 */
const SEAT: AutoMovieArchetypeBuilder.IOptions = { color: "#306f80" };

/*
 * Vector constructor for metric bus-local dimensions.
 */
const v: typeof Vector3.create = Vector3.create;
