import {
  AutoMovieIllinois,
  measureAutoMovieMeshCrossings,
  measureAutoMovieMeshPieces,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPort,
  IAutoMovieLoftViewFullSource,
  IAutoMovieMesh,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanTrunkRows } from "../generation/AutoMovieHumanTrunkRows";

type Port = {
  host: IAutoMovieViewPart;
  arm: IAutoMovieViewPart;
  wall: IAutoMovieLoftViewFullSource.IReader;
  centre: [number, number];
  centreX: (station: number) => number;
  height: number;
  radius: number;
  phaseExtent: number;
  side: "left" | "right";
  start: number;
  outlet: number;
  rows: number;
  meridian?: IAutoMovieConstructionPort.IMeridian;
};

/** Draw the stock construction port on the same native opening and rail. */
export function inspectHumanArmscyePort(
  input: Port & { guide: AutoMovieVector3Tuple[] },
) {
  const { host, arm, guide, rows } = input;
  const node = portNode(input);
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
      report: { pieces, crossings: crossings.length, crossingWitnesses: crossings },
    },
  };
}

/** The same original port supports unskinned measurements and source-tree replay. */
export namespace inspectHumanArmscyePort {
  /** Declare the same exact opening for another source tree. */
  export function definition(input: Port): IAutoMovieConstructionPort {
    return portNode(input);
  }

  /** Observe the upper skin on the actual lateral acromial plane before tessellation. */
  export function crest(input: Port, lateral: number) {
    const { host, arm, side } = input;
    const node = portNode(input);
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
    const crest = { position: null as AutoMovieVector3Tuple | null, brackets: 0 };
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

/** Convert the world conic to the stock operator's host-cover representation. */
function portNode(input: Port): IAutoMovieConstructionPort {
  const {
    host,
    arm,
    wall,
    centre,
    centreX,
    height,
    radius,
    phaseExtent,
    side,
    start,
    outlet,
    rows,
    meridian,
  } = input;
  const sense = side === "left" ? -1 : 1;
  const minimum = side === "left" ? 0 : Math.PI;
  const maximum = minimum + Math.PI;
  const count = arm.samples;
  const shape = Array.from({ length: count }, (_, i) => {
    const clock = (2 * Math.PI * i) / count;
    const dy = height * Math.cos(clock);
    const dp = sense * phaseExtent * Math.sin(clock);
    const limit = Math.min(
      height / Math.abs(dy),
      (dp < 0 ? centre[1] - minimum : maximum - centre[1]) / Math.abs(dp),
    );
    const level = (scale: number): number => {
      const y = centre[0] + scale * dy;
      const x = wall.point(y, centre[1] + scale * dp)[0];
      return (
        ((y - centre[0]) / height) ** 2 + ((x - centreX(y)) / radius) ** 2 - 1
      );
    };
    if (Math.abs(level(limit)) < 1e-10) return limit;
    const scale = AutoMovieIllinois.root(level, 0, limit, 1e-9, 64);
    if (scale === null || Math.abs(level(scale)) > 1e-7)
      throw new Error(
        `The stock port chart has no bounded opening at clock ${clock}`,
      );
    return scale;
  });
  return {
    type: "port",
    name: `port.${arm.name}`,
    host: { type: "source", name: host.name, source: host.name },
    part: { type: "source", name: arm.name, source: arm.name },
    hostFace: host.name,
    partFace: arm.name,
    band: `blend.${arm.name}.${host.name}`,
    loop: {
      centre: [centre[0] / 1000, centre[1]],
      semi: [height / 1000, phaseExtent],
      sense,
      shape,
    },
    partEnd: "bottom",
    rail: (outlet - start) / 1000,
    correspondence: "length",
    ribbons: "column",
    count,
    rows,
    ...(meridian === undefined ? {} : { meridian }),
  };
}
