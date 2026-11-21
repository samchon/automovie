import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";
import { PRIMING_WIRE } from "./PRIMING_WIRE";

/**
 * Inert priming-wire display prop with a ring pinch and a tip locator.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Inert priming-wire display prop with a ring pinch and a tip locator.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the saved display dimensions and supplies its scene grip and endpoint.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The display proxy carries only the saved shape and contacts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two visible parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createStagePrimingWire(
  params: Pick<HandToolDraw.IParams, "id" | "length" | "mass"> = {},
  seed?: number | string,
): Archetype<
  createStagePrimingWire.Affordance,
  createStagePrimingWire.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof HandToolDraw.prepare<createStagePrimingWire.Affordance>
  > = HandToolDraw.prepare<createStagePrimingWire.Affordance>(
    "primingWire",
    params,
    seed,
  );
  const length: number = d.length!;
  const v: typeof Vector3.create = Vector3.create;

  // The ring a finger and thumb pinch, then the stem to its point.
  const wire: number = PRIMING_WIRE.wire;
  const ring: number = PRIMING_WIRE.ring;
  builder.rod(
    "ring",
    ring / 2,
    v(-wire / 2, ring / 2, 0),
    v(wire / 2, ring / 2, 0),
    {
      color: "#4a4d52",
      surface: "steel",
    },
  );
  builder.rod("stem", wire / 2, v(0, ring, 0), v(0, length, 0), {
    color: "#4a4d52",
    surface: "steel",
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "half",
    frame: ArchetypeFrame.facing(v(0, ring / 2, 0), v(1, 0, 0), v(0, 1, 0)),
    extent: null,
    grip: "precision",
    aperture: wire,
    length: ring,
  });
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.upright(v(0, length, 0)),
    extent: null,
  });
  return builder.build(d.mass!, { rests: "steel" });
}

/**
 * The contacts and dimensions of {@link createStagePrimingWire}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createStagePrimingWire {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "grip";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "length" | "mass";
}
