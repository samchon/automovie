import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** A cloth, read. */
const CLOTH: string =
  "E-Cloth General Purpose Cloth, 32 x 32 x 0.3 cm, 19 g (https://www.thenile.co.nz/home/general-purpose-cloth-32x32x03cm/5037284206656), listed elsewhere at 31.75 x 31.75 x 0.3 cm (https://www.desertcart.co.za/products/53864487-e-cloth-general-purpose-cleaning-cloths)";

/** A sponge, read. */
const SPONGE: string =
  "Scotch-Brite Heavy Duty Scrub Sponge, 4.4 x 2.6 x 0.6 to 0.7 in (https://www.target.com/p/scotch-brite-heavy-duty-sponge-3pk/-/A-76165590)";

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
    symmetry: "none",
    frame: ArchetypeFrame.upright(Vector3.create(0, d.thickness / 2, 0)),
    extent: null,
    grip: kind === "cloth" ? "precision" : "power",
    aperture: d.thickness,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sizes are the products' as read, the cloth's folded in four; the sponge's weight is not given, so its mass band is provisional.
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
      width: ArchetypeBand.metres(0.15875, 0.16, `${CLOTH}: folded in four`),
      length: ArchetypeBand.metres(0.15875, 0.16, `${CLOTH}: folded in four`),
      thickness: ArchetypeBand.metres(0.012, 0.012, `${CLOTH}: four layers`),
      mass: ArchetypeBand.of("kg", 0.019, 0.019, CLOTH),
    },
    sponge: {
      width: ArchetypeBand.metres(2.6 * 0.0254, 2.6 * 0.0254, SPONGE),
      length: ArchetypeBand.metres(4.4 * 0.0254, 4.4 * 0.0254, SPONGE),
      thickness: ArchetypeBand.metres(0.6 * 0.0254, 0.7 * 0.0254, SPONGE),
      mass: ArchetypeBand.of("kg", 0.005, 0.02, "the sponge's weight: the listings read do not give it", true),
    },
  };
}
