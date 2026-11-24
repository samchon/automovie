import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * The adult and tall-adult lengths of a maker's aluminium axillary crutch, read
 * at retailers.
 */
const LENGTH: string =
  "Drive Medical aluminium crutches (10400-1): adult 45 to 53 in, tall adult 53 to 61 in (https://carewell.com/product/drive-aluminum-crutch-underarm-pad-handgrip; https://www.vitalitymedical.com/adjustable-aluminum-crutches-knock-down.html), adjustable";

/** A crutch tube's diameter, provisional: a common 7/8 in aluminium tube. */
const TUBE: string = "a 7/8 in (22 mm) aluminium tube, provisional";

/** An axillary crutch's mass, provisional. */
const MASS: string =
  "about 1 kg for one aluminium axillary crutch, provisional";

/**
 * An axillary (underarm) crutch: a shaft from its rubber tip to its underarm
 * pad, with a handgrip across it where the hand bears the body's weight.
 *
 * It stands on its tip at the origin, the pad up `+Y`, and the pad's length and
 * the handgrip along `+Z`, front to back between the side rails as the crutch
 * stands beside its user. `tip` is the floor contact facing down, `grip` the
 * handgrip the hand closes on, and `pad` the underarm pad's top, which the side
 * of the chest presses against two to three finger widths below the axilla,
 * never the axilla itself (Physiopedia, Crutches,
 * https://www.physio-pedia.com/Crutches). The handgrip stands where that
 * fitting puts the wrist crease: read through Drillis and Contini's segment
 * heights (wrist crease 0.485, axilla about 0.72 of stature), `GRIP` of the
 * crutch's length above its tip (provisional).
 *
 * @param params Any dimension the author fixes inside its band, and an optional
 *   scene id.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, the middle of each band.
 * @returns The crutch.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createAxillaryCrutch(
  params: createAxillaryCrutch.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createAxillaryCrutch.Affordance,
  createAxillaryCrutch.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createAxillaryCrutch.Dimension> =
    new AutoMovieArchetypeDrawSession<createAxillaryCrutch.Dimension>(
      "axillaryCrutch",
      createAxillaryCrutch.UNITS,
      seed,
      params,
    );
  const d: Record<createAxillaryCrutch.Dimension, number> = draw.dimensions(
    createAxillaryCrutch.BANDS,
  );
  const length: number = d.length;
  const r: number = d.diameter / 2;
  const grip: number = createAxillaryCrutch.GRIP * length;
  const pad: number = createAxillaryCrutch.PAD_HEIGHT;
  const builder: AutoMovieArchetypeBuilder<
    createAxillaryCrutch.Affordance,
    createAxillaryCrutch.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "axillary crutch",
    draw,
  });
  builder.rod(
    "shaft",
    r,
    Vector3.create(0, 0, 0),
    Vector3.create(0, length - pad, 0),
    { color: "#b8bcc2" },
  );
  builder.rod(
    "handgrip",
    r,
    Vector3.create(0, grip, -createAxillaryCrutch.GRIP_LENGTH / 2),
    Vector3.create(0, grip, createAxillaryCrutch.GRIP_LENGTH / 2),
    { color: "#2c2f33" },
  );
  builder.box(
    "pad",
    Vector3.create(
      createAxillaryCrutch.PAD_DEPTH,
      pad,
      createAxillaryCrutch.PAD_WIDTH,
    ),
    Vector3.create(0, length - pad / 2, 0),
    { color: "#3a3d42" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, grip, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * r,
    length: createAxillaryCrutch.GRIP_LENGTH,
  });
  builder.affordance({
    id: "tip",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, -1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "pad",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, length, 0)),
    extent: null,
    width: createAxillaryCrutch.PAD_DEPTH,
    depth: createAxillaryCrutch.PAD_WIDTH,
  });
  return builder.build(d.mass);
}

/** Companion types, constants and bands of {@link createAxillaryCrutch}. */
export namespace createAxillaryCrutch {
  /** The contacts: the handgrip, the floor tip and the underarm pad's top. */
  export type Affordance = "grip" | "tip" | "pad";

  /** The dimensions the author may fix inside their bands. */
  export type Dimension = "length" | "diameter" | "mass";

  /**
   * The handgrip's height above the tip as a share of the crutch's length: the
   * wrist crease's height over the pad's under the fitting rule (provisional).
   */
  export const GRIP: number = 0.485 / 0.72;

  /**
   * The handgrip's length across the shaft, metres: the 11.5 cm optimal handle
   * length of the Revised NIOSH Lifting Equation, applied.
   */
  export const GRIP_LENGTH: number = 0.115;

  /** The underarm pad's width along the handgrip, metres (provisional). */
  export const PAD_WIDTH: number = 0.18;

  /** The underarm pad's thickness, metres (provisional). */
  export const PAD_HEIGHT: number = 0.04;

  /** The underarm pad's depth across the handgrip, metres (provisional). */
  export const PAD_DEPTH: number = 0.06;

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    mass: "kg",
  };

  /** The dimensions fixed by the author, and an optional scene id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the family name. */
    id?: string;
  }

  /** The sourced bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      45 * AutoMovieArchetypeUnits.INCH,
      61 * AutoMovieArchetypeUnits.INCH,
      LENGTH,
    ),
    diameter: AutoMovieArchetypeBand.metres(0.022, 0.022, TUBE),
    mass: AutoMovieArchetypeBand.of("kg", 1, 1, MASS),
  };
}
