import {
  inspectAutoMovieMeshTopology,
  markAutoMovieConstructionCurves,
  measureAutoMovieMeshPieces,
  realizeAutoMovieConstruction,
  sampleAutoMovieConstructionCurves,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionRealization,
  IAutoMovieHumanConicLoft,
  IAutoMovieMesh,
  IAutoMovieMeshPiece,
  IAutoMovieMeshTopology,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "../generation/conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../generation/conic/AutoMovieHumanConicSection";
import { buildHumanSurfaceCapture } from "./buildHumanSurfaceCapture";

/**
 * Draw a closed upper-arm envelope with a straight axis and circular section.
 * ANSUR II (NATICK/TR-15/007) supplies the women's mean acromion-radiale and
 * flexed biceps circumference, in millimetres. Circular sections place that
 * circumference on radius G / (2π). A geometric cap starts one radius from each
 * end.
 */
export function buildHumanUpperArmStudy(
  subject: string,
): ReturnType<typeof buildHumanSurfaceCapture> {
  const length: number = 311.2;
  const radius: number = 305.6 / (2 * Math.PI);
  const knots: number[] = [radius, length / 2, length - radius];
  const family: IAutoMovieHumanConicLoft.IFamily = {
    name: "upperarm",
    centres: [
      [0, 0, 0],
      [0, length, 0],
    ],
    halves: [],
    up: [1, 0, 0],
    layout: AutoMovieHumanConicSection.limb(0),
    knots,
    values: [
      radius,
      0,
      0,
      radius,
      -radius,
      0,
      0,
      -radius,
      // The quarter-circle midpoint is at r/√2 on both axes, or √2−1 of
      // the line from the chord midpoint to the tangent intersection.
      ...new Array<number>(4).fill(Math.SQRT2 - 1),
    ].map((value: number): number[] => knots.map((): number => value)),
    tips: [
      { from: radius, tip: 0 },
      { from: length - radius, tip: length },
    ],
  };
  const part: IAutoMovieViewPart = AutoMovieHumanConicLoft.part(family, knots);
  const realized: IAutoMovieConstructionRealization.IRealization =
    realizeAutoMovieConstruction(
      {
        name: part.name,
        root: { type: "source", name: part.name, source: part.name },
      },
      // A 1 mm chord keeps tessellation under about one per cent of the
      // study's diameter. It controls sampling of this analytic surface.
      { chord: 0.001, sources: new Map([[part.name, part]]) },
    );
  if (realized.diagnostics.length !== 0)
    throw new Error(
      `${subject}: ${realized.diagnostics.map(({ node, detail }) => `${node}: ${detail}`).join("\n")}`,
    );
  const mesh: IAutoMovieMesh = {
    positions: realized.mesh.positions,
    indices: realized.mesh.indices,
    normals: null,
    uvs: null,
    skin: null,
  };
  const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(mesh);
  const pieces: IAutoMovieMeshPiece[] = measureAutoMovieMeshPieces(mesh);
  if (
    !topology.watertight ||
    topology.nonFinite !== 0 ||
    topology.volume <= 0 ||
    pieces.length !== 1 ||
    !pieces[0]!.manifold ||
    !pieces[0]!.consistentlyWound ||
    pieces[0]!.genus !== 0
  )
    throw new Error(`${subject}: the upper-arm envelope has no closed skin`);
  return buildHumanSurfaceCapture(
    subject,
    part.name,
    mesh,
    markAutoMovieConstructionCurves(
      sampleAutoMovieConstructionCurves(realized),
      subject,
    ),
  );
}
