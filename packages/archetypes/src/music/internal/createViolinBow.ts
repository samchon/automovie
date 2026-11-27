import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core";

/*
 * A full-size violin bow along +X, hair on the bottom, with a grip by the frog.
 * The overall length (745 mm), hair length (649 mm), mass (61 g) and head
 * height (23 mm) follow Birmingham City University's James Tubbs bow catalogue
 * 10.31
 * (https://www.bcu.ac.uk/conservatoire/research/hic/the-collection/string-bow/10-31).
 * Stick diameter, frog width, grip placement and ribbon section are coarse
 * estimates. The stick is rigid. The hair contacts mark the underside of the
 * ribbon at the frog and tip, with outward normals facing the string.
 * Parameter params: The model id, supplied as an option or as a positional string.
 * Returns: A bow with grip, hairFrog and hairTip affordances.
 */
export function createViolinBow(
  params: { id?: string } | string = {},
): AutoMovieArchetype<"grip" | "hairFrog" | "hairTip", never> {
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const overall: number = 0.745;
  const hair: number = 0.649;
  const head: number = 0.023;
  const frog: number = overall - hair;
  const ribbonDepth: number = 0.001;
  const stickRadius: number = 0.004;
  const gripLength: number = 0.042;
  const wood: string = "#744426";
  const builder: AutoMovieArchetypeBuilder<
    "grip" | "hairFrog" | "hairTip",
    never
  > = new AutoMovieArchetypeBuilder({
    id: typeof params === "string" ? params : params.id,
    name: "violin bow",
    material: "composite",
    draw: new AutoMovieArchetypeDrawSession<never>("violin bow", {}, undefined),
  });
  builder.rod(
    "stick",
    stickRadius,
    v(0, head - stickRadius, 0),
    v(overall, head - stickRadius, 0),
    { color: wood },
  );
  builder.box("frog", v(0.038, head, 0.013), v(frog - 0.019, head / 2, 0), {
    color: "#29221e",
  });
  builder.box("head", v(0.01, head, 0.01), v(overall - 0.005, head / 2, 0), {
    color: wood,
  });
  builder.box(
    "ribbon",
    v(hair, ribbonDepth, 0.008),
    v(frog + hair / 2, ribbonDepth / 2, 0),
    {
      color: "#efe2c6",
    },
  );
  builder.affordance({
    id: "grip",
    kind: "bar",
    symmetry: "half",
    frame: AutoMovieArchetypeFrame.upright(
      v(frog + gripLength / 2, head - stickRadius, 0),
    ),
    extent: null,
    grip: "precision",
    aperture: stickRadius * 2,
    length: gripLength,
  });
  for (const [site, x] of [
    ["hairFrog", frog],
    ["hairTip", overall],
  ] as const)
    builder.affordance({
      id: site,
      kind: "surface",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, 0, 0),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
  return builder.build(0.061);
}
