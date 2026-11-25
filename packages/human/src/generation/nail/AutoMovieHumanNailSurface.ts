import { AutoMovieLoftAdmissionError } from "@automovie/engine";
import type {
  IAutoMovieHumanDigitNails,
  IAutoMovieLoftChain,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieHumanDigitNails as Nails } from "./AutoMovieHumanDigitNails";
import { AutoMovieHumanNailPatch as Patch } from "./AutoMovieHumanNailPatch";

/** Replace one published digit face without replacing its body's other edges. */
export namespace AutoMovieHumanNailSurface {
  /** The body face's existing station domain and endpoint ownership. */
  export interface IGrid {
    /** Original sampling endpoints, including any owned collapsed tip. */
    range: [number, number];
    /** Body skin chord in mm outside the trim and its authored reliefs. */
    chord: number;
    /** Leave the body's existing pole and regular end handling in effect. */
    regular(rows: number[]): number[];
  }

  /** The one emitted skin and its adjoining material segment. */
  export interface IRetained {
    /** Same body-end cycles returned by the existing face tessellator. */
    open: IAutoMovieSolidMesh.IOpen[];
    /** Index-buffer boundary between the skin and nail materials. */
    plateFrom: number;
    /** Original plate chain carrying its name and rolled dorsal reading axis. */
    plate: IAutoMovieLoftChain;
    /** Digit loft with the retained bed and free-edge reliefs. */
    skin: IAutoMovieLoftChain;
    /** World chart that evaluated the retained skin. */
    surface: IAutoMovieSolidSurface;
  }

  /** Append exactly one trimmed skin and crown, or roll back both. */
  export function append(
    mesh: IAutoMovieSolidMesh.IMesh,
    face: IAutoMovieSolidMesh.IFace,
    input: IAutoMovieHumanDigitNails.IPlaced,
    grid: IGrid,
    draw: (face: IAutoMovieSolidMesh.IFace) => IAutoMovieSolidMesh.IOpen[],
  ): IRetained {
    const made: IAutoMovieHumanDigitNails.IMade = Nails.createOn(
      input.original,
      input.frame,
      { attached: true },
    );
    if (!made.support.admitted)
      throw new AutoMovieLoftAdmissionError(
        `original bed and strip clip ${made.support.clipped} mm`,
      );
    const prepared: Patch.IPrepared = Patch.prepare(made, {});
    const patch = Patch.shape(prepared);
    const { host: skin, part: plate } = prepared.contact;
    const surface = skin.surface;
    if (
      face.inverted === true ||
      face.surface.orientation !== surface.orientation
    )
      throw new AutoMovieLoftAdmissionError(
        "nail host reverses its original surface",
      );
    for (const loop of [...face.loops, ...(face.domainLoops ?? [])])
      for (const [index, chart] of loop.chart.entries()) {
        const start: number = 3 * loop.vertices[index]!;
        const point = surface.point!(...chart);
        const original: number[] = mesh.positions.slice(start, start + 3);
        // Allow frame arithmetic at the world-mm magnitude. The retained body
        // positions themselves are shared verbatim; they are never moved here.
        const roundoff: number =
          64 * Number.EPSILON * Math.max(1, ...original.map(Math.abs));
        if (
          !point.every(
            (value, axis): boolean =>
              Math.abs(value - original[axis]!) <= roundoff,
          )
        )
          throw new AutoMovieLoftAdmissionError(
            "nail relief changes an existing body edge",
          );
      }

    const vertexFrom: number = mesh.positions.length;
    const coordinateFrom: number = mesh.coordinates.length;
    const indexFrom: number = mesh.indices.length;
    const ownerFrom: number = mesh.owners.length;
    try {
      const seam: IAutoMovieSolidMesh.ILoop = patch.seam(mesh);
      const open: IAutoMovieSolidMesh.IOpen[] = draw({
        ...face,
        surface,
        stations: grid.regular(patch.stations(...grid.range, grid.chord)),
        phases: patch.phases,
        loops: [...face.loops, seam],
        onFailure: (detail: string): never => {
          throw new AutoMovieLoftAdmissionError(detail);
        },
      });
      const plateFrom: number = mesh.indices.length;
      if (plateFrom === indexFrom)
        throw new AutoMovieLoftAdmissionError("nail left no surrounding skin");
      const { inward } = patch.crown(mesh, seam.vertices);
      if (!(inward <= Nails.CLIP_MM))
        throw new AutoMovieLoftAdmissionError(`nail crown clips ${inward} mm`);
      return { open, plateFrom, plate: plate.chain, skin: skin.chain, surface };
    } catch (error: unknown) {
      mesh.positions.length = vertexFrom;
      mesh.coordinates.length = coordinateFrom;
      mesh.indices.length = indexFrom;
      mesh.owners.length = ownerFrom;
      throw error;
    }
  }
}
