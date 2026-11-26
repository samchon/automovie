import type { AutoMovieArchetypeCyclingHelmet } from "../AutoMovieArchetypeCyclingHelmet";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import { WornPropDraw } from "../WornPropDraw";

/**
 * Cycling helmet with a rim hold and a shell socket. It rests on its rim, shell
 * up, front toward `+Z`; `hold` is the rim at its right side (`-X`) where a
 * right hand puts it on by the side of the head, closing over the shell on its
 * height (the hold declares no aperture, so a grasp reads the shell's span
 * along its `+Y`), and `wear` is the shell's inside top, `+Y` toward the head,
 * which rests on the head's crown under the foam.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or
 *   kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses
 *   the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When a fixed parameter lies outside its
 *   admitted band.
 */
export function createCyclingHelmet(
  params: Pick<
    WornPropDraw.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  > = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeCyclingHelmet.Affordance,
  AutoMovieArchetypeCyclingHelmet.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof WornPropDraw.prepare<AutoMovieArchetypeCyclingHelmet.Affordance>> =
    WornPropDraw.prepare<AutoMovieArchetypeCyclingHelmet.Affordance>(
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
    frame: AutoMovieArchetypeFrame.facing(
      v(-(d.width / 2 - 0.01), thin / 2, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height - WornPropDraw.SHELL, 0),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}
