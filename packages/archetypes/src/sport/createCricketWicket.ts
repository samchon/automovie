import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";

/**
 * An adult cricket wicket at the origin, with three separately named stumps and two separately named bails across X.
 *
 * @param params Optional scene id.
 * @param seed Seed for stump diameter.
 * @returns The standing wicket with stumps and bails named as targets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the wicket's origin, arrangement and interaction points.
 * @evidence contracts/development/implementation.md#principled-implementation MCC Laws of Cricket 2026, Laws 8.1–8.3, set the 0.2286 m overall width, the 0.7112 m top height and the stump diameter band. Bail barrels and spigots use the published lengths and coarse cylindrical sections.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build and name the stumps, then build and name each bail.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Ground clearance and bail placements derive from the fixed wicket height and stump diameter; groove details are omitted.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed part count.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds its own prop.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing after construction.
 */
export function createCricketWicket(
  params: { id?: string } = {},
  seed?: number | string,
): Archetype<createCricketWicket.Affordance, "diameter"> {
  const draw: ArchetypeDrawSession<"diameter"> = new ArchetypeDrawSession(
    "cricketWicket",
    { diameter: "m" },
    seed,
    {},
  );
  const { diameter }: Record<"diameter", number> = draw.dimensions({
    diameter: ArchetypeBand.metres(
      0.035,
      0.0381,
      "MCC Laws of Cricket 2026, Law 8.2",
    ),
  });
  const builder: ArchetypeBuilder<createCricketWicket.Affordance, "diameter"> =
    new ArchetypeBuilder({
      material: "wood",
      id: params.id,
      name: "cricket wicket",
      draw,
    });
  const v: typeof Vector3.create = Vector3.create;
  const height: number = 0.7112;
  const offset: number = (0.2286 - diameter) / 2;
  for (const [id, x] of [
    ["leftStump", -offset],
    ["middleStump", 0],
    ["rightStump", offset],
  ] as const) {
    builder.rod(id, diameter / 2, v(x, 0, 0), v(x, height, 0), {
      color: "#ead5ad",
    });
    builder.affordance({
      id,
      kind: "socket",
      frame: ArchetypeFrame.upright(v(x, height / 2, 0)),
      extent: null,
    });
  }
  for (const [id, sign] of [
    ["leftBail", -1],
    ["rightBail", 1],
  ] as const) {
    const x: number = (sign * offset) / 2;
    const y: number = height + 0.003;
    const barrel: number = 0.054 / 2;
    builder.rod(id, 0.009, v(x - barrel, y, 0), v(x + barrel, y, 0), {
      color: "#ead5ad",
    });
    builder.rod(
      `${id}Spigot`,
      0.004,
      v(x - sign * (barrel + 0.0206), y, 0),
      v(x + sign * (barrel + 0.035), y, 0),
      { color: "#ead5ad" },
    );
    builder.affordance({
      id,
      kind: "socket",
      frame: ArchetypeFrame.upright(v(x, y, 0)),
      extent: null,
    });
  }
  // Assembly mass is provisional for staging because Law 8 gives no weight.
  return builder.build(1.5);
}

/**
 * Named aiming and inspection points for an adult wicket. The three stump centers and two bail barrel centers have frames in model metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains what each group of wicket targets identifies and the frame its producer uses.
 * @evidence contracts/development/design.md#principled-representation A closed union describes the fixed three-stump and two-bail wicket arrangement specified by MCC Law 8.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The wicket producer owns the names used to stage a delivery and observe a wicket. Pitch placement and dismissal rules are separate from its geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Separate identifiers preserve each stump and bail identity across wicket positions. The type makes no assumptions about the bowler or the outcome.
 */
export namespace createCricketWicket {
  /** Three stump centers and two bail barrel centers. */
  export type Affordance =
    | "leftStump"
    | "middleStump"
    | "rightStump"
    | "leftBail"
    | "rightBail";
}
