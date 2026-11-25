import {
  AutoMovieConstructionContinuation,
  AutoMovieConstructionRing,
  AutoMovieSolidBody,
  AutoMovieSolidChain,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieLoftChain,
  IAutoMovieSolidBlendChain,
  IAutoMovieSolidBody,
  IAutoMovieSolidJoin,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { ConstructionShapes } from "./ConstructionShapes";

/**
 * The smallest merge the body-level clip functions need: a post (radius 0.015
 * m, 0.08 m long) merged once onto a beam (radius 0.03 m), realized through the
 * public construction function at a coarse chord without its skin, then
 * re-assembled as an untrimmed body with the join and blend records of that
 * merge.
 */
export namespace ConstructionBlendFixture {
  /** The fixture's records. */
  export interface IFixture {
    /** The beam faces first, then the post, untrimmed. */
    body: IAutoMovieSolidBody.IBody;

    /** The accepted join of the post onto the beam. */
    join: IAutoMovieSolidJoin.IJoin;

    /** The blend published for that join. */
    blend: IAutoMovieSolidBlendChain.IBlend;

    /** The body face of each host atlas face. */
    index: number[];

    /** The blend's number of columns. */
    count: number;

    /** The blend face's surface, as the merge appends it. */
    surface: IAutoMovieSolidSurface;
  }

  /** The beam's radius, metres. */
  export const BEAM: number = 0.03;

  /** The post's radius, metres. */
  export const POST: number = 0.015;

  /**
   * Build the fixture once per call; it shares nothing with another call.
   *
   * @param across Whether the beam is two beams of 0.1 m continued end to end
   *   with the post standing on their junction, so that the rail runs over both
   *   beams and crosses from one to the other twice. Otherwise one beam of 0.2
   *   m holds the whole rail.
   */
  export function create(across: boolean = false): IFixture {
    const frame = {
      origin: { x: -0.1, y: 0, z: 0 },
      u: { x: 0, y: 0, z: 1 },
      v: { x: 0, y: 1, z: 0 },
    };
    const host: IAutoMovieConstructionNode = across
      ? {
          type: "continue",
          name: "join.beam",
          host: ConstructionShapes.cylinder("beam.left", frame, BEAM, 0.1),
          hostFace: "beam.left",
          hostEnd: "top",
          part: ConstructionShapes.cylinder(
            "beam.right",
            { ...frame, origin: { x: 0, y: 0, z: 0 } },
            BEAM,
            0.1,
          ),
          partFace: "beam.right",
          partEnd: "bottom",
        }
      : ConstructionShapes.cylinder("beam", frame, BEAM, 0.2);
    const part = ConstructionShapes.cylinder(
      "post",
      {
        origin: { x: 0, y: 0, z: 0 },
        u: { x: 0, y: 1, z: 0 },
        v: { x: 1, y: 0, z: 0 },
      },
      POST,
      0.08,
    );
    const width: number = 0.006;
    const real: IAutoMovieConstructionRealization.IWithoutSkin =
      realizeAutoMovieConstruction(
        {
          name: "made",
          root: ConstructionShapes.join(
            "merge",
            "blend.post",
            host,
            part,
            {
              partFace: "post",
              hostFace: across ? "beam.left" : "beam",
              part: [BEAM + 0.001, Math.PI / 2],
              host: [across ? 0.1 - 0.001 : 0.1 + POST, 0.01],
            },
            {
              part: { type: "chord", value: width },
              host: { type: "chord", value: width },
            },
          ),
        },
        { chord: 1e-2, skin: false },
      );
    const joined: IAutoMovieConstructionRealization.IJoin = real.joins[0]!;
    const face = (
      chain: IAutoMovieLoftChain,
      surface: IAutoMovieSolidSurface,
    ): IAutoMovieSolidBody.IFaceInput => ({
      surface,
      stations: chain.layers.map(
        (layer: IAutoMovieLoftChain.ILayer): number => layer.y,
      ),
      phases: Array.from(
        { length: chain.samples },
        (_: unknown, k: number): number => (2 * Math.PI * k) / chain.samples,
      ),
    });
    const faces: IAutoMovieSolidBody.IFaceInput[] = real.chains.map(
      (chain: IAutoMovieLoftChain, k: number): IAutoMovieSolidBody.IFaceInput =>
        face(chain, real.surfaces[k]!),
    );
    const body: IAutoMovieSolidBody.IBody = AutoMovieSolidBody.create(
      "made",
      faces,
    );

    // The continuation's shared ring: one vertex ring on the beams' junction,
    // each beam's boundary cycle through it.
    if (across) {
      const first: IAutoMovieLoftChain = real.chains[0]!;
      AutoMovieConstructionRing.create(body, {
        host: 0,
        hostStation: first.layers[first.layers.length - 1]!.y,
        hostKind: "end",
        part: 1,
        partStation: real.chains[1]!.layers[0]!.y,
        partKind: "start",
        count: first.samples,
        sign: AutoMovieConstructionContinuation.sign("top", "bottom"),
      });
    }
    const blendSurface: IAutoMovieSolidSurface | null =
      AutoMovieSolidChain.surface(joined.blend.chain);
    if (blendSurface === null)
      throw new Error("the fixture blend carries no jets");
    return {
      body,
      join: joined.join,
      blend: joined.blend,
      index: AutoMovieSolidBody.atlas(body, faces.length - 1).index,
      count: joined.blend.host.chart.length,
      surface: blendSurface,
    };
  }
}
