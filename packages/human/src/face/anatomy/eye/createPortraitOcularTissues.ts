import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { linearInterpolate } from "../../mesh/linearInterpolate";
import { millimetrePoint } from "../../mesh/millimetrePoint";
import { triangulateSurfaceLattice } from "../../mesh/triangulateSurfaceLattice";
import { IPortraitOcularTissueBoundary } from "./structures/IPortraitOcularTissueBoundary";
import type { IPortraitOcularTissueMeshes } from "./structures/IPortraitOcularTissueMeshes";
import { IPortraitOcularTissueShape } from "./structures/IPortraitOcularTissueShape";

/**
 * Own a tissue profile and build both surfaces in one live ocular frame.
 * The medial mound and lateral plica share a patch between the actual lids;
 * neither is a floating sphere with an independently guessed attachment.
 *
 * The profile is copied and validated once (every dimension finite and
 * nonnegative). Each call then takes one boundary (an ordered aperture in head
 * millimetres, its lid and globe samplers) and returns the medial mound
 * (`corner`, a 32 by 12 lattice, absent when its length is zero) and the lower
 * margin (`lowerMargin`, an 80 by 4 lattice, absent when its width is zero), so
 * their vertex counts are fixed at 429 and 405 whatever the eye. The mound's
 * caruncle and plica envelopes, their positions at 0.42 and 0.82 of the region
 * and the 0.02 mm base relief are procedural shape constants and not
 * population statistics. A non-finite or negative dimension, an unordered
 * aperture, a mound longer than half the aperture, non-finite or unordered lid
 * samples and a non-finite globe height throw.
 *
 * @evidence contracts/common.md#principled-implementation Copied nonnegative tissue dimensions construct fixed native-frame lattices between actual lid/globe samplers.
 * @evidence contracts/common.md#clear-and-simple-design One live boundary supplies both medial mound and lower-margin geometry while final triangle contact stays downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Gaussian centres, 20-micrometre relief and lattice counts are authored conventions; zero requested length/width intentionally omits that surface.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetres, ownership, fixed counts, side orientation and invalid sample behavior.
 * @evidence contracts/performance.md#efficient-algorithms Each call emits at most 429 mound and 405 margin vertices, including the caller's actual lid/globe sampling costs.
 * @evidence contracts/performance.md#reuse-equivalent-work A captured profile is reused across calls while each call reads its current live boundary and returns independent meshes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains only its copied scalar profile; returned meshes own arrays and no boundary or task is retained.
 */
export const createPortraitOcularTissues: (
  input: IPortraitOcularTissueShape,
) => (
  boundary: IPortraitOcularTissueBoundary,
) => IPortraitOcularTissueMeshes = (
  input: IPortraitOcularTissueShape,
): ((
  boundary: IPortraitOcularTissueBoundary,
) => IPortraitOcularTissueMeshes) => {
  const shape: {
    cornerLength: number;
    caruncleProjection: number;
    plicaProjection: number;
    lowerMarginWidth: number;
    lowerMarginLift: number;
  } = { ...input };
  if (
    Object.values(shape).some(
      (value: number): boolean => !Number.isFinite(value) || value < 0,
    )
  )
    throw new Error("Ocular tissue dimensions must be finite and nonnegative.");
  return (
    boundary: IPortraitOcularTissueBoundary,
  ): { corner: IAutoMovieMesh | null; lowerMargin: IAutoMovieMesh | null } => {
    const span: number = boundary.maximumX - boundary.minimumX;
    if (
      ![boundary.minimumX, boundary.maximumX, span].every(Number.isFinite) ||
      span <= 0 ||
      shape.cornerLength > span / 2
    )
      throw new Error(
        "Ocular tissue needs an ordered aperture and a medial half-width fit.",
      );
    const section: (x: number) => {
      lower: IAutoMovieVector3;
      upper: IAutoMovieVector3;
    } = (x: number): { lower: IAutoMovieVector3; upper: IAutoMovieVector3 } => {
      const lower: IAutoMovieVector3 = boundary.lower(x),
        upper: IAutoMovieVector3 = boundary.upper(x);
      if (
        ![lower.x, lower.y, lower.z, upper.x, upper.y, upper.z].every(
          Number.isFinite,
        ) ||
        upper.y < lower.y
      )
        throw new Error("Ocular tissue requires finite, ordered lid samples.");
      return { lower, upper };
    };
    const globe: (x: number, y: number) => number = (
      x: number,
      y: number,
    ): number => {
      const z: number = boundary.globe(x, y);
      if (!Number.isFinite(z))
        throw new Error("Ocular tissue requires a finite globe surface.");
      return z;
    };
    const corner: IAutoMovieMesh | null =
      shape.cornerLength === 0
        ? null
        : triangulateSurfaceLattice(
            (u: number, v: number): IAutoMovieVector3 => {
              // Both meshes retain increasing X, hence outward (+Z) winding. The
              // anatomical side changes distance from the medial corner, not winding.
              const x: number =
                boundary.side === "left"
                  ? boundary.minimumX + shape.cornerLength * u
                  : boundary.maximumX - shape.cornerLength * (1 - u);
              const distance: number = boundary.side === "left" ? u : 1 - u;
              const {
                lower,
                upper,
              }: { lower: IAutoMovieVector3; upper: IAutoMovieVector3 } =
                section(x);
              const y: number = linearInterpolate(lower.y, upper.y, v);
              const across: number = Math.sin(Math.PI * v) ** 2;
              const along: number = Math.sin(Math.PI * distance) ** 2;
              // The caruncle occupies the medial body; the narrower plica crest sits
              // laterally at 82% of the same region. Their envelopes vanish at the lids
              // and at the scleral join. These fractions define this procedural shape,
              // not population statistics. A zero projection retains a flat tissue mask.
              const caruncle: number = Math.exp(
                -(((distance - 0.42) / 0.26) ** 2),
              );
              const plica: number = Math.exp(
                -(((distance - 0.82) / 0.08) ** 2),
              );
              const rim: number = linearInterpolate(lower.z, upper.z, v);
              const z: number =
                linearInterpolate(rim, globe(x, y), across) +
                across *
                  along *
                  (0.02 +
                    shape.caruncleProjection * caruncle +
                    shape.plicaProjection * plica);
              return millimetrePoint(x, y, z);
            },
            32,
            12,
          );
    const lowerMargin: IAutoMovieMesh | null =
      shape.lowerMarginWidth === 0
        ? null
        : triangulateSurfaceLattice(
            (u: number, v: number): IAutoMovieVector3 => {
              const x: number = linearInterpolate(
                boundary.minimumX,
                boundary.maximumX,
                u,
              );
              const {
                lower,
                upper,
              }: { lower: IAutoMovieVector3; upper: IAutoMovieVector3 } =
                section(x);
              const fade: number = Math.sin(Math.PI * u);
              // Never span more than half the local aperture. This also closes the
              // strip at both shared canthi and keeps narrow replacement eyes valid.
              const width: number = Math.min(
                shape.lowerMarginWidth * fade,
                (upper.y - lower.y) / 2,
              );
              const y: number = lower.y + width * v;
              const z: number =
                linearInterpolate(lower.z, globe(x, y), v) +
                shape.lowerMarginLift * fade * Math.sin(Math.PI * v);
              return millimetrePoint(x, y, z);
            },
            80,
            4,
          );
    return { corner, lowerMargin };
  };
};
