import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../core";
import type { AutoMovieArchetypeGoal } from "./AutoMovieArchetypeGoal";

/** Point shorthand in the goal's model frame. */
const v: typeof Vector3.create = Vector3.create;

/**
 * How far the backboard's bottom edge lies below the ring's top, metres: FIBA
 * Basketball Equipment 1.1.5, the rectangle's base level with the ring's top
 * and 150 mm above the backboard's bottom edge.
 */
const BOARD_BELOW_RING: number = 0.15;

/** How many rods a basketball ring is drawn with. */
const RING_RODS: number = 16;

/**
 * Build a basketball hoop: the backboard, the ring out from its face on a
 * bracket, the ring's top at the rule's height; `rim` is the ring's front, a
 * bar, and `board` the backboard's face.
 *
 * @param builder The goal builder to fill with the ring and board.
 * @param d Dimensions in metres drawn from the basketball hoop bands.
 */
export function buildBasketballHoop(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeGoal.Affordance,
    AutoMovieArchetypeGoal.Dimension
  >,
  d: Partial<Record<AutoMovieArchetypeGoal.Dimension, number>>,
): void {
  const bottom: number = d.height! - BOARD_BELOW_RING;
  const metal: number = d.bar!;
  const y: number = d.height! - metal / 2;
  const radius: number = d.ring! / 2 + metal / 2;
  const centre: number = d.offset! + d.ring! / 2;
  builder.box(
    "backboard",
    v(d.width!, d.board!, d.thickness!),
    v(0, bottom + d.board! / 2, -d.thickness! / 2),
    { color: "#e8f1f5" },
  );
  builder.rod("bracket", metal / 2, v(0, y, 0), v(0, y, d.offset!), {
    color: "#d9531e",
  });

  // Each rod a tangent to the ring's circle at its middle, so the rods' middles lie on the circle.
  const step: number = (2 * Math.PI) / RING_RODS;
  const corner: number = radius / Math.cos(step / 2);
  const at = (angle: number): ReturnType<typeof Vector3.create> =>
    v(corner * Math.sin(angle), y, centre + corner * Math.cos(angle));
  for (let k: number = 0; k < RING_RODS; k++)
    builder.rod(
      `ring-${k + 1}`,
      metal / 2,
      at((k - 0.5) * step),
      at((k + 0.5) * step),
      {
        color: "#d9531e",
      },
    );
  builder.affordance({
    id: "rim",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, y, centre + radius),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "hook",
    aperture: metal,
    length: 2 * radius * Math.tan(step / 2),
  });
  builder.affordance({
    id: "board",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, bottom + d.board! / 2, 0),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.width!,
    depth: d.board!,
  });
}
