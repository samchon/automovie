import { AutoMovieArchetypeSword } from "../AutoMovieArchetypeSword";
import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import "../constants/SWORD_BANDS";
import "../constants/SWORD_MODELS";
import "./createSwordShapes";

/*
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
 * Parameter params: The kind, the model where the kind has read models, and any
 * dimension the author fixes.
 * Parameter seed: The seed that picks the model left free and draws every dimension
 * left free inside its band; absent, the first model and the middle of each
 * band.
 * Returns: The weapon.
 * For a model not of the kind, a fixed
 * dimension outside its band, or one the model gives.
 */
export function createSword(
  params: AutoMovieArchetypeSword.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSword.Affordance, AutoMovieArchetypeSword.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSword.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSword.Dimension>(
      "sword",
      AutoMovieArchetypeSword.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeSword.Kind = ArchetypeDraw.choice(
    "sword",
    "kind",
    params.kind,
    AutoMovieArchetypeSword.KINDS,
  );
  // A longsword or an arming sword is one of its maker's swords whole, a sabre one of its pattern's two weights; the rest are drawn in their bands.
  const model: {
    figures: Readonly<Partial<Record<AutoMovieArchetypeSword.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeSword.Model>(
    "model",
    params.model,
    AutoMovieArchetypeSword.MODELS[kind],
  );
  const drawn: Partial<Record<AutoMovieArchetypeSword.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeSword.BANDS[kind], AutoMovieArchetypeSword.BANDS),
    ...model.figures,
  };
  const d: Record<AutoMovieArchetypeSword.Dimension, number> = {
    bladeLength: drawn.bladeLength!,
    bladeWidth: drawn.bladeWidth!,
    hiltLength: drawn.hiltLength!,
    balance: drawn.balance!,
    mass: drawn.mass!,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSword.Affordance,
    AutoMovieArchetypeSword.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: AutoMovieArchetypeSword.NAMES[kind],
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const shape: AutoMovieArchetypeSword.IShape = AutoMovieArchetypeSword.SHAPES[kind];
  const n: number = AutoMovieArchetypeSword.SEGMENTS;

  // The blade's centre line: straight, or a parabola swept back toward -Z whose chord is the blade length.
  const rise: number = Math.sqrt(
    d.bladeLength * d.bladeLength - shape.curve * shape.curve,
  );
  const along = (s: number): IAutoMovieVector3 =>
    v(0, rise * s, -shape.curve * s * s);
  const taper = (s: number): number => 1 - (1 - AutoMovieArchetypeSword.TAPER) * s;
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
  const grip: number = d.hiltLength - AutoMovieArchetypeSword.GUARD - 2 * shape.pommel;
  const hilt: readonly IAutoMovieVector3[] = [
    v(0, -AutoMovieArchetypeSword.GUARD / 2, 0),
    v(0, -AutoMovieArchetypeSword.GUARD - grip / 2, 0),
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
        AutoMovieArchetypeSword.THICKNESS * middle,
        Vector3.length(span),
        d.bladeWidth * middle,
      ),
      centres[k]!,
      {
        color: "#c9ccd1",
        share: ((1 - heavy) * weights[k]!) / total,
        rotation: AutoMovieEngineMath.rotationBetween({ x: 0, y: 1, z: 0 }, span),
      },
    );
  }
  if (shape.disc)
    builder.rod(
      "guard",
      shape.guard / 2,
      v(0, -AutoMovieArchetypeSword.GUARD, 0),
      v(0, 0, 0),
      { color: "#3a3a3a", share: heavy * shape.hilt[0] },
    );
  else
    builder.box(
      "guard",
      v(
        kind === "rapier" ? shape.guard / 2 : 0.012,
        AutoMovieArchetypeSword.GUARD,
        shape.guard,
      ),
      hilt[0]!,
      { color: "#8a8d91", share: heavy * shape.hilt[0] },
    );
  builder.rod(
    "grip",
    AutoMovieArchetypeSword.GRIP / 2,
    v(0, -AutoMovieArchetypeSword.GUARD - grip, 0),
    v(0, -AutoMovieArchetypeSword.GUARD, 0),
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
      aperture: AutoMovieArchetypeSword.GRIP,
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
      v((AutoMovieArchetypeSword.THICKNESS * taper(0.5)) / 2, middle.y, middle.z),
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
