import type { AutoMovieArchetypeMop } from "../AutoMovieArchetypeMop";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { LongImplementDraw } from "./LongImplementDraw";

/*
 * Mop with a wide pad and a two-hand shaft. Fixed `upperGrip` and `lowerGrip`
 * handles on the clear shaft take the two hands of a floor stroke.
 * Parameter params: The optional scene ID and any fixed free dimension in metres or
 * kilograms.
 * Parameter seed: The seed for the recorded recipe. Without a seed, the draw uses
 * the original defaults.
 * Returns: The model with its named contact frames in model space.
 * When the model or a fixed parameter lies
 * outside its admitted recipe.
 */
export function createMop(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeMop.Affordance, AutoMovieArchetypeMop.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<AutoMovieArchetypeMop.Affordance>> =
    LongImplementDraw.prepare<AutoMovieArchetypeMop.Affordance>("mop", params, seed);
  const radius: number = d.shaftDiameter! / 2;

  LongImplementDraw.groundTool(
    builder,
    {
      width: LongImplementDraw.HEAD_WIDTH,
      height: PAD,
      depth: 0.12,
      color: "#c9a24a",
      density: 1,
    },
    { radius, top: d.length! },
  );

  // An upper hand and a lower hand push in distinct places on one shaft, at
  // 0.73 and 0.53 of the clear shaft above the pad (a two-handed push).
  for (const [id, share] of [
    ["upperGrip", 0.73],
    ["lowerGrip", 0.53],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, PAD + share * (d.length! - PAD), 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
    });
  return builder.build(d.mass!);
}

/*
 * The pad block's height, metres.
 */
const PAD: number = 0.03;
