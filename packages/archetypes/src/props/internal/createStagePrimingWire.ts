import type { AutoMovieArchetypeStagePrimingWire } from "../AutoMovieArchetypeStagePrimingWire";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { HandToolDraw } from "./HandToolDraw";
import { PRIMING_WIRE } from "../constants/PRIMING_WIRE";

/**
 * Inert priming-wire display prop with a ring pinch and a tip locator.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createStagePrimingWire(
  params: Pick<HandToolDraw.IParams, "id" | "length" | "mass"> = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStagePrimingWire.Affordance,
  AutoMovieArchetypeStagePrimingWire.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof HandToolDraw.prepare<AutoMovieArchetypeStagePrimingWire.Affordance>
  > = HandToolDraw.prepare<AutoMovieArchetypeStagePrimingWire.Affordance>(
    "primingWire",
    params,
    seed,
  );
  const length: number = d.length!;
  const v: typeof Vector3.create = Vector3.create;

  // The ring a finger and thumb pinch, then the stem to its point.
  const wire: number = PRIMING_WIRE.wire;
  const ring: number = PRIMING_WIRE.ring;
  builder.rod(
    "ring",
    ring / 2,
    v(-wire / 2, ring / 2, 0),
    v(wire / 2, ring / 2, 0),
    {
      color: "#4a4d52",
      surface: "steel",
    },
  );
  builder.rod("stem", wire / 2, v(0, ring, 0), v(0, length, 0), {
    color: "#4a4d52",
    surface: "steel",
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "half",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, ring / 2, 0),
      v(1, 0, 0),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: wire,
    length: ring,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.upright(v(0, length, 0)),
    extent: null,
  });
  return builder.build(d.mass!, { rests: "steel" });
}
