import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame } from "../core";

const v: typeof Vector3.create = Vector3.create;

/**
 * A hand paddle's repeated blade panels, handle frame and blade-tip face.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each blade extends along the signed shaft axis in model metres.
 * @evidence contracts/development/design.md#principled-representation Three longitudinal spans form a tapered blade. The grip and tip contacts read the drawn axis.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shares only blade, grip and tip construction between the two independent paddle producers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Callers own their own shaft, blade dimensions, handedness and geometry. No dispatch on craft names.
 */
export namespace PaddleBlade {
  /**
   * Build one thin blade from shoulder to tip, tapered in silhouette. The
   * center ridge controls the dihedral for each half across the local Z axis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which dimensions control silhouette and dihedral, in metres.
   * @evidence contracts/development/implementation.md#principled-implementation Each convex thin panel shares boundary stations with its neighbors and tapers towards the tip.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Define stations, then add one wall cell for each pair of stations and half width.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rendered blade and its collider share identical panel geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Six small convex cells per blade.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each paired cross section and the repeated half construction use one table.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Construction state goes to the caller's builder.
   */
  export function draw<Id extends string, Dimension extends string>(
    builder: ArchetypeBuilder<Id, Dimension>,
    name: string,
    start: number,
    direction: number,
    length: number,
    width: number,
    ridge: number,
    color: string,
  ): void {
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

  /**
   * A grip centered on a round handle, with its +X toward the thumb side.
   * @evidence contracts/development/common.md#meaningful-documentation States the handle frame convention and physical grip site.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the drawn center and tangent with the same rounded grip affordance as other hand tools.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Records one handle with the supplied shaft measurements.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The caller supplies the exact center of its shaft or T-bar and real aperture.
   * @evidence contracts/development/implementation.md#efficient-algorithms One frame construction and append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call declares a distinct physical handle.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The builder owns the resulting contact data.
   */
  export function grip<Id extends string, Dimension extends string>(
    builder: ArchetypeBuilder<Id, Dimension>,
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
      frame: ArchetypeFrame.facing(at, up, toward),
      extent: null,
      grip: "power",
      aperture: diameter,
      length,
    });
  }

  /**
   * The blade-tip face, with +Y pointing away from the shaft.
   * @evidence contracts/development/common.md#meaningful-documentation Names the physical witness and outward axis.
   * @evidence contracts/development/implementation.md#principled-implementation Faces the extreme blade section's plane with the width and thickness of that section.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame and one surface.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tip position and width are the values used to construct the visible final station.
   * @evidence contracts/development/implementation.md#efficient-algorithms No search or mesh traversal.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each tip has its own named site and orientation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The builder owns the resulting contact data.
   */
  export function tip<Id extends string, Dimension extends string>(
    builder: ArchetypeBuilder<Id, Dimension>,
    id: Id,
    x: number,
    direction: number,
    width: number,
  ): void {
    builder.affordance({
      id,
      kind: "surface",
      frame: ArchetypeFrame.facing(v(x, 0, 0), v(direction, 0, 0), v(0, 0, 1)),
      extent: null,
      depth: 0.009,
      width: 0.66 * width,
    });
  }
}
