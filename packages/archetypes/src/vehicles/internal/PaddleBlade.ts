import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core";

/*
 * A hand paddle's repeated blade panels, handle frame and blade-tip face.
 */
export namespace PaddleBlade {
  /*
   * Build one thin blade from shoulder to tip, tapered in silhouette. The
   * center ridge controls the dihedral for each half across the local Z axis.
   */
  export function draw<Id extends string, Dimension extends string>(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    name: string,
    start: number,
    direction: number,
    length: number,
    width: number,
    ridge: number,
    color: string,
  ): void {
    // The blade's 9 mm thickness and its outline stations are authored.
    const thickness: number = 0.009;
    const stations = [
      { u: 0, radius: 0.022, rise: 0 },
      { u: 0.31, radius: width / 2, rise: ridge },
      { u: 0.84, radius: width * 0.47, rise: ridge * 0.82 },
      { u: 1, radius: width * 0.33, rise: ridge * 0.18 },
    ];
    for (let i: number = 0; i + 1 < stations.length; ++i)
      for (const side of [-1, 1])
        builder.convex(
          `${name}-${i}-${side}`,
          [stations[i]!, stations[i + 1]!].flatMap(
            ({ u, radius, rise }): IAutoMovieVector3[] => {
              const x: number = start + direction * length * u;
              return [
                v(x, rise, 0),
                v(x, 0, side * radius),
                v(x, rise - thickness, 0),
                v(x, -thickness, side * radius),
              ];
            },
          ),
          undefined,
          { color },
        );
  }

  /*
   * A grip centered on a round handle, with its +X toward the thumb side.
   */
  export function grip<Id extends string, Dimension extends string>(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    id: Id,
    at: IAutoMovieVector3,
    toward: IAutoMovieVector3,
    diameter: number,
    length: number,
    up: IAutoMovieVector3 = v(0, 1, 0),
  ): void {
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(at, up, toward),
      extent: null,
      grip: "power",
      aperture: diameter,
      length,
    });
  }

  /*
   * The blade-tip face, with +Y pointing away from the shaft.
   */
  export function tip<Id extends string, Dimension extends string>(
    builder: AutoMovieArchetypeBuilder<Id, Dimension>,
    id: Id,
    x: number,
    direction: number,
    width: number,
  ): void {
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, 0, 0),
        v(direction, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      depth: 0.009,
      width: 0.66 * width,
    });
  }
}

const v: typeof Vector3.create = Vector3.create;
