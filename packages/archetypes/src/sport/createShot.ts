import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

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
  "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 33.5, the shot";

/**
 * A competition shot, the men's or the women's.
 *
 * It rests on the floor, its lowest point at the origin and its centre a radius above it. `grip` is the shot as the putting hand holds it, at its centre, its diameter the aperture: the put pushes it from the neck.
 *
 * @param params The category and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The shot.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the shot rests and its contact.
 * @evidence contracts/development/implementation.md#principled-implementation One sphere of the drawn diameter whose mass is the drawn mass, the rule's two measures.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one sphere, one contact.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts The rule's shot is a smooth sphere, which this is.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createShot(
  params: createShot.IParams,
  seed?: number | string,
): Archetype<createShot.Affordance, createShot.Dimension> {
  const kind: createShot.Kind = ArchetypeDraw.choice(
    "shot",
    "kind",
    params.kind,
    createShot.KINDS,
  );
  const d: Record<createShot.Dimension, number> = ArchetypeDraw.dimensions(
    "shot",
    createShot.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createShot.Affordance, createShot.Dimension> =
    new ArchetypeBuilder({
      archetype: "shot",
      id: params.id,
      name: `${kind}'s shot`,
      dimensions: d,
    });
  const centre: IAutoMovieVector3 = Vector3.create(0, d.diameter / 2, 0);
  builder.ball("shot", d.diameter / 2, centre, { color: "#4a4d52" });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      centre,
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.diameter,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createShot}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation The two senior categories and one band per dimension each, the rule's limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The size and mass a put reads and the one contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each band is the rule as read; where the rule gives only a minimum mass or a maximum length, the model takes that limit.
 */
export namespace createShot {
  /** The categories. */
  export type Kind = "men" | "women";

  /** Every category, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men", "women"];

  /** The affordance ids: `grip`, the shot as a hand holds it, at its centre. */
  export type Affordance = "grip";

  /**
   * The free dimensions:
   *
   * - `diameter`: metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "mass";

  /** The parameters: the category, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which category. */
    kind: Kind;

    /** The model's id, unique in a scene; `shot` when absent. */
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
      diameter: band("m", 0.11, 0.13, "the men's 110 to 130 mm across"),
      mass: band(
        "kg",
        7.26,
        7.26,
        "the men's at least 7.26 kg for admission, the minimum the model takes",
      ),
    },
    women: {
      diameter: band("m", 0.095, 0.11, "the women's 95 to 110 mm across"),
      mass: band(
        "kg",
        4,
        4,
        "the women's at least 4 kg for admission, the minimum the model takes",
      ),
    },
  };
}
