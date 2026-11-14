import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The gate valves read. */
const NIBCO: string =
  "NIBCO F-617-ON class 125 iron gate valve sheet: the 4 in (100 mm) valve 24.00 in (610 mm) high open with a 10 in (254 mm) handwheel, the 6 in (150 mm) valve 31.06 in (789 mm) high open with a 12 in (305 mm) handwheel, the handwheel the drawing's dimension C (https://cdn.bath1.com/pdf/nibco/FT617ONBI.pdf)";

/** One valve read: its pipe's nominal bore, its height open above the pipe's axis and its handwheel's diameter, metres. */
interface IModel {
  bore: number;
  height: number;
  wheel: number;
}

/** The two valves read, the smaller first. */
const MODELS: readonly [IModel, IModel] = [
  { bore: 0.1, height: 0.61, wheel: 0.254 },
  { bore: 0.15, height: 0.789, wheel: 0.305 },
];

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `run`, the pipe stub's length either side of the valve as a share of the height; `rim`, the handwheel rim's thickness; `body`, the bonnet's diameter as a share of the bore. */
const ESTIMATES: Readonly<{ run: number; rim: number; body: number }> = {
  run: 0.5,
  rim: 0.02,
  body: 1.4,
};

/**
 * A gate valve on a pipe, opened and closed by its handwheel.
 *
 * The pipe runs along `X` lying on the floor, its axis a bore's radius up over the origin; the valve's bonnet and stem rise along `+Y` to the handwheel, which lies level at the valve's height open above the pipe's axis. Its size lies between the maker's two valves read, by the drawn `size`. `wheel` is the handwheel, a wheel turned about `+Y`; it states no travel, since no source read gives its turns from open to closed.
 *
 * It rests on its iron pipe, so the body's friction is steel on concrete (`ArchetypeFriction`).
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The valve.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, how the size is drawn, its contact and why it states no travel.
 * @evidence contracts/development/implementation.md#principled-implementation The handwheel's diameter and its height open above the pipe's axis interpolated between the maker's two valves by one drawn share; the pipe at the nominal bore.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the share, the pipe, the bonnet and stem, the handwheel, then the contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The handwheel is one rim rod per side of a square; the stub's length, the rim's and the bonnet's sections are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Seven parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createValve(
  params: createValve.IParams = {},
  seed?: number | string,
): Archetype<createValve.Affordance, createValve.Dimension> {
  const d: Record<createValve.Dimension, number> = ArchetypeDraw.dimensions(
    "valve",
    createValve.BANDS,
    seed,
    params,
  );
  const [small, large]: readonly [IModel, IModel] = MODELS;
  const at = (key: keyof IModel): number =>
    small[key] + (large[key] - small[key]) * d.size;
  const builder: ArchetypeBuilder<
    createValve.Affordance,
    createValve.Dimension
  > = new ArchetypeBuilder({
    archetype: "valve",
    id: params.id,
    name: "gate valve",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const bore: number = at("bore");
  const axis: number = bore / 2;
  const height: number = axis + at("height");
  const radius: number = at("wheel") / 2;
  const iron: string = "#4d5357";
  const run: number = E.run * at("height");
  builder.rod("pipe", bore / 2, v(-run, axis, 0), v(run, axis, 0), {
    color: iron,
    surface: "steel",
  });
  builder.rod("bonnet", (E.body * bore) / 2, v(0, axis, 0), v(0, height / 2, 0), {
    color: iron,
  });
  builder.rod("stem", E.rim / 2, v(0, height / 2, 0), v(0, height, 0), {
    color: "#b9bec4",
  });
  const side: number = radius * Math.SQRT1_2;
  const corners: readonly (readonly [number, number])[] = [
    [side, side],
    [-side, side],
    [-side, -side],
    [side, -side],
  ];
  for (let k: number = 0; k < 4; k++) {
    const [ax, az]: readonly [number, number] = corners[k]!;
    const [bx, bz]: readonly [number, number] = corners[(k + 1) % 4]!;
    builder.rod(`rim-${k + 1}`, E.rim / 2, v(ax, height, az), v(bx, height, bz), {
      color: "#c8102e",
    });
  }
  builder.affordance({
    id: "wheel",
    kind: "wheel",
    frame: ArchetypeFrame.upright(v(0, height, 0)),
    extent: null,
    grip: "power",
    radius,
  });
  return builder.build(d.mass, { rests: "steel" });
}

/**
 * Companion types and bands of {@link createValve}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation One drawn share between two read valves, so the wheel and the height stay one valve's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handwheel a hand turns (#3468 N14).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A wheel with no source for its turns states no travel.
 */
export namespace createValve {
  /** The affordance id: `wheel`, the handwheel turned about `+Y`. */
  export type Affordance = "wheel";

  /**
   * The free dimensions:
   *
   * - `size`: where the valve lies between the two read, 0 the 4 in and 1 the 6 in.
   * - `mass`: kilograms.
   */
  export type Dimension = "size" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `valve` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    size: ArchetypeBand.of("", 0, 1, NIBCO),
    mass: ArchetypeBand.of("kg", 40, 90, ArchetypeBand.TYPICAL_MASS, true),
  };
}
