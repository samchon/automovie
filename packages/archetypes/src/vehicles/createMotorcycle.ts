import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** A standard motorcycle read at its maker's page, and a second from a secondary source. */
const STANDARD: string =
  "Honda CB500 Hornet specifications (https://www.honda.co.uk/motorcycles/range/street/cb500-hornet/specifications-and-price.html) and the Yamaha MT-07 infobox (https://en.wikipedia.org/wiki/Yamaha_MT-07)";

/** A step-through scooter read at its maker's page. */
const SCOOTER: string =
  "Honda PCX125 specifications (https://www.honda.co.uk/motorcycles/range/scooter/pcx-125/specifications.html); 760 and 764 mm seats of earlier years seen in its brochures";

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
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The machine.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the machine's origin and front and where the rider's seat, hands and feet go.
 * @evidence contracts/development/implementation.md#principled-implementation Two wheels a wheelbase apart, a body box, a seat slab at the drawn seat height and a handlebar the drawn width across; a scooter's body stands under its seat only, with a front shield under the handlebar and the floorboard between the two, the step-through that tells it from a motorcycle; the foot contacts are `pedal` plates without travel, the kind a foot rests on.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, the wheels and the body by kind, then the seat, the bar and the foot contacts, a scooter's with its shield.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No engine, tank or controls; the front wheel does not steer, since a single-track vehicle turns by its lean.
 * @evidence contracts/development/implementation.md#efficient-algorithms Eight parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createMotorcycle(
  params: createMotorcycle.IParams,
  seed?: number | string,
): Archetype<createMotorcycle.Affordance, createMotorcycle.Dimension> {
  const kind: createMotorcycle.Kind = ArchetypeDraw.choice(
    "motorcycle",
    "kind",
    params.kind,
    createMotorcycle.KINDS,
  );
  const d: Record<createMotorcycle.Dimension, number> =
    ArchetypeDraw.dimensions(
      "motorcycle",
      createMotorcycle.BANDS[kind],
      seed,
      params,
      createMotorcycle.BANDS,
    );
  const builder: ArchetypeBuilder<
    createMotorcycle.Affordance,
    createMotorcycle.Dimension
  > = new ArchetypeBuilder({
    archetype: "motorcycle",
    id: params.id,
    name: kind,
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const radius: number = d.wheelDiameter / 2;
  const half: number = d.wheelbase / 2;
  for (const [name, z] of [
    ["wheel-front", half],
    ["wheel-rear", -half],
  ] as const)
    builder.rod(name, radius, v(-0.05, radius, z), v(0.05, radius, z), {
      color: "#22262b",
    });

  // The seat is behind the middle, and a scooter's floorboard ahead of it.
  const seat: IAutoMovieVector3 = v(0, d.seatHeight, -half * 0.35);
  const board: IAutoMovieVector3 = v(0, d.footrestHeight, seat.z + 0.45);

  // The body under the seat: a motorcycle's fills the frame between the wheels; a scooter's stops at the floorboard's rear edge and comes down to its underside, so the space over the board is open.
  const rear: number = -0.05 - d.wheelbase * 0.35;
  const front: number =
    kind === "scooter" ? board.z - 0.2 : -0.05 + d.wheelbase * 0.35;
  const under: number = kind === "scooter" ? board.y - 0.03 : radius;
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
    v(0, radius, half),
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
    frame: ArchetypeFrame.upright(
      v(0, seat.y, seat.z + createMotorcycle.SEAT.depth / 2),
    ),
    extent: null,
    depth: createMotorcycle.SEAT.depth,
    width: createMotorcycle.SEAT.width,
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
      frame: ArchetypeFrame.upright(
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
      frame: ArchetypeFrame.upright(board),
      extent: null,
      width: 0.4,
      depth: 0.4,
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
        0.012,
        v(sign * 0.15, peg.y - 0.012, peg.z),
        v(sign * 0.3, peg.y - 0.012, peg.z),
        { color: "#55595f" },
      );
      builder.affordance({
        id,
        kind: "pedal",
        frame: ArchetypeFrame.upright(peg),
        extent: null,
        width: 0.1,
        depth: 0.03,
      });
    }
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createMotorcycle}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rider's three contacts and their places (#3372): the seat's height, the bar's width, the foot rests.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A scooter has a floorboard and a motorcycle has pegs; neither declares the other's.
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

  /**
   * The affordance ids:
   *
   * - `seat`: the rider's seat, facing forward.
   * - `leftGrip`, `rightGrip`: the handlebar's grips on `+X` and `-X`.
   * - `leftFootrest`, `rightFootrest`: a motorcycle's foot pegs.
   * - `floorboard`: a scooter's floor, where both feet rest, open above between the front shield and the body under the seat.
   */
  export type Affordance =
    | "seat"
    | "leftGrip"
    | "rightGrip"
    | "leftFootrest"
    | "rightFootrest"
    | "floorboard";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `seatHeight`: the seat above the ground.
   * - `wheelbase`: axle to axle.
   * - `width`: the handlebar, end to end.
   * - `wheelDiameter`: a wheel with its tyre.
   * - `gripDiameter`: the bar where the hands hold it.
   * - `footrestHeight`: the foot rests above the ground.
   * - `mass`: kerb mass, kilograms.
   */
  export type Dimension =
    | "seatHeight"
    | "wheelbase"
    | "width"
    | "wheelDiameter"
    | "gripDiameter"
    | "footrestHeight"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which machine. */
    kind: Kind;

    /** The model's id, unique in a scene; `motorcycle` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    motorcycle: {
      seatHeight: ArchetypeBand.metres(0.785, 0.805, STANDARD, true),
      wheelbase: ArchetypeBand.metres(1.4, 1.41, STANDARD, true),
      width: ArchetypeBand.metres(
        0.745,
        0.8,
        `${STANDARD}: overall width, taken as the handlebar's`,
        true,
      ),
      wheelDiameter: ArchetypeBand.metres(
        0.6,
        0.624,
        `${STANDARD}: tyres 120/70 ZR17 and 160/60 ZR17, the outer diameter computed from the size`,
        true,
      ),
      gripDiameter: ArchetypeBand.metres(
        0.0222,
        0.0222,
        "the 7/8 in (22.2 mm) handlebar, not read at a source",
        true,
      ),
      footrestHeight: ArchetypeBand.metres(0.3, 0.38, TRIANGLE, true),
      mass: ArchetypeBand.of("kg", 179, 191, STANDARD, true),
    },
    scooter: {
      seatHeight: ArchetypeBand.metres(0.76, 0.764, SCOOTER),
      wheelbase: ArchetypeBand.metres(1.315, 1.315, SCOOTER),
      width: ArchetypeBand.metres(
        0.74,
        0.74,
        `${SCOOTER}: overall width, taken as the handlebar's`,
      ),
      wheelDiameter: ArchetypeBand.metres(
        0.51,
        0.512,
        `${SCOOTER}: tyres 110/70-14 and 130/70-13, the outer diameter computed from the size`,
        true,
      ),
      gripDiameter: ArchetypeBand.metres(
        0.0222,
        0.0222,
        "the 7/8 in (22.2 mm) handlebar, not read at a source",
        true,
      ),
      footrestHeight: ArchetypeBand.metres(0.25, 0.3, TRIANGLE, true),
      mass: ArchetypeBand.of("kg", 130, 134, SCOOTER),
    },
  };
}
