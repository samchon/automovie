import { Vector3 } from "@automovie/engine";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import type { createTransitBus } from "./createTransitBus";

/** Bus geometry and affordances share the same builder. */
type BusBuilder = ArchetypeBuilder<
  createTransitBus.Affordance,
  createTransitBus.Dimension
>;

/** Nominal seat width including the gap between pads. */
const SEAT_WIDTH: number = 0.41;
/** Seat pad depth measured back from its front edge. */
const SEAT_DEPTH: number = 0.43;
/** Surface height of a seat pad above the deck. */
const SEAT_HEIGHT: number = 0.46;
/** Passenger backrest height above the pad. */
const BACK_HEIGHT: number = 0.46;
/** Upholstery marking the seat contact surfaces. */
const SEAT: ArchetypeBuilder.IOptions = { color: "#306f80" };
/** Vector constructor for metric bus-local dimensions. */
const v: typeof Vector3.create = Vector3.create;

/**
 * Adds forward-facing passenger rows and the aisle-side seat contact in bus-local metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the seating geometry and reference frame.
 * @evidence contracts/development/implementation.md#principled-implementation Offsets the mirrored rows by the aisle half-width. The full-width aisle-side pads and backs bound the clearance, and the seat contact shares the cushion dimensions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The row placement and its sitting affordance share this seating assembly.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Curbside gaps remain in the prescribed row layout. The seat contact uses the same dimensions as its geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits each prescribed row once and emits a fixed number of solids per row.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing builder and the same seat dimensions for both sides and the affordance.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the attached solids and affordance remain in the builder.
 */
export function addTransitBusSeating(
  builder: BusBuilder,
  floor: number,
  aisle: number,
  support: ArchetypeBuilder.IOptions,
): void {
  for (const z of [-2.42, -1.57, -0.72, 0.13, 0.98, 1.83, 2.68])
    addSeatRow(1, z);
  for (const z of [-2.42, 0.98, 1.83, 2.68]) addSeatRow(-1, z);
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: ArchetypeFrame.upright(
      v(aisle / 2 + SEAT_WIDTH / 2, floor + SEAT_HEIGHT, 0.98),
    ),
    extent: null,
    width: SEAT_WIDTH,
    depth: SEAT_DEPTH,
    back: BACK_HEIGHT,
  });

  /** Adds a forward-facing pair with its front edge at frontZ. */
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
