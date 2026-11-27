import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import { AutoMovieArchetypeBow } from "../AutoMovieArchetypeBow";

/**
 * Build a crossbow lying on its stock on the producer's builder: the stock
 * along `+Z` from the butt at the origin, its top the bolt's groove, the bow
 * across its fore-end, the string drawn back toward the butt by the cranequin's
 * crank, and the trigger and stirrup, each placed from `createBow.CROSSBOW`.
 *
 * @param builder The bow under construction.
 * @param d The drawn dimensions.
 * @returns The crossbow.
 */
export function buildCrossbow(
  builder: AutoMovieArchetypeBuilder<AutoMovieArchetypeBow.Affordance, AutoMovieArchetypeBow.Dimension>,
  d: Partial<Record<AutoMovieArchetypeBow.Dimension, number>>,
): AutoMovieArchetype<AutoMovieArchetypeBow.Affordance, AutoMovieArchetypeBow.Dimension> {
  const v: typeof Vector3.create = Vector3.create;
  const c: typeof AutoMovieArchetypeBow.CROSSBOW = AutoMovieArchetypeBow.CROSSBOW;
  const top: number = c.fore;
  const nut: number = c.stock - c.nut;
  const rest: number = nut + c.rest;
  const centre: ReturnType<typeof v> = v(0, top, rest + d.brace!);
  const half: number = d.length! / 2;
  const limb: number = Math.hypot(half, d.brace!);
  const r: number = c.thickness / 2;

  // The stock, a box of its fore-end's section, the groove its top: the butt-stock from the butt to the nut and the fore-stock from the nut to the fore-end, which the bow hand holds.
  builder.box("stock", v(d.depth!, top, nut), v(0, top / 2, nut / 2), {
    color: "#7a5230",
    surface: "wood",
  });
  const fore: number = (nut + c.stock) / 2;
  builder.box("foreStock", v(d.depth!, top, c.nut), v(0, top / 2, fore), {
    color: "#7a5230",
    surface: "wood",
  });
  // The bow's two halves, straight from its centre to its tips, braced level with the string at rest.
  for (const [id, sign] of [
    ["upperLimb", 1],
    ["lowerLimb", -1],
  ] as const)
    builder.rod(id, r, centre, v(sign * half, top, rest), {
      color: "#55595f",
      surface: "steel",
    });
  builder.ball("nockingPoint", AutoMovieArchetypeBow.STRING, v(0, top, rest), {
    color: "#c9a227",
  });
  builder.rod(
    "trigger",
    c.triggerDiameter / 2,
    v(0, 0, nut),
    v(0, 0, nut - c.trigger),
    { color: "#55595f", surface: "steel" },
  );
  builder.box(
    "stirrup",
    v(c.stirrup, r, c.stirrup),
    v(0, top, c.stock + c.stirrup / 2),
    { color: "#55595f", surface: "steel" },
  );

  // The cranequin's crank turns its full count to bring the string its travel, which the string follows by that ratio, and the bow's halves follow the string.
  builder.affordance({
    id: "crank",
    kind: "crank",
    frame: AutoMovieArchetypeFrame.facing(
      v(d.depth! / 2, top, nut - c.axle),
      v(1, 0, 0),
      v(0, 0, -1),
    ),
    extent: null,
    radius: c.handle,
    travel: c.turns * 360,
  });
  builder.affordance({
    id: "string",
    kind: "slider",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top, rest),
      v(0, 1, 0),
      v(0, 0, -1),
    ),
    extent: null,
    travel: c.travel,
    parts: ["nockingPoint"],
    follows: { id: "crank", ratio: c.travel / (c.turns * 360) },
  });
  builder.affordance({
    id: "nock",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top, rest),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    rides: "string",
  });
  const table: [number, number][] = AutoMovieArchetypeBow.limbs(half, d.brace!, c.travel);
  for (const [id, sign] of [
    ["upperLimb", 1],
    ["lowerLimb", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(centre, v(0, sign, 0), v(0, 0, 1)),
      extent: null,
      travel: table[table.length - 1]![1],
      parts: [id],
      follows: { id: "string", table },
    });
  for (const [id, part] of [
    ["string-upper", "upperLimb"],
    ["string-lower", "lowerLimb"],
  ] as const)
    builder.span(
      id,
      { part, at: v(0, limb / 2, 0) },
      { affordance: "nock" },
      AutoMovieArchetypeBow.STRING,
      { color: "#e8e1cf" },
    );
  // Both hands close across the stock's width, at separate positions along it.
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top / 2, nut - c.trigger),
      v(1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: d.depth!,
  });
  builder.affordance({
    id: "foreEnd",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top / 2, fore),
      v(1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: d.depth!,
    length: c.nut,
  });
  builder.affordance({
    id: "rail",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(centre, v(0, 0, 1), v(0, 1, 0)),
    extent: null,
  });
  builder.affordance({
    id: "rest",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, top, (nut + centre.z) / 2)),
    extent: null,
    width: d.depth!,
    depth: centre.z - nut,
  });
  builder.affordance({
    id: "butt",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, top / 2, 0),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    width: top,
    depth: d.depth!,
  });
  builder.affordance({
    id: "trigger",
    kind: "trigger",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, -c.triggerDiameter / 2, nut - c.trigger / 2),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    travel: c.release,
    parts: ["trigger"],
  });
  builder.affordance({
    id: "stirrup",
    kind: "stirrup",
    frame: AutoMovieArchetypeFrame.upright(
      v(0, top + r / 2, c.stock + c.stirrup / 2),
    ),
    extent: null,
    width: c.stirrup,
  });
  return builder.build(d.mass!, { rests: "wood" });
}
