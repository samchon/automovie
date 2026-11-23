import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** Rider-triangle positions no maker publishes. */
const TRIANGLE: string =
  "the footrest's place under the seat is not published by either maker; a typical rider triangle, not read at a source";

/**
 * A motorcycle or a step-through scooter.
 *
 * The machine stands upright with the middle of its wheelbase over the origin and its front toward `+Z`. The rider sits on the `seat` and holds the two grips; the feet rest on a motorcycle's two footrests or on a scooter's floorboard.
 *
 * `rideMotorcycle` moves it along a course, leaning into the turns.
 *
 * @param params The kind, its read model and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The machine.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the machine's origin and front and where the rider's seat, hands and feet go.
 * @evidence contracts/development/implementation.md#principled-implementation Two wheels a wheelbase apart, a body box, a seat slab at the drawn seat height and a handlebar the drawn width across; a scooter's body stands under its seat only, with a front shield under the handlebar and the floorboard between the two, the step-through that tells it from a motorcycle; the foot contacts are `pedal` plates without travel, the kind a foot rests on.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the read machine whole (`MODELS`), draw the dimensions no maker states, the wheels and the body by kind, then the seat, the bar and the foot contacts, a scooter's with its shield.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No engine, tank or controls; the front wheel does not steer, since a single-track vehicle turns by its lean.
 * @evidence contracts/development/implementation.md#efficient-algorithms Eight parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMotorcycle(
  params: createMotorcycle.IParams,
  seed?: number | string,
): AutoMovieArchetype<createMotorcycle.Affordance, createMotorcycle.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createMotorcycle.Dimension> =
    new AutoMovieArchetypeDrawSession<createMotorcycle.Dimension>(
      "motorcycle",
      createMotorcycle.UNITS,
      seed,
      params,
    );
  const kind: createMotorcycle.Kind = ArchetypeDraw.choice(
    "motorcycle",
    "kind",
    params.kind,
    createMotorcycle.KINDS,
  );
  // One read machine of the kind, its figures laid over the dimensions no maker states.
  const model: {
    figures: Readonly<Partial<Record<createMotorcycle.Dimension, number>>>;
  } = draw.model<createMotorcycle.Model>(
    "model",
    params.model,
    createMotorcycle.MODELS[kind],
  );
  const d: Record<createMotorcycle.Dimension, number> = {
    ...draw.dimensions(createMotorcycle.BANDS[kind], createMotorcycle.BANDS),
    ...model.figures,
  } as Record<createMotorcycle.Dimension, number>;
  const builder: AutoMovieArchetypeBuilder<
    createMotorcycle.Affordance,
    createMotorcycle.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = d.wheelDiameter / 2;
  const nose: number = d.frontWheelDiameter / 2;
  const half: number = d.wheelbase / 2;
  for (const [name, r, z] of [
    ["wheel-front", nose, half],
    ["wheel-rear", radius, -half],
  ] as const)
    builder.rod(name, r, v(-0.05, r, z), v(0.05, r, z), {
      color: "#22262b",
      surface: "rubber",
    });

  // The seat is behind the middle, and a scooter's floorboard ahead of it.
  const seat: IAutoMovieVector3 = v(0, d.seatHeight, -half * 0.35);
  const board: IAutoMovieVector3 = v(0, d.footrestHeight, seat.z + 0.45);

  // The body under the seat: a motorcycle's fills the frame between the wheels down to the rear axle, or lower to the foot pegs' underside where the pegs hang below the axle, so each peg's inner end stays on the frame; a scooter's stops at the floorboard's rear edge and comes down to its underside, so the space over the board is open.
  const rear: number = -0.05 - d.wheelbase * 0.35;
  const front: number =
    kind === "scooter" ? board.z - 0.2 : -0.05 + d.wheelbase * 0.35;
  const under: number =
    kind === "scooter"
      ? board.y - 0.03
      : Math.min(radius, d.footrestHeight - 2 * createMotorcycle.PEG);
  const top: number = d.seatHeight - 0.06;
  builder.box(
    "body",
    v(0.3, top - under, front - rear),
    v(0, (top + under) / 2, (front + rear) / 2),
    { color: "#a33a2c" },
  );
  builder.rod(
    "fork",
    0.025,
    v(0, nose, half),
    v(0, d.seatHeight + 0.2, half - 0.3),
    { color: "#8a8d91" },
  );

  // The seat on the body, and the handlebar above the fork.
  builder.box(
    "seat",
    v(createMotorcycle.SEAT.width, 0.06, createMotorcycle.SEAT.depth),
    v(0, seat.y - 0.03, seat.z),
    { color: "#22262b" },
  );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(
      v(0, seat.y, seat.z + createMotorcycle.SEAT.depth / 2),
    ),
    extent: null,
    depth: createMotorcycle.SEAT.depth,
    width: createMotorcycle.SEAT.width,

    // A scooter is sat on with the legs ahead on its floorboard.
    astride: kind === "motorcycle",
  });
  const bar: IAutoMovieVector3 = v(0, d.seatHeight + 0.22, half - 0.32);
  builder.rod(
    "handlebar",
    d.gripDiameter / 2,
    v(-d.width / 2, bar.y, bar.z),
    v(d.width / 2, bar.y, bar.z),
    { color: "#55595f" },
  );
  for (const [id, sign] of [
    ["leftGrip", 1],
    ["rightGrip", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.upright(
        v(sign * (d.width / 2 - 0.06), bar.y, bar.z),
      ),
      extent: null,
      grip: "power",
      aperture: d.gripDiameter,
      length: 0.12,
    });

  // Where the feet rest: a peg under each thigh, or the floorboard ahead of the seat.
  if (kind === "scooter") {
    builder.box(
      "floorboard",
      v(0.4, 0.03, 0.4),
      v(0, board.y - 0.015, board.z),
      { color: "#55595f" },
    );

    // The front shield: a thin upright panel on the board's front edge, from the board's underside to under the handlebar. Its thickness and height are picture only.
    const crown: number = d.seatHeight + 0.1;
    builder.box(
      "shield",
      v(0.4, crown - under, 0.04),
      v(0, (crown + under) / 2, board.z + 0.2),
      { color: "#a33a2c" },
    );
    builder.affordance({
      id: "floorboard",
      kind: "pedal",
      frame: AutoMovieArchetypeFrame.upright(board),
      extent: null,
      width: 0.4,
      depth: 0.4,
    });
    for (const [id, sign] of [
      ["leftFloorboard", 1],
      ["rightFloorboard", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "surface",
        frame: AutoMovieArchetypeFrame.upright(v(sign * 0.1, board.y, board.z)),
        extent: null,
      });
  } else
    for (const [id, sign] of [
      ["leftFootrest", 1],
      ["rightFootrest", -1],
    ] as const) {
      const peg: IAutoMovieVector3 = v(
        sign * 0.25,
        d.footrestHeight,
        seat.z + 0.05,
      );
      builder.rod(
        `peg-${sign === 1 ? "left" : "right"}`,
        createMotorcycle.PEG,
        v(sign * 0.15, peg.y - createMotorcycle.PEG, peg.z),
        v(sign * 0.3, peg.y - createMotorcycle.PEG, peg.z),
        { color: "#55595f" },
      );
      builder.affordance({
        id,
        kind: "pedal",
        frame: AutoMovieArchetypeFrame.upright(peg),
        extent: null,
        width: 0.1,
        depth: 0.03,
      });
    }
  return builder.build(d.mass, { rests: "rubber", ground: "asphalt" });
}

/**
 * Companion types and bands of {@link createMotorcycle}.
 */
export namespace createMotorcycle {
  /** The kinds of machine. */
  export type Kind = "motorcycle" | "scooter";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["motorcycle", "scooter"];

  /** The rider's seat, metres across and along: typical, not read at a source. */
  export const SEAT: Readonly<{ width: number; depth: number }> = {
    width: 0.3,
    depth: 0.35,
  };

  /** A foot peg's radius, metres: typical, not read at a source. The peg's top is the footrest height, so its underside stands two radii lower. */
  export const PEG: number = 0.012;

  /**
   * The affordance ids:
   *
   * - `seat`: the rider's seat, facing forward.
   * - `leftGrip`, `rightGrip`: the handlebar's grips on `+X` and `-X`.
   * - `leftFootrest`, `rightFootrest`: a motorcycle's foot pegs.
   * - `leftFloorboard`, `rightFloorboard`: two named sole contact points on the scooter's board.
   * - `floorboard`: a scooter's floor, where both feet rest, open above between the front shield and the body under the seat.
   */
  export type Affordance =
    | "seat"
    | "leftGrip"
    | "rightGrip"
    | "leftFootrest"
    | "rightFootrest"
    | "floorboard"
    | "leftFloorboard"
    | "rightFloorboard";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `seatHeight`: the seat above the ground.
   * - `wheelbase`: axle to axle.
   * - `width`: the handlebar, end to end.
   * - `wheelDiameter`, `frontWheelDiameter`: the rear and the front wheel with its tyre.
   * - `gripDiameter`: the bar where the hands hold it.
   * - `footrestHeight`: the foot rests above the ground.
   * - `mass`: kerb mass, kilograms.
   */
  export type Dimension =
    | "seatHeight"
    | "wheelbase"
    | "width"
    | "wheelDiameter"
    | "frontWheelDiameter"
    | "gripDiameter"
    | "footrestHeight"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    seatHeight: "m",
    wheelbase: "m",
    width: "m",
    wheelDiameter: "m",
    frontWheelDiameter: "m",
    gripDiameter: "m",
    footrestHeight: "m",
    mass: "kg",
  };

  /** The parameters: the kind, its read model, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which machine. */
    kind: Kind;

    /** Which read model of the kind; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `motorcycle` when absent. */
    id?: string;
  }

  /** The read machines: the Honda CB500 Hornet and the Yamaha MT-07, and the Honda PCX125 scooter. */
  export type Model = "cb500Hornet" | "mt07" | "pcx125";

  /**
   * Each kind's read machines, each whole: its seat height, wheelbase, overall width (taken as the handlebar's), tyres' outer diameters (`AutoMovieArchetypeUnits.tyre`) and kerb or wet mass. The CB500 Hornet at Honda UK's page (the 2026 E-Clutch version: seat 785 mm, wheelbase 1,410, 800 mm wide, 120/70 ZR17 and 160/60 ZR17, 191 kg; https://www.honda.co.uk/motorcycles/range/street/cb500-hornet/specifications-and-price.html); the MT-07 at Yamaha's 2019 factsheet, p. 4 (seat 805 mm, wheel base 1,400, 745 mm wide, 120/70 ZR17 and 180/55 ZR17, wet weight 182 kg; https://cdn2.yamaha-motor.eu/prod/product-assets/2019/MT07/Factsheets/2019-MT07_en.pdf); the PCX125 at Honda UK's page (the 2025 version: seat 763 mm, wheelbase 1,315, 740 mm wide, 110/70-14 and 130/70-13, 134 kg; https://www.honda.co.uk/motorcycles/range/scooter/pcx-125/specifications.html).
   */
  export const MODELS: Readonly<
    Record<
      Kind,
      Readonly<
        Partial<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    motorcycle: {
      cb500Hornet: {
        seatHeight: 0.785,
        wheelbase: 1.41,
        width: 0.8,
        frontWheelDiameter: AutoMovieArchetypeUnits.tyre(120, 70, 17),
        wheelDiameter: AutoMovieArchetypeUnits.tyre(160, 60, 17),
        mass: 191,
      },
      mt07: {
        seatHeight: 0.805,
        wheelbase: 1.4,
        width: 0.745,
        frontWheelDiameter: AutoMovieArchetypeUnits.tyre(120, 70, 17),
        wheelDiameter: AutoMovieArchetypeUnits.tyre(180, 55, 17),
        mass: 182,
      },
    },
    scooter: {
      pcx125: {
        seatHeight: 0.763,
        wheelbase: 1.315,
        width: 0.74,
        frontWheelDiameter: AutoMovieArchetypeUnits.tyre(110, 70, 14),
        wheelDiameter: AutoMovieArchetypeUnits.tyre(130, 70, 13),
        mass: 134,
      },
    },
  };

  /** The band of each dimension no machine's maker states, by kind; the others are the read model's (`MODELS`). */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    motorcycle: {
      gripDiameter: AutoMovieArchetypeBand.metres(
        (7 / 8) * AutoMovieArchetypeUnits.INCH,
        (7 / 8) * AutoMovieArchetypeUnits.INCH,
        "the 7/8 in handlebar, not read at a source",
        true,
      ),
      footrestHeight: AutoMovieArchetypeBand.metres(0.3, 0.38, TRIANGLE, true),
    },
    scooter: {
      gripDiameter: AutoMovieArchetypeBand.metres(
        (7 / 8) * AutoMovieArchetypeUnits.INCH,
        (7 / 8) * AutoMovieArchetypeUnits.INCH,
        "the 7/8 in handlebar, not read at a source",
        true,
      ),
      footrestHeight: AutoMovieArchetypeBand.metres(0.25, 0.3, TRIANGLE, true),
    },
  };
}
