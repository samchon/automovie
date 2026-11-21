import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { WornPropDraw } from "./WornPropDraw";

/**
 * Spectacles with a bridge hold and a nose socket.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Spectacles with a bridge hold and a nose socket.
 * @evidence contracts/development/implementation.md#principled-implementation The open temples run behind the frame and the bridge's back aligns with the nose.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The temples retain their present open rigid stance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds three parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createSpectacles(
  params: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > = {},
  seed?: number | string,
): Archetype<createSpectacles.Affordance, createSpectacles.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof WornPropDraw.prepare<createSpectacles.Affordance>> =
    WornPropDraw.prepare<createSpectacles.Affordance>(
      "spectacles",
      params,
      seed,
    );
  const v: typeof Vector3.create = Vector3.create;
  const thin: number = WornPropDraw.THIN;

  // The front standing on its lenses' bottom edge, the temples back from its ends.
  builder.box("front", v(d.width, d.height, thin), v(0, d.height / 2, 0), {
    color: "#1d1f22",
  });
  for (const [id, sign] of [
    ["leftTemple", 1],
    ["rightTemple", -1],
  ] as const)
    builder.rod(
      id,
      thin / 2,
      v((sign * (d.width - thin)) / 2, d.height * 0.7, -thin / 2),
      v((sign * (d.width - thin)) / 2, d.height * 0.7, -d.depth),
      { color: "#1d1f22" },
    );
  builder.affordance({
    id: "hold",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(v(0, d.height / 2, 0), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    grip: "precision",
    aperture: thin,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.facing(
      v(0, d.height * 0.4, -thin / 2),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * The contacts and dimensions of {@link createSpectacles}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createSpectacles {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "hold" | "wear";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "height" | "mass" | "width";
}
