import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core";
import { BOAT_MODELS } from "./BOAT_MODELS";
import { createBoat } from "./createBoat";

/**
 * A rowboat's oars: their sizes from the oarlocks' span, their places in the oarlocks, and the angles of a stroke.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it builds and what it gives the rowing ride.
 * @evidence contracts/development/design.md#principled-representation Each oar a swivel of two chained articulations, a turn about the upright and a lift about the pin riding it, with the handle riding the lift; the geometry one record the builder and the ride share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `build` for `createBoat`, `geometry` for `rowBoat`, and the read rules both use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The oars' sizes follow from the span by the boatbuilders' rules, not from a separate guess per boat.
 */
export namespace BoatOars {
  /** The oarlock's pivot above the rowing thwart, as a share of the span between the oarlocks: 0.17, WoodenBoat's oar geometry table (column C = A x 0.17; https://www.woodenboat.com/sites/default/files/bonus-content/oar-geometry-calculation-table.pdf). */
  export const HEIGHT: number = 0.17;

  /** The rowing thwart's aft edge ahead of the oarlocks, as a share of the span: 0.22, the same table (column D = A x 0.22). */
  export const AFT: number = 0.22;

  /** An oar's inboard length beyond half the span, metres: 2 in, Shaw and Tenney's rule, the inboard half the span plus 2 in, the whole oar 25/7 of the inboard (WoodenBoat, https://www.woodenboat.com/online-exclusives/choosing-proper-length-oars). */
  export const INBOARD: number = 2 * AutoMovieArchetypeUnits.INCH;

  /** An oar's whole length over its inboard length: 25/7, the same rule. */
  export const RATIO: number = 25 / 7;

  /**
   * A rowboat's blades: those of the read oar (`BOAT_MODELS.oars`) whose length is nearest the oar Shaw and Tenney's rule gives the span, `RATIO` times the inboard, half the span plus `INBOARD`.
   *
   * @param span The span between the oarlocks, metres, the boat's beam.
   * @returns The blade's length and width, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule and the choice.
   * @evidence contracts/development/implementation.md#principled-implementation The boatbuilders' oar length from the span, then the read oar nearest it, whose blade is taken whole.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One length, one nearest.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to refuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A scan of eight oars.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blade(span: number): {
    bladeLength: number;
    bladeWidth: number;
  } {
    const length: number = (span / 2 + INBOARD) * RATIO;
    const oar: (typeof BOAT_MODELS.oars)[number] = BOAT_MODELS.oars.reduce(
      (
        best: (typeof BOAT_MODELS.oars)[number],
        o: (typeof BOAT_MODELS.oars)[number],
      ): (typeof BOAT_MODELS.oars)[number] =>
        Math.abs(o.length - length) < Math.abs(best.length - length) ? o : best,
    );
    return { bladeLength: oar.bladeLength, bladeWidth: oar.bladeWidth };
  }

  /** The oar's loom, metres: 44 mm, Fyne Boat Kits' standard oars (https://fyneboatkits.co.uk/accessories/oars/oars-standard). */
  export const LOOM: number = 0.044;

  /** The handle's diameter, metres: 1.25 in finished, Angus Rowboats' oar plan (https://cdn.shopify.com/s/files/1/1566/1423/files/oarplansfinalsmall.pdf). */
  export const HANDLE: number = 1.25 * AutoMovieArchetypeUnits.INCH;

  /** The handle's held run, metres: a construction estimate, one hand's breadth and a little. */
  export const GRIP: number = 0.12;

  /** The blade's thickness, metres: a construction estimate the picture shows; the blade's edges, which the stroke's heights read, lie in the oar's upright plane, so no contact reads it. */
  export const THICKNESS: number = 0.012;

  /** The stroke's arc, degrees from square to the boat: the blade 62 degrees toward the bow at the catch and 43.5 toward the stern at the finish, the men's single sculls' gate angles (Holt et al. 2020, Frontiers in Sports and Active Living 2:589013, Table 1). Those are sliding-seat boats; a fixed thwart's arc no source read gives, so on a rowboat this is a provisional value. Searched for #3497 without a figure: fixed-seat oar angles at the catch and the finish for trainera, llaut, gig and dghajsa crews; Agius et al. 2023 (Bioengineering 10(7):774) and the 2025 static-seat ergometer study (PMC12289236) measure the body's angles, not the oar's; Angus's fixed-seat rowing geometry (Small Craft Advisor, 6 February 2023) gives the rig, not the arc. */
  export const ARC: Readonly<{ catch: number; finish: number }> = {
    catch: 62,
    finish: 43.5,
  };

  /** The blade's lower edge above the water on the recovery, metres, a provisional value: not read; the source to read is a fixed-seat rowing biomechanics study. Searched for #3497 without a figure: the fixed-seat kinematics studies above, and Angus's fixed-seat geometry, which states none. */
  export const CLEAR: number = 0.1;

  /**
   * An oar's measures and its lift's angles, worked from the boat's dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation Lengths in metres and angles in degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; made by `geometry` and read by `build` and `rowBoat`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IGeometry {
    /** Between the oarlocks' pivots, metres: the beam, the oarlocks standing on the gunwale at the widest beam. */
    span: number;

    /** The pivot above the water, metres. */
    pivot: number;

    /** The oar from its handle's end to the pivot, metres. */
    inboard: number;

    /** The oar from the pivot to its blade's tip, metres. */
    outboard: number;

    /** The oar's angle below level at rest, the blade at its working depth with its top edge at the water, degrees. */
    rest: number;

    /** The lift that brings the blade's lower edge to the water, degrees: the catch's and the finish's. */
    touch: number;

    /** The lift that clears the blade `CLEAR` above the water, degrees: the recovery's and the lift's travel. */
    clear: number;
  }

  /**
   * An oar's measures and its lift's angles for a rowboat's dimensions.
   *
   * @param d The rowboat's drawn dimensions.
   * @returns The geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is worked out.
   * @evidence contracts/development/implementation.md#principled-implementation The span is the beam and the pivot `createBoat.LOCK` above the gunwale; the inboard and the whole oar by Shaw and Tenney's rule; a square blade on the oar's line, its corners a half width either side of it in the upright plane, so a corner's height is the pivot's less its distance along the oar times the sine of the oar's angle, plus or less the half width times the cosine: at rest the blade's upper root corner is at the water, wholly buried, and at the touch its lower tip corner is, wholly out.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A few expressions.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function geometry(
    d: Readonly<Partial<Record<createBoat.Dimension, number>>>,
  ): IGeometry {
    const span: number = d.beam!;
    const pivot: number = d.depth! - d.draft! + createBoat.LOCK;
    const inboard: number = span / 2 + INBOARD;
    const outboard: number = inboard * RATIO - inboard;
    const half: number = d.bladeWidth! / 2;
    const root: number = outboard - d.bladeLength!;
    const degrees = (radians: number): number =>
      radians / AutoMovieArchetypeUnits.DEGREE;

    // At rest the blade's upper root corner meets the water; lifted, its lower tip corner stands at a height above it.
    const rest: number = degrees(
      Math.asin(pivot / Math.hypot(root, half)) + Math.atan2(half, root),
    );
    const lifted = (height: number): number =>
      rest -
      degrees(
        Math.asin((pivot - height) / Math.hypot(outboard, half)) -
          Math.atan2(half, outboard),
      );
    return {
      span,
      pivot,
      inboard,
      outboard,
      rest,
      touch: lifted(0),
      clear: lifted(CLEAR),
    };
  }

  /**
   * Add both oars in their oarlocks, at rest: square to the boat, the blades at their working depth.
   *
   * @param builder The rowboat under construction.
   * @param d The drawn dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rest pose.
   * @evidence contracts/development/implementation.md#principled-implementation Each oar is a loom from its handle's end to its blade's root and a square blade on its line, at the rest angle `geometry` gives. The oarlock's turn is a two-sided `wheel` about the upright through the pivot, `+Y` down on the left and up on the right so a positive turn swings either blade toward the bow, reaching the catch's arc; the lift is a `hinge` about the pin, square to the oar and level, riding the turn, `+Y` along `+Z` on the left and `-Z` on the right so a positive lift raises either blade, reaching `clear`; the handle rides the lift.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the two sides.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The blade is a flat board; its spoon and the oar's leather, button and feathering are not built.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three parts per oar.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function build(
    builder: AutoMovieArchetypeBuilder<
      createBoat.Affordance,
      createBoat.Dimension
    >,
    d: Readonly<Partial<Record<createBoat.Dimension, number>>>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const g: IGeometry = geometry(d);
    const rest: number = g.rest * AutoMovieArchetypeUnits.DEGREE;
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const pivot: IAutoMovieVector3 = v((sign * g.span) / 2, g.pivot, 0);
      const out: IAutoMovieVector3 = v(
        sign * Math.cos(rest),
        -Math.sin(rest),
        0,
      );
      const at = (s: number): IAutoMovieVector3 =>
        Vector3.add(pivot, Vector3.scale(out, s));
      const loom: string = `oar-${side}`;
      const blade: string = `blade-${side}`;
      const grip: string = `grip-${side}`;
      builder.rod(
        loom,
        LOOM / 2,
        at(-g.inboard + GRIP),
        at(g.outboard - d.bladeLength!),
        { color: WOOD, surface: "wood" },
      );
      builder.rod(grip, HANDLE / 2, at(-g.inboard), at(-g.inboard + GRIP), {
        color: WOOD,
        surface: "wood",
      });
      builder.box(
        blade,
        v(d.bladeLength!, d.bladeWidth!, THICKNESS),
        at(g.outboard - d.bladeLength! / 2),
        {
          color: BLADE,
          rotation: Quaternion.fromAxisAngle(
            { x: 0, y: 0, z: 1 },
            -sign * g.rest,
          ),
        },
      );
      builder.affordance({
        id: `${side}Oarlock`,
        kind: "wheel",
        frame: AutoMovieArchetypeFrame.facing(
          pivot,
          v(0, -sign, 0),
          v(0, 0, 1),
        ),
        extent: null,
        travel: ARC.catch,
      });
      builder.affordance({
        id: `${side}Oar`,
        kind: "hinge",
        frame: AutoMovieArchetypeFrame.facing(
          pivot,
          v(0, 0, sign),
          v(sign, 0, 0),
        ),
        extent: null,
        travel: g.clear,
        parts: [loom, grip, blade],
        rides: `${side}Oarlock`,
      });
      builder.affordance({
        id: `${side}Handle`,
        kind: "handle",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.facing(
          at(-g.inboard + GRIP / 2),
          v(sign * Math.sin(rest), Math.cos(rest), 0),
          out,
        ),
        extent: null,
        grip: "power",
        aperture: HANDLE,
        length: GRIP,
        rides: `${side}Oar`,
      });
    }
  }
}

/** Oiled wood. */
const WOOD: string = "#b08a55";

/** A painted blade. */
const BLADE: string = "#c0392b";
