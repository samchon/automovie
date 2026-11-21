import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Ladle with a pinch grip and a bowl facing +Z.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Ladle with a pinch grip and a bowl facing +Z.
 * @evidence contracts/development/implementation.md#principled-implementation The bowl radius sets its position and its surface contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A coarse round bowl and steel handle retain the saved tool frames.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createLadle(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "bowl"
  > = {},
  seed?: number | string,
): Archetype<createLadle.Affordance, createLadle.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<createLadle.Affordance>> =
    HandToolDraw.prepare<createLadle.Affordance>("ladle", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;
  const v: typeof Vector3.create = Vector3.create;

  const handle: number = length - d.bowl!;
  HandToolDraw.handle(builder, handle, radius, {
    steel: true,
    precision: true,
  });

  // A ladle's bowl beyond its handle, its opening toward +Z.
  builder.ball("bowl", d.bowl! / 2, v(0, length - d.bowl! / 2, 0), {
    color: "#b9bcc0",
    surface: "steel",
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      v(0, length - d.bowl! / 2, d.bowl! / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass!, { rests: "steel" });
}

/**
 * The contacts and dimensions of {@link createLadle}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createLadle {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "grip";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "bowl" | "gripDiameter" | "length" | "mass";
}
