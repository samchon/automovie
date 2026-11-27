import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import * as AutoMovieArchetypeAxillaryCrutchData from "./internal/AutoMovieArchetypeAxillaryCrutchData";

/** Constructs the axillary crutch archetype from its recipe. */
export namespace AutoMovieArchetypeAxillaryCrutch {
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
export function create(
  params: AutoMovieArchetypeAxillaryCrutch.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeAxillaryCrutch.Affordance,
  AutoMovieArchetypeAxillaryCrutch.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeAxillaryCrutch.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeAxillaryCrutch.Dimension>(
      "axillaryCrutch",
      AutoMovieArchetypeAxillaryCrutch.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeAxillaryCrutch.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeAxillaryCrutch.BANDS,
  );
  const length: number = d.length;
  const r: number = d.diameter / 2;
  const grip: number = AutoMovieArchetypeAxillaryCrutch.GRIP * length;
  const pad: number = AutoMovieArchetypeAxillaryCrutch.PAD_HEIGHT;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeAxillaryCrutch.Affordance,
    AutoMovieArchetypeAxillaryCrutch.Dimension
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
    Vector3.create(0, grip, -AutoMovieArchetypeAxillaryCrutch.GRIP_LENGTH / 2),
    Vector3.create(0, grip, AutoMovieArchetypeAxillaryCrutch.GRIP_LENGTH / 2),
    { color: "#2c2f33" },
  );
  builder.box(
    "pad",
    Vector3.create(
      AutoMovieArchetypeAxillaryCrutch.PAD_DEPTH,
      pad,
      AutoMovieArchetypeAxillaryCrutch.PAD_WIDTH,
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
    length: AutoMovieArchetypeAxillaryCrutch.GRIP_LENGTH,
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
    width: AutoMovieArchetypeAxillaryCrutch.PAD_DEPTH,
    depth: AutoMovieArchetypeAxillaryCrutch.PAD_WIDTH,
  });
  return builder.build(d.mass);
}

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
      AutoMovieArchetypeAxillaryCrutchData.LENGTH,
    ),
    diameter: AutoMovieArchetypeBand.metres(0.022, 0.022, AutoMovieArchetypeAxillaryCrutchData.TUBE),
    mass: AutoMovieArchetypeBand.of("kg", 1, 1, AutoMovieArchetypeAxillaryCrutchData.MASS),
  };
}
