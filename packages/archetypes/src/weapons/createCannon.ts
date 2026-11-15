import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  type IArchetypeBand,
} from "../core";
import { FIELD_GUN } from "./FIELD_GUN";

/**
 * A cannon on its carriage: the 6-pdr bronze field gun, Model 1839-1844, on its M1841 carriage, as the 1862 Ordnance Manual gives them.
 *
 * The gun stands on level ground, its axle across `X` at the origin's `Z`, its muzzle toward `+Z`. `muzzle` is the muzzle's face, `+Y` along the bore; `vent` is the vent's outer orifice on the breech, `+Y` out along the vent, which leans to the rear; both ride `elevation`, a hinge on the trunnions' axis whose positive travel raises the muzzle up to the manual's 12 degrees; its 8 degrees of depression below level wait on a signed articulation range in the core. `elevatingScrew` is the screw's handle under the breech, a place read from an undimensioned plate and so provisional. `trail` is the top of the trail's end, where the trail handspike bears to traverse the piece; where the pointing rings sit on it is unread. `leftSpin` and `rightSpin` turn the wheels on the axle, a positive turn rolling them forward. The gun rests on its iron tires and its wooden trail, two materials, so its body carries no friction.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The cannon.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the gun stands, each contact and articulation, what is provisional and why it carries no friction.
 * @evidence contracts/development/implementation.md#principled-implementation Every size and weight is the manual's, built by `FIELD_GUN.build`; the dimensions are its single figures, so the gun is the one the manual describes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, build the gun, and weigh it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None here; the construction's shortcuts are `FIELD_GUN.build`'s.
 * @evidence contracts/development/implementation.md#efficient-algorithms One builder pass.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCannon(
  params: createCannon.IParams,
  seed?: number | string,
): Archetype<createCannon.Affordance, createCannon.Dimension> {
  const kind: createCannon.Kind = ArchetypeDraw.choice(
    "cannon",
    "kind",
    params.kind,
    createCannon.KINDS,
  );
  const d: Partial<Record<createCannon.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "cannon",
      createCannon.BANDS[kind],
      seed,
      params,
      createCannon.BANDS,
    );
  const builder: ArchetypeBuilder<createCannon.Affordance, createCannon.Dimension> =
    new ArchetypeBuilder({
      archetype: "cannon",
      id: params.id,
      name: kind,
      dimensions: d,
    });
  FIELD_GUN.build(builder);
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createCannon}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind, each a single read figure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The gun's working points, its elevation and its wheels (#3484), and the figures a scene measures it by.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The provisional screw and the unread pointing rings are stated, not hidden.
 */
export namespace createCannon {
  /** The kinds of cannon. */
  export type Kind = "fieldGun";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["fieldGun"];

  /**
   * The affordance ids:
   *
   * - `muzzle`: the muzzle's face, `+Y` along the bore; it rides `elevation`.
   * - `vent`: the vent's outer orifice, `+Y` out along the vent; it rides `elevation`.
   * - `elevation`: the tube's hinge on the trunnions' axis, raising the muzzle.
   * - `elevatingScrew`: the elevating screw's handle under the breech, provisional.
   * - `trail`: the top of the trail's end, where the handspike bears.
   * - `leftSpin`, `rightSpin`: the wheels' turns on the axle.
   */
  export type Affordance =
    | "muzzle"
    | "vent"
    | "elevation"
    | "elevatingScrew"
    | "trail"
    | "leftSpin"
    | "rightSpin";

  /**
   * The dimensions, metres unless stated:
   *
   * - `length`: the tube's whole length.
   * - `trunnionHeight`: the trunnions' axis above the ground.
   * - `wheelDiameter`: the wheels' height.
   * - `track`: between the wheels.
   * - `mass`: the gun and its carriage without implements, kilograms.
   */
  export type Dimension =
    | "length"
    | "trunnionHeight"
    | "wheelDiameter"
    | "track"
    | "mass";

  /** The parameters: the kind, and any dimension fixed to its value. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which cannon. */
    kind: Kind;

    /** The model's id, unique in a scene; `cannon` when absent. */
    id?: string;
  }

  /** The band of each dimension, by kind: each the manual's single figure. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
  > = {
    fieldGun: {
      length: ArchetypeBand.metres(
        FIELD_GUN.TUBE.whole,
        FIELD_GUN.TUBE.whole,
        FIELD_GUN.SOURCE,
      ),
      trunnionHeight: ArchetypeBand.metres(
        FIELD_GUN.CARRIAGE.trunnionHeight,
        FIELD_GUN.CARRIAGE.trunnionHeight,
        FIELD_GUN.SOURCE,
      ),
      wheelDiameter: ArchetypeBand.metres(
        FIELD_GUN.CARRIAGE.wheel,
        FIELD_GUN.CARRIAGE.wheel,
        FIELD_GUN.SOURCE,
      ),
      track: ArchetypeBand.metres(
        FIELD_GUN.CARRIAGE.track,
        FIELD_GUN.CARRIAGE.track,
        FIELD_GUN.SOURCE,
      ),
      mass: ArchetypeBand.of(
        "kg",
        FIELD_GUN.TUBE.mass + FIELD_GUN.CARRIAGE.mass + 2 * FIELD_GUN.CARRIAGE.wheelMass,
        FIELD_GUN.TUBE.mass + FIELD_GUN.CARRIAGE.mass + 2 * FIELD_GUN.CARRIAGE.wheelMass,
        `${FIELD_GUN.SOURCE}: the piece's 884 lb and the gun-carriage complete without implements, 900 lb`,
      ),
    },
  };
}
