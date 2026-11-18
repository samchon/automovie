import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";

/**
 * A full-size violin bow along +X, hair on the bottom, with a grip by the
 * frog. The overall length (745 mm), hair length (649 mm), mass (61 g) and
 * head height (23 mm) follow Birmingham City University's James Tubbs bow
 * catalogue 10.31 (https://www.bcu.ac.uk/conservatoire/research/hic/the-collection/string-bow/10-31).
 * Stick diameter, frog width, grip placement and ribbon section are coarse
 * estimates. The stick is rigid. The hair contacts mark the underside of the
 * ribbon at the frog and tip, with outward normals facing the string.
 *
 * @param id Optional model id.
 * @returns A bow with grip, hairFrog and hairTip affordances.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives axes, named contacts, measured dimensions, estimates and rigid construction.
 * @evidence contracts/development/implementation.md#principled-implementation The ribbon spans the documented hair length and its end frames are located on the underside of the same part.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the stick, its ends and ribbon, then declare their three sites.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stated physical measures come from the cited bow; coarse geometry is labelled as estimated.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed parts and contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds an independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createViolinBow(
  id?: string,
): Archetype<"grip" | "hairFrog" | "hairTip", never> {
  const v: typeof Vector3.create = Vector3.create;
  const overall: number = 0.745;
  const hair: number = 0.649;
  const head: number = 0.023;
  const frog: number = overall - hair;
  const ribbonDepth: number = 0.001;
  const stickRadius: number = 0.004;
  const gripLength: number = 0.042;
  const wood: string = "#744426";
  const builder: ArchetypeBuilder<"grip" | "hairFrog" | "hairTip", never> =
    new ArchetypeBuilder({
      id,
      name: "violin bow",
      material: "composite",
      draw: new ArchetypeDrawSession<never>("violin bow", {}, undefined),
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
    frame: ArchetypeFrame.upright(
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
      frame: ArchetypeFrame.facing(v(x, 0, 0), v(0, -1, 0), v(1, 0, 0)),
      extent: null,
    });
  return builder.build(0.061);
}
