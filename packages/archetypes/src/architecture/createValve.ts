import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `run`, the pipe stub's length either side of the valve as a share of the height; `rim`, the handwheel rim's thickness; `body`, the bonnet's diameter as a share of the bore. */
const ESTIMATES: Readonly<{ run: number; rim: number; body: number }> = {
  run: 0.5,
  rim: 0.02,
  body: 1.4,
};

/**
 * A gate valve on a pipe, opened and closed by its handwheel.
 *
 * The pipe runs along `X` lying on the floor, its axis a bore's radius up over the origin; the valve's bonnet and stem rise along `+Y` to the handwheel, which lies level at the valve's height open above the pipe's axis. It is one of the maker's two valves read, whole: the model given, or one drawn from the seed. `wheel` is the handwheel, a wheel turned about `+Y`; it states no travel, since no source read gives its turns from open to closed.
 *
 * It rests on its iron pipe: steel on concrete (`ArchetypeFriction`).
 *
 * @param params The model and any dimension the author fixes.
 * @param seed The seed that draws the model when it is not given and every dimension left free inside its band; absent, the first model and the middle of each band.
 * @returns The valve.
 * @throws {ArchetypeRefusal} For a model the sheet does not list, or a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, how the model is chosen, its contact and why it states no travel.
 * @evidence contracts/development/implementation.md#principled-implementation One read valve whole: its handwheel's diameter and its height open above the pipe's axis as the sheet gives them; the pipe at its nominal bore.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the model, draw the mass, then the pipe, the bonnet and stem, the handwheel and the contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No valve between the two read is made; the handwheel is one rim rod per side of a square; the stub's length, the rim's and the bonnet's sections are construction estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Seven parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createValve(
  params: createValve.IParams = {},
  seed?: number | string,
): Archetype<createValve.Affordance, createValve.Dimension> {
  const draw: ArchetypeDrawSession<createValve.Dimension> =
    new ArchetypeDrawSession<createValve.Dimension>(
      "valve",
      createValve.UNITS,
      seed,
      params,
    );
  const model: {
    name: createValve.Model | undefined;
    figures: Readonly<Partial<Record<createValve.Dimension, number>>>;
  } = draw.model<createValve.Model>("model", params.model, createValve.MODELS);
  const d: Record<createValve.Dimension, number> = {
    ...draw.dimensions(createValve.BANDS),
    bore: model.figures.bore!,
    height: model.figures.height!,
    wheel: model.figures.wheel!,
  };
  const builder: ArchetypeBuilder<
    createValve.Affordance,
    createValve.Dimension
  > = new ArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: `gate valve ${model.name}`,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const E: typeof ESTIMATES = ESTIMATES;
  const bore: number = d.bore;
  const axis: number = bore / 2;
  const height: number = axis + d.height;
  const radius: number = d.wheel / 2;
  const iron: string = "#4d5357";
  const run: number = E.run * d.height;
  builder.rod("pipe", bore / 2, v(-run, axis, 0), v(run, axis, 0), {
    color: iron,
    surface: "steel",
  });
  builder.rod(
    "bonnet",
    (E.body * bore) / 2,
    v(0, axis, 0),
    v(0, height / 2, 0),
    {
      color: iron,
    },
  );
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
    builder.rod(
      `rim-${k + 1}`,
      E.rim / 2,
      v(ax, height, az),
      v(bx, height, bz),
      {
        color: "#c8102e",
      },
    );
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
 * @evidence contracts/development/common.md#meaningful-documentation Each model, affordance and dimension states what it is; each model and band its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of the valves read, each built whole; the mass, which the sheet does not give, a provisional band.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The handwheel a hand turns (#3468 N14).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A wheel with no source for its turns states no travel.
 */
export namespace createValve {
  /** The valves read: NIBCO F-617-ON's 4 in and 6 in. */
  export type Model = "4in" | "6in";

  /** Each valve's figures, metres, the default first: NIBCO F-617-ON class 125 iron gate valve sheet, the 4 in (100 mm) valve 24.00 in (610 mm) high open with a 10 in (254 mm) handwheel, the 6 in (150 mm) valve 31.06 in (789 mm) high open with a 12 in (305 mm) handwheel, the handwheel the drawing's dimension C (https://cdn.bath1.com/pdf/nibco/FT617ONBI.pdf). */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "4in": { bore: 0.1, height: 0.61, wheel: 0.254 },
    "6in": { bore: 0.15, height: 0.789, wheel: 0.305 },
  };

  /** The affordance id: `wheel`, the handwheel turned about `+Y`. */
  export type Affordance = "wheel";

  /**
   * The dimensions, metres unless stated:
   *
   * - `bore`: the pipe's nominal bore, its model's.
   * - `height`: the valve's height open above the pipe's axis, its model's.
   * - `wheel`: the handwheel's diameter, its model's.
   * - `mass`: kilograms, free.
   */
  export type Dimension = "bore" | "height" | "wheel" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
    bore: "m",
    height: "m",
    wheel: "m",
    mass: "kg",
  };

  /** The parameters: the model, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<"mass", number>> {
    /** Which valve; drawn from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `valve` when absent. */
    id?: string;
  }

  /** The band of the free dimension. */
  export const BANDS: Readonly<Record<"mass", IArchetypeBand>> = {
    mass: ArchetypeBand.of("kg", 40, 90, ArchetypeBand.TYPICAL_MASS, true),
  };
}
