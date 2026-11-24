import {
  AutoMovieSolidVector as V,
  measureAutoMovieMeshCrossings,
  measureAutoMovieMeshPieces,
} from "@automovie/engine";
import type { AutoMovieHumanTrunkCarrier } from "@automovie/human";
import type {
  IAutoMovieBlendCrossJet,
  IAutoMovieMesh,
  IAutoMovieSolidSurface,
  AutoMovieVector2Tuple as Plane,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

import { FamilyConicMpfbArmscye as Armscye } from "./FamilyConicMpfbArmscye";
import { FamilyConicMpfbContext as Context } from "./FamilyConicMpfbContext";
import type { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";

/** Audit and weld the generated analytic torso extension. */
export namespace FamilyConicMpfbTorsoRail {
  /** Hold every column to its incoming rail and independently read the far end. */
  export function study(input: {
    lines: readonly ReturnType<typeof AutoMovieHumanTrunkCarrier.prepare>[];
    read: (x: number, y: number) => IAutoMovieSolidSurface.IJet | null;
    observe: (
      x: number,
      y: number,
    ) => { position: Point; normal: Point } | null;
    length: number;
    layers: number;
    reference: boolean;
  }) {
    const { lines, read, observe, length, layers, reference } = input;
    const positions: number[] = [];
    const referencePositions: number[] = [];
    const failed: { column: number; layer: number }[] = [];
    let gap: number = 0,
      slope: number = 0,
      second: number = 0,
      farGap: number = 0;
    let minimumProgress: number = Infinity;
    let farNormal: number = 0;
    let sourceDeviation: number = 0;
    for (const [column, line] of lines.entries()) {
      const generated = line.bind(read);
      for (let j: number = 0; j <= layers; ++j) {
        const t: number = j / layers;
        const jet: IAutoMovieBlendCrossJet | null = generated?.(t) ?? null;
        if (jet === null) {
          failed.push({ column, layer: j });
          continue;
        }
        positions.push(...jet.point);
        const uv: Plane = line.address(t)[0];
        const observation = observe(...uv);
        if (reference && observation !== null)
          referencePositions.push(...observation.position);
        if (observation !== null)
          sourceDeviation = Math.max(
            sourceDeviation,
            V.norm(V.sub(jet.point, observation.position)),
          );
        minimumProgress = Math.min(
          minimumProgress,
          V.dot(jet.first, line.expected.first) / (length * length),
        );
        if (j === 0) {
          gap = Math.max(gap, V.norm(V.sub(jet.point, line.expected.point)));
          slope = Math.max(
            slope,
            V.norm(V.sub(jet.first, line.expected.first)),
          );
          second = Math.max(
            second,
            V.norm(V.sub(jet.second, line.expected.second)),
          );
        }
        if (j === layers) {
          const end: IAutoMovieSolidSurface.IJet = read(...uv)!;
          farGap = Math.max(farGap, V.norm(V.sub(end.p, jet.point)));
          const predicted: Point | null = V.unit(V.cross(end.u, end.v));
          const observed: Point | null = observation?.normal ?? null;
          if (predicted !== null && observed !== null)
            farNormal = Math.max(
              farNormal,
              Math.atan2(
                V.norm(V.cross(predicted, observed)),
                V.dot(predicted, observed),
              ),
            );
        }
      }
    }
    const complete: boolean = failed.length === 0;
    const indices: number[] = [];
    if (complete)
      for (let i: number = 0; i < lines.length; ++i)
        for (let j: number = 0; j < layers; ++j) {
          const a: number = i * (layers + 1) + j;
          const b: number = ((i + 1) % lines.length) * (layers + 1) + j;
          indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
    const mesh: IAutoMovieMesh = {
      positions: positions.map((mm): number => mm / 1_000),
      indices,
      normals: null,
      uvs: null,
      skin: null,
    };
    return {
      length,
      layers,
      complete,
      failed,
      gap,
      slope,
      second,
      farGap,
      farNormal,
      sourceDeviation,
      minimumProgress,
      crossings: complete
        ? measureAutoMovieMeshCrossings(mesh, mesh, { allPairs: true }).length
        : null,
      mesh: complete ? { positions, indices } : undefined,
      control:
        complete && referencePositions.length === positions.length
          ? { positions: referencePositions, indices }
          : undefined,
    };
  }

  /** The generated strip consumes the accepted torso rim as shared indices. */
  export function weld(input: {
    base: { positions: number[]; indices: number[] };
    extension: { positions: number[]; indices: number[] };
    baseRim: readonly number[];
    layers: number;
  }) {
    const { base, extension, baseRim, layers } = input;
    const stride: number = layers + 1;
    if (extension.positions.length !== 3 * baseRim.length * stride)
      throw new Error(
        "The generated torso rail has a different sampling order",
      );
    const positions: number[] = [...base.positions];
    const point = (mesh: readonly number[], vertex: number): Point => [
      mesh[3 * vertex]!,
      mesh[3 * vertex + 1]!,
      mesh[3 * vertex + 2]!,
    ];
    let roundoff: number = 0;
    const offsets: number[] = Array.from(
      { length: extension.positions.length / 3 },
      (_, i): number => {
        const p: Point = point(extension.positions, i);
        if (i % stride === 0) {
          const index: number = baseRim[i / stride]!;
          roundoff = Math.max(
            roundoff,
            V.norm(V.sub(p, point(base.positions, index))),
          );
          return index;
        }
        const index: number = positions.length / 3;
        positions.push(...p);
        return index;
      },
    );
    if (roundoff > 0.01)
      throw new Error(
        "The generated torso rail leaves the protected physical outlet",
      );
    const faces: number[] = extension.indices.map((i): number => offsets[i]!);
    const original: IAutoMovieMesh = {
      positions: positions.map((mm): number => mm / 1_000),
      indices: base.indices,
      normals: null,
      skin: null,
      uvs: null,
    };
    const crossings: number = measureAutoMovieMeshCrossings(
      original,
      { ...original, indices: faces },
      { allPairs: true },
    ).length;
    const indices: number[] = [...base.indices, ...faces];
    return {
      mesh: { positions, indices },
      outerRim: baseRim.map((_, i): number => offsets[i * stride + layers]!),
      roundoff,
      crossings,
      topology: measureAutoMovieMeshPieces({ ...original, indices }),
    };
  }

  /** Reuse the comparison's public context only beyond the generated outer rim. */
  export function comparison(
    source: Mpfb.IGeometry,
    attached: ReturnType<typeof weld>,
  ) {
    const anatomy: Armscye.IMeasurement = Armscye.measure(source);
    const { origin, normal } = Armscye.divider(anatomy);
    const whole: Context.IAttachment = Context.attach(
      attached.mesh,
      attached.outerRim,
      source.body,
      origin,
      normal,
      anatomy.elbow,
    );
    const face: number = whole.owners.analyticTriangles * 3;
    const first: IAutoMovieMesh = {
      positions: whole.mesh.positions.map((mm): number => mm / 1_000),
      indices: whole.mesh.indices.slice(0, face),
      normals: null,
      skin: null,
      uvs: null,
    };
    const crossings: number = measureAutoMovieMeshCrossings(
      first,
      { ...first, indices: whole.mesh.indices.slice(face) },
      { allPairs: true },
    ).length;
    return { ...whole, crossings };
  }
}
