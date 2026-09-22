import { Vector3 } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceGroom,
  buildPortraitHairCards,
  resolveHumanFaceGroom,
} from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/**
 * Read metric observations from historical surface-seated guides through their
 * actual resolver and tessellator. The migration CLI supplies a neutral shared
 * model and an explicitly selected historical groom; neither input is mutated.
 * The tessellated paired-row midpoints are the old renderer's centreline, so
 * lengths include Catmull-Rom curvature rather than measuring its control cage.
 * Returned points are metres in the model frame and remain offline observations,
 * never fields of the new numerical document or a runtime resource.
 *
 * Every card has the admitted common segment count and contiguous paired rows.
 * Empty populations stay empty. Nonempty zero-length curves refuse because a
 * direction/length fit cannot interpret them. The tessellator admits at most 64
 * finite millimetre chords before its 0.001 metric conversion. Even the sum's
 * worst finite-coordinate bound, (128*sqrt(3)/1000)*Number.MAX_VALUE, fits a double;
 * the engine's magnitude owner also avoids intermediate square overflow.
 * Shared geometry, contact validity and revision correspondence are premises.
 */
export function sampleHistoricalHair(props: {
  model: IAutoMovieModel;
  groom: IAutoMovieHumanFaceGroom;
}) {
  const shape = resolveHumanFaceGroom(props);
  const parts = buildPortraitHairCards(shape);
  if (parts.length === 0) return [];
  // The inspected tessellator returns portraitPart(mesh); its public annotation
  // is the wider model-part union. No injected producer participates here.
  const mesh = (parts[0].geometry as { type: "mesh"; mesh: IAutoMovieMesh })
    .mesh;
  const rows = shape.segments + 1;
  return props.groom.cards.map((card, index) => {
    const points = Array.from({ length: rows }, (_, row) => {
      const at = (index * rows + row) * 6;
      return [0, 1, 2].map(
        (axis) =>
          (mesh.positions[at + axis] + mesh.positions[at + 3 + axis]) / 2,
      ) as [number, number, number];
    });
    const lengths = [0];
    for (let at = 1; at < points.length; at++)
      lengths.push(
        lengths[at - 1] +
          Vector3.length(
            Vector3.subtract(
              Vector3.create(...points[at]),
              Vector3.create(...points[at - 1]),
            ),
          ),
      );
    const length = lengths[lengths.length - 1];
    if (!(length > 0))
      throw new Error(
        "Historical hair needs a finite positive measured length.",
      );
    return {
      points,
      lengths,
      length,
      width: card.width * shape.widthScale,
    };
  });
}
