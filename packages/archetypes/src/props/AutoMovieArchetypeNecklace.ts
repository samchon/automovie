import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { AutoMovieArchetypeNecklaceData } from "./internal/AutoMovieArchetypeNecklaceData";

/**
 * Constructs a closed chain or ribbon loop with an inside aperture and paired grips.
 */
export namespace AutoMovieArchetypeNecklace {
/**
 * Build a rigid elliptical necklace lying in model XZ with its back
 * at the origin and its pendant toward `+Z`.
 *
 * The drawn length and breadth set the nominal ellipse. Twenty-four
 * straight pieces approximate that centreline. A short, wide chain
 * uses a shallower front-to-back axis to retain both measurements.
 *
 * @param params Chain or ribbon, optional scene ID and finite
 *   measurements admitted by that kind. Omission selects `chain`.
 * @param seed Numeric seed for omitted measurements. Without it,
 *   the chain is 0.7112 metres long and 0.21 metres across.
 * @returns The fixed neck loop with rear and pendant sockets, an inner
 *   aperture and two grips. The default ID is `necklace` for chain
 *   and `neckMedal` for ribbon.
 * @throws {AutoMovieArchetypeRefusal} If a kind or fixed value is inadmissible.
 */
export function create(
  params: AutoMovieArchetypeNecklace.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeNecklace.Affordance, AutoMovieArchetypeNecklace.Dimension> {
  const kind: AutoMovieArchetypeNecklace.Kind = ArchetypeDraw.choice(
    "necklace",
    "kind",
    params.kind ?? "chain",
    AutoMovieArchetypeNecklace.KINDS,
  );
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeNecklace.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeNecklace.Dimension>(
      kind === "chain" ? "necklace" : "neckMedal",
      AutoMovieArchetypeNecklace.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeNecklace.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeNecklace.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeNecklace.Affordance,
    AutoMovieArchetypeNecklace.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: kind === "chain" ? "steel" : "composite",
    id: params.id,
    name: kind === "chain" ? "necklace" : "neck medal",
    draw,
  });
  const b: number = d.breadth / 2;
  const scaledPerimeter: number = d.length / (Math.PI * b);
  // Short, wide chains use the shallow root of the same ellipse perimeter.
  const a: number =
    scaledPerimeter >= 2
      ? AutoMovieArchetypeNecklace.depth(d.length, b)
      : (b *
          (3 * scaledPerimeter -
            4 +
            Math.sqrt(3 * scaledPerimeter ** 2 + 12 * scaledPerimeter - 20))) /
        6;
  const point = (theta: number): IAutoMovieVector3 =>
    AutoMovieEngineVector3.create(b * Math.sin(theta), 0, a * (1 - Math.cos(theta)));
  const thread: number = kind === "chain" ? 0.0015 : 0.004;
  const color: string = kind === "chain" ? "#d4af37" : "#1f4fa3";
  for (let k: number = 0; k < PIECES; ++k)
    builder.rod(
      `loop${k}`,
      thread,
      point((2 * Math.PI * k) / PIECES),
      point((2 * Math.PI * (k + 1)) / PIECES),
      { color },
    );

  // The pendant or the disc at the front, lying in the loop's plane.
  const front: IAutoMovieVector3 = point(Math.PI);
  const disc: number = kind === "chain" ? 0.012 : d.disc;
  builder.rod(
    "pendant",
    disc / 2,
    AutoMovieEngineVector3.create(front.x, -0.002, front.z + disc / 2),
    AutoMovieEngineVector3.create(front.x, 0.002, front.z + disc / 2),
    { color: "#c9a227" },
  );
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, 0, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "front",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(front.x, 0, front.z + disc / 2),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "opening",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, 0, thread),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    width: 2 * (b - thread),
    height: 2 * (a - thread),
  });
  const at: number =
    kind === "chain" ? AutoMovieArchetypeNecklace.CLASP : AutoMovieArchetypeNecklace.SIDE;
  for (const [id, theta] of [
    ["holdLeft", at],
    ["holdRight", -at],
  ] as const) {
    const p: IAutoMovieVector3 = point(theta);
    // Out of the loop at that point, across its tangent.
    const tangent: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.create(b * Math.cos(theta), 0, a * Math.sin(theta)),
    );
    builder.affordance({
      id,
      kind: "handle",
      frame: AutoMovieArchetypeFrame.facing(
        p,
        AutoMovieEngineVector3.create(tangent.z, 0, -tangent.x),
        tangent,
      ),
      extent: null,
      grip: "lateral",
      aperture: 2 * thread,
    });
  }
  return builder.build(d.mass);
}

  /** Selects a chain with a small pendant or a ribbon with a medal disc. */
  export type Kind = "chain" | "ribbon";

  /** Both admitted closed-loop kinds in gallery order. */
  export const KINDS: readonly Kind[] = ["chain", "ribbon"];

  /**
   * Rear `wear` and pendant `front` sockets, inner `opening`, and
   * opposed `holdLeft` and `holdRight` along the loop.
   */
  export type Affordance =
    | "wear"
    | "front"
    | "opening"
    | "holdLeft"
    | "holdRight";

  /**
   * Nominal loop perimeter, centreline breadth and disc diameter in metres. Mass is in kilograms.
   */
  export type Dimension = "length" | "breadth" | "disc" | "mass";

  /** Chain grip angle from the back centre, 35 degrees expressed in radians. */
  export const CLASP: number = (35 * Math.PI) / 180;

  /**
   * Ribbon grip angle at the widest points, pi over two radians from the back.
   */
  export const SIDE: number = Math.PI / 2;

  /** Units for the saved loop perimeter, breadth, disc diameter and mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    breadth: "m",
    disc: "m",
    mass: "kg",
  };

  /**
   * Optional chain or ribbon kind, scene ID and applicable finite band measurements.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the chain or ribbon bands. Omission uses `chain`. */
    kind?: Kind;

    /**
     * Scene object ID, defaulting to `necklace` for chain or `neckMedal` for ribbon.
     */
    id?: string;
  }

  /**
   * Per-kind bands for the nominal perimeter, breadth, disc diameter and mass.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    chain: {
      length: AutoMovieArchetypeBand.metres(
        26 * AutoMovieArchetypeUnits.INCH,
        30 * AutoMovieArchetypeUnits.INCH,
        AutoMovieArchetypeNecklaceData.CHAIN,
      ),
      breadth: AutoMovieArchetypeBand.metres(0.2, 0.22, AutoMovieArchetypeNecklaceData.BREADTH),
      disc: AutoMovieArchetypeBand.metres(0.012, 0.012, AutoMovieArchetypeNecklaceData.CHAIN_MASS),
      mass: AutoMovieArchetypeBand.of("kg", 0.01, 0.04, AutoMovieArchetypeNecklaceData.CHAIN_MASS),
    },
    ribbon: {
      length: AutoMovieArchetypeBand.metres(0.8, 1.0, AutoMovieArchetypeNecklaceData.RIBBON),
      breadth: AutoMovieArchetypeBand.metres(0.2, 0.22, AutoMovieArchetypeNecklaceData.BREADTH),
      disc: AutoMovieArchetypeBand.metres(0.07, 0.085, AutoMovieArchetypeNecklaceData.DISC),
      mass: AutoMovieArchetypeBand.of("kg", 0.45, 0.556, AutoMovieArchetypeNecklaceData.DISC),
    },
  };

  /**
   * Find the front-to-back half-axis for a circular or deeper ellipse.
   *
   * Uses Ramanujan's first perimeter approximation. The public helper
   * keeps the half-axis at least the supplied half-breadth. The factory
   * uses the shallow root directly for its short and wide chain recipes.
   *
   * @param length Nominal loop perimeter in metres.
   * @param b Positive half-breadth in metres.
   * @returns The half-depth in metres, with a minimum of `b`.
   */
  export function depth(length: number, b: number): number {
    const perimeter = (a: number): number =>
      Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    if (length <= perimeter(b)) return b;
    let lo: number = b;
    let hi: number = length;
    for (let i: number = 0; i < 60; ++i) {
      const mid: number = (lo + hi) / 2;
      if (perimeter(mid) < length) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
}

/*
 * How many straight pieces draw the loop.
 */
const PIECES: number = 24;
