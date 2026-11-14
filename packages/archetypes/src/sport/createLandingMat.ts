import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The high jump's landing area in the rules' comparison sheet. */
const HIGH: string =
  "2025 High Jump Rules Comparison, Pacific Association USATF, World Athletics column: landing surface 6 m by 4 m by 0.7 m (https://pausatf.org/wp-content/uploads/2025/01/High-Jump-Rules-Comparison-Color-2025.pdf), the least the rule allows, which the model takes";

/** The pole vault's landing area in the rules' comparison sheet. */
const POLE: string =
  "2025 Pole Vault Rules Comparison, Pacific Association USATF, World Athletics column: landing area 6 m by 6 m by 0.8 m behind the box, 8 m with the front pads (https://pausatf.org/wp-content/uploads/2025/01/Pole-Vault-Rules-Comparison-Color-2025.pdf), the least the rule allows, which the model takes";

/**
 * A landing mat: the foam bed a high jumper or a pole vaulter comes down on.
 *
 * The mat lies on the floor with the middle of its footprint at the origin, its length along `Z` (the direction of the jump) and its width along `X`. `surface` is its top, the place a landing lies on.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The mat.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the mat lies and the contact.
 * @evidence contracts/development/implementation.md#principled-implementation One box of the drawn length, width and height; its top is the contact, as large as the top.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one box, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bed is rigid: how far it gives under a body is the landing act's. A pole vault mat's cut-out round the box is not drawn.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createLandingMat(
  params: createLandingMat.IParams,
  seed?: number | string,
): Archetype<createLandingMat.Affordance, createLandingMat.Dimension> {
  const kind: createLandingMat.Kind = ArchetypeDraw.choice(
    "landingMat",
    "kind",
    params.kind,
    createLandingMat.KINDS,
  );
  const d: Record<createLandingMat.Dimension, number> =
    ArchetypeDraw.dimensions(
      "landingMat",
      createLandingMat.BANDS[kind],
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createLandingMat.Affordance,
    createLandingMat.Dimension
  > = new ArchetypeBuilder({
    archetype: "landingMat",
    id: params.id,
    name: kind === "highJump" ? "high jump mat" : "pole vault mat",
    dimensions: d,
  });
  builder.box(
    "bed",
    Vector3.create(d.width, d.height, d.length),
    Vector3.create(0, d.height / 2, 0),
    { color: "#2f5d9e" },
  );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, d.height, 0)),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createLandingMat}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union and one band per dimension per kind; the rules give the least size, so each band runs from it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The top's height and extent a landing reads, and the one contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both kinds have every dimension, so the table is total.
 */
export namespace createLandingMat {
  /** The kinds of mat. */
  export type Kind = "highJump" | "poleVault";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["highJump", "poleVault"];

  /** The affordance ids: `surface`, the top. */
  export type Affordance = "surface";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: along `Z`, the jump's direction.
   * - `width`: along `X`.
   * - `height`: the top above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "height" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which mat. */
    kind: Kind;

    /** The model's id, unique in a scene; `landingMat` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    highJump: {
      length: ArchetypeBand.metres(4, 4, HIGH),
      width: ArchetypeBand.metres(6, 6, HIGH),
      height: ArchetypeBand.metres(0.7, 0.7, HIGH),
      mass: ArchetypeBand.of(
        "kg",
        250,
        400,
        "an estimate of a foam bed of that size with its cover; no maker's figure was read",
        true,
      ),
    },
    poleVault: {
      length: ArchetypeBand.metres(6, 8, POLE),
      width: ArchetypeBand.metres(6, 6, POLE),
      height: ArchetypeBand.metres(0.8, 0.8, POLE),
      mass: ArchetypeBand.of(
        "kg",
        450,
        700,
        "an estimate of a foam bed of that size with its cover; no maker's figure was read",
        true,
      ),
    },
  };
}
