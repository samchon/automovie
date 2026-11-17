import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** A band in kilograms. */
const kg = (
  minimum: number,
  maximum: number,
  source: string,
  provisional?: boolean,
): IArchetypeBand =>
  ArchetypeBand.of("kg", minimum, maximum, source, provisional);

/** Apple's phone specification pages; the smallest and largest rows were read on the comparison page by position. */
const PHONE: string =
  "Apple iPhone 16 and 17 technical specifications (https://www.apple.com/iphone-16/specs/, https://www.apple.com/iphone-17/specs/); the extremes from Apple's comparison page (https://www.apple.com/iphone/compare/), its rows matched to models by position";

/** One maker's remote read at its page and two seen in listings. */
const REMOTE: string =
  "Apple TV 4K technical specifications, Siri Remote (https://www.apple.com/apple-tv-4k/specs/); the larger end from Roku and Amazon remote listings seen only in search results";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createDevice.Kind, string>> = {
  phone: "smartphone",
  camera: "compact camera",
  remote: "remote control",
  tablet: "tablet",
  walkieTalkie: "walkie-talkie",
};

/**
 * A handheld device: a smartphone, a compact camera, a remote control, a tablet or a walkie-talkie.
 *
 * The model is a slab, with a camera's lens barrel and hand grip: what tells them apart. The device stands on its bottom edge at the origin, its screen, its lens or its buttons facing `+Z`, its long side along `+Y` for a phone, a remote, a tablet and a walkie-talkie and along `+X` for a camera. A tablet and a walkie-talkie are held across their back anywhere up their height; a tablet's `screen` is its whole front, and no maker read places its lens, so it declares none; a walkie-talkie's `speaker` is its whole front, which the voice meets, and its antenna and push-to-talk key wait for a source of their size and place. A camera's and a remote's `button` states no travel: no maker read gives one, so the press is not built.
 *
 * @param params The kind, the kind's model where it has read models, and any dimension the author fixes.
 * @param seed The seed that picks the model when none is given and draws every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The device.
 * @throws {ArchetypeRefusal} For a model the kind does not have, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled and how the device is oriented.
 * @evidence contracts/development/implementation.md#principled-implementation A dimensioned box per device; a hold's `aperture` is the slab's thickness along the hand's approach, which is what the collider measures there, and a camera's grip is its own upright bar of the body's depth, its far end the other hand's hold of the same depth, as a camera is held in both hands.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the slab, then each kind's contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bezel, button or lens detail beyond the one barrel that makes a camera a camera.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most three parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createDevice(
  params: createDevice.IParams,
  seed?: number | string,
): Archetype<createDevice.Affordance, createDevice.Dimension> {
  const draw: ArchetypeDrawSession<createDevice.Dimension> =
    new ArchetypeDrawSession<createDevice.Dimension>(
      "device",
      createDevice.UNITS,
      seed,
      params,
    );
  const kind: createDevice.Kind = ArchetypeDraw.choice(
    "device",
    "kind",
    params.kind,
    createDevice.KINDS,
  );
  const drawn: Partial<Record<createDevice.Dimension, number>> =
    draw.dimensions(createDevice.BANDS[kind], createDevice.BANDS);
  // A camera, a tablet and a walkie-talkie are each one of their makers' read models whole.
  const model: {
    name: createDevice.Model | undefined;
    figures: createDevice.Figures;
  } = draw.model<createDevice.Model>(
    "model",
    params.model,
    createDevice.MODELS[kind],
  );
  const d: Partial<Record<createDevice.Dimension, number>> = {
    ...drawn,
    ...model.figures,
  };
  const width: number = d.width!;
  const height: number = d.height!;
  const depth: number = d.thickness!;
  const builder: ArchetypeBuilder<
    createDevice.Affordance,
    createDevice.Dimension
  > = new ArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: NAMES[kind],
    draw,
  });
  const front: (y: number) => ReturnType<typeof ArchetypeFrame.facing> = (
    y: number,
  ) =>
    ArchetypeFrame.facing(
      Vector3.create(0, y, depth / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    );

  if (kind === "tablet" || kind === "walkieTalkie") {
    // One slab, held across its back anywhere up its height, its front looked at or spoken into.
    builder.box(
      "body",
      Vector3.create(width, height, depth),
      Vector3.create(0, height / 2, 0),
      { color: "#2c2f33" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, height / 2, 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: depth,
      length: height,
    });
    builder.affordance({
      id: kind === "tablet" ? "screen" : "speaker",
      kind: "surface",
      direction: "normal",
      frame: front(height / 2),
      extent: null,
      width,
      depth: height,
    });
    return builder.build(d.mass!);
  }

  if (kind === "camera") {
    // The body, a grip bar on the photographer's right (-X) and the lens barrel in front.
    const grip: number = depth / 2;
    builder.box(
      "body",
      Vector3.create(width - 2 * grip, height, depth),
      Vector3.create(grip, height / 2, 0),
      { color: "#2c2f33" },
    );
    builder.rod(
      "grip",
      grip,
      Vector3.create(-width / 2 + grip, 0, 0),
      Vector3.create(-width / 2 + grip, height, 0),
      { color: "#2c2f33" },
    );
    builder.rod(
      "lens",
      height * 0.35,
      Vector3.create(grip, height / 2, depth / 2),
      Vector3.create(grip, height / 2, depth / 2 + 0.02),
      { color: "#55595f" },
    );
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        Vector3.create(-width / 2 + grip, height / 2, 0),
        Vector3.create(-1, 0, 0),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: depth,
      length: height,
    });
    // The other hand's hold: the body's far (+X) end, taken from the front
    // with the fingers there and the thumb round onto the back, so the hand
    // closes across the body's depth, not its width, and stays off the face
    // the back is held to.
    builder.affordance({
      id: "support",
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        Vector3.create(width / 2 - grip, height / 2, 0),
        Vector3.create(0, 0, 1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: depth,
      length: height,
    });
    builder.affordance({
      id: "lens",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(grip, height / 2, depth / 2 + 0.02),
        Vector3.create(0, 0, 1),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: "screen",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(grip, height / 2, -depth / 2),
        Vector3.create(0, 0, -1),
        Vector3.create(-1, 0, 0),
      ),
      extent: null,
      width: width * 0.6,
      depth: height * 0.8,
    });
    builder.affordance({
      id: "button",
      kind: "button",
      frame: ArchetypeFrame.upright(
        Vector3.create(-width / 2 + grip, height, 0),
      ),
      extent: null,
    });
    return builder.build(d.mass!);
  }

  builder.box(
    "body",
    Vector3.create(width, height, depth),
    Vector3.create(0, height / 2, 0),
    { color: "#2c2f33" },
  );

  // Held across the back with the fingers round the sides, or pinched at the bottom edge.
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, height * 0.4, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: depth,
    length: height * 0.6,
  });
  builder.affordance({
    id: "pinch",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, 0.02, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "lateral",
    aperture: depth,
    length: width,
  });
  if (kind === "phone") {
    builder.affordance({
      id: "screen",
      kind: "surface",
      direction: "normal",
      frame: front(height / 2),
      extent: null,
      width: width * 0.94,
      depth: height * 0.94,
    });
    builder.affordance({
      id: "lens",
      kind: "surface",
      direction: "normal",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, height * 0.9, -depth / 2),
        Vector3.create(0, 0, -1),
        Vector3.create(-1, 0, 0),
      ),
      extent: null,
    });
  } else
    builder.affordance({
      id: "button",
      kind: "button",
      frame: front(height * 0.75),
      extent: null,
    });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createDevice}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The outside sizes and the mass a hold reads (#3369), and the faces a gaze or a thumb meets.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A kind without a contact does not declare it: a phone has no button here.
 */
export namespace createDevice {
  /** The kinds of device. */
  export type Kind = "phone" | "camera" | "remote" | "tablet" | "walkieTalkie";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "phone",
    "camera",
    "remote",
    "tablet",
    "walkieTalkie",
  ];

  /**
   * The affordance ids:
   *
   * - `grip`: the hold, a power grip: across the back of a phone, a remote, a tablet or a walkie-talkie, on a camera's grip bar at its `-X` end.
   * - `support`: a camera's other hold, the far `+X` end of its body taken from the front, where the second hand steadies it.
   * - `pinch`: a lateral pinch at the bottom edge of a phone or a remote.
   * - `screen`: the face that is looked at: a phone's or a tablet's front, a camera's back.
   * - `lens`: the face that looks: a phone's rear lens, a camera's lens front.
   * - `button`: a camera's shutter release on its top, a remote's keys on its face; it states no travel, so its press stays at rest until a source gives one.
   * - `speaker`: a walkie-talkie's front, which the voice meets.
   */
  export type Affordance =
    | "grip"
    | "pinch"
    | "support"
    | "screen"
    | "lens"
    | "button"
    | "speaker";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: along `+X`.
   * - `height`: along `+Y`.
   * - `thickness`: along `+Z`; a camera's body without its lens.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "height" | "thickness" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    width: "m",
    height: "m",
    thickness: "m",
    mass: "kg",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which device. */
    kind: Kind;

    /** A camera's, a tablet's or a walkie-talkie's model; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `device` when absent. */
    id?: string;
  }

  /** A model's read figures, by dimension. */
  export type Figures = Readonly<Partial<Record<Dimension, number>>>;

  /** The models read: Ricoh's GR III and Fujifilm's X100VI; Apple's iPad (10th generation) Wi-Fi and cellular; Motorola's CP200d with each of its four batteries. */
  export type Model =
    | "grIII"
    | "x100vi"
    | "wifi"
    | "cellular"
    | "nimh1400"
    | "liIon1600"
    | "liIon2250"
    | "liIon2900";

  /**
   * Each kind's models whole, the default first, width x height x thickness and mass:
   *
   * - camera: the Ricoh GR III, 109.4 x 61.9 x 33.2 mm and 257 g (https://www.ricoh-imaging.co.jp/english/products/gr-3/spec/), and the Fujifilm X100VI, 128.0 x 74.8 x 55.3 mm and 471 g without its battery (https://fujifilm-dsc.com/en/manual/x100vi/technical_notes/spec/).
   * - tablet: the iPad (10th generation), 179.5 x 248.6 x 7 mm, 477 g Wi-Fi and 481 g cellular (https://support.apple.com/en-us/111840).
   * - walkieTalkie: the MOTOTRBO CP200d, 61.5 x 127.7 mm and, with its NiMH 1400, slim Li-Ion 1600, high-capacity Li-Ion 2250 and ultra-high-capacity Li-Ion 2900 mAh batteries, 42.0, 39.0, 44.0 and 44.0 mm deep and 406, 341, 346 and 348 g (data sheet 06-2020, p. 3, https://www.daywireless.com/downloads/motorola/motorola_cp200d_specsheet.pdf).
   */
  export const MODELS: Readonly<
    Partial<Record<Kind, Readonly<Partial<Record<Model, Figures>>>>>
  > = {
    camera: {
      grIII: { width: 0.1094, height: 0.0619, thickness: 0.0332, mass: 0.257 },
      x100vi: { width: 0.128, height: 0.0748, thickness: 0.0553, mass: 0.471 },
    },
    tablet: {
      wifi: { width: 0.1795, height: 0.2486, thickness: 0.007, mass: 0.477 },
      cellular: {
        width: 0.1795,
        height: 0.2486,
        thickness: 0.007,
        mass: 0.481,
      },
    },
    walkieTalkie: {
      nimh1400: {
        width: 0.0615,
        height: 0.1277,
        thickness: 0.042,
        mass: 0.406,
      },
      liIon1600: {
        width: 0.0615,
        height: 0.1277,
        thickness: 0.039,
        mass: 0.341,
      },
      liIon2250: {
        width: 0.0615,
        height: 0.1277,
        thickness: 0.044,
        mass: 0.346,
      },
      liIon2900: {
        width: 0.0615,
        height: 0.1277,
        thickness: 0.044,
        mass: 0.348,
      },
    },
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    phone: {
      width: ArchetypeBand.metres(0.0642, 0.078, PHONE, true),
      height: ArchetypeBand.metres(0.1315, 0.1634, PHONE, true),
      thickness: ArchetypeBand.metres(0.00564, 0.00875, PHONE, true),
      mass: kg(0.135, 0.249, PHONE, true),
    },
    camera: {},
    remote: {
      width: ArchetypeBand.metres(0.035, 0.042, REMOTE, true),
      height: ArchetypeBand.metres(0.136, 0.142, REMOTE, true),
      thickness: ArchetypeBand.metres(0.00925, 0.02, REMOTE, true),
      mass: kg(0.0434, 0.085, REMOTE, true),
    },
    tablet: {},
    walkieTalkie: {},
  };
}
