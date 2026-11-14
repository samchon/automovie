import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
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

/** Two makers' compact cameras. */
const CAMERA: string =
  "Ricoh GR III specifications (https://www.ricoh-imaging.co.jp/english/products/gr-3/spec/) and Fujifilm X100VI specifications (https://fujifilm-dsc.com/en/manual/x100vi/technical_notes/spec/)";

/** One maker's remote read at its page and two seen in listings. */
const REMOTE: string =
  "Apple TV 4K technical specifications, Siri Remote (https://www.apple.com/apple-tv-4k/specs/); the larger end from Roku and Amazon remote listings seen only in search results";

/** The travel of a small push button, for which no specification was read. */
const PRESS: string = "typical tactile switch travel, not read at a source";

/** The readable name of each kind. */
const NAMES: Readonly<Record<createDevice.Kind, string>> = {
  phone: "smartphone",
  camera: "compact camera",
  remote: "remote control",
};

/**
 * A handheld device: a smartphone, a compact camera or a remote control.
 *
 * The model is a slab, with a camera's lens barrel and hand grip: what tells the three apart. The device stands on its bottom edge at the origin, its screen, its lens or its buttons facing `+Z`, its long side along `+Y` for a phone and a remote and along `+X` for a camera.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The device.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
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
  const kind: createDevice.Kind = ArchetypeDraw.choice(
    "device",
    "kind",
    params.kind,
    createDevice.KINDS,
  );
  const d: Partial<Record<createDevice.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "device",
      createDevice.BANDS[kind],
      seed,
      params,
      createDevice.BANDS,
    );
  const width: number = d.width!;
  const height: number = d.height!;
  const depth: number = d.thickness!;
  const builder: ArchetypeBuilder<
    createDevice.Affordance,
    createDevice.Dimension
  > = new ArchetypeBuilder({
    archetype: "device",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  const front: (y: number) => ReturnType<typeof ArchetypeFrame.facing> = (
    y: number,
  ) =>
    ArchetypeFrame.facing(
      Vector3.create(0, y, depth / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    );

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
      travel: d.press!,
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
      travel: d.press!,
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
  export type Kind = "phone" | "camera" | "remote";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["phone", "camera", "remote"];

  /**
   * The affordance ids:
   *
   * - `grip`: the hold, a power grip: across the back of a phone or a remote, on a camera's grip bar at its `-X` end.
   * - `support`: a camera's other hold, the far `+X` end of its body taken from the front, where the second hand steadies it.
   * - `pinch`: a lateral pinch at the bottom edge of a phone or a remote.
   * - `screen`: the face that is looked at: a phone's front, a camera's back.
   * - `lens`: the face that looks: a phone's rear lens, a camera's lens front.
   * - `button`: a camera's shutter release on its top, a remote's keys on its face.
   */
  export type Affordance =
    | "grip"
    | "pinch"
    | "support"
    | "screen"
    | "lens"
    | "button";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: along `+X`.
   * - `height`: along `+Y`.
   * - `thickness`: along `+Z`; a camera's body without its lens.
   * - `press`: a button's travel.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "height" | "thickness" | "press" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which device. */
    kind: Kind;

    /** The model's id, unique in a scene; `device` when absent. */
    id?: string;
  }

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
    camera: {
      width: ArchetypeBand.metres(0.1094, 0.128, CAMERA),
      height: ArchetypeBand.metres(0.0619, 0.0748, CAMERA),
      thickness: ArchetypeBand.metres(0.0332, 0.0553, CAMERA),
      press: ArchetypeBand.metres(0.001, 0.002, PRESS, true),
      mass: kg(0.257, 0.521, CAMERA),
    },
    remote: {
      width: ArchetypeBand.metres(0.035, 0.042, REMOTE, true),
      height: ArchetypeBand.metres(0.136, 0.142, REMOTE, true),
      thickness: ArchetypeBand.metres(0.00925, 0.02, REMOTE, true),
      press: ArchetypeBand.metres(0.0005, 0.001, PRESS, true),
      mass: kg(0.0434, 0.085, REMOTE, true),
    },
  };
}
