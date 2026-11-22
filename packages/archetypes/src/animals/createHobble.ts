import { Vector3 } from "@automovie/engine";

import { Archetype, ArchetypeBuilder, ArchetypeDrawSession } from "../core";

/** A cuff's size. */
interface ICuff {
  /** Width along the leg, metres. */
  width: number;

  /** The leather's thickness, metres. */
  thickness: number;
}

/** A cuff's width along the leg and its leather's thickness, metres: authored, no maker's listing read gives them. */
const CUFF: ICuff = {
  width: 0.05,
  thickness: 0.008,
};

/** The strap's radius, metres: authored. */
const STRAP: number = 0.008;

/** A hobble's mass, kilograms: authored, no listing read gives it. */
const MASS: number = 0.3;

/**
 * A fore hobble: a cuff round each foreleg's cannon and a strap between them.
 *
 * Each cuff is a short ring round the cannon, a cylinder along the leg's axis (`+Y`) that clears the cannon's radius by the leather's thickness; at rest the cuffs' middles stand the strap's length apart along `+X`, the left at `+X`. The strap is a span from the inner side of one cuff to the inner side of the other, its rest length the strap's length less the two cuffs' radii, so the cuffs' middles never stand farther apart than the strap's length while it is not drawn past its rest length, and a pose that draws it shorter reports it slack. The cuffs are posed onto a hobbled equid's forelegs by `EquineHobble`. The cuff's width and thickness, the strap's radius and the mass are authored.
 *
 * @param cannon The radius of the cannon the cuffs close round, metres.
 * @param params The strap's length and the model's id.
 * @returns The hobble.
 * @throws {RangeError} For a nonpositive cannon radius or strap length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the parts, the frame, the strap's rest length and which values are authored.
 * @evidence contracts/development/implementation.md#principled-implementation Two leg-axis cylinders clearing the cannon by the leather's thickness, joined by a span between their inner sides with the strap's rest length.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, lay two cuffs and a strap, build.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every authored size is named; a nonpositive input refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shared builder and span.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHobble(
  cannon: number,
  params: createHobble.IParams,
): Archetype<never, never> {
  if (
    !(Number.isFinite(cannon) && cannon > 0) ||
    !(Number.isFinite(params.strap) && params.strap > 0)
  )
    throw new RangeError(
      "A hobble closes round a cannon of positive radius with a strap of positive length",
    );
  const draw: ArchetypeDrawSession<never> = new ArchetypeDrawSession<never>(
    "hobble",
    {},
    undefined,
    {},
  );
  const builder: ArchetypeBuilder<never, never> = new ArchetypeBuilder({
    material: "leather",
    id: params.id,
    name: "hobble",
    draw,
  });
  const ring: number = cannon + CUFF.thickness;
  if (!(params.strap > 2 * ring))
    throw new RangeError(
      "A hobble's strap is longer than its two cuffs are wide",
    );
  const half: number = params.strap / 2;
  for (const [id, x] of [
    ["leftCuff", half],
    ["rightCuff", -half],
  ] as const)
    builder.rod(
      id,
      ring,
      Vector3.create(x, -CUFF.width / 2, 0),
      Vector3.create(x, CUFF.width / 2, 0),
      { color: "#4a2f1b", round: false },
    );
  builder.span(
    "strap",
    builder.anchor("leftCuff", Vector3.create(half - ring, 0, 0)),
    builder.anchor("rightCuff", Vector3.create(-half + ring, 0, 0)),
    STRAP,
    { color: "#4a2f1b" },
    params.strap - 2 * ring,
  );
  return builder.build(MASS);
}

/**
 * Companion types of {@link createHobble}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type states what it is and its units.
 * @evidence contracts/development/design.md#principled-representation The strap's length in metres and an id.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the producer reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace createHobble {
  /** The parameters. */
  export interface IParams {
    /** The most the cuffs' middles stand apart, metres, more than the two cuffs are wide. */
    strap: number;

    /** The model's id, unique in a scene; `hobble` when absent. */
    id?: string;
  }
}
