import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeRefusal,
} from "../core";
import { DOOR_BANDS } from "./DOOR_BANDS";

/** Radius of a lever arm or a pull bar, metres: a 20 to 25 mm bar, the pull's diameter seen only in a listing. */
const BAR: number = 0.011;

/**
 * A door in its frame: a hinged leaf with lever, knob or push-and-pull hardware, or a sliding leaf.
 *
 * The door stands in the `XY` plane with its threshold's middle at the origin. A hinged leaf opens toward `+Z`, the side it is pulled from, about the `hinge` on the side `hinge` names as seen from there; a sliding leaf runs toward that side. The leaf, its hardware and the hardware's affordances all move with the articulation, so a hand on the handle follows the leaf's arc. The two levers or knobs share one spindle, the `latch`, a `knob` articulation on the leaf: its travel presses both levers down or turns both knobs to draw the latch.
 *
 * `pull` and `push` are where a hand takes the door from the `+Z` and the `-Z` side; `aperture` is the clear opening a body passes through.
 *
 * @param params The kind, the hinge side, the hardware and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The door.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band or one the door's hardware lacks, or hardware named for a sliding door.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the door's plane and origin, which way it opens, what moves with what and what each hand contact is.
 * @evidence contracts/development/implementation.md#principled-implementation A leaf box in a three-piece frame, which a sliding door has without the jamb on the side its leaf runs out past; the hinge axis points down for a left hinge and up for a right one so that a positive travel swings the leaf toward `+Z`, and the latch's axis points so that a positive travel presses the levers down. A left-hinged door is the mirror image of a right-hinged one in the `YZ` plane.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the frame and the leaf with its articulation, then the hardware of each face.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No latch bolt, closer or panel detail; the opening force is a drawn dimension for an act to read, not simulated. Hardware named for a sliding door is refused, never ignored.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most ten parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createDoor(
  params: createDoor.IParams = {},
  seed?: number | string,
): Archetype<createDoor.Affordance, createDoor.Dimension> {
  const kind: createDoor.Kind = ArchetypeDraw.choice(
    "door",
    "kind",
    params.kind ?? "hinged",
    createDoor.KINDS,
  );
  if (kind === "sliding" && params.hardware !== undefined)
    throw new ArchetypeRefusal({
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
  const d: Partial<Record<createDoor.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "door",
      createDoor.BANDS[kind === "sliding" ? "sliding" : hardware],
      seed,
      params,
      createDoor.BANDS,
    );
  const width: number = d.width!;
  const height: number = d.height!;
  const thick: number = d.thickness!;
  const builder: ArchetypeBuilder<createDoor.Affordance, createDoor.Dimension> =
    new ArchetypeBuilder({
      archetype: "door",
      id: params.id,
      name: kind === "sliding" ? "sliding door" : "hinged door",
      dimensions: d,
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
    frame: ArchetypeFrame.upright(
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
            ? ArchetypeFrame.facing(
                Vector3.create(x + (s * d.grip!) / 2, y, off),
                Vector3.create(0, 1, 0),
                Vector3.create(s, 0, 0),
              )
            : ArchetypeFrame.facing(
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
        frame: ArchetypeFrame.facing(plate, out, Vector3.create(-z, 0, 0)),
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
      frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.facing(
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
      frame: ArchetypeFrame.facing(
        Vector3.create((s * width) / 2, y, thick / 2),
        Vector3.create(0, s, 0),
        Vector3.create(-s, 0, 0),
      ),
      extent: null,
      travel: d.swing!,
      parts: moving,
    });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createDoor}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions for the kind, the hinge side and the hardware, and one cited band per dimension per hardware, in metres, degrees and newtons.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dimensions are those a door-opening act reads (#3371): the hardware's height and place, the turn that frees the latch, the swing and the clear opening.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Hardware a door does not have has no band: a plate door has no latch turn.
 */
export namespace createDoor {
  /** The kinds of door. */
  export type Kind = "hinged" | "sliding";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["hinged", "sliding"];

  /** What a hand operates a hinged door by: a lever or a knob that draws a latch, or a push plate and a pull bar on a door without one. */
  export type Hardware = "lever" | "knob" | "plate";

  /** Every hardware, for a caller that reads one at run time. */
  export const HARDWARE: readonly Hardware[] = ["lever", "knob", "plate"];

  /** A pull bar's centre above the floor, metres: ANSI/SDI A250.8-2017 Table 5, centreline of grip at 42 in. */
  export const PULL_HEIGHT: number = 1.067;

  /** A push plate's centre above the floor, metres: ANSI/SDI A250.8-2017 Table 5, centreline at 45 in. */
  export const PLATE_HEIGHT: number = 1.143;

  /** A push plate's width and height, metres: a 4 by 16 in plate, a common catalogue size, not read at a source. */
  export const PLATE: Readonly<{ width: number; height: number }> = {
    width: 0.102,
    height: 0.406,
  };

  /** A pull bar's grip length and its clearance from the leaf's face, metres: estimates, not read at a source. */
  export const PULL: Readonly<{ length: number; clearance: number }> = {
    length: 0.2,
    clearance: 0.038,
  };

  /**
   * The affordance ids:
   *
   * - `hinge`: a hinged leaf's axis; its travel swings the leaf toward `+Z`.
   * - `slide`: a sliding leaf's run toward the side `hinge` names, out past the frame, which has no jamb on that side.
   * - `aperture`: the clear opening, passed through along `+Z` or against it.
   * - `pull`: what a hand takes on the `+Z` face: the lever's arm, the knob, or the pull bar.
   * - `push`: what a hand takes on the `-Z` face: the lever's arm, the knob, the push plate of a hinged plate door, or a sliding door's pull bar.
   * - `latch`: the spindle that joins the two levers or knobs, a `knob` articulation on the face its axis points out of; its travel presses both levers down or turns both knobs, and `pull` and `push` ride it.
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
   * - `backset`: the lever's or knob's axis from the leaf's latch edge.
   * - `grip`: the length of a lever's arm, or a knob's diameter.
   * - `projection`: how far the lever's arm or the knob's centre stands off the leaf's face.
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

  /** The parameters: the kind, the hinge side, the hardware, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which door; hinged when absent. */
    kind?: Kind;

    /** The side the hinges are on, or a sliding leaf runs toward, as seen by someone on the `+Z` side facing the door: `left` is `-X`. Right when absent. */
    hinge?: "left" | "right";

    /** A hinged door's hardware; a lever when absent. A sliding door has a pull bar on each face and refuses this parameter. */
    hardware?: Hardware;

    /** The model's id, unique in a scene; `door` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by hardware, and for a sliding door. */
  export const BANDS: typeof DOOR_BANDS = DOOR_BANDS;
}
