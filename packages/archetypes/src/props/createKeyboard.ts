import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";

/**
 * A computer keyboard, or a laptop open on its base.
 *
 * It lies on a desk centred over the origin, its front edge (the typist's side) toward `+Z`. `keys` is the key field's top, facing up, as wide and as deep as the rows; `homeRow` the middle of the home row (the row of `F` and `J`), the third of the alphanumeric rows from the front, facing up, along `+X`, where the fingers rest to type. A laptop's lid stands open from the base's back edge, tilted back by `LID` degrees, its `screen` facing the typist; `lid` is the lid's top edge, pinched to open or close it.
 *
 * @param params The kind, the kind's model where it has read models, and any dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The keyboard.
 * @throws {ArchetypeRefusal} For a model the kind does not have, or a fixed dimension outside its band.
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
  const draw: ArchetypeDrawSession<createKeyboard.Dimension> =
    new ArchetypeDrawSession<createKeyboard.Dimension>(
      "keyboard",
      createKeyboard.UNITS,
      seed,
      params,
    );
  const kind: createKeyboard.Kind = ArchetypeDraw.choice(
    "keyboard",
    "kind",
    params.kind,
    createKeyboard.KINDS,
  );
  const drawn: Partial<Record<createKeyboard.Dimension, number>> =
    draw.dimensions(createKeyboard.BANDS[kind]);
  // Each kind is one of Apple's read models whole.
  const model: {
    name: createKeyboard.Model | undefined;
    figures: createKeyboard.Figures;
  } = draw.model<createKeyboard.Model>(
    "model",
    params.model,
    createKeyboard.MODELS[kind],
  );
  const read: Partial<Record<createKeyboard.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const d: Record<createKeyboard.Dimension, number> = {
    width: read.width!,
    depth: read.depth!,
    height: read.height!,
    mass: read.mass!,
  };
  const builder: ArchetypeBuilder<
    createKeyboard.Affordance,
    createKeyboard.Dimension
  > = new ArchetypeBuilder({
    id: params.id,
    name: kind,
    draw,
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
    const rad: number = tilt * ArchetypeUnits.DEGREE;
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
      frame: ArchetypeFrame.facing(
        Vector3.add(hinge, Vector3.scale(up, d.depth / 2)),
        out,
        v(1, 0, 0),
      ),
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
      symmetry: "none",
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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pitch and the sizes are read; a laptop's base is its closed height less the lid's estimated thickness; the margins and the lid's tilt are named estimates.
 */
export namespace createKeyboard {
  /** The kinds: a full-size keyboard and a laptop. */
  export type Kind = "keyboard" | "laptop";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["keyboard", "laptop"];

  /** The key pitch, metres: full-size keys on 0.750 in (19.05 mm) centres, the withdrawn ISO 1091's 19 mm +/- 1 mm, which ISO/IEC 9995 does not state (Deskthority wiki, Key pitch, https://deskthority.net/wiki/Key_pitch). */
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

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which keyboard. */
    kind: Kind;

    /** The kind's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `keyboard` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The models read: Apple's Magic Keyboard with Numeric Keypad and its Touch ID (USB-C) version, and the MacBook Air M4 in its 13 and 15 inch sizes. */
  export type Model = "numericKeypad" | "touchId" | "air13" | "air15";

  /**
   * Each kind's models whole, the default first. The keyboards: 41.87 cm wide, 11.49 cm deep, 1.09 cm high at the back edge, 0.39 kg (https://support.apple.com/en-us/112037) and 0.369 kg with Touch ID (https://support.apple.com/en-us/121953). The laptops: the 13-inch 30.41 x 21.5 x 1.13 cm closed and 1.24 kg (https://support.apple.com/en-us/122209), the 15-inch 34.04 x 23.76 x 1.15 cm and 1.51 kg (https://support.apple.com/en-us/122210), the base the closed height less the lid's.
   */
  export const MODELS: Readonly<
    Record<Kind, Readonly<Partial<Record<Model, Figures>>>>
  > = {
    keyboard: {
      numericKeypad: {
        width: 0.4187,
        depth: 0.1149,
        height: 0.0109,
        mass: 0.39,
      },
      touchId: { width: 0.4187, depth: 0.1149, height: 0.0109, mass: 0.369 },
    },
    laptop: {
      air13: {
        width: 0.3041,
        depth: 0.215,
        height: 0.0113 - LID_THICKNESS,
        mass: 1.24,
      },
      air15: {
        width: 0.3404,
        depth: 0.2376,
        height: 0.0115 - LID_THICKNESS,
        mass: 1.51,
      },
    },
  };

  /** The band of each free dimension, by kind: none, every figure is a model's. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    keyboard: {},
    laptop: {},
  };
}
