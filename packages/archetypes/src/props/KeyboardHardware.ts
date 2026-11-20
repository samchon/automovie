import { Vector3 } from "@automovie/engine";

import {
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/**
 * Shared key field and the manufacturer records used by saved keyboard recipes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The records identify the selected manufacturer figures and the key field's position and dimensions.
 * @evidence contracts/development/design.md#principled-representation The kind selects one set of measured keyboard dimensions in metres and mass in kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Both input devices share their base and key geometry. The laptop producer owns its lid.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The model input must be present in the table for the selected kind.
 */
export namespace KeyboardHardware {
  /**
   * The kinds: a full-size keyboard and a laptop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lists the two stored keyboard forms.
   * @evidence contracts/development/design.md#principled-representation A closed selector chooses the desktop or laptop case.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two forms share the saved keyboard entry point.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The selector distinguishes devices with and without a lid.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the typing surfaces and lid contacts in the model frame.
   * @evidence contracts/development/design.md#principled-representation A closed union represents every contact the old dispatcher can return.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The typing contacts are shared and the lid contacts belong to the laptop.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The desktop model does not advertise the laptop's contacts.
   */
  export type Affordance = "keys" | "homeRow" | "screen" | "lid";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `depth`, `height`: the base's.
   * - `mass`: kilograms.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Lists the base's sizes in metres and the total mass in kilograms.
   * @evidence contracts/development/design.md#principled-representation Each dimension has one stated unit for the two measured devices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The model records only measurements used to place the base and key field.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The lid thickness is accounted for in the model's base height.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside its band.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the saved selector, optional model and model identifier.
   * @evidence contracts/development/design.md#principled-representation The selector binds a whole recorded keyboard or laptop profile.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The legacy input retains fields originally exposed on saved keyboard records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The draw refuses any dimension override because the two forms have no free dimension bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which keyboard. */
    kind: Kind;

    /** The kind's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `keyboard` when absent. */
    id?: string;
  }

  /**
   * A model's read figures, by dimension.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the measured numbers by dimension.
   * @evidence contracts/development/design.md#principled-representation A row carries measured values with dimension-specific units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only reported figures are present in a partial row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One row's mass and sizes stay attached to the same model.
   */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /**
   * The models read: Apple's Magic Keyboard with Numeric Keypad and its Touch ID (USB-C) version, and the MacBook Air M4 in its 13 and 15 inch sizes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the desktop and laptop records from Apple.
   * @evidence contracts/development/design.md#principled-representation A closed selector selects one complete set of model figures.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The selector covers only the explicitly recorded input hardware.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The selected form must contain the specified model.
   */
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

  /**
   * Draws the original dimensions in metres and builds the base and key contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the constructed result and its local coordinates or dimensions.
   * @evidence contracts/development/implementation.md#principled-implementation Use the maker figures and position the key field by the established pitch and margin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared routine owns key geometry and both input devices reuse it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The key field and home row follow the existing size and location contract.
   * @evidence contracts/development/implementation.md#efficient-algorithms Draw one model and place one part and two contacts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The laptop and desktop keyboard both use the same key field geometry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the constructed records and builder.
   */
  export function draw<Id extends string>(
    kind: Kind,
    params: Omit<IParams, "kind">,
    seed: number | string | undefined,
  ): {
    builder: ArchetypeBuilder<"keys" | "homeRow" | Id, Dimension>;
    d: Record<Dimension, number>;
  } {
    const draw: ArchetypeDrawSession<Dimension> =
      new ArchetypeDrawSession<Dimension>("keyboard", UNITS, seed, params);
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
    const builder: ArchetypeBuilder<"keys" | "homeRow" | Id, Dimension> =
      new ArchetypeBuilder({
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
      frame: ArchetypeFrame.upright(v(0, d.height, front - rows / 2)),
      extent: null,
      width: d.width - 2 * MARGIN,
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
    return { builder, d };
  }
}
