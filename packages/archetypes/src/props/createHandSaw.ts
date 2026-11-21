import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Hand saw with a blade ledge and a grip across its heel.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Hand saw with a blade ledge and a grip across its heel.
 * @evidence contracts/development/implementation.md#principled-implementation The grip crosses the line from the hand to the teeth at a right angle, as in the saved saw hang.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The blade supplies a named tooth line represented by a ledge.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createHandSaw(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "blade"
  > = {},
  seed?: number | string,
): Archetype<createHandSaw.Affordance, createHandSaw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<createHandSaw.Affordance>> =
    HandToolDraw.prepare<createHandSaw.Affordance>("saw", params, seed);
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - d.blade!;
  // A saw's grip runs across its heel, square to the line from the grip to
  // the tooth line's middle (the hang), so the fist thrusts along that line.
  const centre: IAutoMovieVector3 = Vector3.create(0, handle / 2, 0);
  const toTeeth: IAutoMovieVector3 = Vector3.subtract(
    Vector3.create(0, handle + d.blade! / 2, HandToolDraw.BLADE_DEPTH / 2),
    centre,
  );
  const across: IAutoMovieVector3 = Vector3.normalize(
    Vector3.create(0, -toTeeth.z, toTeeth.y),
  );
  const held: number = HandToolDraw.GRIP;
  builder.rod(
    "handle",
    radius,
    Vector3.subtract(centre, Vector3.scale(across, held / 2)),
    Vector3.add(centre, Vector3.scale(across, held / 2)),
    { color: "#8a5a35" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      centre,
      Vector3.create(1, 0, 0),
      Vector3.scale(across, -1),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
    length: held,
  });

  builder.box(
    "blade",
    Vector3.create(0.001, d.blade!, HandToolDraw.BLADE_DEPTH),
    Vector3.create(0, handle + d.blade! / 2, 0),
    { color: "#b9bcc0", density: 11 },
  );
  builder.affordance({
    id: "face",
    kind: "ledge",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, handle + d.blade! / 2, HandToolDraw.BLADE_DEPTH / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    length: d.blade!,
  });
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createHandSaw}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createHandSaw {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "grip";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "blade" | "gripDiameter" | "length" | "mass";
}
