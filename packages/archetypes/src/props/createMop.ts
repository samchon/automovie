import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";

/** The pad block's height, metres. */
const PAD: number = 0.03;

/**
 * Mop with a wide pad and a two-hand shaft. Fixed `upperGrip` and `lowerGrip`
 * handles on the clear shaft take the two hands of a floor stroke.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies
 *   outside its admitted recipe.
 */
export function createMop(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number | string,
): AutoMovieArchetype<createMop.Affordance, createMop.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<createMop.Affordance>> =
    LongImplementDraw.prepare<createMop.Affordance>("mop", params, seed);
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

/** The contacts and dimensions of {@link createMop}. */
export namespace createMop {
  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "face" | "shaft" | "upperGrip" | "lowerGrip";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "shaftDiameter";
}
