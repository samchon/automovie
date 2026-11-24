import { Vector3, rotationBetween } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";
import { SWORD_BANDS } from "./SWORD_BANDS";
import { SWORD_MODELS } from "./SWORD_MODELS";

/**
 * A blade held by its hilt: a longsword, an arming sword, a sabre, a katana, a
 * rapier, a dagger or a knife.
 *
 * The weapon stands along `+Y` with its point up and the blade's shoulder,
 * where the guard sits, at the origin; the hilt hangs below. The true edge
 * faces `+Z` and the flats face `+X` and `-X`. A sabre's and a katana's blade
 * curves back toward `-Z`, so the edge is the outside of the curve, and
 * `bladeLength` is the straight line from the shoulder to the point. The blade
 * is `SEGMENTS` flat boxes, each a declared part `blade-<k>` from the guard
 * out, so a contact names the part of the blade that met: the low numbers are
 * the strong, the high the weak.
 *
 * Mass and balance are cited, not derived: the parts carry mass shares that put
 * the centre of mass at the drawn `balance` above the guard, the hilt's parts
 * taking what the blade's taper leaves. `properties` gives the centre and the
 * inertia, and `moment` the inertia about the grip that a cut works against.
 *
 * @param params The kind, the model where the kind has read models, and any
 *   dimension the author fixes.
 * @param seed The seed that picks the model left free and draws every dimension
 *   left free inside its band; absent, the first model and the middle of each
 *   band.
 * @returns The weapon.
 * @throws {AutoMovieArchetypeRefusal} For a model not of the kind, a fixed
 *   dimension outside its band, or one the model gives.
 */
export function createSword(
  params: createSword.IParams,
  seed?: number | string,
): AutoMovieArchetype<createSword.Affordance, createSword.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createSword.Dimension> =
    new AutoMovieArchetypeDrawSession<createSword.Dimension>(
      "sword",
      createSword.UNITS,
      seed,
      params,
    );
  const kind: createSword.Kind = ArchetypeDraw.choice(
    "sword",
    "kind",
    params.kind,
    createSword.KINDS,
  );
  // A longsword or an arming sword is one of its maker's swords whole, a sabre one of its pattern's two weights; the rest are drawn in their bands.
  const model: {
    figures: Readonly<Partial<Record<createSword.Dimension, number>>>;
  } = draw.model<createSword.Model>(
    "model",
    params.model,
    createSword.MODELS[kind],
  );
  const drawn: Partial<Record<createSword.Dimension, number>> = {
    ...draw.dimensions(createSword.BANDS[kind], createSword.BANDS),
    ...model.figures,
  };
  const d: Record<createSword.Dimension, number> = {
    bladeLength: drawn.bladeLength!,
    bladeWidth: drawn.bladeWidth!,
    hiltLength: drawn.hiltLength!,
    balance: drawn.balance!,
    mass: drawn.mass!,
  };
  const builder: AutoMovieArchetypeBuilder<
    createSword.Affordance,
    createSword.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: createSword.NAMES[kind],
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const shape: createSword.IShape = createSword.SHAPES[kind];
  const n: number = createSword.SEGMENTS;

  // The blade's centre line: straight, or a parabola swept back toward -Z whose chord is the blade length.
  const rise: number = Math.sqrt(
    d.bladeLength * d.bladeLength - shape.curve * shape.curve,
  );
  const along = (s: number): IAutoMovieVector3 =>
    v(0, rise * s, -shape.curve * s * s);
  const taper = (s: number): number => 1 - (1 - createSword.TAPER) * s;
  const weights: number[] = [];
  const centres: IAutoMovieVector3[] = [];
  for (let k: number = 0; k < n; k++) {
    const from: IAutoMovieVector3 = along(k / n);
    const to: IAutoMovieVector3 = along((k + 1) / n);
    const span: IAutoMovieVector3 = Vector3.subtract(to, from);
    const middle: number = taper((k + 0.5) / n);
    weights.push(Vector3.length(span) * middle * middle);
    centres.push(Vector3.scale(Vector3.add(from, to), 0.5));
  }

  // The hilt under the guard: guard, grip, pommel.
  const grip: number = d.hiltLength - createSword.GUARD - 2 * shape.pommel;
  const hilt: readonly IAutoMovieVector3[] = [
    v(0, -createSword.GUARD / 2, 0),
    v(0, -createSword.GUARD - grip / 2, 0),
    v(0, -d.hiltLength + shape.pommel, 0),
  ];

  // The hilt's share of the mass is the one that balances the blade at the cited point above the guard.
  const total: number = weights.reduce((a: number, b: number): number => a + b);
  const blade: number =
    centres.reduce(
      (sum: number, c: IAutoMovieVector3, k: number): number =>
        sum + c.y * weights[k]!,
      0,
    ) / total;
  const low: number =
    hilt[0]!.y * shape.hilt[0] +
    hilt[1]!.y * shape.hilt[1] +
    hilt[2]!.y * shape.hilt[2];
  const heavy: number = (blade - d.balance) / (blade - low);

  for (let k: number = 0; k < n; k++) {
    const span: IAutoMovieVector3 = Vector3.subtract(
      along((k + 1) / n),
      along(k / n),
    );
    const middle: number = taper((k + 0.5) / n);
    builder.box(
      `blade-${k + 1}`,
      v(
        createSword.THICKNESS * middle,
        Vector3.length(span),
        d.bladeWidth * middle,
      ),
      centres[k]!,
      {
        color: "#c9ccd1",
        share: ((1 - heavy) * weights[k]!) / total,
        rotation: rotationBetween({ x: 0, y: 1, z: 0 }, span),
      },
    );
  }
  if (shape.disc)
    builder.rod(
      "guard",
      shape.guard / 2,
      v(0, -createSword.GUARD, 0),
      v(0, 0, 0),
      { color: "#3a3a3a", share: heavy * shape.hilt[0] },
    );
  else
    builder.box(
      "guard",
      v(
        kind === "rapier" ? shape.guard / 2 : 0.012,
        createSword.GUARD,
        shape.guard,
      ),
      hilt[0]!,
      { color: "#8a8d91", share: heavy * shape.hilt[0] },
    );
  builder.rod(
    "grip",
    createSword.GRIP / 2,
    v(0, -createSword.GUARD - grip, 0),
    v(0, -createSword.GUARD, 0),
    { color: "#4a3324", share: heavy * shape.hilt[1] },
  );
  builder.ball("pommel", shape.pommel, hilt[2]!, {
    color: "#8a8d91",
    share: heavy * shape.hilt[2],
  });

  // The hand or hands on the grip, taken from the back with the blade leaving the thumb's side; reversed, it leaves the little finger's.
  for (const [id, sign] of [
    ["grip", 1],
    ["reverseGrip", -1],
  ] as const) {
    if (id === "reverseGrip" && !shape.reverse) continue;
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        hilt[1]!,
        v(0, 0, -1),
        v(0, sign, 0),
      ),
      extent: null,
      grip: shape.hands === 2 ? "two-hand" : "power",
      aperture: createSword.GRIP,
      length: grip,
    });
  }

  // The edges at the middle of the blade, each facing the way it cuts; the flat that takes a parry; the point.
  const middle: IAutoMovieVector3 = along(0.5);
  const half: number = (d.bladeWidth * taper(0.5)) / 2;
  const chord: IAutoMovieVector3 = Vector3.subtract(along(1), along(0));
  for (const [id, sign] of [
    ["edge", 1],
    ["falseEdge", -1],
  ] as const) {
    if (id === "falseEdge" && !shape.double) continue;
    builder.affordance({
      id,
      kind: "ledge",
      direction: "normal",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, middle.y, middle.z + sign * half),
        v(0, 0, sign),
        chord,
      ),
      extent: null,
      length: d.bladeLength,
    });
  }
  builder.affordance({
    id: "flat",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v((createSword.THICKNESS * taper(0.5)) / 2, middle.y, middle.z),
      v(1, 0, 0),
      chord,
    ),
    extent: null,
    width: d.bladeLength,
    depth: 2 * half,
  });
  builder.affordance({
    id: "point",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(along(1), chord, v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/** Companion types, shape constants and bands of {@link createSword}. */
export namespace createSword {
  /** The kinds of blade. */
  export type Kind =
    | "longsword"
    | "armingSword"
    | "sabre"
    | "katana"
    | "rapier"
    | "dagger"
    | "knife";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "longsword",
    "armingSword",
    "sabre",
    "katana",
    "rapier",
    "dagger",
    "knife",
  ];

  /** The readable name of each kind. */
  export const NAMES: Readonly<Record<Kind, string>> = {
    longsword: "longsword",
    armingSword: "arming sword",
    sabre: "sabre",
    katana: "katana",
    rapier: "rapier",
    dagger: "dagger",
    knife: "fighting knife",
  };

  /** What a kind is beyond its drawn dimensions. */
  export interface IShape {
    /** How many hands the grip takes. */
    hands: 1 | 2;

    /** Whether the back of the blade is sharpened too. */
    double: boolean;

    /** Whether the weapon is also held point down, in the reverse grip. */
    reverse: boolean;

    /**
     * How far the point lies back toward `-Z` from the line the blade leaves
     * the guard on, metres.
     */
    curve: number;

    /** The guard's span along `Z`, or a disc guard's diameter, metres. */
    guard: number;

    /** Whether the guard is a disc about the blade, as a katana's tsuba. */
    disc: boolean;

    /** The pommel's radius, metres. */
    pommel: number;

    /**
     * The shares of the hilt's mass in the guard, the grip and the pommel,
     * summing to 1.
     */
    hilt: readonly [number, number, number];
  }

  /**
   * Each kind's shape. Every number here is an estimate not read at a source,
   * except the hands and edges, which define the kinds: guard spans and pommel
   * sizes are picture and guard collider, the hilt's mass split only moves the
   * inertia (the balance is cited), a katana's curve stands for a sori of about
   * 18 mm and a sabre's for the "pronounced curve" of the 1796 pattern.
   */
  export const SHAPES: Readonly<Record<Kind, IShape>> = {
    longsword: {
      hands: 2,
      double: true,
      reverse: false,
      curve: 0,
      guard: 0.22,
      disc: false,
      pommel: 0.025,
      hilt: [0.3, 0.2, 0.5],
    },
    armingSword: {
      hands: 1,
      double: true,
      reverse: false,
      curve: 0,
      guard: 0.18,
      disc: false,
      pommel: 0.025,
      hilt: [0.3, 0.2, 0.5],
    },
    sabre: {
      hands: 1,
      double: false,
      reverse: false,
      curve: 0.07,
      guard: 0.1,
      disc: false,
      pommel: 0.018,
      hilt: [0.4, 0.3, 0.3],
    },
    katana: {
      hands: 2,
      double: false,
      reverse: false,
      curve: 0.018,
      guard: 0.075,
      disc: true,
      pommel: 0.018,
      hilt: [0.35, 0.5, 0.15],
    },
    rapier: {
      hands: 1,
      double: true,
      reverse: false,
      curve: 0,
      guard: 0.11,
      disc: false,
      pommel: 0.022,
      hilt: [0.5, 0.15, 0.35],
    },
    dagger: {
      hands: 1,
      double: true,
      reverse: true,
      curve: 0,
      guard: 0.08,
      disc: false,
      pommel: 0.018,
      hilt: [0.35, 0.35, 0.3],
    },
    knife: {
      hands: 1,
      double: false,
      reverse: true,
      curve: 0,
      guard: 0.05,
      disc: false,
      pommel: 0.014,
      hilt: [0.25, 0.55, 0.2],
    },
  };

  /** How many boxes a blade is laid as. */
  export const SEGMENTS: number = 6;

  /**
   * A blade's thickness at the guard, metres: an estimate, not read at a
   * source.
   */
  export const THICKNESS: number = 0.005;

  /**
   * A blade's width and thickness at the point as a fraction of those at the
   * guard: an estimate that stands for profile and distal taper, not read at a
   * source.
   */
  export const TAPER: number = 0.4;

  /**
   * A guard's thickness along the blade, metres: an estimate, not read at a
   * source.
   */
  export const GUARD: number = 0.012;

  /**
   * A grip's diameter, metres, which is its `aperture`: an estimate, not read
   * at a source.
   */
  export const GRIP: number = 0.03;

  /**
   * The affordance ids:
   *
   * - `grip`: the hand or hands on the grip, taken from the `-Z` side, the
   *   frame's `+X` toward the blade; its `length` is the grip between guard and
   *   pommel, so a site along it places one hand under the guard and the other
   *   at the pommel.
   * - `reverseGrip`: the same grip held point down, the frame's `+X` toward the
   *   pommel; a dagger and a knife.
   * - `edge`: the true edge, a `ledge` at the blade's middle facing `+Z`, the way
   *   it cuts, its `length` the blade's.
   * - `falseEdge`: the back edge of a double-edged blade, facing `-Z`.
   * - `flat`: the blade's `+X` flat, which takes a parry or lies against a
   *   target; its width runs along the blade.
   * - `point`: the point, its `+Y` along the blade, the way a thrust goes.
   */
  export type Affordance =
    | "grip"
    | "reverseGrip"
    | "edge"
    | "falseEdge"
    | "flat"
    | "point";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `bladeLength`: from the guard to the point, in a straight line.
   * - `bladeWidth`: the blade's width at the guard.
   * - `hiltLength`: from the guard's blade side to the pommel's end.
   * - `balance`: the point of balance above the guard.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "bladeLength"
    | "bladeWidth"
    | "hiltLength"
    | "balance"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    bladeLength: "m",
    bladeWidth: "m",
    hiltLength: "m",
    balance: "m",
    mass: "kg",
  };

  /**
   * The read models: Albion's Crecy and Regent longswords and Knight and
   * Poitiers arming swords, and the 1796 sabre's officer's and trooper's
   * patterns.
   */
  export type Model =
    | "crecy"
    | "regent"
    | "knight"
    | "poitiers"
    | "officer"
    | "trooper";

  /**
   * The parameters: the kind, the model, and any free dimension fixed to a
   * value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which blade. */
    kind: Kind;

    /**
     * Which of the kind's read models; picked from the seed when absent. A
     * katana, a rapier, a dagger and a knife have none.
     */
    model?: Model;

    /** The model's id, unique in a scene; `sword` when absent. */
    id?: string;
  }

  /** Each kind's read models whole, the default first. */
  export const MODELS: typeof SWORD_MODELS = SWORD_MODELS;

  /** The band of each free dimension a model leaves, by kind. */
  export const BANDS: typeof SWORD_BANDS = SWORD_BANDS;
}
