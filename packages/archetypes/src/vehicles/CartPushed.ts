import { Vector3 } from "@automovie/engine";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";
import { createCart } from "./createCart";

/**
 * The carriers pushed by hand: a shopping trolley and a wheelbarrow, each built on its drawn dimensions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it builds.
 * @evidence contracts/development/design.md#principled-representation A basket or tray box on wheels with handle bars at the drawn height.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two builders `createCart` calls for its pushed kinds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each kind is its own builder; no shared shape is forced on both.
 */
export namespace CartPushed {
  /**
   * A shopping trolley: a basket over a chassis on four castors, pushed by the one bar across its back.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built.
   * @evidence contracts/development/implementation.md#principled-implementation The basket stands over its chassis on two rear uprights and carries the push bar on two arms from its rear rim; the handle's frame lies on the bar's axis with the bar's diameter as its `aperture`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Basket, chassis, castors, then what joins them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The basket is one solid box held at its rear, its wire mesh, child seat and front supports not modelled.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eleven parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function trolley(
    builder: ArchetypeBuilder<createCart.Affordance, createCart.Dimension>,
    d: Readonly<Partial<Record<createCart.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const grip: number = d.gripDiameter! / 2;
    const wheel: number = d.wheelDiameter! / 2;
    const length: number = d.length!;
    const width: number = d.width!;
    const handleHeight: number = d.handleHeight!;
    const floor: number = d.wheelDiameter! + 0.3;
    builder.box(
      "basket",
      v(width, handleHeight - 0.08 - floor, length - 0.15),
      v(0, (handleHeight - 0.08 + floor) / 2, 0.075),
      { color: "#b9bcc0", density: 0.1 },
    );
    builder.box(
      "chassis",
      v(width, 0.03, length - 0.15),
      v(0, d.wheelDiameter! + 0.015, 0.075),
      { color: "#8a8d91" },
    );
    for (const [name, x, z] of [
      ["castor-front-left", 1, 1],
      ["castor-front-right", -1, 1],
      ["castor-rear-left", 1, -1],
      ["castor-rear-right", -1, -1],
    ] as const)
      builder.rod(
        name,
        wheel,
        v(
          x * (width / 2 - 0.05) - 0.015,
          wheel,
          z * (length / 2 - 0.2) + 0.075,
        ),
        v(
          x * (width / 2 - 0.05) + 0.015,
          wheel,
          z * (length / 2 - 0.2) + 0.075,
        ),
        { color: "#22262b" },
      );
    const bar: number = -length / 2 + grip;

    // What joins the three: an upright under each rear corner of the basket, and an arm from the basket's rear rim to each end of the bar.
    const back: number = -length / 2 + 0.15;
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const x: number = sign * (width / 2 - grip);
      builder.rod(
        `upright-${side}`,
        grip,
        v(x, d.wheelDiameter! + 0.03, back + grip),
        v(x, floor, back + grip),
        { color: "#8a8d91" },
      );
      builder.rod(
        `arm-${side}`,
        grip,
        v(x, handleHeight - 0.08, back),
        v(x, handleHeight, bar),
        { color: "#8a8d91" },
      );
    }
    builder.rod(
      "handle",
      grip,
      v(-width / 2, handleHeight, bar),
      v(width / 2, handleHeight, bar),
      { color: "#c0392b" },
    );
    builder.affordance({
      id: "handle",
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.upright(v(0, handleHeight, bar)),
      extent: null,
      grip: "power",
      aperture: d.gripDiameter!,
      length: width,
    });
    for (const [id, sign] of [
      ["leftHandle", 1],
      ["rightHandle", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "bar",
        symmetry: "round",
        frame: ArchetypeFrame.upright(v((sign * width) / 4, handleHeight, bar)),
        extent: null,
        grip: "power",
        aperture: d.gripDiameter!,
        length: width / 2,
      });
    builder.affordance({
      id: "load",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, floor, 0.075)),
      extent: null,
      width,
      depth: length - 0.15,
    });
  }

  /**
   * A wheelbarrow: a tray over one front wheel, two legs behind, and two handles reaching back.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built.
   * @evidence contracts/development/implementation.md#principled-implementation Each handle's frame lies on its grip's axis with the grip's diameter as its `aperture`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Tray, wheel, then each side's shaft, grip, leg and handle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wheelbarrow rests on its legs, handles at rest height; lifting it is the pushing act's to pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function wheelbarrow(
    builder: ArchetypeBuilder<createCart.Affordance, createCart.Dimension>,
    d: Readonly<Partial<Record<createCart.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const grip: number = d.gripDiameter! / 2;
    const wheel: number = d.wheelDiameter! / 2;
    const length: number = d.length!;
    const handleHeight: number = d.handleHeight!;
    const tray: number = 0.88;
    const rear: number = -length / 2 + createCart.GRIP;
    const middle: number = length / 2 - d.wheelDiameter! - tray / 2 + 0.2;
    builder.box(
      "tray",
      v(d.width!, 0.3, tray),
      v(0, handleHeight - 0.05, middle),
      {
        color: "#4f7f5a",
        density: 0.2,
      },
    );
    builder.rod(
      "wheel",
      wheel,
      v(-0.04, wheel, length / 2 - wheel),
      v(0.04, wheel, length / 2 - wheel),
      { color: "#22262b", surface: "rubber" },
    );
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const x: number = (sign * d.handleSpacing!) / 2;
      builder.rod(
        `shaft-${side}`,
        grip,
        v(x, handleHeight, rear),
        v(sign * 0.08, wheel, length / 2 - wheel),
        { color: "#8a8d91" },
      );
      builder.rod(
        `grip-${side}`,
        grip,
        v(x, handleHeight, -length / 2),
        v(x, handleHeight, rear),
        { color: "#22262b" },
      );
      builder.rod(
        `leg-${side}`,
        0.015,
        v(x * 0.8, 0, -0.1),
        v(x * 0.8, handleHeight - 0.2, -0.1),
        { color: "#8a8d91" },
      );
      builder.affordance({
        id: `${side}Handle`,
        kind: "handle",
        symmetry: "round",
        frame: ArchetypeFrame.facing(
          v(x, handleHeight, -length / 2 + createCart.GRIP / 2),
          v(0, 1, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "power",
        aperture: d.gripDiameter!,
        length: createCart.GRIP,
      });
    }
    builder.affordance({
      id: "load",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, handleHeight - 0.2, middle)),
      extent: null,
      width: d.width!,
      depth: tray,
    });
  }
}
