import { AutoMovieArchetypeHandgun } from "../AutoMovieArchetypeHandgun";
import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";
import "../constants/HANDGUN_BANDS";
import "../constants/HANDGUN_MODELS";
import { HandgunActions } from "./HandgunActions";

/**
 * A handgun as a film prop: a self-loading pistol, a slide over a frame with a
 * grip, a trigger and sights; a revolver, its hammer cocking and its cylinder
 * turning; or a flintlock pistol with the musket's lock (`HandgunActions`). It
 * models no effect.
 *
 * The pistol stands on the base of its grip at the origin with its muzzle
 * toward `+Z` and its backstrap at `z = 0`. The shooting hand takes the `grip`
 * from behind; the `trigger` is a part on its articulation, its face
 * `triggerReach` ahead of the backstrap, as makers measure it; the `slide` runs
 * back on its slider. `sight` and `frontSight` give the line of aim, `muzzle`
 * the end of the barrel and `magazine` the well under the grip.
 *
 * @param params The frame size, the model and a GLOCK's sights, whether it is
 *   loaded and any dimension the author fixes.
 * @param seed The seed that picks the model and the sights left free and draws
 *   every dimension left free inside its band; absent, the first model, the
 *   first sights and the middle of each band.
 * @returns The handgun.
 * @throws {AutoMovieArchetypeRefusal} For a model not of the frame, sights on a
 *   pistol without them, a fixed dimension outside its band, or one the model
 *   or the sights give.
 */
export function createHandgun(
  params: AutoMovieArchetypeHandgun.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHandgun.Affordance, AutoMovieArchetypeHandgun.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeHandgun.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeHandgun.Dimension>(
      "handgun",
      AutoMovieArchetypeHandgun.UNITS,
      seed,
      params,
    );
  const frame: AutoMovieArchetypeHandgun.Frame = ArchetypeDraw.choice(
    "handgun",
    "frame",
    params.frame,
    AutoMovieArchetypeHandgun.FRAMES,
  );
  // One of the frame's two read pistols whole, and a GLOCK's sights, which set its sight radius.
  const model: {
    name: AutoMovieArchetypeHandgun.Model | undefined;
    figures: Readonly<Partial<Record<AutoMovieArchetypeHandgun.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeHandgun.Model>(
    "model",
    params.model,
    AutoMovieArchetypeHandgun.MODELS[frame],
  );
  draw.model<AutoMovieArchetypeHandgun.Sights>(
    "sights",
    params.sights,
    model.name === undefined ? undefined : AutoMovieArchetypeHandgun.SIGHTS[model.name],
  );
  draw.dimensions(AutoMovieArchetypeHandgun.BANDS[frame], AutoMovieArchetypeHandgun.BANDS);
  // A revolver's or a flintlock pistol's sight line, where no maker gives its radius: a revolver's from the top strap's groove to the muzzle, a flintlock's along its barrel, which carries no sights.
  if (frame === "revolver" && draw.values.sightRadius === undefined)
    draw.derive("sightRadius", HandgunActions.radius(draw.values));
  if (frame === "flintlock") draw.derive("sightRadius", draw.values.barrel!);
  const d: Partial<Record<AutoMovieArchetypeHandgun.Dimension, number>> = {
    ...draw.values,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeHandgun.Affordance,
    AutoMovieArchetypeHandgun.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: AutoMovieArchetypeHandgun.NAMES[frame],
    draw,
  });
  const loaded: number =
    params.loaded === true ? AutoMovieArchetypeHandgun.AMMUNITION[frame] : 0;
  if (frame === "revolver" || frame === "flintlock") {
    if (frame === "revolver") HandgunActions.revolver(builder, d);
    else HandgunActions.flintlock(builder, d);
    return builder.build(d.mass! + loaded);
  }
  const v: typeof Vector3.create = Vector3.create;
  const slide: number = 0.028;
  const top: number = d.height!;
  const under: number = top - slide;
  const rear: number = -0.02;
  const muzzle: number = rear + d.length!;
  const steel: string = "#2c2f33";
  builder.box(
    "grip",
    v(0.03, under, d.gripDepth!),
    v(0, under / 2, d.gripDepth! / 2),
    { color: steel, density: 0.5 },
  );
  builder.box(
    "slide",
    v(d.width!, slide, d.length!),
    v(0, top - slide / 2, (rear + muzzle) / 2),
    { color: steel },
  );
  builder.box(
    "trigger",
    v(0.008, 0.02, 0.006),
    v(0, under - 0.02, d.triggerReach! - 0.003),
    { color: "#55595f" },
  );

  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, under / 2, d.gripDepth! / 2),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.gripDepth!,
    length: under,
  });
  builder.affordance({
    id: "trigger",
    kind: "trigger",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, under - 0.02, d.triggerReach!),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    travel: d.triggerTravel!,
    parts: ["trigger"],
  });
  builder.affordance({
    id: "slide",
    kind: "slider",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top - slide / 2, 0.01),
      v(0, 1, 0),
      v(0, 0, -1),
    ),
    extent: null,
    grip: "power",
    aperture: d.width!,
    travel: AutoMovieArchetypeHandgun.RACK,
    parts: ["slide"],
  });
  for (const [id, z] of [
    ["sight", rear + 0.01],
    ["frontSight", rear + 0.01 + d.sightRadius!],
  ] as const)
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, top, z)),
      extent: null,
      rides: "slide",
    });
  builder.affordance({
    id: "muzzle",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top - slide / 2, muzzle),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "magazine",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, d.gripDepth! / 2),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass! + loaded);
}
