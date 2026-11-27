import type { AutoMovieArchetypeHandSaw } from "../AutoMovieArchetypeHandSaw";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Hand saw with a blade ledge and a grip across its heel.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createHandSaw(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "blade"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHandSaw.Affordance, AutoMovieArchetypeHandSaw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<AutoMovieArchetypeHandSaw.Affordance>> =
    HandToolDraw.prepare<AutoMovieArchetypeHandSaw.Affordance>("saw", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - d.blade!;
  // A saw's grip runs across its heel, square to the line from the grip to
  // the tooth line's middle (the hang), so the fist thrusts along that line.
  const centre: IAutoMovieVector3 = Vector3.create(0, handle / 2, 0);
  const toTeeth: IAutoMovieVector3 = Vector3.subtract(
    Vector3.create(0, handle + d.blade! / 2, HandToolDraw.BLADE_DEPTH / 2),
    centre,
  );
  const across: IAutoMovieVector3 = Vector3.normalize(
    Vector3.create(0, -toTeeth.z, toTeeth.y),
  );
  const held: number = HandToolDraw.GRIP;
  builder.rod(
    "handle",
    radius,
    Vector3.subtract(centre, Vector3.scale(across, held / 2)),
    Vector3.add(centre, Vector3.scale(across, held / 2)),
    { color: "#8a5a35" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      centre,
      Vector3.create(1, 0, 0),
      Vector3.scale(across, -1),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
    length: held,
  });

  builder.box(
    "blade",
    Vector3.create(0.001, d.blade!, HandToolDraw.BLADE_DEPTH),
    Vector3.create(0, handle + d.blade! / 2, 0),
    { color: "#b9bcc0", density: 11 },
  );
  builder.affordance({
    id: "face",
    kind: "ledge",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, handle + d.blade! / 2, HandToolDraw.BLADE_DEPTH / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    length: d.blade!,
  });
  return builder.build(d.mass!);
}
