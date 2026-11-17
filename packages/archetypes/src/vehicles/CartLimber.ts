import { Vector3 } from "@automovie/engine";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import { CartWheel } from "./CartWheel";
import { createCart } from "./createCart";

/** The body's paint. */
const BODY: string = "#2f4f3f";

/** Bare wood. */
const WOOD: string = "#8b6a43";

/** Iron. */
const METAL: string = "#55595f";

/**
 * The artillery limber among the drawn carriers, on one axle with its pole ahead and its pintle behind, kept apart from `CartDrawn` so each file stays within its size.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it builds and why it is its own file.
 * @evidence contracts/development/design.md#principled-representation One builder on the shared wheel pair, its sizes `createCart.LIMBER`'s.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `build`, which `createCart` calls for its limber.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wheels are `CartWheel`'s pair, not a copy.
 */
export namespace CartLimber {
  /**
   * An artillery limber: a frame on the axle carrying the ammunition chest, a pole ahead and the pintle hook behind.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and where each place comes from.
   * @evidence contracts/development/implementation.md#principled-implementation The frame, `length` long, rests on the axle from `LIMBER.rear` behind it, and the pole runs `poleLength` on from its front, level, its end the `coupling`. The chest, its inside the Ordnance Manual's, stands over the axle on the frame; its lid hinges at its rear edge, opening a quarter turn to stand upright, and is the gunners' forward-facing `seat`. The `pintle` hook is at the frame's rear end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Frame, chest, pole, hook, wheels.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The chest's boards (`LIMBER.board`) are a construction estimate and the pintle's height (`LIMBER.pintle`) a named provisional value; the pole is level until a team's harness holds it.
   * @evidence contracts/development/implementation.md#efficient-algorithms About ten parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function build(
    builder: ArchetypeBuilder<createCart.Affordance, createCart.Dimension>,
    d: Readonly<Partial<Record<createCart.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = d.wheelDiameter! / 2;
    const rear: number = -createCart.LIMBER.rear;
    const front: number = rear + d.length!;
    const tip: number = front + d.poleLength!;
    const chest: typeof createCart.LIMBER.chest = createCart.LIMBER.chest;
    const board: number = createCart.LIMBER.board;
    const width: number = chest.width + 2 * board;
    const across: number = chest.length + 2 * board;
    const base: number = radius + 0.08;
    const lid: number = base + chest.depth + 2 * board;
    builder.box(
      "frame",
      v(0.5, 0.08, d.length!),
      v(0, radius + 0.04, (rear + front) / 2),
      { color: WOOD },
    );
    builder.box(
      "chest",
      v(across, lid - base - board, width),
      v(0, (base + lid - board) / 2, 0),
      { color: BODY },
    );
    builder.box(
      "chest-lid",
      v(across, board, width),
      v(0, lid - board / 2, 0),
      { color: BODY, density: 0.5 },
    );
    builder.affordance({
      id: "chest",
      kind: "hinge",
      frame: ArchetypeFrame.facing(
        v(0, lid, -width / 2),
        v(-1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      travel: 90,
      parts: ["chest-lid"],
    });
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: ArchetypeFrame.upright(v(0, lid, width / 2)),
      extent: null,
      depth: width,
      width: across,
    });
    builder.rod(
      "pole",
      0.04,
      v(0, radius + 0.04, front),
      v(0, radius + 0.04, tip),
      { color: WOOD },
    );
    builder.affordance({
      id: "coupling",
      kind: "hook",
      frame: ArchetypeFrame.upright(v(0, radius + 0.04, tip)),
      extent: null,
    });
    const pintle: number = createCart.LIMBER.pintle;
    builder.rod("pintle", 0.02, v(0, pintle, rear), v(0, pintle, rear - 0.1), {
      color: METAL,
    });
    builder.affordance({
      id: "pintle",
      kind: "hook",
      frame: ArchetypeFrame.upright(v(0, pintle, rear - 0.08)),
      extent: null,
    });
    CartWheel.pair(builder, {
      track: d.track!,
      radius,
      spokes: 12,
      z: 0,
      prefix: "",
      spins: ["leftSpin", "rightSpin"],
    });
  }
}
