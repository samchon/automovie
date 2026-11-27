import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** A spinning rod's length and the rod and reel's weight. */
const ROD: string =
  "spinning rods of 5 to 8 ft (1.5 to 2.4 m) with a 2500-size reel, about 0.3 to 0.5 kg together (retail listings seen in search results; provisional)";

/** A spinning reel's line retrieved per handle turn. */
const RETRIEVE: string =
  "spinning reels' line retrieved per handle turn, about 24 to 37 in (0.6 to 0.95 m) over gear ratios of 5:1 to 6.2:1 (makers' listings seen in search results; provisional)";

/** A reel handle's crank radius. */
const CRANK: string =
  "a 2500-size reel's handle arm, about 45 to 55 mm from the spool axis to the knob (provisional)";

/** How far the grip runs up from the butt, metres: the rod family's own grip. */
const GRIP: number = 0.12;

/** Constructs the spinning rod archetype from its recipe. */
export namespace AutoMovieArchetypeSpinningRod {
/**
 * A spinning rod with its reel: the rod standing on its butt along `+Y`, the
 * reel hanging under it toward `-Z` just above the grip, its handle on the left
 * (`-X`) turning about the reel's axis across the rod.
 *
 * - `grip`: the rod's grip the rod hand takes.
 * - `tip`: the rod's end the line runs from.
 * - `crank`: the reel's handle articulation, turning in degrees about its frame's
 *   `+Y`, the axis across the rod; the arm and the knob turn with it.
 * - `handle`: the knob the other hand turns, riding `crank`.
 *
 * @param params Any dimension the author fixes inside its band, and an optional
 *   scene id.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, the middle of each band.
 * @returns The rod.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeSpinningRod.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeSpinningRod.Affordance,
  AutoMovieArchetypeSpinningRod.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSpinningRod.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSpinningRod.Dimension>(
      "spinningRod",
      AutoMovieArchetypeSpinningRod.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeSpinningRod.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeSpinningRod.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSpinningRod.Affordance,
    AutoMovieArchetypeSpinningRod.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "spinning rod",
    draw,
  });
  const radius: number = 0.006;
  builder.rod(
    "rod",
    radius,
    Vector3.create(0, 0, 0),
    Vector3.create(0, d.length, 0),
    { color: "#2c2f33" },
  );
  // The reel under the rod just above the grip, its axis across the rod.
  const axis: IAutoMovieVector3 = Vector3.create(0, GRIP + 0.05, -0.07);
  builder.box("reel", Vector3.create(0.045, 0.05, 0.06), axis, {
    color: "#7d8288",
  });
  const hub: IAutoMovieVector3 = Vector3.create(-0.03, axis.y, axis.z);
  const knob: IAutoMovieVector3 = Vector3.create(
    -0.03,
    axis.y - d.crank,
    axis.z,
  );
  builder.rod("arm", 0.004, hub, knob, { color: "#4a4e53" });
  builder.rod("knob", 0.008, knob, Vector3.create(-0.055, knob.y, knob.z), {
    color: "#1d1f22",
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, GRIP / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 0.025,
    length: GRIP,
  });
  builder.affordance({
    id: "tip",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, d.length, 0)),
    extent: null,
  });
  builder.affordance({
    id: "crank",
    kind: "crank",
    extent: null,
    parts: ["arm", "knob"],
    frame: AutoMovieArchetypeFrame.facing(
      hub,
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
  });
  builder.affordance({
    id: "handle",
    kind: "handle",
    rides: "crank",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(-0.045, knob.y, knob.z),
      Vector3.create(0, 0, -1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: 0.016,
    length: 0.025,
  });
  return builder.build(d.mass);
}
}

/** Companion types, constants and bands of {@link createSpinningRod}. */
export namespace AutoMovieArchetypeSpinningRod {
  /** The contacts: the rod's grip and tip, the reel's crank and its handle. */
  export type Affordance = "grip" | "tip" | "crank" | "handle";

  /** The dimensions the author may fix inside their bands. */
  export type Dimension = "length" | "mass" | "retrieve" | "crank";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    mass: "kg",
    retrieve: "m",
    crank: "m",
  };

  /** The dimensions fixed by the author, and an optional scene id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the family name. */
    id?: string;
  }

  /** The sourced bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(1.5, 2.4, ROD),
    mass: AutoMovieArchetypeBand.of("kg", 0.3, 0.5, ROD),
    retrieve: AutoMovieArchetypeBand.metres(0.6, 0.95, RETRIEVE),
    crank: AutoMovieArchetypeBand.metres(0.045, 0.055, CRANK),
  };
}
