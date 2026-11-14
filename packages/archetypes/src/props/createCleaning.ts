import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a maker's size reads as, not read at a source. */
const MAKER: string = "a common maker's size, not read at a source";

/**
 * A thing a hand wipes or scrubs with: a cloth folded flat or a sponge.
 *
 * It lies flat on a surface centred over the origin. `grip` is the hold at its middle, pinched for a cloth and closed round for a sponge, its thickness the aperture; `face` its underside, facing down, the side that meets what is wiped.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The thing.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how it lies and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation One box of the drawn width, length and thickness.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cloth does not drape and a sponge does not squeeze; both are rigid boxes.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCleaning(
  params: createCleaning.IParams,
  seed?: number | string,
): Archetype<createCleaning.Affordance, createCleaning.Dimension> {
  const kind: createCleaning.Kind = ArchetypeDraw.choice(
    "cleaning",
    "kind",
    params.kind,
    createCleaning.KINDS,
  );
  const d: Record<createCleaning.Dimension, number> = ArchetypeDraw.dimensions(
    "cleaning",
    createCleaning.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createCleaning.Affordance,
    createCleaning.Dimension
  > = new ArchetypeBuilder({
    archetype: "cleaning",
    id: params.id,
    name: kind,
    dimensions: d,
  });
  builder.box(
    kind,
    Vector3.create(d.width, d.thickness, d.length),
    Vector3.create(0, d.thickness / 2, 0),
    { color: kind === "cloth" ? "#4f86c6" : "#f2d24b" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.upright(Vector3.create(0, d.thickness / 2, 0)),
    extent: null,
    grip: kind === "cloth" ? "precision" : "power",
    aperture: d.thickness,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, 0, 0),
      Vector3.create(0, -1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createCleaning}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation A closed union of the two and one band per dimension each.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hold and the wiping face.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source was read, so every band is provisional.
 */
export namespace createCleaning {
  /** The kinds: a cloth folded in four, a kitchen sponge. */
  export type Kind = "cloth" | "sponge";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["cloth", "sponge"];

  /**
   * The affordance ids:
   *
   * - `grip`: the hold at the middle.
   * - `face`: the underside, facing down.
   */
  export type Affordance = "grip" | "face";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `length`, `thickness`: the thing's as it lies.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "length" | "thickness" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which thing. */
    kind: Kind;

    /** The model's id, unique in a scene; `cleaning` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    cloth: {
      width: ArchetypeBand.metres(0.15, 0.2, `${MAKER}: a 30 to 40 cm cloth folded in four`, true),
      length: ArchetypeBand.metres(0.15, 0.2, `${MAKER}: a 30 to 40 cm cloth folded in four`, true),
      thickness: ArchetypeBand.metres(0.004, 0.008, MAKER, true),
      mass: ArchetypeBand.of("kg", 0.02, 0.05, MAKER, true),
    },
    sponge: {
      width: ArchetypeBand.metres(0.06, 0.075, MAKER, true),
      length: ArchetypeBand.metres(0.09, 0.11, MAKER, true),
      thickness: ArchetypeBand.metres(0.025, 0.045, MAKER, true),
      mass: ArchetypeBand.of("kg", 0.005, 0.02, MAKER, true),
    },
  };
}
