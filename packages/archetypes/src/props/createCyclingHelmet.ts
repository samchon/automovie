import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { WornPropDraw } from "./WornPropDraw";

/**
 * Cycling helmet with a rim pinch and a shell socket. It rests on its rim,
 * shell up, front toward `+Z`; `hold` is the rim at its right side (`-X`)
 * where a right hand puts it on by the side of the head, and `wear` is the
 * shell's inside top, `+Y` toward the head, which rests on the head's crown
 * under the foam.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When a fixed parameter lies outside its admitted band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rest frame, the pinch, the socket and the provenance of the sizes.
 * @evidence contracts/development/implementation.md#principled-implementation A dome over an elliptical rim as one convex part, with the socket a foam thickness under the shell's top.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the recipe, then build the shell and its two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shell is rigid; the vents, straps and foam are not modelled.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds one convex part from forty-eight points and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createCyclingHelmet(
  params: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > = {},
  seed?: number | string,
): Archetype<createCyclingHelmet.Affordance, createCyclingHelmet.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof WornPropDraw.prepare<createCyclingHelmet.Affordance>> =
    WornPropDraw.prepare<createCyclingHelmet.Affordance>(
      "helmet",
      params,
      seed,
    );
  const v: typeof Vector3.create = Vector3.create;
  const thin: number = WornPropDraw.THIN;

  // An elliptical rim and three rings rising to the crown.
  const shell: IAutoMovieVector3[] = [];
  for (const [rise, scale] of [
    [0, 1],
    [0.55, 0.86],
    [0.85, 0.55],
    [1, 0.12],
  ] as const)
    for (let k: number = 0; k < 12; ++k) {
      const angle: number = (2 * Math.PI * k) / 12;
      shell.push(
        v(
          (Math.cos(angle) * scale * d.width) / 2,
          rise * d.height,
          (Math.sin(angle) * scale * d.depth) / 2,
        ),
      );
    }
  builder.convex("shell", shell, undefined, { color: "#d33f2f" });
  builder.affordance({
    id: "hold",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      v(-(d.width / 2 - 0.01), thin / 2, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: thin,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: ArchetypeFrame.facing(
      v(0, d.height - WornPropDraw.SHELL, 0),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * The contacts and dimensions of {@link createCyclingHelmet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createCyclingHelmet {
  /** The contacts this producer builds. */
  export type Affordance = "hold" | "wear";

  /** The dimensions this producer draws, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "height" | "mass" | "width";
}