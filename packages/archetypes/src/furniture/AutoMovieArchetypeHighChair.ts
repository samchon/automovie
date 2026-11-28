import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeHighChairData } from "./internal/AutoMovieArchetypeHighChairData";

/** Constructs a floor-standing high chair with a front-edge seat contact. */
export namespace AutoMovieArchetypeHighChair {
/**
 * Build a high chair with a seat shell, back and four splayed legs.
 *
 * The floor is model Y zero and the chair faces `+Z`. The ANTILOP
 * footprint is 0.56 by 0.59 metres and the seat is 0.54 metres high.
 * The model exposes one seat contact and its supporting geometry.
 *
 * @param params Optional object ID and finite dimensions inside their bands.
 *   The ID defaults to `highChair`.
 * @param seed Numeric seed for omitted dimensions. Without it, the mass
 *   defaults to 3.25 kilograms.
 * @returns The chair with its `seat` at the front edge of the physical seat.
 * @throws {AutoMovieArchetypeRefusal} If a fixed dimension is outside its band.
 */
export function create(
  params: AutoMovieArchetypeHighChair.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHighChair.Affordance, AutoMovieArchetypeHighChair.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeHighChair.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeHighChair.Dimension>(
      "highChair",
      AutoMovieArchetypeHighChair.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeHighChair.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeHighChair.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeHighChair.Affordance,
    AutoMovieArchetypeHighChair.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "high chair",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const seat: number = d.seatHeight;
  const half: { x: number; z: number } = {
    x: d.seatWidth / 2,
    z: d.seatDepth / 2,
  };
  const foot: { x: number; z: number } = {
    x: d.width / 2 - E.leg / 2,
    z: d.depth / 2 - E.leg / 2,
  };
  for (const [id, sx, sz] of [
    ["leg-1", 1, 1],
    ["leg-2", -1, 1],
    ["leg-3", 1, -1],
    ["leg-4", -1, -1],
  ] as const)
    builder.rod(
      id,
      E.leg / 2,
      v(sx * foot.x, E.leg / 2, sz * foot.z),
      v(sx * half.x, seat - E.shell, sz * half.z),
      { color: "#d9c7a7", round: true },
    );
  builder.box(
    "seat",
    v(d.seatWidth, E.shell, d.seatDepth),
    v(0, seat - E.shell / 2, 0),
    { color: "#f2f2f2" },
  );
  builder.box(
    "back",
    v(d.seatWidth, d.height - seat, E.shell),
    v(0, (d.height + seat) / 2, -half.z - E.shell / 2),
    { color: "#f2f2f2" },
  );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, seat, half.z),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.seatWidth,
    depth: d.seatDepth,
  });
  return builder.build(d.mass);
}

  /** The level `seat` contact at the centre of the shell's forward edge. */
  export type Affordance = "seat";

  /**
   * The floor footprint uses `width` and `depth`. `height` reaches the top
   * of the back. `seatHeight`, `seatWidth` and `seatDepth` describe the
   * supporting shell. Geometry is in metres and mass is in kilograms.
   */
  export type Dimension =
    | "width"
    | "depth"
    | "height"
    | "seatHeight"
    | "seatWidth"
    | "seatDepth"
    | "mass";

  /**
   * Uses metres for the chair and seat geometry and kilograms for body mass.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    seatHeight: "m",
    seatWidth: "m",
    seatDepth: "m",
    mass: "kg",
  };

  /**
   * Optional object ID and fixed values in the ANTILOP bands. Equal geometric endpoints select the recorded measurement.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene object ID, defaulting to `highChair`. */
    id?: string;
  }

  /**
   * Recorded ANTILOP footprint and seat geometry with a provisional empty mass interval.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(0.56, 0.56, AutoMovieArchetypeHighChairData.ANTILOP),
    depth: AutoMovieArchetypeBand.metres(0.59, 0.59, AutoMovieArchetypeHighChairData.ANTILOP),
    height: AutoMovieArchetypeBand.metres(0.9, 0.9, AutoMovieArchetypeHighChairData.ANTILOP),
    seatHeight: AutoMovieArchetypeBand.metres(0.54, 0.54, AutoMovieArchetypeHighChairData.ANTILOP),
    seatWidth: AutoMovieArchetypeBand.metres(0.25, 0.25, AutoMovieArchetypeHighChairData.ANTILOP),
    seatDepth: AutoMovieArchetypeBand.metres(0.22, 0.22, AutoMovieArchetypeHighChairData.ANTILOP),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      2.5,
      4,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `leg`, a leg's diameter; `shell`, the seat
 * shell's thickness.
 */
const ESTIMATES: Readonly<{ leg: number; shell: number }> = {
  leg: 0.025,
  shell: 0.02,
};
