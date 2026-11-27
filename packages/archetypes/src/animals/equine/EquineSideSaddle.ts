import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core";
import { type AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import { EquineSaddle } from "./EquineSaddle";
import { EquineStirrup } from "./EquineStirrup";
import type { EquineTack } from "./EquineTack";
import { QuadrupedAttachments } from "../quadruped/QuadrupedAttachments";

/*
 * An equid's side saddle, laid on its body: a flat seat, the fixed head (the
 * upper pommel) the right leg goes round, the leaping head (the lower pommel)
 * curved over the left thigh, one stirrup on the near side and the two reins.
 * The Side Saddle Association's introduction gives the arrangement: "your right
 * leg goes around the top one, and then hangs down", the left leg lies under
 * "the second or lower pommel – the leaping head", the "left foot will be in a
 * stirrup", and the rider sits "absolutely straight and square"
 * (https://sidesaddleassociation.co.uk/introsidesaddle.asp). Both legs are on
 * the near side, `+X`, so the tack is asymmetric by construction.
 *
 * The seat is entered sideways, facing the near side, as a rider is legged up
 * onto a side saddle before lifting the right leg over the fixed head; its
 * `seat` contact therefore faces `+X`, is sat with the legs ahead and reaches
 * back across the saddle to its spine. Every size is an estimate no source read
 * gives, named here; the saddle's weight is a press figure.
 */
export namespace EquineSideSaddle {
  /*
   * The side saddle's mass, kilograms: traditional side saddles of beechwood,
   * iron and leather "typically weighed around 22lb (10kg)" (Horse & Hound,
   * "Riding side-saddle",
   * https://www.horseandhound.co.uk/news/riding-side-saddle-39657). Added on
   * top of the equid's drawn mass; the stirrup, the reins and the lead are
   * massless, as on the riding saddle.
   */
  export const WEIGHT: number = 10;

  /*
   * The flat seat's width across the back, metres: an estimate, wider than the
   * riding saddle's `EquineSaddle.SEAT_WIDTH`, no source read gives it.
   */
  export const WIDTH: number = 0.36;

  /*
   * The fixed head's rise above the seat and its offset to the near side of the
   * spine, metres: estimates.
   */
  export const HEAD: Readonly<{ rise: number; near: number }> = {
    rise: 0.1,
    near: 0.04,
  };

  /*
   * How much shorter the near stirrup leather hangs than the riding saddle's
   * drop, metres: an estimate for the bent left leg under the leaping head.
   */
  export const SHORTER: number = 0.1;

  /*
   * Lay the side saddle, its heads, its stirrup and its reins on an equid under
   * construction.
   * Parameter builder: The equid under construction, its body laid.
   * Parameter d: The equid's dimensions.
   * Parameter rig: The equid's rest rig.
   */
  export function lay(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    d: EquineTack.Dimensions,
    rig: AutoMovieArchetypeEquine.IRig,
  ): void {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    const top: number = rig.back + 0.04;
    const centre: number = rig.hitch.z;
    const front: number = centre + d.seatSize / 2;
    builder.box(
      "saddle",
      v(WIDTH, 0.04, d.seatSize),
      v(0, top - 0.02, centre),
      {
        color: "#3a2a20",
        share: (100 * WEIGHT) / d.mass,
      },
    );

    // Sat sideways from the near side, behind the fixed head so the right thigh clears it, the sitting surface reaching back to the spine; the stirrup lies behind it, under the sitter's left foot.
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.facing(
        v(WIDTH / 2, top, centre - 0.06),
        v(0, 1, 0),
        v(0, 0, -1),
      ),
      extent: null,
      depth: WIDTH / 2 + 0.02,
      width: d.seatSize / 2,
    });

    // The fixed head rises at the front just left of the spine; the right thigh lies over its top.
    const head: IAutoMovieVector3 = v(HEAD.near, top + HEAD.rise, front - 0.02);
    builder.rod("fixed-head", 0.025, v(HEAD.near, top, front - 0.06), head, {
      color: "#3a2a20",
      share: 0,
    });
    builder.affordance({
      id: "fixedHead",
      kind: "bar",
      frame: AutoMovieArchetypeFrame.facing(head, v(0, 1, 0), v(0, 0, 1)),
      extent: null,
      aperture: 0.05,
      length: 0.08,
    });

    // The leaping head curves down and forward on the near side; the left thigh presses up under it.
    const from: IAutoMovieVector3 = v(0.1, top - 0.01, front - 0.16);
    const to: IAutoMovieVector3 = v(0.17, top - 0.06, front - 0.08);
    builder.rod("leaping-head", 0.02, from, to, {
      color: "#3a2a20",
      share: 0,
    });
    builder.affordance({
      id: "leapingHead",
      kind: "bar",
      frame: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.lerp(from, to, 0.5),
        v(0, -1, 0),
        AutoMovieEngineVector3.subtract(to, from),
      ),
      extent: null,
      aperture: 0.04,
      length: AutoMovieEngineVector3.distance(from, to),
    });

    // One stirrup, on the near side only.
    EquineStirrup(builder, {
      side: "left",
      tread: v(rig.barrel + 0.03, top - d.stirrupDrop + SHORTER, centre - 0.12),
      width: d.stirrupWidth,
      drop: d.stirrupDrop - SHORTER,
      saddle: { x: WIDTH / 2, y: top - 0.02 },
      barrel: QuadrupedAttachments.solids(rig).trunk,
      color: "#3a2a20",
    });
    EquineSaddle.rein(builder, d, rig, "left");
    EquineSaddle.rein(builder, d, rig, "right");
  }
}
