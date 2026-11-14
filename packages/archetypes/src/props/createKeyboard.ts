import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The key pitch of a standard keyboard. */
const PITCH_SOURCE: string =
  "ISO/IEC 9995 and common practice, a 19.05 mm key pitch, recalled and not read";

/** What a maker's size reads as, not read at a source. */
const MAKER: string = "a common maker's size, not read at a source";

/**
 * A computer keyboard, or a laptop open on its base.
 *
 * It lies on a desk centred over the origin, its front edge (the typist's side) toward `+Z`. `keys` is the key field's top, facing up, as wide and as deep as the rows; `homeRow` the middle of the home row (the row of `F` and `J`), the third of the alphanumeric rows from the front, facing up, along `+X`, where the fingers rest to type. A laptop's lid stands open from the base's back edge, tilted back by `LID` degrees, its `screen` facing the typist; `lid` is the lid's top edge, pinched to open or close it.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The keyboard.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the keyboard lies, its rows, the home row's place and a laptop's lid.
 * @evidence contracts/development/implementation.md#principled-implementation A base box of the drawn width, depth and height; the home row's middle two and a half key pitches back from the key field's front; a laptop's lid a box turned about the base's back edge.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the base and the key field, then a laptop's lid.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The keys are one field, not separate caps; the key field's margins, the lid's tilt and thickness are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createKeyboard(
  params: createKeyboard.IParams,
  seed?: number | string,
): Archetype<createKeyboard.Affordance, createKeyboard.Dimension> {
  const kind: createKeyboard.Kind = ArchetypeDraw.choice(
    "keyboard",
    "kind",
    params.kind,
    createKeyboard.KINDS,
  );
  const d: Record<createKeyboard.Dimension, number> = ArchetypeDraw.dimensions(
    "keyboard",
    createKeyboard.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createKeyboard.Affordance,
    createKeyboard.Dimension
  > = new ArchetypeBuilder({
    archetype: "keyboard",
    id: params.id,
    name: kind,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const pitch: number = createKeyboard.PITCH;
  builder.box("base", v(d.width, d.height, d.depth), v(0, d.height / 2, 0), {
    color: kind === "laptop" ? "#8a8d91" : "#2c2f33",
  });
  // The key field: five rows deep from a margin at the front, as wide as
  // the base less a margin each side.
  const rows: number = 5 * pitch;
  const front: number = d.depth / 2 - createKeyboard.MARGIN;
  builder.affordance({
    id: "keys",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, d.height, front - rows / 2)),
    extent: null,
    width: d.width - 2 * createKeyboard.MARGIN,
    depth: rows,
  });
  builder.affordance({
    id: "homeRow",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, d.height, front - 2.5 * pitch)),
    extent: null,
    width: 10 * pitch,
    depth: pitch,
  });
  if (kind === "laptop") {
    const tilt: number = createKeyboard.LID;
    const thick: number = createKeyboard.LID_THICKNESS;
    const rad: number = (tilt * Math.PI) / 180;
    // The lid's bottom edge on the base's back edge, turned up from the base's forward line by the tilt, so its top leans back.
    const up: IAutoMovieVector3 = v(0, Math.sin(rad), Math.cos(rad));
    const out: IAutoMovieVector3 = v(0, -Math.cos(rad), Math.sin(rad));
    const hinge: IAutoMovieVector3 = v(0, d.height, -d.depth / 2);
    const centre: IAutoMovieVector3 = Vector3.add(
      Vector3.add(hinge, Vector3.scale(up, d.depth / 2)),
      Vector3.scale(out, -thick / 2),
    );
    builder.box("lid", v(d.width, d.depth, thick), centre, {
      color: "#8a8d91",
      rotation: Quaternion.fromAxisAngle(v(1, 0, 0), 90 - tilt),
    });
    builder.affordance({
      id: "screen",
      kind: "surface",
      frame: ArchetypeFrame.facing(Vector3.add(hinge, Vector3.scale(up, d.depth / 2)), out, v(1, 0, 0)),
      extent: null,
      width: d.width,
      depth: d.depth,
    });
    const top: IAutoMovieVector3 = Vector3.add(
      Vector3.add(hinge, Vector3.scale(up, d.depth)),
      Vector3.scale(out, -thick / 2),
    );
    builder.affordance({
      id: "lid",
      kind: "handle",
      frame: ArchetypeFrame.facing(top, out, v(1, 0, 0)),
      extent: null,
      grip: "precision",
      aperture: thick,
      length: d.width / 3,
    });
  }
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createKeyboard}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two and one band per dimension each; the rows follow the standard key pitch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The key field and the home row a typing act reads, and a laptop's screen and lid.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pitch was recalled and not read, and no maker's size was read, so every band is provisional; the margins and the lid's tilt and thickness are named estimates.
 */
export namespace createKeyboard {
  /** The kinds: a full-size keyboard and a laptop. */
  export type Kind = "keyboard" | "laptop";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["keyboard", "laptop"];

  /** The key pitch, metres: 19.05 mm (see the source). */
  export const PITCH: number = 0.01905;

  /** The margin from the base's edge to the key field, metres: an estimate. */
  export const MARGIN: number = 0.01;

  /** A laptop lid's tilt back from flat, degrees: open at an estimated 110 degrees. */
  export const LID: number = 110;

  /** A laptop lid's thickness, metres: an estimate. */
  export const LID_THICKNESS: number = 0.006;

  /**
   * The affordance ids:
   *
   * - `keys`: the key field's top, facing up.
   * - `homeRow`: the home row's middle, facing up, ten keys wide.
   * - `screen`: a laptop's screen, facing the typist.
   * - `lid`: a laptop lid's top edge, pinched.
   */
  export type Affordance = "keys" | "homeRow" | "screen" | "lid";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `depth`, `height`: the base's.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which keyboard. */
    kind: Kind;

    /** The model's id, unique in a scene; `keyboard` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    keyboard: {
      width: ArchetypeBand.metres(0.43, 0.46, `${PITCH_SOURCE}: some 22.5 keys wide; ${MAKER}`, true),
      depth: ArchetypeBand.metres(0.13, 0.16, `${PITCH_SOURCE}: six rows deep; ${MAKER}`, true),
      height: ArchetypeBand.metres(0.02, 0.035, MAKER, true),
      mass: ArchetypeBand.of("kg", 0.5, 1.2, MAKER, true),
    },
    laptop: {
      width: ArchetypeBand.metres(0.3, 0.36, MAKER, true),
      depth: ArchetypeBand.metres(0.21, 0.25, MAKER, true),
      height: ArchetypeBand.metres(0.012, 0.02, MAKER, true),
      mass: ArchetypeBand.of("kg", 1.1, 2.2, MAKER, true),
    },
  };
}
