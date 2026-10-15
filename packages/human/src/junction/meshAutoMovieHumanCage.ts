import {
  IAutoMovieSubdivisionCage,
  IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanUvLayout } from "./AutoMovieHumanUvLayout";
import { IAutoMovieHumanCage } from "./IAutoMovieHumanCage";

/**
 * Subdivide a skin cage once with the engine's Catmull-Clark and turn the limit surface into a render mesh.
 *
 * The cage is converted from millimetres to metres in this one step. Positions are the limit positions and normals the limit normals the engine evaluates, written explicitly, because normals recomputed from triangles would split shading wherever a UV seam duplicates a vertex. UVs follow `AUTOMOVIE_HUMAN_UV_LAYOUT` face-varying: each face corner takes the UV of its own semantic address, so a corner on a chart boundary gets its own chart's value and the engine pins every chart outline. A render vertex is split where a corner's limit normal or UV differs, and every split copy names its subdivided vertex in `physicalVertices`, so welding and topology treat a seam as one surface.
 *
 * @param props.cage The cage, millimetres, only read
 * @param props.levels Refinement steps, an integer from 1 to 6
 * @param props.domain Physical domain name of the surface's vertices
 * @returns The mesh, without skin, and the parameter of each render vertex on the cage
 */
export const meshAutoMovieHumanCage = (props: {
  cage: IAutoMovieHumanCage;
  levels: number;
  domain: string;
}): meshAutoMovieHumanCage.IOutput => {
  const uvs: number[] = [];
  const uvFaces: number[][] = [];
  const index: Map<string, number> = new Map();
  for (const face of props.cage.faces) {
    const corners: Array<[number, number]> = AutoMovieHumanUvLayout.map(
      face.coordinates,
    );
    uvFaces.push(
      corners.map(([x, y]: [number, number], k: number): number => {
        const key: string = `${face.vertices[k]}:${x}:${y}`;
        let found: number | undefined = index.get(key);
        if (found === undefined) {
          found = uvs.length / 2;
          uvs.push(x, y);
          index.set(key, found);
        }
        return found;
      }),
    );
  }
  const cage: IAutoMovieSubdivisionCage = {
    positions: props.cage.vertices.flatMap(
      (v: IAutoMovieHumanCage.IVertex): number[] => [
        v.position.x / 1000,
        v.position.y / 1000,
        v.position.z / 1000,
      ],
    ),
    faces: props.cage.faces.map((f: IAutoMovieHumanCage.IFace): number[] => [
      ...f.vertices,
    ]),
    uvs,
    uvFaces,
    creases: props.cage.creases.map((c: IAutoMovieHumanCage.ICrease) => ({
      from: c.edge[0],
      to: c.edge[1],
      sharpness: c.sharpness,
    })),
  };
  const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage,
    levels: props.levels,
  });
  const positions: number[] = [];
  const normals: number[] = [];
  const meshUvs: number[] = [];
  const sources: number[] = [];
  const indices: number[] = [];
  const split: Map<string, number> = new Map();
  const corner = (c: number): number => {
    const v: number = surface.faces[c]!;
    const n: number = surface.normalFaces[c]!;
    const t: number = surface.uvFaces === null ? -1 : surface.uvFaces[c]!;
    const key: string = `${v}:${n}:${t}`;
    let found: number | undefined = split.get(key);
    if (found === undefined) {
      found = sources.length;
      split.set(key, found);
      sources.push(v);
      positions.push(
        surface.limitPositions[3 * v]!,
        surface.limitPositions[3 * v + 1]!,
        surface.limitPositions[3 * v + 2]!,
      );
      normals.push(
        surface.normals[3 * n]!,
        surface.normals[3 * n + 1]!,
        surface.normals[3 * n + 2]!,
      );
      if (t !== -1)
        meshUvs.push(surface.uvs![2 * t]!, surface.uvs![2 * t + 1]!);
    }
    return found;
  };
  for (let f: number = 0; f < surface.faces.length; f += 4) {
    const [a, b, c, d]: number[] = [
      corner(f),
      corner(f + 1),
      corner(f + 2),
      corner(f + 3),
    ];
    indices.push(a!, b!, c!, a!, c!, d!);
  }
  return {
    mesh: {
      positions,
      normals,
      uvs: surface.uvs === null ? null : meshUvs,
      indices,
      skin: null,
      physicalVertices: {
        sources: Array.from(
          { length: surface.limitPositions.length / 3 },
          (_: unknown, id: number) => ({ domain: props.domain, id }),
        ),
        vertices: sources,
      },
    },
    vertices: sources,
    surface,
  };
};
/** Output type of {@link meshAutoMovieHumanCage}. */
export namespace meshAutoMovieHumanCage {
  /**
   * The render mesh and how it maps back to the subdivided surface.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Render mesh in metres with limit normals, without skin. */
    mesh: IAutoMovieMesh;

    /** Subdivided surface vertex of each render vertex. */
    vertices: number[];

    /** The engine's subdivided surface. */
    surface: IAutoMovieSubdivisionSurface;
  }
}
