import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The bags, from a search only. */
const EVERLAST: string =
  "Everlast 100 lb hanging bags: Powershot about 59 in tall and 14.5 in across, Powerlock 46 in and 13 in, NevaTear 53 in and 13.25 in, as search results give Everlast's and retailers' listings; not read";

/**
 * A hanging heavy bag: a cylinder of the drawn height and diameter on a chain from its hook.
 *
 * It hangs from its `hook` at the origin, the chain straight down `-Y` to the bag's top and the bag below it; the side struck faces `+Z`. `target` is the bag's face at its middle height, a surface along `+Z` a punch or a kick lands on, `+X` across the bag and its depth the bag's height; `hook` is the hanging point, `+Y` up. Where the hook hangs, a ceiling's or a stand's, is the placement's.
 *
 * A bag swinging after a hit is the force law of #3417, not this archetype's.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The heavy bag.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the origin is, which side is struck, its two contacts and that a swing is not modelled.
 * @evidence contracts/development/implementation.md#principled-implementation A rod of the drawn diameter and height under a thin rod for the chain, the target's frame on the bag's surface at mid-height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, two parts, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One chain stands for the four a bag hangs by; the chain's length and section are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHeavyBag(
  params: createHeavyBag.IParams = {},
  seed?: number | string,
): Archetype<createHeavyBag.Affordance, createHeavyBag.Dimension> {
  const d: Record<createHeavyBag.Dimension, number> = ArchetypeDraw.dimensions(
    "heavyBag",
    createHeavyBag.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createHeavyBag.Affordance,
    createHeavyBag.Dimension
  > = new ArchetypeBuilder({
    archetype: "heavyBag",
    id: params.id,
    name: "heavy bag",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const top: number = -createHeavyBag.CHAIN;
  const radius: number = d.diameter / 2;
  builder.rod("chain", createHeavyBag.LINK / 2, v(0, 0, 0), v(0, top, 0), {
    color: "#8a8d91",
    density: 0.1,
  });
  builder.rod("bag", radius, v(0, top, 0), v(0, top - d.height, 0), {
    color: "#2b2b2e",
  });
  builder.affordance({
    id: "target",
    kind: "surface",
    frame: ArchetypeFrame.facing(v(0, top - d.height / 2, radius), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    width: d.diameter,
    depth: d.height,
  });
  builder.affordance({
    id: "hook",
    kind: "hook",
    frame: ArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createHeavyBag}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension over the bags the search found, provisional as a whole.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face a strike lands on and the point it hangs from (#3468 F6: `punch`, `kick`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The chain's length and section are named estimates, not dimensions of the bag.
 */
export namespace createHeavyBag {
  /** The chain's drop from the hook to the bag's top, metres: an estimate. */
  export const CHAIN: number = 0.6;

  /** The chain's section, metres: an estimate. */
  export const LINK: number = 0.02;

  /**
   * The affordance ids:
   *
   * - `target`: the struck face at mid-height, `+Y` along `+Z`.
   * - `hook`: the hanging point at the origin.
   */
  export type Affordance = "target" | "hook";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the bag's.
   * - `diameter`: the bag's.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `heavyBag` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    height: ArchetypeBand.metres(1.168, 1.499, EVERLAST, true),
    diameter: ArchetypeBand.metres(0.33, 0.368, EVERLAST, true),
    mass: ArchetypeBand.of("kg", 45.4, 45.4, `${EVERLAST}: 100 lb`, true),
  };
}
