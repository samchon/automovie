import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeUnits,
} from "../core";

/**
 * One flag of a flag football belt at the IFAF Flag Football Rules'
 * dimensions: a strip 15 to 16 inches long from its socket (the middle,
 * 15.5 in), 1.8 to 2.0 inches wide (1.9 in) and 0.02 to 0.10 inches thick
 * (0.06 in), hanging down along -Y from its socket at the origin. A player
 * wears one at each hip; a defender's hand that grips it pulls it off.
 *
 * `socket` is where it clips to the belt, worn on the hips; `tip` its free
 * end, `grip` the middle a pulling hand closes on.
 *
 * @param params The model's id.
 * @param seed The seed; the flag has no drawn dimension.
 * @returns The flag.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the rule's dimensions and the affordances.
 * @evidence contracts/development/implementation.md#principled-implementation The length, width and thickness are the middles of the IFAF Flag Football Rules' bands.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One strip, then the three affordances.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The strip is rigid; its cloth does not flutter.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createFootballFlag(
  params: createFootballFlag.IParams = {},
  seed?: number | string,
): Archetype<createFootballFlag.Affordance, never> {
  const draw: ArchetypeDrawSession<never> = new ArchetypeDrawSession(
    "footballFlag",
    {},
    seed,
    {},
  );
  const builder: ArchetypeBuilder<createFootballFlag.Affordance, never> =
    new ArchetypeBuilder({
      material: "fabric",
      id: params.id,
      name: "football flag",
      draw,
    });
  const { LENGTH, WIDTH, THICKNESS } = createFootballFlag;
  builder.box(
    "strip",
    Vector3.create(WIDTH, LENGTH, THICKNESS),
    Vector3.create(0, -LENGTH / 2, 0),
    { color: "#e8452c" },
  );
  for (const [id, y] of [
    ["socket", 0],
    ["grip", -LENGTH / 2],
    ["tip", -LENGTH],
  ] as const)
    builder.affordance({
      id,
      kind: id === "grip" ? "handle" : "socket",
      frame: ArchetypeFrame.upright(Vector3.create(0, y, 0)),
      extent: null,
    });

  // A flag's nominal mass, kilograms; provisional.
  return builder.build(0.02);
}

/**
 * Companion types and constants of {@link createFootballFlag}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, parameter and constant states what it is and its source.
 * @evidence contracts/development/design.md#principled-representation The dimensions are the rule's, in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Where the flag is worn, held and ends.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The affordance names are a closed union.
 */
export namespace createFootballFlag {
  /** `socket`, where it clips to the belt; `grip`, its middle; `tip`, its free end. */
  export type Affordance = "socket" | "grip" | "tip";

  /** The parameters. */
  export interface IParams {
    /** The model's id, unique in a scene; `footballFlag` when absent. */
    id?: string;
  }

  /** The flag's length from its socket, metres: IFAF, 15 to 16 in. */
  export const LENGTH: number = 15.5 * ArchetypeUnits.INCH;

  /** The flag's width, metres: IFAF, 1.8 to 2.0 in. */
  export const WIDTH: number = 1.9 * ArchetypeUnits.INCH;

  /** The flag's thickness, metres: IFAF, 0.02 to 0.10 in. */
  export const THICKNESS: number = 0.06 * ArchetypeUnits.INCH;
}
