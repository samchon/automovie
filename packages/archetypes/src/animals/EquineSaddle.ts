import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { EquineStirrup } from "./EquineStirrup";
import type { EquineTack } from "./EquineTack";
import { QuadrupedAttachments } from "./QuadrupedAttachments";

/**
 * An equid's riding tack, laid on its body: a riding saddle with its seat,
 * pommel and cantle, two stirrups on their leathers, two reins from the mouth
 * back to the hands, and the lead rope beside the head. It is kept apart from
 * `createHorse` so each file stays within its size.
 *
 * The saddle sits on the back where the rig's `hitch` is,
 * `AutoMovieArchetypeEquine.SADDLE` behind the shoulder joints, and its read
 * weight is added on top of the equid's drawn mass; every other part is
 * massless, no maker's weight having been read for it.
 */
export namespace EquineSaddle {
  /**
   * Flexible reins/lead follow two declared span anchors, so none is a rigid
   * head-carried part.
   */
  export const HEAD: readonly string[] = [];

  /**
   * The length of strap a hand closes on, metres, for a rein and for the lead
   * rope: a hand's breadth and a half, and two; estimates, no source read gives
   * them.
   */
  export const HELD: Readonly<{ rein: number; lead: number }> = {
    rein: 0.2,
    lead: 0.3,
  };

  /**
   * A pillion pad's depth along the back and its thickness, metres: estimates,
   * no source read gives them.
   */
  export const PILLION: Readonly<{ depth: number; thick: number }> = {
    depth: 0.32,
    thick: 0.03,
  };

  /** The gap between the cantle and a pillion pad's front, metres: an estimate. */
  export const SADDLE_GAP: number = 0.02;

  /** The saddle's seat width, metres: an estimate, no source read gives it. */
  export const SEAT_WIDTH: number = 0.3;

  /**
   * The riding saddle's mass, kilograms: the Wintec 500 All Purpose's
   * "Approximate weight: 5.4 kg/11.9 lb", stirrup straps and girth not
   * included, at its maker's page
   * (https://wintec-saddles.com.au/products/wintec-500-all-purpose), the saddle
   * whose seat sizes `AutoMovieArchetypeEquine.SEATS` reads. It is added on top
   * of the equid's drawn mass, its share that weight as a percent of the
   * equid's. The stirrups, the leathers, the reins and the lead rope are
   * massless, a share of 0: no maker's weight was read for them (searched:
   * Weaver's lead ropes, retailer shipping weights only, 1.0 to 1.3 lb,
   * secondary).
   */
  export const WEIGHT: number = 5.4;

  /**
   * A lead rope's diameter, metres: 5/8 in, a Weaver Leather cotton lead seen
   * only in retailer listings.
   */
  export const LEAD: number = (5 / 8) * AutoMovieArchetypeUnits.INCH;

  /**
   * Lay the riding saddle, its stirrups and its reins on an equid under
   * construction.
   *
   * @param builder The equid under construction, its body laid.
   * @param d The equid's dimensions.
   * @param rig The equid's rest rig.
   */
  export function lay(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    d: EquineTack.Dimensions,
    rig: AutoMovieArchetypeEquine.IRig,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const back: number = rig.back;
    // The saddle on the back behind the withers, and what the rider holds and stands in.
    const top: number = back + 0.04;
    const centre: number = rig.hitch.z;
    builder.box(
      "saddle",
      v(SEAT_WIDTH, 0.04, d.seatSize),
      v(0, top - 0.02, centre),
      { color: "#4a3324", share: (100 * WEIGHT) / d.mass },
    );
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(
        v(0, top, centre + d.seatSize / 2),
      ),
      extent: null,
      depth: d.seatSize,
      width: SEAT_WIDTH,
      astride: true,

      // A horse is mounted from its near side, the left.
      mount: "left",
    });
    for (const [id, z] of [
      ["pommel", centre + d.seatSize / 2],
      ["cantle", centre - d.seatSize / 2],
    ] as const) {
      builder.rod(id, 0.015, v(-0.06, top + 0.03, z), v(0.06, top + 0.03, z), {
        color: "#4a3324",
        share: 0,
      });
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.upright(v(0, top + 0.03, z)),
        extent: null,
        grip: "power",
        aperture: 0.03,
        length: 0.12,
      });
    }
    const barrel: QuadrupedAttachments.ICapsule =
      QuadrupedAttachments.solids(rig).trunk;
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      EquineStirrup(builder, {
        side,
        tread: v(
          sign * (barrel.radius + 0.03),
          top - d.stirrupDrop,
          centre + 0.05,
        ),
        width: d.stirrupWidth,
        drop: d.stirrupDrop,
        saddle: { x: SEAT_WIDTH / 2, y: top - 0.02 },
        barrel,
        color: "#4a3324",
      });
      rein(builder, d, rig, side);
    }
  }

  /**
   * Lay one rein from the corner of the mouth back to where the hand holds it
   * above the withers, with its `leftRein` or `rightRein` contact. Every
   * bridled tack lays the same reins.
   *
   * @param builder The equid under construction, its body laid.
   * @param d The equid's dimensions.
   * @param rig The equid's rest rig.
   * @param side The rein's side: `left` on `+X`, `right` on `-X`.
   */
  export function rein(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    d: EquineTack.Dimensions,
    rig: AutoMovieArchetypeEquine.IRig,
    side: "left" | "right",
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const sign: number = side === "left" ? 1 : -1;
    const hand: IAutoMovieVector3 = v(
      sign * 0.08,
      rig.back + 0.15,
      rig.trunk / 2 - 0.1,
    );
    const bit: IAutoMovieVector3 = v(
      sign * 0.05 * d.withersHeight,
      rig.mouth.y,
      rig.mouth.z,
    );
    builder.affordance({
      id: `${side}Rein`,
      kind: "rein",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        hand,
        v(0, 1, 0),
        Vector3.subtract(bit, hand),
      ),
      extent: null,
      grip: "power",
      aperture: d.reinWidth,
      length: HELD.rein,
    });

    // The occupied held run stays on the line even as the bit moves.
    builder.span(
      `rein-${side}`,
      { affordance: `${side}Rein`, overhang: HELD.rein / 2 },
      builder.anchor("head", bit),
      d.reinWidth / 2,
      { color: "#4a3324", share: 0 },
    );
  }

  /**
   * A bareback seat's depth along the back, metres: an estimate of the stretch
   * behind the withers a rider sits on, no source read gives it.
   */
  export const BAREBACK: number = 0.45;

  /**
   * Lay a bareback bridle: the two reins and a `seat` contact on the horse's
   * own back where a saddle would sit, with no saddle, stirrup or handle. The
   * seat is sat astride and mounted from the near side; its height is the back
   * itself, so the rider sits a saddle's thickness lower than in the riding
   * saddle.
   *
   * @param builder The equid under construction, its body laid.
   * @param d The equid's dimensions.
   * @param rig The equid's rest rig.
   */
  export function bareback(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    d: EquineTack.Dimensions,
    rig: AutoMovieArchetypeEquine.IRig,
  ): void {
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, rig.back, rig.hitch.z + BAREBACK / 2),
      ),
      extent: null,
      depth: BAREBACK,
      width: SEAT_WIDTH,
      astride: true,
      mount: "left",
    });
    rein(builder, d, rig, "left");
    rein(builder, d, rig, "right");
  }

  /**
   * Lay a pillion pad on the loins behind the riding saddle's cantle, with the
   * passenger's `pillion` seat astride on it, entered from the near side. Lay
   * the saddle first.
   *
   * @param builder The equid under construction, its saddle laid.
   * @param d The equid's dimensions.
   * @param rig The equid's rest rig.
   */
  export function pillion(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    d: EquineTack.Dimensions,
    rig: AutoMovieArchetypeEquine.IRig,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const front: number = rig.hitch.z - d.seatSize / 2 - SADDLE_GAP;
    const top: number = rig.back + PILLION.thick;
    builder.box(
      "pillionPad",
      v(SEAT_WIDTH, PILLION.thick, PILLION.depth),
      v(0, top - PILLION.thick / 2, front - PILLION.depth / 2),
      { color: "#5b4030", share: 0 },
    );
    builder.affordance({
      id: "pillion",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, front)),
      extent: null,
      depth: PILLION.depth,
      width: SEAT_WIDTH,
      astride: true,
      mount: "left",
    });
  }

  /**
   * A trick saddle's fittings, metres: the horn's height over the pommel, a
   * side strap's drop below the seat and the hippodrome strap's height over it;
   * estimates, no source read gives them.
   */
  export const TRICK: Readonly<{
    horn: number;
    strap: number;
    hippodrome: number;
  }> = {
    horn: 0.12,
    strap: 0.25,
    hippodrome: 0.03,
  };

  /**
   * Lay a trick rider's fittings on the riding saddle: a tall horn over the
   * pommel, a handhold on each side of it, a foot strap hanging on each side
   * for the drags and a hippodrome strap across the seat that a standing
   * rider's feet go under. Lay the saddle first.
   *
   * @param builder The equid under construction, its saddle laid.
   * @param d The equid's dimensions.
   * @param rig The equid's rest rig.
   */
  export function trick(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    d: EquineTack.Dimensions,
    rig: AutoMovieArchetypeEquine.IRig,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const top: number = rig.back + 0.04;
    const pommel: number = rig.hitch.z + d.seatSize / 2;
    const hornTop: number = top + 0.03 + TRICK.horn;
    builder.rod(
      "horn",
      0.015,
      v(0, top + 0.03, pommel),
      v(0, hornTop, pommel),
      {
        color: "#4a3324",
        share: 0,
      },
    );
    builder.affordance({
      id: "horn",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.upright(v(0, hornTop, pommel)),
      extent: null,
      grip: "power",
      aperture: 0.03,
      length: 0.08,
    });
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      builder.affordance({
        id: `${side}Handhold`,
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.upright(
          v(sign * (SEAT_WIDTH / 2), top, pommel),
        ),
        extent: null,
        grip: "power",
        aperture: 0.03,
        length: 0.1,
      });
      const x: number = sign * (rig.barrel + 0.03);
      const strap: IAutoMovieVector3 = v(x, top - TRICK.strap, pommel);
      builder.rod(`strap-${side}`, 0.008, v(x, top - 0.02, pommel), strap, {
        color: "#4a3324",
        share: 0,
      });
      builder.affordance({
        id: `${side}Strap`,
        kind: "stirrup",
        frame: AutoMovieArchetypeFrame.upright(strap),
        extent: null,
        width: 0.1,
        length: TRICK.strap,
      });
    }
    const middle: number = rig.hitch.z;
    const over: number = top + TRICK.hippodrome;
    builder.rod(
      "hippodrome",
      0.008,
      v(-SEAT_WIDTH / 2, over, middle),
      v(SEAT_WIDTH / 2, over, middle),
      {
        color: "#4a3324",
        share: 0,
      },
    );
    builder.affordance({
      id: "hippodrome",
      kind: "stirrup",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, middle)),
      extent: null,
      width: SEAT_WIDTH,
      length: TRICK.hippodrome,
    });
  }

  /**
   * Lay the lead rope's held run beside the head on the equid's left, up to the
   * halter, with its `lead` contact.
   *
   * @param builder The equid under construction.
   * @param nose The rig's nose.
   * @param h The height at the withers, metres.
   */
  export function lead(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    nose: IAutoMovieVector3,
    h: number,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const held: IAutoMovieVector3 = v(0.25, nose.y - 0.35, nose.z - 0.05);
    const halter: IAutoMovieVector3 = v(0.03 * h, nose.y, nose.z - 0.05 * h);
    builder.affordance({
      id: "lead",
      kind: "rein",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        held,
        v(1, 0, 0),
        Vector3.subtract(halter, held),
      ),
      extent: null,
      grip: "power",
      aperture: LEAD,
      length: HELD.lead,
    });
    builder.span(
      "lead",
      { affordance: "lead", overhang: HELD.lead / 2 },
      builder.anchor("head", halter),
      LEAD / 2,
      { color: "#d8d2c4", share: 0 },
    );
  }
}
