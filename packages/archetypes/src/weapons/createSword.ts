import { Vector3, rotationBetween } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
} from "../core";
import { SWORD_BANDS } from "./SWORD_BANDS";

/**
 * A blade held by its hilt: a longsword, an arming sword, a sabre, a katana, a rapier, a dagger or a knife.
 *
 * The weapon stands along `+Y` with its point up and the blade's shoulder, where the guard sits, at the origin; the hilt hangs below. The true edge faces `+Z` and the flats face `+X` and `-X`. A sabre's and a katana's blade curves back toward `-Z`, so the edge is the outside of the curve, and `bladeLength` is the straight line from the shoulder to the point. The blade is `SEGMENTS` flat boxes, each a declared part `blade-<k>` from the guard out, so a contact names the part of the blade that met: the low numbers are the strong, the high the weak.
 *
 * Mass and balance are cited, not derived: the parts carry mass shares that put the centre of mass at the drawn `balance` above the guard, the hilt's parts taking what the blade's taper leaves. `properties` gives the centre and the inertia, and `moment` the inertia about the grip that a cut works against.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The weapon.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the weapon stands, where its edge and flats face, how a curved blade is measured, what the blade's parts are and where the mass properties come from.
 * @evidence contracts/development/implementation.md#principled-implementation The blade tapers in width and thickness to `TAPER` of its base at the point, so each segment's mass share is its length times its width times its thickness and the blade's own centre follows; the hilt's share is then the lever balance that puts the whole at the cited point of balance, (blade centre minus balance) over (blade centre minus hilt centre), split among guard, grip and pommel by `HILT`. A curved blade's points lie on a parabola whose chord is the blade length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, lay the blade's segments, lay the hilt, weigh the hilt against the blade, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fuller, ricasso or bevel; a rapier's swept hilt is a plate, a sabre has no knuckle bow. The split of the hilt's mass, the taper, the guards' sizes and the curves are estimates named on their constants.
 * @evidence contracts/development/implementation.md#efficient-algorithms Nine parts: six blade segments, a guard, a grip and a pommel.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSword(
  params: createSword.IParams,
  seed?: number | string,
): Archetype<createSword.Affordance, createSword.Dimension> {
  const kind: createSword.Kind = ArchetypeDraw.choice(
    "sword",
    "kind",
    params.kind,
    createSword.KINDS,
  );
  const d: Record<createSword.Dimension, number> = ArchetypeDraw.dimensions(
    "sword",
    createSword.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createSword.Affordance,
    createSword.Dimension
  > = new ArchetypeBuilder({
    archetype: "sword",
    id: params.id,
    name: createSword.NAMES[kind],
    dimensions: d,
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
      frame: ArchetypeFrame.facing(hilt[1]!, v(0, 0, -1), v(0, sign, 0)),
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
      frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(
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
    frame: ArchetypeFrame.facing(along(1), chord, v(1, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, shape constants and bands of {@link createSword}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from or that it is an estimate.
 * @evidence contracts/development/design.md#principled-representation Closed unions, one cited band per dimension per kind, and one shape record per kind for what the bands do not vary: hands, edges, curve and hilt furniture.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a cut, a thrust and a parry read (#3202 decision 6, #3374): the grip with sites along it, the edges, the flat, the point, the mass, the point of balance and the inertia about the grip.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Kinds differ by data in `SHAPES`, not by branches named after them, except the rapier's wider guard block.
 */
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

    /** How far the point lies back toward `-Z` from the line the blade leaves the guard on, metres. */
    curve: number;

    /** The guard's span along `Z`, or a disc guard's diameter, metres. */
    guard: number;

    /** Whether the guard is a disc about the blade, as a katana's tsuba. */
    disc: boolean;

    /** The pommel's radius, metres. */
    pommel: number;

    /** The shares of the hilt's mass in the guard, the grip and the pommel, summing to 1. */
    hilt: readonly [number, number, number];
  }

  /**
   * Each kind's shape. Every number here is an estimate not read at a source, except the hands and edges, which define the kinds: guard spans and pommel sizes are picture and guard collider, the hilt's mass split only moves the inertia (the balance is cited), a katana's curve stands for a sori of about 18 mm and a sabre's for the "pronounced curve" of the 1796 pattern.
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

  /** A blade's thickness at the guard, metres: an estimate, not read at a source. */
  export const THICKNESS: number = 0.005;

  /** A blade's width and thickness at the point as a fraction of those at the guard: an estimate that stands for profile and distal taper, not read at a source. */
  export const TAPER: number = 0.4;

  /** A guard's thickness along the blade, metres: an estimate, not read at a source. */
  export const GUARD: number = 0.012;

  /** A grip's diameter, metres, which is its `aperture`: an estimate, not read at a source. */
  export const GRIP: number = 0.03;

  /**
   * The affordance ids:
   *
   * - `grip`: the hand or hands on the grip, taken from the `-Z` side, the frame's `+X` toward the blade; its `length` is the grip between guard and pommel, so a site along it places one hand under the guard and the other at the pommel.
   * - `reverseGrip`: the same grip held point down, the frame's `+X` toward the pommel; a dagger and a knife.
   * - `edge`: the true edge, a `ledge` at the blade's middle facing `+Z`, the way it cuts, its `length` the blade's.
   * - `falseEdge`: the back edge of a double-edged blade, facing `-Z`.
   * - `flat`: the blade's `+X` flat, which takes a parry or lies against a target; its width runs along the blade.
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

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which blade. */
    kind: Kind;

    /** The model's id, unique in a scene; `sword` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: typeof SWORD_BANDS = SWORD_BANDS;
}
