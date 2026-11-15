import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame, ArchetypeUnits } from "../core";
import type { createHorse } from "./createHorse";

/**
 * An equid's riding tack, laid on its body: a riding saddle with its seat, pommel and cantle, two stirrups on their leathers, two reins from the mouth back to the hands, and the lead rope beside the head. It is kept apart from `createHorse` so each file stays within its size.
 *
 * The saddle sits on the back where the rig's `hitch` is, `createHorse.SADDLE` behind the shoulder joints, and its read weight is added on top of the equid's drawn mass; every other part is massless, no maker's weight having been read for it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is laid, where the saddle sits and which parts carry mass.
 * @evidence contracts/development/design.md#principled-representation The saddle as a box, the straps as round bars, the contacts as a seat, handles, stirrups and reins.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `lay` and `lead`, with the saddle's read weight and the estimates they read; `createHorse` calls them for `tack` `saddle`, `both` and `pack`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every size no source gives is a named estimate; the saddle's weight is its maker's.
 */
export namespace HorseSaddle {
  /** The length of strap a hand closes on, metres, for a rein and for the lead rope: a hand's breadth and a half, and two; estimates, no source read gives them. */
  export const HELD: Readonly<{ rein: number; lead: number }> = {
    rein: 0.2,
    lead: 0.3,
  };

  /** The saddle's seat width, metres: an estimate, no source read gives it. */
  export const SEAT_WIDTH: number = 0.3;

  /** The riding saddle's mass, kilograms: the Wintec 500 All Purpose's "Approximate weight: 5.4 kg/11.9 lb", stirrup straps and girth not included, at its maker's page (https://wintec-saddles.com.au/products/wintec-500-all-purpose), the saddle whose seat sizes `createHorse.SEATS` reads. It is added on top of the equid's drawn mass, its share that weight as a percent of the equid's. The stirrups, the leathers, the reins and the lead rope are massless, a share of 0: no maker's weight was read for them (searched: Weaver's lead ropes, retailer shipping weights only, 1.0 to 1.3 lb, secondary). */
  export const WEIGHT: number = 5.4;

  /** A lead rope's diameter, metres: 5/8 in, a Weaver Leather cotton lead seen only in retailer listings. */
  export const LEAD: number = (5 / 8) * ArchetypeUnits.INCH;

  /**
   * Lay the riding saddle, its stirrups and its reins on an equid under construction.
   *
   * @param builder The equid under construction, its body laid.
   * @param d The equid's dimensions.
   * @param rig The equid's rest rig.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it adds and what it reads.
   * @evidence contracts/development/implementation.md#principled-implementation The saddle on the back over the rig's hitch, the stirrups hanging their drawn drop below it beside the barrel, each rein from the corner of the mouth back to where the hand holds it above the withers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The saddle and its seat, the pommel and cantle, then each side's stirrup and rein.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The saddle is a box; only it carries mass, as a percent of the equid's, the body's shares being percents of its mass (`QuadrupedBody.lay`).
   * @evidence contracts/development/implementation.md#efficient-algorithms Nine parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one saddle.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lay(
    builder: ArchetypeBuilder<createHorse.Affordance, createHorse.Dimension>,
    d: Readonly<Record<createHorse.Dimension, number>>,
    rig: createHorse.IRig,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const h: number = d.withersHeight;
    const barrel: number = rig.barrel;
    const back: number = rig.back;
    const half: number = rig.trunk / 2;
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
      frame: ArchetypeFrame.upright(v(0, top, centre + d.seatSize / 2)),
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
      builder.rod(
        id,
        0.015,
        v(-0.06, top + 0.03, z),
        v(0.06, top + 0.03, z),
        {
          color: "#4a3324",
          share: 0,
        },
      );
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "none",
        frame: ArchetypeFrame.upright(v(0, top + 0.03, z)),
        extent: null,
        grip: "power",
        aperture: 0.03,
        length: 0.12,
      });
    }
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const x: number = sign * (barrel + 0.03);
      const tread: IAutoMovieVector3 = v(x, top - d.stirrupDrop, centre + 0.05);
      builder.rod(
        `leather-${side}`,
        0.008,
        v(x, top - 0.02, centre + 0.05),
        v(x, tread.y + 0.01, tread.z),
        { color: "#4a3324", share: 0 },
      );
      builder.box(
        `stirrup-${side}`,
        v(d.stirrupWidth, 0.01, 0.05),
        v(x, tread.y - 0.005, tread.z),
        { color: "#b9bcc0", share: 0 },
      );
      builder.affordance({
        id: `${side}Stirrup`,
        kind: "stirrup",
        frame: ArchetypeFrame.upright(tread),
        extent: null,
        width: d.stirrupWidth,
        length: d.stirrupDrop,
      });

      // A rein from the corner of the mouth back to where the hand holds it, above the withers.
      const hand: IAutoMovieVector3 = v(sign * 0.08, back + 0.15, half - 0.1);
      const bit: IAutoMovieVector3 = v(
        sign * 0.05 * h,
        rig.mouth.y,
        rig.mouth.z,
      );
      // The strap runs on behind the hand by half the held run, so the run the hand closes on is all strap.
      const run: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(bit, hand),
      );
      builder.rod(
        `rein-${side}`,
        d.reinWidth / 2,
        Vector3.subtract(hand, Vector3.scale(run, HELD.rein / 2)),
        bit,
        { color: "#4a3324", share: 0 },
      );
      builder.affordance({
        id: `${side}Rein`,
        kind: "rein",
        symmetry: "round",
        frame: ArchetypeFrame.facing(hand, v(0, 1, 0), Vector3.subtract(bit, hand)),
        extent: null,
        grip: "power",
        aperture: d.reinWidth,
        length: HELD.rein,
      });
    }
  }

  /**
   * Lay the lead rope's held run beside the head on the equid's left, up to the halter, with its `lead` contact.
   *
   * @param builder The equid under construction.
   * @param nose The rig's nose.
   * @param h The height at the withers, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it lays and where.
   * @evidence contracts/development/implementation.md#principled-implementation The rope from the held point beside the head to the halter at the nose, running on behind the hand by half the held run so the run the hand closes on is all rope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rod and its contact.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rope is straight and massless, no maker's weight read.
   * @evidence contracts/development/implementation.md#efficient-algorithms One part.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one rope.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lead(
    builder: ArchetypeBuilder<createHorse.Affordance, createHorse.Dimension>,
    nose: IAutoMovieVector3,
    h: number,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const held: IAutoMovieVector3 = v(0.25, nose.y - 0.35, nose.z - 0.05);
    const halter: IAutoMovieVector3 = v(0.03 * h, nose.y, nose.z - 0.05 * h);
    builder.rod(
      "lead",
      LEAD / 2,
      Vector3.subtract(
        held,
        Vector3.scale(
          Vector3.normalize(Vector3.subtract(halter, held)),
          HELD.lead / 2,
        ),
      ),
      halter,
      { color: "#d8d2c4", share: 0 },
    );
    builder.affordance({
      id: "lead",
      kind: "rein",
      symmetry: "round",
      frame: ArchetypeFrame.facing(held, v(1, 0, 0), Vector3.subtract(halter, held)),
      extent: null,
      grip: "power",
      aperture: LEAD,
      length: HELD.lead,
    });
  }
}
