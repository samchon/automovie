import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/**
 * A chain long enough to pass over a head: the matinee to the lower opera
 * lengths.
 */
const CHAIN: string =
  "necklace lengths: matinee 20 to 24 in, opera from 24 to about 34 in (Blue Nile, Necklace length chart; LoveToKnow, Necklace length guide); the coarse rigid loop takes 26 to 30 in, long enough to pass over a head";

/** A neck ribbon's loop: twice the hang of `createMedal`'s ribbon. */
const RIBBON: string =
  "a medal's neck ribbon hanging about 0.4 to 0.5 m from the nape to the disc (createMedal, provisional), a loop of twice that";

/**
 * The loop's inner breadth: wider than a head, so the rigid loop passes over
 * it.
 */
const BREADTH: string =
  "an inner breadth of 0.2 to 0.22 m, more than an adult head's breadth so the rigid loop passes over it, provisional";

/** The medal disc: the recent Olympic medals, as `createMedal` reads them. */
const DISC: string =
  "Olympic medals: Tokyo 2020 85 mm across and up to 556 g, Paris 2024 85 mm and 529 g (organisers' figures); smaller ceremony medals down to 70 mm and 450 g, provisional";

/** A chain necklace's mass, provisional. */
const CHAIN_MASS: string =
  "a fine chain with a small pendant, 10 to 40 g, provisional";

/** How many straight pieces draw the loop. */
const PIECES: number = 24;

/** Constructs the necklace archetype from its recipe. */
export namespace AutoMovieArchetypeNecklace {
/**
 * A neck loop worn around the neck and set over a head (#4015): a chain
 * necklace with a small pendant (`chain`) or a ribbon medal (`ribbon`).
 *
 * The coarse prop is one rigid closed loop, so it goes on over the head rather
 * than being opened and clasped: it lies in its `XZ` plane, an ellipse
 * `breadth` across along `X` whose perimeter is the drawn `length`, its back
 * point (the clasp, or the ribbon's middle) at the origin and its front at
 * `+Z`. `wear` is the back point, its `+Y` into the loop (`+Z`), the point laid
 * on the wearer's nape; `front` is the pendant or the disc; `opening` is the
 * loop's inside as an aperture a head passes through: its frame at the back
 * inside the thread, `+Y` toward the front, `+Z` along the loop's normal, its
 * `width` and `height` the inner breadth and length; `holdLeft` and `holdRight`
 * are where the two hands take the loop, on the wearer's left (`+X`) and right
 * sides: near the clasp for a chain (`CLASP` from the back), at the loop's
 * widest for a ribbon (`SIDE`).
 *
 * @param params The kind, any dimension the author fixes inside its band, and
 *   an optional scene id.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, the middle of each band.
 * @returns The loop.
 * @throws {AutoMovieArchetypeRefusal} For an unknown kind or a fixed dimension
 *   outside its band.
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
  const a: number = AutoMovieArchetypeNecklace.depth(d.length, b);
  const point = (theta: number): IAutoMovieVector3 =>
    Vector3.create(b * Math.sin(theta), 0, a * (1 - Math.cos(theta)));
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
    Vector3.create(front.x, -0.002, front.z + disc / 2),
    Vector3.create(front.x, 0.002, front.z + disc / 2),
    { color: "#c9a227" },
  );
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "front",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(front.x, 0, front.z + disc / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "opening",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, 0, thread),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
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
    const tangent: IAutoMovieVector3 = Vector3.normalize(
      Vector3.create(b * Math.cos(theta), 0, a * Math.sin(theta)),
    );
    builder.affordance({
      id,
      kind: "handle",
      frame: AutoMovieArchetypeFrame.facing(
        p,
        Vector3.create(tangent.z, 0, -tangent.x),
        tangent,
      ),
      extent: null,
      grip: "lateral",
      aperture: 2 * thread,
    });
  }
  return builder.build(d.mass);
}

  /** The kinds: a chain with a small pendant, or a ribbon medal. */
  export type Kind = "chain" | "ribbon";

  /** The kinds, as data. */
  export const KINDS: readonly Kind[] = ["chain", "ribbon"];

  /**
   * The contacts: the back point laid on the nape, the pendant, the opening a
   * head passes through, and the two hands' places.
   */
  export type Affordance =
    | "wear"
    | "front"
    | "opening"
    | "holdLeft"
    | "holdRight";

  /** The dimensions the author may fix inside their bands. */
  export type Dimension = "length" | "breadth" | "disc" | "mass";

  /**
   * How far round from the back a chain's hands take it, radians: beside the
   * clasp (provisional).
   */
  export const CLASP: number = (35 * Math.PI) / 180;

  /**
   * How far round from the back a ribbon's hands take it, radians: at the
   * loop's widest.
   */
  export const SIDE: number = Math.PI / 2;

  /** Each dimension's unit. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    breadth: "m",
    disc: "m",
    mass: "kg",
  };

  /** The kind, the dimensions fixed by the author, and an optional scene id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The kind; `chain` when absent. */
    kind?: Kind;

    /** A unique scene identifier, defaulting to the family name. */
    id?: string;
  }

  /** The sourced bands of each kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    chain: {
      length: AutoMovieArchetypeBand.metres(
        26 * AutoMovieArchetypeUnits.INCH,
        30 * AutoMovieArchetypeUnits.INCH,
        CHAIN,
      ),
      breadth: AutoMovieArchetypeBand.metres(0.2, 0.22, BREADTH),
      disc: AutoMovieArchetypeBand.metres(0.012, 0.012, CHAIN_MASS),
      mass: AutoMovieArchetypeBand.of("kg", 0.01, 0.04, CHAIN_MASS),
    },
    ribbon: {
      length: AutoMovieArchetypeBand.metres(0.8, 1.0, RIBBON),
      breadth: AutoMovieArchetypeBand.metres(0.2, 0.22, BREADTH),
      disc: AutoMovieArchetypeBand.metres(0.07, 0.085, DISC),
      mass: AutoMovieArchetypeBand.of("kg", 0.45, 0.556, DISC),
    },
  };

  /**
   * The ellipse's half-axis front to back whose perimeter is `length` at the
   * half-breadth `b`, by bisection on Ramanujan's first approximation `pi (3
   * (a
   *
   * - B) - sqrt((3a + b)(a + 3b)))`.
   *
   * @param length The loop's perimeter, metres.
   * @param b The half-breadth, metres.
   * @returns The front-to-back half-axis, metres; `b` when the perimeter is no
   *   more than the circle's.
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
