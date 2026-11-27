import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeLongTool } from "../AutoMovieArchetypeLongTool";

/*
 * Finney's measured Bolivian sling.
 */
const FINNEY: string =
  "Finney, An Archaeological and Experimental Study of the Sling (PhD thesis, Bournemouth University, 2005), p. 167, fig. 4.6: a Bolivian camelid-wool sling 1780 mm long in total, its main cords about 6 mm across, its pouch 155 mm long and 40 mm wide at most (https://eprints.bournemouth.ac.uk/396/1/Jon_Bryant_Finney.pdf)";

/*
 * Skov's measured sling speeds.
 */
const SKOV: string =
  "Skov, Experimental Sling Use (MA thesis, University of Nebraska, 2013), Table 5, p. 65: average projectile speeds by technique measured at 0.45 m/s, underhand 32.1 m/s to overhand 43.3 m/s (https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=1032&context=anthrotheses)";

/*
 * The Basketmaker atlatl.
 */
const BASKETMAKER: string =
  'Kidder and Guernsey, Archeological Explorations in Northeastern Arizona, BAE Bulletin 65 (1919), pp. 178-179: "Its length over all is 26 inches; width of spur end 1 3/8 inches; of grip end 7/8 inch"; "The spur is 3 inches from the end"; "The handle proper begins 4 inches from the butt" (https://repository.si.edu/handle/10088/15532)';

/*
 * Pettigrew's measured dart speeds.
 */
const PETTIGREW: string =
  "Pettigrew, The Ballistics of Archaic North American Atlatls and Darts (MA thesis, University of Arkansas, 2015), Table 2, p. 25: typical and hard throws by seven atlatlists, 16.7 to 28.7 m/s, filmed over 3 m from the launch (https://scholarworks.uark.edu/context/etd/article/2168/viewcontent/Pettigrew_uark_0011O_11678.pdf)";

/*
 * The two throwers among the long tools: a hand sling and a spear-thrower
 * (atlatl), each with its read sizes and the measured speeds it throws at, and
 * the contacts a throwing act reads.
 *
 * A sling hangs folded from the hand at the top, both cords down to the pouch
 * at the origin: `grip` is the finger loop, `release` the release cord's knot
 * held between thumb and finger, and `pouch` the pouch a stone sits in, facing
 * up. An atlatl lies along `+Y` from its butt at the origin: `grip` is its
 * handle with the finger loops, and `spur` the hook at the far end whose groove
 * takes the dart's butt, facing along the shaft.
 */
export namespace Throwers {
  /*
   * The finger loop's size and the knot's, metres, and an atlatl's thickness,
   * metres: estimates, no source read giving them (searched: Finney 2005, Skov
   * 2013, Carter 1933, Kidder and Guernsey 1919, Museums Victoria;
   * records-sling-atlatl.md).
   */
  export const ESTIMATES: Readonly<{
    loop: number;
    knot: number;
    thickness: number;
  }> = {
    loop: 0.025,
    knot: 0.015,
    thickness: 0.012,
  };

  /*
   * The bands of a sling and an atlatl, each a read figure or a measured
   * spread, the unread masses estimates.
   */
  export const BANDS: Readonly<
    Record<
      "sling" | "atlatl",
      Readonly<
        Partial<Record<AutoMovieArchetypeLongTool.Dimension, IAutoMovieArchetypeBand>>
      >
    >
  > = {
    sling: {
      length: AutoMovieArchetypeBand.metres(1.78, 1.78, FINNEY),
      shaftDiameter: AutoMovieArchetypeBand.metres(0.006, 0.006, FINNEY),
      pouchLength: AutoMovieArchetypeBand.metres(0.155, 0.155, FINNEY),
      pouchWidth: AutoMovieArchetypeBand.metres(0.04, 0.04, FINNEY),
      launchSpeed: AutoMovieArchetypeBand.of("m/s", 32.1, 43.3, SKOV),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.05,
        0.1,
        `${AutoMovieArchetypeBand.TYPICAL_MASS}: an estimate, no sling's weight being read (searched: Finney 2005, Skov 2013; records-sling-atlatl.md)`,
        true,
      ),
    },
    atlatl: {
      length: AutoMovieArchetypeBand.metres(
        26 * AutoMovieArchetypeUnits.INCH,
        26 * AutoMovieArchetypeUnits.INCH,
        BASKETMAKER,
      ),
      width: AutoMovieArchetypeBand.metres(
        (11 / 8) * AutoMovieArchetypeUnits.INCH,
        (11 / 8) * AutoMovieArchetypeUnits.INCH,
        `${BASKETMAKER}: the spur end`,
      ),
      spurSetback: AutoMovieArchetypeBand.metres(
        3 * AutoMovieArchetypeUnits.INCH,
        3 * AutoMovieArchetypeUnits.INCH,
        BASKETMAKER,
      ),
      gripSetback: AutoMovieArchetypeBand.metres(
        4 * AutoMovieArchetypeUnits.INCH,
        4 * AutoMovieArchetypeUnits.INCH,
        BASKETMAKER,
      ),
      launchSpeed: AutoMovieArchetypeBand.of("m/s", 16.7, 28.7, PETTIGREW),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.1,
        0.3,
        `${AutoMovieArchetypeBand.TYPICAL_MASS}: an estimate, no Basketmaker atlatl being weighed (searched: Kidder and Guernsey 1919, Museums Victoria's woomeras; records-sling-atlatl.md)`,
        true,
      ),
    },
  };

  /*
   * Lay a sling: its two cords from the hand down to the pouch, the finger loop
   * and the release knot at the top.
   * Parameter builder: The tool under construction.
   * Parameter d: The tool's dimensions.
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
    // The finger loop and the release knot where the cords meet the hand, side by side across it.
    const loop: IAutoMovieVector3 = v(ESTIMATES.loop / 2, hand, 0);
    const knot: IAutoMovieVector3 = v(-ESTIMATES.knot / 2, hand, 0);
    builder.ball("loop", ESTIMATES.loop / 2, loop, wool);
    builder.ball("knot", ESTIMATES.knot / 2, knot, wool);
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(loop, v(0, 0, -1), v(1, 0, 0)),
      extent: null,
      grip: "hook",
      aperture: ESTIMATES.loop,
      length: ESTIMATES.loop,
    });
    builder.affordance({
      id: "release",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(knot, v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      grip: "lateral",
      aperture: ESTIMATES.knot,
      length: ESTIMATES.knot,
    });
    builder.affordance({
      id: "pouch",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v(0, r, 0)),
      extent: null,
    });
  }

  /*
   * Lay an atlatl: a flat shaft from its butt to its spur end, the handle at
   * the butt and the spur near the far end.
   * Parameter builder: The tool under construction.
   * Parameter d: The tool's dimensions.
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
      frame: AutoMovieArchetypeFrame.facing(
        v(0, grip / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: ESTIMATES.thickness,
      length: grip,
    });
    builder.affordance({
      id: "spur",
      kind: "socket",
      direction: "along",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, length - d.spurSetback!, ESTIMATES.thickness / 2),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }
}

/*
 * A long tool under construction.
 */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeLongTool.Affordance,
  AutoMovieArchetypeLongTool.Dimension
>;

/*
 * A long tool's drawn dimensions.
 */
type Drawn = Readonly<Partial<Record<AutoMovieArchetypeLongTool.Dimension, number>>>;
