import { Vector3 } from "@automovie/engine";

import { resolveHumanFaceApertureUp } from "../../basis/resolveHumanFaceApertureUp";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementContextOptions } from "./IHumanFaceMeasurementContextOptions";

/**
 * Wrap one build's final posed positions as the context face measurements
 * read.
 *
 * Positions are those the build emits, after articulation, closure and
 * contact; each coordinate a reader sees is rounded to Float32, the precision
 * of the static asset. An unknown surface or an out-of-range vertex refuses by
 * name. The opening direction is the contact frame's, or null when the basis
 * declares no articulation.
 *
 * @author Samchon
 */
export function createHumanFaceMeasurementContext(
  basis: IAutoMovieHumanFaceBasis,
  posed: ReadonlyMap<string, readonly number[]>,
  options?: IHumanFaceMeasurementContextOptions,
): IHumanFaceMeasurementContext {
  const absentDental = new Set(options?.oral?.absentDentalVertices ?? []);
  const assertPresent = (surface: string, vertex: number): void => {
    if (surface === options?.oral?.dentalSurface && absentDental.has(vertex))
      throw new Error(
        `A face measurement requires absent authored crown vertex ${vertex} of ${surface}.`,
      );
    if (options?.brows?.replacements.get(surface)?.has(vertex))
      throw new Error(
        "Generated brow acquisition needs actual shafts or implantation boundaries, not replaced source-card vertices.",
      );
  };
  const positions = (surface: string): readonly number[] => {
    const found = posed.get(surface);
    if (found === undefined)
      throw new Error(
        "A face measurement names an absent surface: " + surface + ".",
      );
    return found;
  };
  return {
    basis,
    point: (surface, vertex) => {
      assertPresent(surface, vertex);
      const values = positions(surface);
      if (
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        3 * vertex + 2 >= values.length
      )
        throw new Error(
          `A face measurement names an absent vertex ${vertex} of ${surface}.`,
        );
      return Vector3.create(
        Math.fround(values[3 * vertex]),
        Math.fround(values[3 * vertex + 1]),
        Math.fround(values[3 * vertex + 2]),
      );
    },
    surface: (surface) => {
      if (surface === options?.oral?.dentalSurface)
        throw new Error(
          "Generated oral composite surface acquisition needs its actual part meshes, not replaced native gingiva.",
        );
      if (options?.brows?.replacements.has(surface))
        throw new Error(
          "Generated brow surface acquisition needs actual shafts, not replaced source cards.",
        );
      return {
        positions: positions(surface).map(Math.fround),
        indices: basis.surfaces.find((candidate) => candidate.id === surface)!
          .indices,
      };
    },
    apertureUp:
      basis.articulation === undefined
        ? null
        : resolveHumanFaceApertureUp(basis.articulation.jaw.axis),
    opticalMesh: (side, role) => {
      const mesh = options?.optics?.find((eye) => eye.side === side)?.geometry
        .parts[role].mesh;
      return mesh === undefined
        ? null
        : {
            ...mesh,
            positions: mesh.positions.map(Math.fround),
            normals: mesh.normals?.map(Math.fround) ?? null,
          };
    },
    referencePoint:
      options?.reference === undefined
        ? null
        : (surface, vertex) => {
            assertPresent(surface, vertex);
            const values = options.reference!.get(surface);
            if (
              values === undefined ||
              !Number.isSafeInteger(vertex) ||
              vertex < 0 ||
              3 * vertex + 2 >= values.length
            )
              throw new Error(
                `A face reference measurement names an absent vertex ${vertex} of ${surface}.`,
              );
            const coordinates = values
              .slice(3 * vertex, 3 * vertex + 3)
              .map(Math.fround);
            if (!coordinates.every(Number.isFinite))
              throw new Error(
                `A face reference measurement has a nonfinite Float32 vertex ${vertex} of ${surface}.`,
              );
            return Vector3.create(
              coordinates[0],
              coordinates[1],
              coordinates[2],
            );
          },
    lashMesh: (side, row) => {
      const population = options?.lashes?.find(
        (one) => one.side === side && one.row === row,
      );
      if (population === undefined) return null;
      if (population.mesh === null)
        return {
          positions: [],
          indices: [],
          normals: [],
          uvs: null,
          skin: null,
        };
      return {
        ...population.mesh,
        positions: population.mesh.positions.map(Math.fround),
        normals: population.mesh.normals?.map(Math.fround) ?? null,
      };
    },
  };
}
