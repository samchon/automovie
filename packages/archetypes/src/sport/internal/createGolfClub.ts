import { AutoMovieArchetypeGolfClub } from "../AutoMovieArchetypeGolfClub";
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
 * A golf club: a driver, an iron or a putter.
 *
 * It stands on its head's sole at the origin, the shaft straight up along `+Y`
 * to the grip's end, the head's toe toward `+X` and its face toward `+Z`.
 * `grip` is the grip both hands close on; `face` the striking face, its `+Y`
 * out of it; `head` the head's centre, its `+Y` running out of the club down
 * the shaft's line: a swing carries `head` through the ball as its working
 * point (`tip`) with `face` leading as its edge (`edge`).
 * Parameter params: The kind and any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, each takes the middle of its band.
 * Returns: The club.
 * For a fixed dimension outside its band.
 */
export function createGolfClub(
  params: AutoMovieArchetypeGolfClub.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeGolfClub.Affordance, AutoMovieArchetypeGolfClub.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeGolfClub.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeGolfClub.Dimension>(
      "golfClub",
      AutoMovieArchetypeGolfClub.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeGolfClub.Kind = ArchetypeDraw.choice(
    "golfClub",
    "kind",
    params.kind,
    AutoMovieArchetypeGolfClub.KINDS,
  );
  const d: Record<AutoMovieArchetypeGolfClub.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeGolfClub.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeGolfClub.Affordance,
    AutoMovieArchetypeGolfClub.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const high: number = AutoMovieArchetypeGolfClub.HEAD_HEIGHT[kind];
  const hold: number = AutoMovieArchetypeGolfClub.GRIP_LENGTH;
  builder.box(
    "head",
    v(d.headWidth, high, d.headDepth),
    v(d.headWidth / 2, high / 2, 0),
    { color: kind === "driver" ? "#2c2f33" : "#b8bcc2", density: 2 },
  );
  builder.rod(
    "shaft",
    AutoMovieArchetypeGolfClub.SHAFT / 2,
    v(0, high, 0),
    v(0, d.length - hold, 0),
    { color: "#8a8d91" },
  );
  builder.rod(
    "grip",
    d.gripDiameter / 2,
    v(0, d.length - hold, 0),
    v(0, d.length, 0),
    { color: "#1d1f22" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.length - hold / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "two-hand",
    aperture: d.gripDiameter,
    length: hold,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      v(d.headWidth / 2, high / 2, d.headDepth / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.headWidth,
  });
  builder.affordance({
    id: "head",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      v(d.headWidth / 2, high / 2, 0),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}
