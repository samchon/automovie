import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * The ring sizes: ISO 8653:2016 states a ring's size as its inner circumference
 * in millimetres, its table running from 49 to 72 mm.
 */
const SIZE: string =
  "ISO 8653:2016 ring sizes, the inner circumference 49 to 72 mm (Wikipedia, Ring size, ISO size table)";

/** A plain band's wire thickness, provisional. */
const WIRE: string = "a plain band's wire 1.5 to 2.5 mm thick, provisional";

/** A plain band's mass, provisional. */
const MASS: string = "a plain gold band of 2 to 8 g, provisional";

/** How many straight pieces draw the band's circle. */
const PIECES: number = 12;

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
export function createFingerRing(
  params: createFingerRing.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createFingerRing.Affordance, createFingerRing.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createFingerRing.Dimension> =
    new AutoMovieArchetypeDrawSession<createFingerRing.Dimension>(
      "fingerRing",
      createFingerRing.UNITS,
      seed,
      params,
    );
  const d: Record<createFingerRing.Dimension, number> = draw.dimensions(
    createFingerRing.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createFingerRing.Affordance,
    createFingerRing.Dimension
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

/** Companion types, constants and bands of {@link createFingerRing}. */
export namespace createFingerRing {
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
    circumference: AutoMovieArchetypeBand.metres(0.049, 0.072, SIZE),
    wire: AutoMovieArchetypeBand.metres(0.0015, 0.0025, WIRE),
    mass: AutoMovieArchetypeBand.of("kg", 0.002, 0.008, MASS),
  };
}
