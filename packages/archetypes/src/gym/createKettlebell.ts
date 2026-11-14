import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a competition kettlebell is commonly stated to measure. */
const BELL: string =
  "competition kettlebells as commonly stated for the sport (one size for every mass: 280 mm tall, a 210 mm body, a 35 mm handle); the rule's own text was not read, so the band is marked provisional";

/**
 * A kettlebell: a round body with a handle looped over its top, held in
 * one hand or both.
 *
 * It stands on the floor at the origin, the body a ball whose lowest point
 * is the origin, the handle a level bar along `X` at the top joined to the
 * body by two uprights. A competition bell has one size for every mass, so
 * the mass does not change the shape. `grip` is the handle's bar, taken
 * from above.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The kettlebell.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how it stands, what it is built of, why the mass leaves the shape alone and the contact.
 * @evidence contracts/development/implementation.md#principled-implementation A ball of the body's diameter on the floor, the handle's bar at the bell's height less half its own thickness, and an upright from each end of the bar down to the ball.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one ball, three rods, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Straight uprights stand for the handle's curved horns, the base is not flattened, and the mass is spread over the shapes by volume though the handle is hollow or thin.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four shapes.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createKettlebell(
  params: createKettlebell.IParams,
  seed?: number | string,
): Archetype<createKettlebell.Affordance, createKettlebell.Dimension> {
  const kind: createKettlebell.Kind = ArchetypeDraw.choice(
    "kettlebell",
    "kind",
    params.kind ?? "competition",
    createKettlebell.KINDS,
  );
  const d: Partial<Record<createKettlebell.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "kettlebell",
      createKettlebell.BANDS[kind],
      seed,
      params,
      createKettlebell.BANDS,
    );
  const body: number = d.diameter! / 2;
  const slim: number = d.handleDiameter! / 2;
  const top: number = d.height! - slim;
  const half: number = createKettlebell.WINDOW / 2 + slim;
  const builder: ArchetypeBuilder<
    createKettlebell.Affordance,
    createKettlebell.Dimension
  > = new ArchetypeBuilder({
    archetype: "kettlebell",
    id: params.id,
    name: "kettlebell",
    dimensions: d,
  });
  builder.ball("body", body, Vector3.create(0, body, 0), { color: "#2c2f33" });
  builder.rod(
    "handle",
    slim,
    Vector3.create(-half, top, 0),
    Vector3.create(half, top, 0),
    { color: "#b8bcc2" },
  );
  for (const side of [1, -1] as const)
    builder.rod(
      side === 1 ? "horn-left" : "horn-right",
      slim,
      Vector3.create(side * half, top, 0),
      Vector3.create(side * half, body, 0),
      { color: "#b8bcc2" },
    );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, top, 0),
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: d.handleDiameter!,
    length: createKettlebell.WINDOW,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createKettlebell}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and how sure its source is.
 * @evidence contracts/development/design.md#principled-representation A closed union and one band per dimension, each marked provisional where the rule's text was not read.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bell's size, the handle a hand reads and the mass a scene chooses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No balance point or inertia is declared.
 */
export namespace createKettlebell {
  /** The kinds of kettlebell. */
  export type Kind = "competition";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["competition"];

  /** The handle's clear width between its horns, metres. An estimate, not read at a source: room for one hand, or two side by side with the thumbs over. */
  export const WINDOW: number = 0.12;

  /** The affordance ids: `grip`, the handle's level bar, taken from above. */
  export type Affordance = "grip";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: from the floor to the handle's top.
   * - `diameter`: the body's.
   * - `handleDiameter`: the handle's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "handleDiameter" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which kettlebell; `competition` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `kettlebell` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    competition: {
      height: ArchetypeBand.metres(0.28, 0.28, BELL, true),
      diameter: ArchetypeBand.metres(0.21, 0.21, BELL, true),
      handleDiameter: ArchetypeBand.metres(0.033, 0.035, BELL, true),
      mass: ArchetypeBand.of(
        "kg",
        8,
        32,
        "an estimate of the range a gym carries, from the lightest common bell to the heaviest the sport lifts; the rule's text was not read",
        true,
      ),
    },
  };
}
