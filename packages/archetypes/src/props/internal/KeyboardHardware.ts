import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";

/** Shared key field and the manufacturer records used by saved keyboard recipes. */
export namespace KeyboardHardware {
  /** The kinds: a full-size keyboard and a laptop. */
  export type Kind = "keyboard" | "laptop";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["keyboard", "laptop"];

  /**
   * The key pitch, metres: full-size keys on 0.750 in (19.05 mm) centres, the
   * withdrawn ISO 1091's 19 mm +/- 1 mm, which ISO/IEC 9995 does not state
   * (Deskthority wiki, Key pitch, https://deskthority.net/wiki/Key_pitch).
   */
  export const PITCH: number = 0.01905;

  /** The margin from the base's edge to the key field, metres: an estimate. */
  export const MARGIN: number = 0.01;

  /**
   * A laptop lid's tilt back from flat, degrees: open at an estimated 110
   * degrees.
   */
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
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
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

  /**
   * The models read: Apple's Magic Keyboard with Numeric Keypad and its Touch
   * ID (USB-C) version, and the MacBook Air M4 in its 13 and 15 inch sizes.
   */
  export type Model = "numericKeypad" | "touchId" | "air13" | "air15";

  /**
   * Each kind's models whole, the default first. The keyboards: 41.87 cm wide,
   * 11.49 cm deep, 1.09 cm high at the back edge, 0.39 kg
   * (https://support.apple.com/en-us/112037) and 0.369 kg with Touch ID
   * (https://support.apple.com/en-us/121953). The laptops: the 13-inch 30.41 x
   * 21.5 x 1.13 cm closed and 1.24 kg (https://support.apple.com/en-us/122209),
   * the 15-inch 34.04 x 23.76 x 1.15 cm and 1.51 kg
   * (https://support.apple.com/en-us/122210), the base the closed height less
   * the lid's.
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
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    keyboard: {},
    laptop: {},
  };

  /** The contact ids {@link draw} builds or reads. */
  export type DrawContact = "keys" | "homeRow";

  /** What {@link draw} prepares for its caller. */
  export interface IDrawResult<Id extends string> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<DrawContact | Id, Dimension>;

    /** The prepared `d` this call returns. */
    d: Record<Dimension, number>;
  }

  /**
   * Draws the original dimensions in metres and builds the base and key
   * contacts.
   */
  export function draw<Id extends string>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed: number | undefined,
  ): IDrawResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "keyboard",
        UNITS,
        seed,
        params,
      );
    const drawn: Partial<Record<Dimension, number>> = draw.dimensions(
      BANDS[kind],
    );
    // Each kind is one of Apple's read models whole.
    const model: {
      name: Model | undefined;
      figures: Figures;
    } = draw.model<Model>("model", params.model, MODELS[kind]);
    const read: Partial<Record<Dimension, number>> = {
      ...drawn,
      ...model.figures,
    };
    const d: Record<Dimension, number> = {
      width: read.width!,
      depth: read.depth!,
      height: read.height!,
      mass: read.mass!,
    };
    const builder: AutoMovieArchetypeBuilder<DrawContact | Id, Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name: kind,
        draw,
      });
    const v: typeof Vector3.create = Vector3.create;
    const pitch: number = PITCH;
    builder.box("base", v(d.width, d.height, d.depth), v(0, d.height / 2, 0), {
      color: kind === "laptop" ? "#8a8d91" : "#2c2f33",
    });
    // The key field: five rows deep from a margin at the front, as wide as
    // the base less a margin each side.
    const rows: number = 5 * pitch;
    const front: number = d.depth / 2 - MARGIN;
    builder.affordance({
      id: "keys",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, d.height, front - rows / 2)),
      extent: null,
      width: d.width - 2 * MARGIN,
      depth: rows,
    });
    builder.affordance({
      id: "homeRow",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        v(0, d.height, front - 2.5 * pitch),
      ),
      extent: null,
      width: 10 * pitch,
      depth: pitch,
    });
    return { builder, d };
  }
}
