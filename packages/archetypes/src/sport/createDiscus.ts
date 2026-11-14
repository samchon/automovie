import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The World Athletics rule as read. */
const RULE: string =
  "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 34.2, the discus";

/**
 * A competition discus, the men's or the women's.
 *
 * It lies flat on the floor, its centre over the origin. `grip` is the disc as the throwing hand holds it, laid flat on its top with the fingertips over the rim, its thickness the aperture; `rim` is the edge the fingertips hook, toward `+Z`.
 *
 * @param params The category and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The discus.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the discus lies and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation One flat cylinder of the drawn diameter and the drawn thickness at its centre.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rule's discus tapers from its centre to a rounded rim; this is a flat cylinder of the centre's thickness.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createDiscus(
  params: createDiscus.IParams,
  seed?: number | string,
): Archetype<createDiscus.Affordance, createDiscus.Dimension> {
  const kind: createDiscus.Kind = ArchetypeDraw.choice(
    "discus",
    "kind",
    params.kind,
    createDiscus.KINDS,
  );
  const d: Record<createDiscus.Dimension, number> = ArchetypeDraw.dimensions(
    "discus",
    createDiscus.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createDiscus.Affordance,
    createDiscus.Dimension
  > = new ArchetypeBuilder({
    archetype: "discus",
    id: params.id,
    name: `${kind}'s discus`,
    dimensions: d,
  });
  builder.rod(
    "disc",
    d.diameter / 2,
    Vector3.create(0, 0, 0),
    Vector3.create(0, d.thickness, 0),
    { color: "#8a8d91" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.upright(Vector3.create(0, d.thickness / 2, 0)),
    extent: null,
    grip: "hook",
    aperture: d.thickness,
  });
  builder.affordance({
    id: "rim",
    kind: "ledge",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, d.thickness, d.diameter / 2),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    length: d.diameter / 4,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createDiscus}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation The two senior categories and one band per dimension each, the rule's limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hold and the rim a throw reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each band is the rule as read; where the rule gives only a minimum mass or a maximum length, the model takes that limit.
 */
export namespace createDiscus {
  /** The categories. */
  export type Kind = "men" | "women";

  /** Every category, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /**
   * The affordance ids:
   *
   * - `grip`: the disc held flat from above, its thickness the aperture.
   * - `rim`: the top of the rim toward `+Z`, where the fingertips hook.
   */
  export type Affordance = "grip" | "rim";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `diameter`: across the rim.
   * - `thickness`: at the centre.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "thickness" | "mass";

  /** The parameters: the category, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which category. */
    kind: Kind;

    /** The model's id, unique in a scene; `discus` when absent. */
    id?: string;
  }

  /** A band of the rule. */
  const band = (
    unit: IArchetypeBand["unit"],
    minimum: number,
    maximum: number,
    what: string,
  ): IArchetypeBand =>
    ArchetypeBand.of(unit, minimum, maximum, `${RULE}: ${what}`);

  /** The band of each free dimension, by category. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    men: {
      diameter: band("m", 0.219, 0.221, "the men's 219 to 221 mm across"),
      thickness: band(
        "m",
        0.044,
        0.046,
        "the men's 44 to 46 mm thick at the centre",
      ),
      mass: band(
        "kg",
        2,
        2,
        "the men's at least 2 kg for admission, the minimum the model takes",
      ),
    },
    women: {
      diameter: band("m", 0.18, 0.182, "the women's 180 to 182 mm across"),
      thickness: band(
        "m",
        0.037,
        0.039,
        "the women's 37 to 39 mm thick at the centre",
      ),
      mass: band(
        "kg",
        1,
        1,
        "the women's at least 1 kg for admission, the minimum the model takes",
      ),
    },
  };
}
