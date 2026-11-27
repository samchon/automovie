import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The high jump's landing area in the rules' comparison sheet. */
const HIGH: string =
  "2025 High Jump Rules Comparison, Pacific Association USATF, World Athletics column: landing surface 6 m by 4 m by 0.7 m (https://pausatf.org/wp-content/uploads/2025/01/High-Jump-Rules-Comparison-Color-2025.pdf), the least the rule allows, which the model takes";

/** The pole vault's landing area in the rules' comparison sheet. */
const POLE: string =
  "2025 Pole Vault Rules Comparison, Pacific Association USATF, World Athletics column: landing area 6 m by 6 m by 0.8 m behind the box, 8 m with the front pads (https://pausatf.org/wp-content/uploads/2025/01/Pole-Vault-Rules-Comparison-Color-2025.pdf), the least the rule allows, which the model takes";

/** Constructs the landing mat archetype from its recipe. */
export namespace AutoMovieArchetypeLandingMat {
/**
 * A landing mat: the foam bed a high jumper or a pole vaulter comes down on.
 *
 * The mat lies on the floor with the middle of its footprint at the origin, its
 * length along `Z` (the direction of the jump) and its width along `X`.
 * `surface` is its top, the place a landing lies on.
 *
 * @param params The kind, a pole vault mat's layout and any dimension the
 *   author fixes.
 * @param seed The seed that draws a pole vault mat's layout when it is not
 *   given and every dimension left free inside its band; absent, the first
 *   layout and the middle of each band.
 * @returns The mat.
 * @throws {AutoMovieArchetypeRefusal} For a layout the rules do not give or one
 *   named for a high jump mat, a fixed dimension outside its band, or one only
 *   the other kind has.
 */
export function create(
  params: AutoMovieArchetypeLandingMat.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLandingMat.Affordance, AutoMovieArchetypeLandingMat.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeLandingMat.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeLandingMat.Dimension>(
      "landingMat",
      AutoMovieArchetypeLandingMat.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeLandingMat.Kind = ArchetypeDraw.choice(
    "landingMat",
    "kind",
    params.kind,
    AutoMovieArchetypeLandingMat.KINDS,
  );
  const layout: {
    name: AutoMovieArchetypeLandingMat.Layout | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeLandingMat.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeLandingMat.Layout>(
    "layout",
    params.layout,
    AutoMovieArchetypeLandingMat.LAYOUTS[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeLandingMat.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeLandingMat.BANDS[kind], AutoMovieArchetypeLandingMat.BANDS),
    ...layout.figures,
  };
  const length: number = d.length!;
  const width: number = d.width!;
  const height: number = d.height!;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeLandingMat.Affordance,
    AutoMovieArchetypeLandingMat.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name:
      kind === "highJump" ? "high jump mat" : `pole vault mat ${layout.name}`,
    draw,
  });
  builder.box(
    "bed",
    Vector3.create(width, height, length),
    Vector3.create(0, height / 2, 0),
    { color: "#2f5d9e" },
  );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: null,
    width,
    depth: length,
  });
  return builder.build(d.mass!);
}
}

/** Companion types and bands of {@link createLandingMat}. */
export namespace AutoMovieArchetypeLandingMat {
  /** The kinds of mat. */
  export type Kind = "highJump" | "poleVault";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["highJump", "poleVault"];

  /** The affordance ids: `surface`, the top. */
  export type Affordance = "surface";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: along `Z`, the jump's direction.
   * - `width`: along `X`.
   * - `height`: the top above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    height: "m",
    mass: "kg",
  };

  /** A pole vault mat's layouts. */
  export type Layout = "without front pads" | "with front pads";

  /**
   * The figures each layout fixes, by kind, the default first: the pole vault's
   * landing area "6 m by 6 m by 0.8 m behind the box, 8 m with the front pads"
   * (at the address `POLE` gives).
   */
  export const LAYOUTS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Layout, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    poleVault: {
      "without front pads": { length: 6 },
      "with front pads": { length: 8 },
    },
  };

  /**
   * The parameters: the kind, a pole vault mat's layout, and any free dimension
   * fixed to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which mat. */
    kind: Kind;

    /**
     * A pole vault mat's layout; drawn from the seed when absent. A high jump
     * mat has none.
     */
    layout?: Layout;

    /** The model's id, unique in a scene; `landingMat` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    highJump: {
      length: AutoMovieArchetypeBand.metres(4, 4, HIGH),
      width: AutoMovieArchetypeBand.metres(6, 6, HIGH),
      height: AutoMovieArchetypeBand.metres(0.7, 0.7, HIGH),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        250,
        400,
        "an estimate of a foam bed of that size with its cover; no maker's figure was read",
        true,
      ),
    },
    poleVault: {
      width: AutoMovieArchetypeBand.metres(6, 6, POLE),
      height: AutoMovieArchetypeBand.metres(0.8, 0.8, POLE),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        450,
        700,
        "an estimate of a foam bed of that size with its cover; no maker's figure was read",
        true,
      ),
    },
  };
}
