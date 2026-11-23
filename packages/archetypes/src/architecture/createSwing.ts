import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The seat clearance read for a single-user swing at rest. */
const EN1176: string =
  "EN 1176-2 single-user swing seat clearance at rest, 350 mm, as a third-party summary states it (https://www.scribd.com/document/521625147/BS-EN-1176-2-2017); not read in the standard itself";

/** Construction sizes no source read gives, provisional. */
const ESTIMATE: string =
  "Coarse playground construction estimate; no source read gives it";

/**
 * A playground swing: a crossbeam on two posts and a seat hung on two chains
 * from the beam's pivot axis.
 *
 * The pivot axis runs along `x` at `y = pivot`, `z = 0`, above the ground at `y
 * = 0`; the seat hangs below it and swings in the `y`-`z` plane. This model
 * draws the fixed frame. The seat with its chains is a separate rigid model,
 * `createSwing.seat`, whose origin is the pivot, so a rotation of its frame
 * about the pivot axis swings it (`rideSwing`).
 *
 * @param params Fixed dimensions.
 * @param seed The seed for any unfixed dimension.
 * @returns The swing frame.
 * @throws {AutoMovieArchetypeRefusal} For a dimension outside its band, or a
 *   seat that would hang at or above the beam.
 */
export function createSwing(
  params: createSwing.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createSwing.Affordance, createSwing.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createSwing.Dimension> =
    new AutoMovieArchetypeDrawSession("swing", createSwing.UNITS, seed, params);
  const {
    pivot,
    clearance,
    seatWidth,
    grip,
    mass,
  }: Record<createSwing.Dimension, number> = draw.dimensions(createSwing.BANDS);
  if (!(pivot - clearance > grip))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "swing",
      axis: "pivot",
      value: pivot,
      feasible: {
        kind: "range",
        minimum: clearance + grip,
        maximum: null,
        unit: "m",
      },
      reason: "the seat must hang below the chain grips under the beam",
      fix: "raise the beam or lower the seat clearance",
    });
  const builder: AutoMovieArchetypeBuilder<
    createSwing.Affordance,
    createSwing.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "swing",
    material: "steel",
    draw,
  });
  const span: number = seatWidth + 0.6;
  for (const side of [-1, 1] as const)
    builder.rod(
      side < 0 ? "rightPost" : "leftPost",
      0.04,
      Vector3.create((side * span) / 2, 0, 0),
      Vector3.create((side * span) / 2, pivot, 0),
      { color: "#2d6a4f" },
    );
  builder.rod(
    "beam",
    0.05,
    Vector3.create(-span / 2, pivot, 0),
    Vector3.create(span / 2, pivot, 0),
    { color: "#2d6a4f" },
  );
  builder.affordance({
    id: "ground",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 0, 0)),
    extent: null,
    width: span,
    depth: 2 * pivot,
  });
  return builder.build(mass);
}

/** The swing's dimensions and its hanging seat. */
export namespace createSwing {
  /** The ground under the swing, where a rider stands and lands. */
  export type Affordance = "ground";

  /**
   * Beam height, seat clearance, seat width and depth and the chain grips'
   * height above the seat in metres, and frame mass in kilograms.
   */
  export type Dimension =
    | "pivot"
    | "clearance"
    | "seatWidth"
    | "seatDepth"
    | "grip"
    | "mass";

  /** The hanging seat's sitting surface and the two chain grips. */
  export type SeatAffordance = "seat" | "leftChain" | "rightChain";

  /**
   * The hanging seat's hanging length, width and depth in metres, and mass in
   * kilograms.
   */
  export type SeatDimension = "length" | "width" | "depth" | "mass";

  /** The dimensions the author fixes inside their bands. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The scene's model identifier, `swing` when omitted. */
    id?: string;
  }

  /** Units recorded in the model's draw provenance. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    pivot: "m",
    clearance: "m",
    seatWidth: "m",
    seatDepth: "m",
    grip: "m",
    mass: "kg",
  };

  /** The dimensions' bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    pivot: AutoMovieArchetypeBand.metres(2, 2.6, ESTIMATE, true),
    clearance: AutoMovieArchetypeBand.metres(0.35, 0.45, EN1176, true),
    seatWidth: AutoMovieArchetypeBand.metres(0.28, 0.5, ESTIMATE, true),
    seatDepth: AutoMovieArchetypeBand.metres(0.15, 0.22, ESTIMATE, true),
    // Where a seated rider holds the chains: from just over the thighs to
    // an adult's seated overhead reach.
    grip: AutoMovieArchetypeBand.metres(0.3, 1.2, ESTIMATE, true),
    mass: AutoMovieArchetypeBand.of("kg", 60, 150, ESTIMATE, true),
  };

  /**
   * The seat with its chains as one rigid model whose origin is the pivot: the
   * sitting surface hangs `length` below it, and each chain grip is the swing's
   * `grip` above the seat on its chain.
   *
   * @param swing The swing whose seat this is.
   * @returns The hanging seat model.
   */
  export function seat(
    swing: Pick<AutoMovieArchetype<Affordance, Dimension>, "dimensions">,
  ): AutoMovieArchetype<SeatAffordance, SeatDimension> {
    const pivot: number = swing.dimensions.pivot!;
    const clearance: number = swing.dimensions.clearance!;
    const seatWidth: number = swing.dimensions.seatWidth!;
    const seatDepth: number = swing.dimensions.seatDepth!;
    const grip: number = swing.dimensions.grip!;
    const draw: AutoMovieArchetypeDrawSession<SeatDimension> =
      new AutoMovieArchetypeDrawSession(
        "swingSeat",
        { length: "m", width: "m", depth: "m", mass: "kg" },
        undefined,
        {},
      );
    const length: number = draw.derive("length", pivot - clearance);
    draw.derive("width", seatWidth);
    draw.derive("depth", seatDepth);
    // A rubber seat of about 2 kg with its chains: a provisional estimate.
    const mass: number = draw.derive("mass", 4);
    const builder: AutoMovieArchetypeBuilder<SeatAffordance, SeatDimension> =
      new AutoMovieArchetypeBuilder({
        name: "swing seat",
        material: "rubber",
        draw,
      });
    builder.box(
      "seat",
      Vector3.create(seatWidth, 0.03, seatDepth),
      Vector3.create(0, -length - 0.015, 0),
      { color: "#222222" },
    );
    for (const side of [-1, 1] as const) {
      builder.rod(
        side < 0 ? "rightChainLink" : "leftChainLink",
        0.008,
        Vector3.create((side * seatWidth) / 2, 0, 0),
        Vector3.create((side * seatWidth) / 2, -length, 0),
        { color: "#9a9a9a" },
      );
      builder.affordance({
        id: side < 0 ? "rightChain" : "leftChain",
        kind: "handle",
        symmetry: "round",
        grip: "power",
        frame: AutoMovieArchetypeFrame.facing(
          Vector3.create((side * seatWidth) / 2, grip - length, 0),
          Vector3.create(0, 0, -1),
          Vector3.create(0, 1, 0),
        ),
        extent: null,
        length: 0.2,
        aperture: 0.02,
      });
    }
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, -length, seatDepth / 2),
      ),
      extent: null,
      width: seatWidth,
      depth: seatDepth,
    });
    return builder.build(mass);
  }
}
