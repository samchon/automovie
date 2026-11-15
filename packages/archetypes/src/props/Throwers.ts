import { Vector3 } from "@automovie/engine";

import {
  ArchetypeBand,
  type ArchetypeBuilder,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import type { createLongTool } from "./createLongTool";

/** A long tool under construction. */
type Builder = ArchetypeBuilder<
  createLongTool.Affordance,
  createLongTool.Dimension
>;

/** A long tool's drawn dimensions. */
type Drawn = Readonly<Partial<Record<createLongTool.Dimension, number>>>;

/** Finney's measured Bolivian sling. */
const FINNEY: string =
  "Finney, An Archaeological and Experimental Study of the Sling (PhD thesis, Bournemouth University, 2005), p. 167, fig. 4.6: a Bolivian camelid-wool sling 1780 mm long in total, its main cords about 6 mm across, its pouch 155 mm long and 40 mm wide at most (https://eprints.bournemouth.ac.uk/396/1/Jon_Bryant_Finney.pdf)";

/** Skov's measured sling speeds. */
const SKOV: string =
  "Skov, Experimental Sling Use (MA thesis, University of Nebraska, 2013), Table 5, p. 65: average projectile speeds by technique measured at 0.45 m/s, underhand 32.1 m/s to overhand 43.3 m/s (https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=1032&context=anthrotheses)";

/** The Basketmaker atlatl. */
const BASKETMAKER: string =
  'Kidder and Guernsey, Archeological Explorations in Northeastern Arizona, BAE Bulletin 65 (1919), pp. 178-179: "Its length over all is 26 inches; width of spur end 1 3/8 inches; of grip end 7/8 inch"; "The spur is 3 inches from the end"; "The handle proper begins 4 inches from the butt" (https://repository.si.edu/handle/10088/15532)';

/** Pettigrew's measured dart speeds. */
const PETTIGREW: string =
  "Pettigrew, The Ballistics of Archaic North American Atlatls and Darts (MA thesis, University of Arkansas, 2015), Table 2, p. 25: typical and hard throws by seven atlatlists, 16.7 to 28.7 m/s, filmed over 3 m from the launch (https://scholarworks.uark.edu/context/etd/article/2168/viewcontent/Pettigrew_uark_0011O_11678.pdf)";

/**
 * The two throwers among the long tools: a hand sling and a spear-thrower (atlatl), each with its read sizes and the measured speeds it throws at, and the contacts a throwing act reads.
 *
 * A sling hangs folded from the hand at the top, both cords down to the pouch at the origin: `grip` is the finger loop, `release` the release cord's knot held between thumb and finger, and `pouch` the pouch a stone sits in, facing up. An atlatl lies along `+Y` from its butt at the origin: `grip` is its handle with the finger loops, and `spur` the hook at the far end whose groove takes the dart's butt, facing along the shaft.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each thrower stands and what each contact is.
 * @evidence contracts/development/design.md#principled-representation Each thrower as rods and boxes from its read sizes, its contacts as handles and sockets.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two builders `createLongTool` calls for its throwers, and their bands.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sling's cords are straight, a coarse stand-in for flexible cords; every unread size is a named estimate.
 */
export namespace Throwers {
  /** The finger loop's size and the knot's, metres, and an atlatl's thickness, metres: estimates, no source read giving them (searched: Finney 2005, Skov 2013, Carter 1933, Kidder and Guernsey 1919, Museums Victoria; records-sling-atlatl.md). */
  export const ESTIMATES: Readonly<{
    loop: number;
    knot: number;
    thickness: number;
  }> = {
    loop: 0.025,
    knot: 0.015,
    thickness: 0.012,
  };

  /** The bands of a sling and an atlatl, each a read figure or a measured spread, the unread masses estimates. */
  export const BANDS: Readonly<
    Record<
      "sling" | "atlatl",
      Readonly<Partial<Record<createLongTool.Dimension, IArchetypeBand>>>
    >
  > = {
    sling: {
      length: ArchetypeBand.metres(1.78, 1.78, FINNEY),
      shaftDiameter: ArchetypeBand.metres(0.006, 0.006, FINNEY),
      pouchLength: ArchetypeBand.metres(0.155, 0.155, FINNEY),
      pouchWidth: ArchetypeBand.metres(0.04, 0.04, FINNEY),
      launchSpeed: ArchetypeBand.of("m/s", 32.1, 43.3, SKOV),
      mass: ArchetypeBand.of(
        "kg",
        0.05,
        0.1,
        `${ArchetypeBand.TYPICAL_MASS}: an estimate, no sling's weight being read (searched: Finney 2005, Skov 2013; records-sling-atlatl.md)`,
        true,
      ),
    },
    atlatl: {
      length: ArchetypeBand.metres(
        26 * ArchetypeUnits.INCH,
        26 * ArchetypeUnits.INCH,
        BASKETMAKER,
      ),
      width: ArchetypeBand.metres(
        (11 / 8) * ArchetypeUnits.INCH,
        (11 / 8) * ArchetypeUnits.INCH,
        `${BASKETMAKER}: the spur end`,
      ),
      spurSetback: ArchetypeBand.metres(
        3 * ArchetypeUnits.INCH,
        3 * ArchetypeUnits.INCH,
        BASKETMAKER,
      ),
      gripSetback: ArchetypeBand.metres(
        4 * ArchetypeUnits.INCH,
        4 * ArchetypeUnits.INCH,
        BASKETMAKER,
      ),
      launchSpeed: ArchetypeBand.of("m/s", 16.7, 28.7, PETTIGREW),
      mass: ArchetypeBand.of(
        "kg",
        0.1,
        0.3,
        `${ArchetypeBand.TYPICAL_MASS}: an estimate, no Basketmaker atlatl being weighed (searched: Kidder and Guernsey 1919, Museums Victoria's woomeras; records-sling-atlatl.md)`,
        true,
      ),
    },
  };

  /**
   * Lay a sling: its two cords from the hand down to the pouch, the finger loop and the release knot at the top.
   *
   * @param builder The tool under construction.
   * @param d The tool's dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it lays.
   * @evidence contracts/development/implementation.md#principled-implementation Folded in the hand, each cord runs half the read length less the pouch's to the pouch's ends, so the whole sling is its read length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Pouch, cords, then the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cords are straight; the loop and the knot are `ESTIMATES`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one sling.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function sling(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const pouch: number = d.pouchLength!;
    const cord: number = (d.length! - pouch) / 2;
    // The hand above the pouch's middle, each cord's read share running straight from a pouch end to it.
    const hand: number = Math.sqrt(cord * cord - (pouch / 2) ** 2);
    const r: number = d.shaftDiameter! / 2;
    const wool: { color: string } = { color: "#a08a6a" };
    builder.box("pouch", v(d.pouchWidth!, r * 2, pouch), v(0, 0, 0), wool);
    for (const [side, sign] of [
      ["loop", 1],
      ["release", -1],
    ] as const)
      builder.rod(
        `cord-${side}`,
        r,
        v(0, 0, (sign * pouch) / 2),
        v(0, hand, 0),
        wool,
      );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, hand, 0), v(0, 0, -1), v(1, 0, 0)),
      extent: null,
      grip: "hook",
      aperture: ESTIMATES.loop,
      length: ESTIMATES.loop,
    });
    builder.affordance({
      id: "release",
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(0, hand, 0), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      grip: "lateral",
      aperture: ESTIMATES.knot,
      length: ESTIMATES.knot,
    });
    builder.affordance({
      id: "pouch",
      kind: "socket",
      frame: ArchetypeFrame.upright(v(0, r, 0)),
      extent: null,
    });
  }

  /**
   * Lay an atlatl: a flat shaft from its butt to its spur end, the handle at the butt and the spur near the far end.
   *
   * @param builder The tool under construction.
   * @param d The tool's dimensions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it lays.
   * @evidence contracts/development/implementation.md#principled-implementation The shaft of the read length and spur-end width; the handle runs from the butt to the read point the handle proper begins, and the spur stands the read setback from the far end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shaft, then the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The taper to the grip end, the finger loops and the weight stone are not modelled; the thickness is `ESTIMATES.thickness`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one atlatl.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function atlatl(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const length: number = d.length!;
    const grip: number = d.gripSetback!;
    builder.box(
      "shaft",
      v(d.width!, length, ESTIMATES.thickness),
      v(0, length / 2, 0),
      { color: "#8a6a45" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(v(0, grip / 2, 0), v(0, 0, -1), v(0, 1, 0)),
      extent: null,
      grip: "power",
      aperture: d.width!,
      length: grip,
    });
    builder.affordance({
      id: "spur",
      kind: "socket",
      direction: "along",
      frame: ArchetypeFrame.facing(
        v(0, length - d.spurSetback!, ESTIMATES.thickness / 2),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }
}
