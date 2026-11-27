import { AutoMovieArchetypeRack } from "../AutoMovieArchetypeRack";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";

/*
 * A squat rack: two uprights, each with a hook a barbell rests on.
 *
 * It stands on the floor with the middle of its footprint at the origin, the
 * uprights on either side of `X`, the hooks reaching toward `-Z`, where the
 * lifter stands. `rest` is the place between the two hooks where the bar's
 * middle lies, on the bar's axis, with `+Y` up.
 * Parameter params: The kind and any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The rack.
 * For a fixed dimension outside its band.
 */
export function createRack(
  params: AutoMovieArchetypeRack.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRack.Affordance, AutoMovieArchetypeRack.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRack.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeRack.Dimension>(
      "rack",
      AutoMovieArchetypeRack.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeRack.Kind = ArchetypeDraw.choice(
    "rack",
    "kind",
    params.kind ?? "squat",
    AutoMovieArchetypeRack.KINDS,
  );
  const d: Partial<Record<AutoMovieArchetypeRack.Dimension, number>> = draw.dimensions(
    AutoMovieArchetypeRack.BANDS[kind],
    AutoMovieArchetypeRack.BANDS,
  );
  const half: number = d.width! / 2;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRack.Affordance,
    AutoMovieArchetypeRack.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "squat rack",
    draw,
  });
  for (const side of [1, -1] as const) {
    const name: string = side === 1 ? "left" : "right";
    builder.box(
      `upright-${name}`,
      AutoMovieEngineVector3.create(AutoMovieArchetypeRack.POST, d.height!, AutoMovieArchetypeRack.POST),
      AutoMovieEngineVector3.create(side * half, d.height! / 2, 0),
      { color: "#5a5f66" },
    );
    builder.box(
      `hook-${name}`,
      AutoMovieEngineVector3.create(AutoMovieArchetypeRack.POST, AutoMovieArchetypeRack.LIP, AutoMovieArchetypeRack.HOOK),
      AutoMovieEngineVector3.create(
        side * half,
        d.rest! - AutoMovieArchetypeRack.SEAT - AutoMovieArchetypeRack.LIP / 2,
        -(AutoMovieArchetypeRack.POST + AutoMovieArchetypeRack.HOOK) / 2,
      ),
      { color: "#b8bcc2" },
    );
  }
  builder.affordance({
    id: "rest",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.upright(
      AutoMovieEngineVector3.create(0, d.rest!, -(AutoMovieArchetypeRack.POST + AutoMovieArchetypeRack.HOOK) / 2),
    ),
    extent: null,
    width: d.width!,
    depth: AutoMovieArchetypeRack.HOOK,
  });
  return builder.build(d.mass!);
}
