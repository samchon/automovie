import {
  AutoMovieIllinois,
  measureAutoMovieMeshCrossings,
  measureAutoMovieMeshPieces,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieMesh,
} from "@automovie/interface";

import { AutoMovieHumanTrunkRows } from "../generation/AutoMovieHumanTrunkRows";
import { AutoMovieHumanArmscyeDefinition } from "../generation/arm/AutoMovieHumanArmscyeDefinition";

type Port = AutoMovieHumanArmscyeDefinition.IInput;

/** Draw the stock construction port on the same native opening and rail. */
export function inspectHumanArmscyePort(
  input: Port & { guide: AutoMovieVector3Tuple[] },
) {
  const { host, arm, guide, rows } = input;
  const node = AutoMovieHumanArmscyeDefinition.create(input);
  const began = performance.now();
  const result = realizeAutoMovieConstruction(
    { name: node.name, root: node },
    {
      chord: AutoMovieHumanTrunkRows.MAX_GAP / 1000,
      sources: new Map([
        [host.name, host],
        [arm.name, arm],
      ]),
    },
  );
  const milliseconds = performance.now() - began;
  const bandDomain = result.surfaces.find(
    ({ name }) => name === node.band,
  )?.domain;
  const { positions, indices } = result.mesh;
  const geometry: IAutoMovieMesh = {
    positions,
    indices,
    normals: null,
    skin: null,
    uvs: null,
  };
  const pieces = measureAutoMovieMeshPieces(geometry).map(
    ({ boundaryLoops, genus, manifold, consistentlyWound }) => ({
      boundaryLoops,
      genus,
      manifold,
      consistentlyWound,
    }),
  );
  const crossings = measureAutoMovieMeshCrossings(geometry, geometry);
  return {
    milliseconds,
    bandDomain,
    rows,
    retained: result.chains.map(({ name }) => name),
    diagnostics: result.diagnostics,
    guide,
    skin: {
      positions,
      indices,
      report: {
        pieces,
        crossings: crossings.length,
        crossingWitnesses: crossings,
      },
    },
  };
}

/**
 * The same original port supports unskinned measurements and source-tree
 * replay.
 */
export namespace inspectHumanArmscyePort {
  /**
   * Observe the upper skin on the actual lateral acromial plane before
   * tessellation.
   */
  export function crest(input: Port, lateral: number) {
    const { host, arm, side } = input;
    const node = AutoMovieHumanArmscyeDefinition.create(input);
    const began = performance.now();
    const result = realizeAutoMovieConstruction(
      { name: node.name, root: node },
      {
        chord: AutoMovieHumanTrunkRows.MAX_GAP / 1000,
        sources: new Map([
          [host.name, host],
          [arm.name, arm],
        ]),
        skin: false,
      },
    );
    const surface = result.surfaces.find(({ name }) => name === node.band);
    const crest = {
      position: null as AutoMovieVector3Tuple | null,
      brackets: 0,
    };
    if (surface?.domain !== undefined) {
      const [from, to] = surface.domain;
      const sign = side === "left" ? 1 : -1;
      for (let i = 0; i < node.count; ++i) {
        const phase = ((surface.period ?? 2 * Math.PI) * i) / node.count;
        const level = (s: number): number =>
          sign * surface.jet(s, phase).p[2] - lateral;
        // Resolve within a tenth of the campaign's 0.01 mm overlap tolerance.
        const at = AutoMovieIllinois.root(level, from, to, 0.001, 32);
        if (at === null || Math.abs(level(at)) > 0.001) continue;
        const point = surface.jet(at, phase).p;
        ++crest.brackets;
        if (crest.position === null || point[1] > crest.position[1])
          crest.position = [...point];
      }
    }
    return {
      ...crest,
      diagnostics: result.diagnostics,
      milliseconds: performance.now() - began,
    };
  }
}
