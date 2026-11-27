import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeLongTool } from "../AutoMovieArchetypeLongTool";

/** The 1862 Ordnance Manual, read at its scan. */
const ORDNANCE: string =
  "Ordnance Manual for the Use of the Officers of the United States Army, 3rd ed., Lippincott, Philadelphia 1862 (https://archive.org/details/ordnancemanualfo00unitrich)";

/**
 * The 6-pdr field gun's long implements as the 1862 Ordnance Manual gives them,
 * in metres and kilograms, with the wood densities that split a sponge and
 * rammer's mass, and their builder: kept apart from {@link createLongTool} so
 * each file stays within its size.
 */
export namespace FIELD_IMPLEMENTS {
  /**
   * The manual's table of implements, 6-pdr gun column (pp. 138-140), its
   * handspike table (p. 137) and its descriptions (pp. 128-129).
   */
  export const SOURCE: string = `${ORDNANCE}: Dimensions and Weights of Implements, pp. 138-139, 6-pdr gun and 12-pdr howitzer column; Worms, p. 140, field; Handspikes, p. 137, trail, for field carriage; implements, pp. 128-129`;

  /**
   * A sponge and rammer on one ash staff, as field guns carry it (p. 129: "For
   * field-guns ... the rammer and sponge heads are on the same staff").
   */
  export const SPONGE_RAMMER: Readonly<
    Record<
      | "length"
      | "mass"
      | "staff"
      | "rammer"
      | "rammerDiameter"
      | "sponge"
      | "spongeDiameter"
      | "loops"
      | "wool",
      number
    >
  > = {
    /** The finished implement's length, 77 in. */
    length: 77 * AutoMovieArchetypeUnits.INCH,
    /** Its weight, 4.5 lb. */
    mass: 4.5 * AutoMovieArchetypeUnits.POUND,
    /** The staff's diameter, 1.5 in. */
    staff: 1.5 * AutoMovieArchetypeUnits.INCH,
    /** The rammer head's length, 4 in. */
    rammer: 4 * AutoMovieArchetypeUnits.INCH,
    /** The rammer head's body diameter, 3.24 in; its 2.5 in neck is not drawn. */
    rammerDiameter: 3.24 * AutoMovieArchetypeUnits.INCH,
    /** The sponge head's length, 7.5 in. */
    sponge: 7.5 * AutoMovieArchetypeUnits.INCH,
    /**
     * The sponge head's diameter, 2.7 in, an inch under the 3.67 in calibre as
     * p. 128 sets it.
     */
    spongeDiameter: 2.7 * AutoMovieArchetypeUnits.INCH,
    /**
     * The woollen sponge's loops, 0.75 in long (p. 128), which stand round the
     * sponge head.
     */
    loops: 0.75 * AutoMovieArchetypeUnits.INCH,
    /** The woollen sponge's weight, 0.25 lb. */
    wool: 0.25 * AutoMovieArchetypeUnits.POUND,
  };

  /** A worm on its ash staff. */
  export const WORM: Readonly<
    Record<
      | "length"
      | "mass"
      | "staff"
      | "iron"
      | "socket"
      | "socketDiameter"
      | "circle"
      | "wormMass",
      number
    >
  > = {
    /** The finished worm and staff's length, 72 in. */
    length: 72 * AutoMovieArchetypeUnits.INCH,
    /** Its weight, 3.6 lb. */
    mass: 3.6 * AutoMovieArchetypeUnits.POUND,
    /** The staff's diameter, 1.5 in. */
    staff: 1.5 * AutoMovieArchetypeUnits.INCH,
    /** The iron worm's length with its socket, 9 in. */
    iron: 9 * AutoMovieArchetypeUnits.INCH,
    /**
     * The socket and neck's length, 5.5 in; the coil is the rest of the iron's
     * length.
     */
    socket: 5.5 * AutoMovieArchetypeUnits.INCH,
    /** The socket's exterior diameter at its top, 1.5 in. */
    socketDiameter: 1.5 * AutoMovieArchetypeUnits.INCH,
    /** The worm's exterior circle, 3 in. */
    circle: 3 * AutoMovieArchetypeUnits.INCH,
    /** The iron worm's weight, 1.5 lb; the staff carries the rest. */
    wormMass: 1.5 * AutoMovieArchetypeUnits.POUND,
  };

  /** A trail handspike for the field carriage, hickory. */
  export const HANDSPIKE: Readonly<
    Record<
      "length" | "mass" | "conical" | "upper" | "lower" | "largest",
      number
    >
  > = {
    /** Its whole length, 53 in. */
    length: 53 * AutoMovieArchetypeUnits.INCH,
    /** Its weight, 7.25 lb. */
    mass: 7.25 * AutoMovieArchetypeUnits.POUND,
    /** The conical part at the lower end, 9.5 in long. */
    conical: 9.5 * AutoMovieArchetypeUnits.INCH,
    /** The diameter at the upper end, 1.5 in. */
    upper: 1.5 * AutoMovieArchetypeUnits.INCH,
    /** The diameter at the lower end, 2.2 in. */
    lower: 2.2 * AutoMovieArchetypeUnits.INCH,
    /** The largest diameter, 3.0 in, where the conical part meets the rest. */
    largest: 3 * AutoMovieArchetypeUnits.INCH,
  };

  /**
   * White ash's density at 12 % moisture, kilograms per cubic metre, for the
   * staves (p. 129: "Staves for implements are made of tough ash") and the
   * rammer head (The Wood Database, https://www.wood-database.com/white-ash/,
   * 675 kg/m3).
   */
  export const ASH: number = 675;

  /**
   * American elm's density at 12 % moisture, kilograms per cubic metre, for the
   * sponge head (The Wood Database,
   * https://www.wood-database.com/american-elm/, 560 kg/m3).
   */
  export const ELM: number = 560;

  /**
   * Which wood each head is drawn in: the first of the manual's listed woods
   * (p. 128: rammer heads "of ash, maple, birch, beech, elm, gum, or other
   * tough woods"; sponge heads "of elm or poplar"), a choice.
   */
  export const HEAD_WOODS: Readonly<{ rammer: number; sponge: number }> = {
    rammer: ASH,
    sponge: ELM,
  };

  /**
   * Builds a 6-pdr field gun's long implement on the long tool's builder: a
   * sponge and rammer, a worm, or a trail handspike, standing along `+Y` from
   * its working end at the origin.
   *
   * A sponge and rammer's woollen sponge carries its read weight, and the staff
   * and the two heads share the rest by their volumes times their woods'
   * densities; a worm's iron and staff carry their read weights, the iron's
   * shared between its coil and its socket by their drawn volumes; a handspike
   * is one wood, its two tapers drawn as rods of their mean diameters.
   *
   * @param builder The long tool's builder.
   * @param kind Which implement.
   * @param length The implement's drawn length, metres.
   * @param radius The staff's radius, metres; a handspike's comes from its
   *   tapers instead.
   * @param mass The implement's drawn mass, kilograms.
   */
  export function build(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeLongTool.Affordance,
      AutoMovieArchetypeLongTool.Dimension
    >,
    kind: "spongeRammer" | "worm" | "trailHandspike",
    length: number,
    radius: number,
    mass: number,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const ash: string = "#c8a874";
    const iron: string = "#4a4d52";
    // The working end at the origin, facing down out of the tool.
    const end: (direction: "normal" | "along") => void = (
      direction: "normal" | "along",
    ): void => {
      builder.affordance({
        id: "face",
        kind: "surface",
        direction,
        frame: AutoMovieArchetypeFrame.facing(
          v(0, 0, 0),
          v(0, -1, 0),
          v(1, 0, 0),
        ),
        extent: null,
      });
    };
    const shaft: (from: number, to: number, wrap: number) => void = (
      from: number,
      to: number,
      wrap: number,
    ): void => {
      builder.affordance({
        id: "shaft",
        kind: "bar",
        symmetry: "round",
        frame: AutoMovieArchetypeFrame.facing(
          v(0, (from + to) / 2, 0),
          v(0, 0, -1),
          v(0, 1, 0),
        ),
        extent: null,
        grip: "two-hand",
        aperture: 2 * wrap,
        length: to - from,
      });
    };

    if (kind === "spongeRammer") {
      const s: typeof SPONGE_RAMMER = SPONGE_RAMMER;
      const head: number = s.rammerDiameter / 2;
      const core: number = s.spongeDiameter / 2;
      const top: number = length - s.sponge;
      // The wood's weights by volume times density; the wool keeps its own read weight.
      const rammer: number =
        HEAD_WOODS.rammer * Math.PI * head * head * s.rammer;
      const staff: number = ASH * Math.PI * radius * radius * (top - s.rammer);
      const sponge: number =
        HEAD_WOODS.sponge * Math.PI * core * core * s.sponge;
      const wood: number = (mass - s.wool) / (rammer + staff + sponge);
      builder.rod("rammer", head, v(0, 0, 0), v(0, s.rammer, 0), {
        color: ash,
        share: (wood * rammer) / mass,
      });
      builder.rod("staff", radius, v(0, s.rammer, 0), v(0, top, 0), {
        color: ash,
        share: (wood * staff) / mass,
      });
      builder.rod("sponge", core + s.loops, v(0, top, 0), v(0, length, 0), {
        color: "#3b3631",
        share: (wood * sponge + s.wool) / mass,
      });
      end("normal");
      shaft(s.rammer, top, radius);
      builder.affordance({
        id: "tip",
        kind: "surface",
        direction: "along",
        frame: AutoMovieArchetypeFrame.upright(v(0, length, 0)),
        extent: null,
      });
      // The two heads by name, each facing out of its end: the rammer head
      // at the origin and the sponge at the far end.
      builder.affordance({
        id: "rammer",
        kind: "surface",
        direction: "normal",
        frame: AutoMovieArchetypeFrame.facing(
          v(0, 0, 0),
          v(0, -1, 0),
          v(1, 0, 0),
        ),
        extent: null,
      });
      builder.affordance({
        id: "sponge",
        kind: "surface",
        direction: "normal",
        frame: AutoMovieArchetypeFrame.upright(v(0, length, 0)),
        extent: null,
      });
      return;
    }

    if (kind === "worm") {
      const w: typeof WORM = WORM;
      const coil: number = w.iron - w.socket;
      const circle: number = w.circle / 2;
      const socket: number = w.socketDiameter / 2;
      // The iron's read weight shared by the coil's and the socket's drawn volumes.
      const coilVolume: number = Math.PI * circle * circle * coil;
      const socketVolume: number = Math.PI * socket * socket * w.socket;
      const ironShare: number = w.wormMass / mass / (coilVolume + socketVolume);
      builder.rod("coil", circle, v(0, 0, 0), v(0, coil, 0), {
        color: iron,
        share: ironShare * coilVolume,
      });
      builder.rod("socket", socket, v(0, coil, 0), v(0, w.iron, 0), {
        color: iron,
        share: ironShare * socketVolume,
      });
      builder.rod("staff", radius, v(0, w.iron, 0), v(0, length, 0), {
        color: ash,
        share: 1 - w.wormMass / mass,
      });
      end("along");
      shaft(w.iron, length, radius);
      return;
    }

    // A trail handspike: the conical lower end, then the long taper to the small end.
    const h: typeof HANDSPIKE = HANDSPIKE;
    const foot: number = (h.lower + h.largest) / 4;
    const lever: number = (h.largest + h.upper) / 4;
    builder.rod("foot", foot, v(0, 0, 0), v(0, h.conical, 0), {
      color: "#b98d5b",
    });
    builder.rod("lever", lever, v(0, h.conical, 0), v(0, length, 0), {
      color: "#b98d5b",
    });
    end("normal");
    shaft(h.conical, length, lever);
  }

  /**
   * Each implement's bands: its read length, its staff where it has one, and
   * its weight; a handspike's diameter follows from its read tapers instead.
   */
  export const BANDS: Readonly<
    Record<
      "spongeRammer" | "worm" | "trailHandspike",
      Readonly<
        Partial<Record<AutoMovieArchetypeLongTool.Dimension, IAutoMovieArchetypeBand>>
      >
    >
  > = {
    spongeRammer: {
      length: AutoMovieArchetypeBand.metres(
        SPONGE_RAMMER.length,
        SPONGE_RAMMER.length,
        SOURCE,
      ),
      shaftDiameter: AutoMovieArchetypeBand.metres(
        SPONGE_RAMMER.staff,
        SPONGE_RAMMER.staff,
        SOURCE,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        SPONGE_RAMMER.mass,
        SPONGE_RAMMER.mass,
        SOURCE,
      ),
    },
    worm: {
      length: AutoMovieArchetypeBand.metres(WORM.length, WORM.length, SOURCE),
      shaftDiameter: AutoMovieArchetypeBand.metres(
        WORM.staff,
        WORM.staff,
        SOURCE,
      ),
      mass: AutoMovieArchetypeBand.of("kg", WORM.mass, WORM.mass, SOURCE),
    },
    trailHandspike: {
      length: AutoMovieArchetypeBand.metres(
        HANDSPIKE.length,
        HANDSPIKE.length,
        SOURCE,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        HANDSPIKE.mass,
        HANDSPIKE.mass,
        SOURCE,
      ),
    },
  };
}
