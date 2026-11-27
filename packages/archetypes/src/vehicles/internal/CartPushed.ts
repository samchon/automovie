import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core";
import { AutoMovieArchetypeCart } from "../AutoMovieArchetypeCart";

/**
 * The carriers pushed by hand: a shopping trolley and a wheelbarrow, each built
 * on its drawn dimensions.
 */
export namespace CartPushed {
  /**
   * A shopping trolley: a basket over a chassis on four castors, pushed by the
   * one bar across its back.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   */
  export function trolley(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>,
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
      frame: AutoMovieArchetypeFrame.upright(v(0, handleHeight, bar)),
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
        frame: AutoMovieArchetypeFrame.upright(
          v((sign * width) / 4, handleHeight, bar),
        ),
        extent: null,
        grip: "power",
        aperture: d.gripDiameter!,
        length: width / 2,
      });
    builder.affordance({
      id: "load",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, floor, 0.075)),
      extent: null,
      width,
      depth: length - 0.15,
    });
  }

  /**
   * A wheelbarrow: a tray over one front wheel, two legs behind, and two
   * handles reaching back.
   *
   * @param builder The carrier under construction.
   * @param d The drawn dimensions.
   */
  export function wheelbarrow(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeCart.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const grip: number = d.gripDiameter! / 2;
    const wheel: number = d.wheelDiameter! / 2;
    const length: number = d.length!;
    const handleHeight: number = d.handleHeight!;

    // The tray's 0.88 m length and 0.3 m depth are authored.
    const tray: number = 0.88;
    const rear: number = -length / 2 + AutoMovieArchetypeCart.GRIP;
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
        frame: AutoMovieArchetypeFrame.facing(
          v(x, handleHeight, -length / 2 + AutoMovieArchetypeCart.GRIP / 2),
          v(0, 1, 0),
          v(0, 0, 1),
        ),
        extent: null,
        grip: "power",
        aperture: d.gripDiameter!,
        length: AutoMovieArchetypeCart.GRIP,
      });
    }
    builder.affordance({
      id: "load",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, handleHeight - 0.2, middle)),
      extent: null,
      width: d.width!,
      depth: tray,
    });
  }
}
