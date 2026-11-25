import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { ArchetypeDraw, AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal } from "../core";
import { DOOR_BANDS } from "./DOOR_BANDS";
import { DOOR_SIZES } from "./DOOR_SIZES";
import * as parts from "./createDoorMeasures";

/**
 * Radius of a lever arm or a pull bar, metres: a 20 to 25 mm bar, the pull's
 * diameter seen only in a listing.
 */
const BAR: number = 0.011;

/**
 * A door in its frame: a hinged leaf with lever, knob or push-and-pull
 * hardware, or a sliding leaf.
 *
 * The door stands in the `XY` plane with its threshold's middle at the origin.
 * A hinged leaf opens toward `+Z`, the side it is pulled from, about the
 * `hinge` on the side `hinge` names as seen from there; a sliding leaf runs
 * toward that side. The leaf, its hardware and the hardware's affordances all
 * move with the articulation, so a hand on the handle follows the leaf's arc.
 * The two levers or knobs share one spindle, the `latch`, a `knob` articulation
 * on the leaf: its travel presses both levers down or turns both knobs to draw
 * the latch.
 *
 * `pull` and `push` are where a hand takes the door from the `+Z` and the `-Z`
 * side; `aperture` is the clear opening a body passes through.
 *
 * @param params The kind, the hinge side, the hardware, the leaf's standard
 *   sizes, a latch's backset, a lever's style and any dimension the author
 *   fixes.
 * @param seed The seed that draws each size and style not given and every
 *   dimension left free inside its band; absent, the first of each list and the
 *   middle of each band.
 * @returns The door.
 * @throws {AutoMovieArchetypeRefusal} For a size or style the standard or the
 *   maker does not list, a backset or lever named for hardware without one, a
 *   fixed dimension outside its band or one the door's hardware lacks, or
 *   hardware named for a sliding door.
 */
export function createDoor(
  params: createDoor.IParams = {},
  seed?: number,
): AutoMovieArchetype<createDoor.Affordance, createDoor.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createDoor.Dimension> =
    new AutoMovieArchetypeDrawSession<createDoor.Dimension>(
      "door",
      createDoor.UNITS,
      seed,
      params,
    );
  const kind: createDoor.Kind = ArchetypeDraw.choice(
    "door",
    "kind",
    params.kind ?? "hinged",
    createDoor.KINDS,
  );
  if (kind === "sliding" && params.hardware !== undefined)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "door",
      axis: "hardware",
      value: params.hardware,
      feasible: null,
      reason:
        "a sliding door has a pull bar on each face and no other hardware",
      fix: "leave hardware out for a sliding door",
    });
  const hardware: createDoor.Hardware =
    kind === "sliding"
      ? "plate"
      : ArchetypeDraw.choice(
          "door",
          "hardware",
          params.hardware ?? "lever",
          createDoor.HARDWARE,
        );
  const s: number =
    ArchetypeDraw.choice("door", "hinge", params.hinge ?? "right", [
      "left",
      "right",
    ]) === "right"
      ? 1
      : -1;
  const variant: createDoor.Hardware | "sliding" =
    kind === "sliding" ? "sliding" : hardware;
  /** One axis of the door's read sizes, given or picked whole. */
  const axis = <Name extends string>(
    name: string,
    given: Name | undefined,
    models:
      | Readonly<
          Partial<
            Record<
              Name,
              Readonly<Partial<Record<createDoor.Dimension, number>>>
            >
          >
        >
      | undefined,
  ): Readonly<Partial<Record<createDoor.Dimension, number>>> =>
    draw.model<Name>(name, given, models).figures;
  const d: Partial<Record<createDoor.Dimension, number>> = {
    ...draw.dimensions(createDoor.BANDS[variant], createDoor.BANDS),
    ...axis("nominalWidth", params.nominalWidth, DOOR_SIZES.width),
    ...axis("nominalHeight", params.nominalHeight, DOOR_SIZES.height),
    ...axis("nominalThickness", params.nominalThickness, DOOR_SIZES.thickness),
    ...axis("latchBackset", params.latchBackset, DOOR_SIZES.backset[variant]),
    ...axis("lever", params.lever, DOOR_SIZES.lever[variant]),
  };
  const width: number = d.width!;
  const height: number = d.height!;
  const thick: number = d.thickness!;
  const builder: AutoMovieArchetypeBuilder<
    createDoor.Affordance,
    createDoor.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind === "sliding" ? "sliding door" : "hinged door",
    draw,
  });

  // The frame: two jambs and a head round the leaf.
  const jamb: number = 0.05;
  for (const side of [1, -1] as const) {
    // A sliding leaf runs out past the side it opens toward, where the frame has no jamb.
    if (kind === "sliding" && side === s) continue;
    builder.box(
      side === 1 ? "jamb-left" : "jamb-right",
      Vector3.create(jamb, height + jamb, 0.1),
      Vector3.create(side * (width / 2 + jamb / 2), (height + jamb) / 2, 0),
      { color: "#d8d2c4" },
    );
  }
  builder.box(
    "head",
    Vector3.create(width, jamb, 0.1),
    Vector3.create(0, height + jamb / 2, 0),
    { color: "#d8d2c4" },
  );
  builder.box(
    "leaf",
    Vector3.create(width, height, thick),
    Vector3.create(0, height / 2, 0),
    { color: "#b08a60" },
  );

  // The leaf's articulation: the leaf and the fixed hardware are its parts, and the levers or knobs ride it through the one latch their spindle is.
  const moving: string[] = ["leaf"];
  const latched: string[] = [];
  const carrier: "hinge" | "slide" = kind === "sliding" ? "slide" : "hinge";
  const x: number = -s * (width / 2 - (d.backset ?? 0.07));
  const y: number = d.hardwareHeight ?? createDoor.PULL_HEIGHT;
  const clear: number = kind === "sliding" ? width - 0.1 : width - thick;
  builder.affordance({
    id: "aperture",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.upright(
      Vector3.create((-s * (kind === "sliding" ? 0.1 : thick)) / 2, 0, 0),
    ),
    extent: null,
    width: clear,
    height,
  });

  /** One face's hardware: the part or parts and the contact a hand takes. */
  const face = (id: "pull" | "push", z: 1 | -1): void => {
    const out: IAutoMovieVector3 = Vector3.create(0, 0, z);
    const on: number = (z * thick) / 2;
    if (hardware === "lever" || hardware === "knob") {
      const off: number = on + z * d.projection!;
      latched.push(`${id}-stem`, `${id}-grip`);
      builder.rod(
        `${id}-stem`,
        BAR,
        Vector3.create(x, y, on),
        Vector3.create(x, y, off),
        { color: "#8a8d91" },
      );
      if (hardware === "lever")
        builder.rod(
          `${id}-grip`,
          BAR,
          Vector3.create(x, y, off),
          Vector3.create(x + s * d.grip!, y, off),
          { color: "#8a8d91", round: true },
        );
      else
        builder.ball(`${id}-grip`, d.grip! / 2, Vector3.create(x, y, off), {
          color: "#8a8d91",
        });
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "none",
        frame:
          hardware === "lever"
            ? AutoMovieArchetypeFrame.facing(
                Vector3.create(x + (s * d.grip!) / 2, y, off),
                Vector3.create(0, 1, 0),
                Vector3.create(s, 0, 0),
              )
            : AutoMovieArchetypeFrame.facing(
                Vector3.create(x, y, off),
                out,
                Vector3.create(0, 1, 0),
              ),
        extent: null,
        grip: "power",
        aperture: hardware === "lever" ? 2 * BAR : d.grip!,
        ...(hardware === "lever" ? { length: d.grip! } : {}),
        rides: "latch",
      });
      return;
    }

    // Push-and-pull hardware and a sliding door's pulls: a plate to push on, or an upright bar to pull.
    if (id === "push" && kind === "hinged") {
      const plate: IAutoMovieVector3 = Vector3.create(
        x,
        createDoor.PLATE_HEIGHT,
        on - 0.001,
      );
      builder.box(
        "push-plate",
        Vector3.create(createDoor.PLATE.width, createDoor.PLATE.height, 0.002),
        plate,
        { color: "#8a8d91" },
      );
      moving.push("push-plate");
      builder.affordance({
        id,
        kind: "surface",
        frame: AutoMovieArchetypeFrame.facing(
          plate,
          out,
          Vector3.create(-z, 0, 0),
        ),
        extent: null,
        width: createDoor.PLATE.width,
        depth: createDoor.PLATE.height,
        rides: carrier,
      });
      return;
    }
    const off: number = on + z * (createDoor.PULL.clearance + BAR);
    builder.rod(
      `${id}-bar`,
      BAR,
      Vector3.create(x, y - createDoor.PULL.length / 2, off),
      Vector3.create(x, y + createDoor.PULL.length / 2, off),
      { color: "#8a8d91" },
    );
    moving.push(`${id}-bar`);
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(x, y, off),
        out,
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * BAR,
      length: createDoor.PULL.length,
      rides: carrier,
    });
  };
  face("pull", 1);
  face("push", -1);

  // One spindle joins the two levers or knobs. Its frame sits on the face its axis points out of, the axis about which a positive turn takes a lever's arm (toward s on X) down.
  if (latched.length > 0)
    builder.affordance({
      id: "latch",
      kind: "knob",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(x, y, (-s * thick) / 2),
        Vector3.create(0, 0, -s),
        Vector3.create(s, 0, 0),
      ),
      extent: null,
      travel: d.latchTurn!,
      parts: latched,
      rides: carrier,
    });

  if (kind === "sliding")
    builder.affordance({
      id: "slide",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(x, y, thick / 2),
        Vector3.create(0, 0, 1),
        Vector3.create(s, 0, 0),
      ),
      extent: null,
      travel: clear,
      parts: moving,
    });
  else
    builder.affordance({
      id: "hinge",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create((s * width) / 2, y, thick / 2),
        Vector3.create(0, s, 0),
        Vector3.create(-s, 0, 0),
      ),
      extent: null,
      travel: d.swing!,
      parts: moving,
    });
  // A hinged leaf leaves its frame whole, with its hardware, at the energy a ram breaks an unreinforced softwood frame (`createDoor.BREAKING`); the frame stays.
  if (kind === "hinged") {
    builder.fracture([{ id: "leaf", parts: [...moving, ...latched] }]);
    return builder.build(d.mass!, {
      outcome: { fracture: createDoor.BREAKING },
    });
  }
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createDoor}. */
export namespace createDoor {
  /** The moved constant {@link createDoorMeasures.BREAKING}. */
  export const BREAKING: typeof parts.BREAKING = parts.BREAKING;
  /** The moved type {@link createDoorMeasures.Kind}. */
  export type Kind = parts.Kind;
  /** The moved constant {@link createDoorMeasures.KINDS}. */
  export const KINDS: typeof parts.KINDS = parts.KINDS;
  /** The moved type {@link createDoorMeasures.Hardware}. */
  export type Hardware = parts.Hardware;
  /** The moved constant {@link createDoorMeasures.HARDWARE}. */
  export const HARDWARE: typeof parts.HARDWARE = parts.HARDWARE;
  /** The moved constant {@link createDoorMeasures.PULL_HEIGHT}. */
  export const PULL_HEIGHT: typeof parts.PULL_HEIGHT = parts.PULL_HEIGHT;
  /** The moved constant {@link createDoorMeasures.PLATE_HEIGHT}. */
  export const PLATE_HEIGHT: typeof parts.PLATE_HEIGHT = parts.PLATE_HEIGHT;
  /** The moved constant {@link createDoorMeasures.PLATE}. */
  export const PLATE: typeof parts.PLATE = parts.PLATE;
  /** The moved constant {@link createDoorMeasures.PULL}. */
  export const PULL: typeof parts.PULL = parts.PULL;

  /**
   * The affordance ids:
   *
   * - `hinge`: a hinged leaf's axis; its travel swings the leaf toward `+Z`.
   * - `slide`: a sliding leaf's run toward the side `hinge` names, out past the
   *   frame, which has no jamb on that side.
   * - `aperture`: the clear opening, passed through along `+Z` or against it.
   * - `pull`: what a hand takes on the `+Z` face: the lever's arm, the knob, or
   *   the pull bar.
   * - `push`: what a hand takes on the `-Z` face: the lever's arm, the knob, the
   *   push plate of a hinged plate door, or a sliding door's pull bar.
   * - `latch`: the spindle that joins the two levers or knobs, a `knob`
   *   articulation on the face its axis points out of; its travel presses both
   *   levers down or turns both knobs, and `pull` and `push` ride it.
   */
  export type Affordance =
    | "hinge"
    | "slide"
    | "aperture"
    | "pull"
    | "push"
    | "latch";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `thickness`: the leaf.
   * - `hardwareHeight`: the lever's or knob's axis above the floor.
   * - `backset`: the lever's or knob's axis, the push plate's centre or a sliding
   *   door's pull from the leaf's latch edge.
   * - `grip`: the length of a lever's arm, or a knob's diameter.
   * - `projection`: how far the lever's arm or the knob's centre stands off the
   *   leaf's face.
   * - `latchTurn`: the turn that draws the latch, degrees.
   * - `swing`: the widest opening, degrees.
   * - `force`: the push or pull that opens the leaf, newtons.
   * - `mass`: the leaf with its frame, kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "thickness"
    | "hardwareHeight"
    | "backset"
    | "grip"
    | "projection"
    | "latchTurn"
    | "swing"
    | "force"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    thickness: "m",
    hardwareHeight: "m",
    backset: "m",
    grip: "m",
    projection: "m",
    latchTurn: "degrees",
    swing: "degrees",
    force: "N",
    mass: "kg",
  };

  /** The leaf's nominal widths, ANSI/SDI A250.8's. */
  export type Width = "2ft10in" | "3ft0in";

  /** The leaf's nominal heights, ANSI/SDI A250.8's. */
  export type Height = "6ft8in" | "7ft0in";

  /** The leaf's thicknesses, ANSI/SDI A250.8's. */
  export type Thickness = "1-3/8in" | "1-3/4in";

  /** A cylindrical lock's backsets, the Schlage ND's. */
  export type Backset = "2-3/8in" | "2-3/4in";

  /** The Schlage ND lever styles read, each with its own length and projection. */
  export type Lever =
    | "ATH"
    | "BRK"
    | "BRW"
    | "LAT"
    | "LON"
    | "OME"
    | "RHO"
    | "SPA"
    | "TLR";

  /**
   * The parameters: the kind, the hinge side, the hardware, the picked sizes
   * and style, and any remaining free dimension fixed to a value inside its
   * band.
   */
  export interface IParams extends Partial<
    Record<Exclude<Dimension, "width" | "height" | "thickness">, number>
  > {
    /**
     * The leaf's nominal width, which sets its width; drawn from the seed when
     * absent.
     */
    nominalWidth?: Width;

    /**
     * The leaf's nominal height, which sets its height; drawn from the seed
     * when absent.
     */
    nominalHeight?: Height;

    /**
     * The leaf's nominal thickness, which sets its `thickness`; drawn from the
     * seed when absent.
     */
    nominalThickness?: Thickness;

    /**
     * A lever's or knob's backset, or a sliding door's pull's, the same lock's;
     * drawn from the seed when absent.
     */
    latchBackset?: Backset;

    /** A lever's style; drawn from the seed when absent. */
    lever?: Lever;

    /** Which door; hinged when absent. */
    kind?: Kind;

    /**
     * The side the hinges are on, or a sliding leaf runs toward, as seen by
     * someone on the `+Z` side facing the door: `left` is `-X`. Right when
     * absent.
     */
    hinge?: "left" | "right";

    /**
     * A hinged door's hardware; a lever when absent. A sliding door has a pull
     * bar on each face and refuses this parameter.
     */
    hardware?: Hardware;

    /** The model's id, unique in a scene; `door` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by hardware, and for a sliding door. */
  export const BANDS: typeof DOOR_BANDS = DOOR_BANDS;
}
