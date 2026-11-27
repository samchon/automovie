import type { AutoMovieArchetypeSandbag } from "../AutoMovieArchetypeSandbag";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { ObstacleDraw } from "./ObstacleDraw";

/*
 * A filled sandbag with a low crossing surface and a grasp at each end.
 *
 * The laid bag's nominal section defines the crossing rise and depth; end
 * grasps keep their own centres. The object stands on Y = 0 and is approached
 * from +Z.
 * Parameter params: The scene identifier and any dimensions to fix inside their
 * bands.
 * Parameter seed: The seed for the draws the author leaves open.
 * Returns: The fixed model with its typed contacts.
 * If a supplied override lies outside the
 * selected profile.
 */
export function createSandbag(
  params: AutoMovieArchetypeSandbag.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSandbag.Affordance, AutoMovieArchetypeSandbag.Dimension> {
  const { builder, d }: ObstacleDraw.IObstacle<AutoMovieArchetypeSandbag.Affordance> =
    ObstacleDraw.begin("sandbag", "sandbag", "composite", params, seed);
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const length: number = d.length!;
  const height: number = d.height!;
  const width: number = d.width!;
  builder.box(
    "sandbag",
    v(length, height, width),
    v(0, height / 2, width / 2),
    {
      color: "#b8a47a",
    },
  );
  ObstacleDraw.ledge(builder, height, length, width, width / 2);

  // A bag is lifted by its two ends, a hand on each end's top edge; the grasp reads the bag's own collider for the width.
  for (const [id, sign] of [
    ["leftEnd", 1],
    ["rightEnd", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        v((sign * length) / 2, height, width / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      length: width,
    });
  return builder.build(d.mass!);
}
