import { AutoMovieArchetypeValve } from "../AutoMovieArchetypeValve";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";

/*
 * A gate valve on a pipe, opened and closed by its handwheel.
 *
 * The pipe runs along `X` lying on the floor, its axis a bore's radius up over
 * the origin; the valve's bonnet and stem rise along `+Y` to the handwheel,
 * which lies level at the valve's height open above the pipe's axis. It is one
 * of the maker's two valves read, whole: the model given, or one drawn from the
 * seed. `wheel` is the handwheel, a wheel turned about `+Y`; it states no
 * travel, since no source read gives its turns from open to closed.
 *
 * It rests on its iron pipe: steel on concrete (`AutoMovieArchetypeFriction`).
 * Parameter params: The model and any dimension the author fixes.
 * Parameter seed: The seed that draws the model when it is not given and every
 * dimension left free inside its band; absent, the first model and the middle
 * of each band.
 * Returns: The valve.
 * For a model the sheet does not list, or a
 * fixed dimension outside its band.
 */
export function createValve(
  params: AutoMovieArchetypeValve.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeValve.Affordance, AutoMovieArchetypeValve.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeValve.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeValve.Dimension>(
      "valve",
      AutoMovieArchetypeValve.UNITS,
      seed,
      params,
    );
  const model: {
    name: AutoMovieArchetypeValve.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeValve.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeValve.Model>("model", params.model, AutoMovieArchetypeValve.MODELS);
  const d: Record<AutoMovieArchetypeValve.Dimension, number> = {
    ...draw.dimensions(AutoMovieArchetypeValve.BANDS),
    bore: model.figures.bore!,
    height: model.figures.height!,
    wheel: model.figures.wheel!,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeValve.Affordance,
    AutoMovieArchetypeValve.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: `gate valve ${model.name}`,
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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
    frame: AutoMovieArchetypeFrame.upright(v(0, height, 0)),
    extent: null,
    grip: "power",
    radius,
  });
  return builder.build(d.mass, { rests: "steel" });
}

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `run`, the pipe stub's length either side of the
 * valve as a share of the height; `rim`, the handwheel rim's thickness; `body`,
 * the bonnet's diameter as a share of the bore.
 */
const ESTIMATES: Readonly<{ run: number; rim: number; body: number }> = {
  run: 0.5,
  rim: 0.02,
  body: 1.4,
};
