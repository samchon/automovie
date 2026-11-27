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
import * as AutoMovieArchetypeFingerRingData from "./internal/AutoMovieArchetypeFingerRingData";

/** Constructs the finger ring archetype from its recipe. */
export namespace AutoMovieArchetypeFingerRing {
/**
 * A finger ring: a plain band slipped along a finger to its base (#4015).
 *
 * The band lies in the `XY` plane around the origin, its hole's axis along
 * `+Z`. `wear` is the hole's centre, its frame's `+Y` along that axis (the
 * model's `+Z`), the way the ring travels along a finger toward the hand, so
 * seating it on a finger lays the axis along the finger; `hold` is the band's
 * top, facing out, where a thumb and a fingertip pinch it.
 *
 * @param params Any dimension the author fixes inside its band, and an optional
 *   scene id.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, the middle of each band.
 * @returns The ring.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeFingerRing.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeFingerRing.Affordance, AutoMovieArchetypeFingerRing.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeFingerRing.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeFingerRing.Dimension>(
      "fingerRing",
      AutoMovieArchetypeFingerRing.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeFingerRing.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeFingerRing.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeFingerRing.Affordance,
    AutoMovieArchetypeFingerRing.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "finger ring",
    draw,
  });

  // The band's centreline: the inner circle's radius plus half the wire.
  const radius: number = d.circumference / (2 * Math.PI) + d.wire / 2;
  const at = (k: number): IAutoMovieVector3 =>
    Vector3.create(
      radius * Math.sin((2 * Math.PI * k) / PIECES),
      radius * Math.cos((2 * Math.PI * k) / PIECES),
      0,
    );
  for (let k: number = 0; k < PIECES; ++k)
    builder.rod(`band${k}`, d.wire / 2, at(k), at(k + 1), { color: "#d4af37" });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    depth: d.wire,
  });
  builder.affordance({
    id: "hold",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, radius, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: d.wire,
  });
  return builder.build(d.mass);
}

  /**
   * The contacts: the hole's centre a finger passes through, and the band's top
   * a pinch takes.
   */
  export type Affordance = "wear" | "hold";

  /** The dimensions the author may fix inside their bands. */
  export type Dimension = "circumference" | "wire" | "mass";

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    circumference: "m",
    wire: "m",
    mass: "kg",
  };

  /** The dimensions fixed by the author, and an optional scene id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the family name. */
    id?: string;
  }

  /** The sourced bands. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    circumference: AutoMovieArchetypeBand.metres(0.049, 0.072, AutoMovieArchetypeFingerRingData.SIZE),
    wire: AutoMovieArchetypeBand.metres(0.0015, 0.0025, AutoMovieArchetypeFingerRingData.WIRE),
    mass: AutoMovieArchetypeBand.of("kg", 0.002, 0.008, AutoMovieArchetypeFingerRingData.MASS),
  };
}

/*
 * How many straight pieces draw the band's circle.
 */
const PIECES: number = 12;
