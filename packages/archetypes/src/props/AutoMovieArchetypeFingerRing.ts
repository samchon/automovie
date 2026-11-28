import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeFingerRingData } from "./internal/AutoMovieArchetypeFingerRingData";

/** Constructs a plain finger ring with an axial socket and top pinch. */
export namespace AutoMovieArchetypeFingerRing {
/**
 * Build a plain ring centred in the model XY plane.
 *
 * The `wear` socket faces along the hole toward `+Z`. The `hold` pinches
 * the band at its upper side with an aperture equal to wire diameter.
 *
 * @param params Optional scene ID and finite inner circumference,
 *   wire diameter and mass. The ID defaults to `fingerRing`.
 * @param seed Numeric seed for omitted values. The seedless nominal
 *   inner circumference is 0.0605 metres, with 0.002 metre wire.
 * @returns The segmented band with its finger socket and top grip.
 * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
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
    AutoMovieEngineVector3.create(
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
      AutoMovieEngineVector3.create(0, 0, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    depth: d.wire,
  });
  builder.affordance({
    id: "hold",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, radius, 0),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: d.wire,
  });
  return builder.build(d.mass);
}

  /**
   * Axial finger `wear` socket at the hole centre and top `hold` at the band.
   */
  export type Affordance = "wear" | "hold";

  /**
   * Nominal inner circumference and wire diameter in metres, and mass in kilograms.
   */
  export type Dimension = "circumference" | "wire" | "mass";

  /** Units for the circumference, wire diameter and whole ring mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    circumference: "m",
    wire: "m",
    mass: "kg",
  };

  /**
   * Optional scene ID and finite nominal inner circumference, wire diameter and mass within their bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene object ID, defaulting to `fingerRing`. */
    id?: string;
  }

  /**
   * The source bands for inner circumference, wire diameter and gold-band mass.
   */
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
