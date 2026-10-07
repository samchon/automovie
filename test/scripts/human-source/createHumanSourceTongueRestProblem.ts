import { createHumanFaceOralLiningField } from "@automovie/human/face/anatomy/oral/createHumanFaceOralLiningField";
import { readHumanFaceOralCrowns } from "@automovie/human/face/anatomy/oral/readHumanFaceOralCrowns";
import { resolveHumanFaceOralArchFrame } from "@automovie/human/face/anatomy/oral/resolveHumanFaceOralArchFrame";
import { resolveHumanFaceOralLiningDimensions } from "@automovie/human/face/anatomy/oral/resolveHumanFaceOralLiningDimensions";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOral } from "@automovie/human/face/structures/IAutoMovieHumanFaceOral";

import { createHumanSourceCrownSolids } from "./createHumanSourceCrownSolids.ts";
import type { IHumanSourceTongueRestProblem } from "./structures/IHumanSourceTongueRestProblem.ts";

/**
 * Freeze tongue rest against the post-occlusion dental source and normal
 * lining field. The caller's explicit shared authoring convention supplies
 * lining dimensions; omitted dimensions follow the normal dimension owner.
 * No clinical mean or proxy tongue volume is used as a replacement shape.
 * The posterior quarter root is the existing source-authoring convention,
 * not a measured hyoid, frenulum or vallecula boundary.
 */
export function createHumanSourceTongueRestProblem(
  face: IAutoMovieHumanFaceBasis,
  oral: IAutoMovieHumanFaceOral,
): IHumanSourceTongueRestProblem {
  const dental = face.surfaces.find(
      (surface) => surface.id === "Human.teeth_base",
    ),
    tongue = face.surfaces.find((surface) => surface.id === "Human.tongue01");
  if (dental === undefined || tongue === undefined)
    throw new Error(
      "Source tongue rest requires its existing dental and tongue geometry.",
    );
  const crowns = readHumanFaceOralCrowns(face);
  const upper = resolveHumanFaceOralArchFrame(
    crowns.filter((crown) => !crown.mandibular),
    dental.positions,
    false,
  );
  const lower = resolveHumanFaceOralArchFrame(
    crowns.filter((crown) => crown.mandibular),
    dental.positions,
    true,
  );
  const coordinates = (direction: readonly number[]): number[] =>
    Array.from({ length: tongue.positions.length / 3 }, (_, vertex) =>
      direction.reduce(
        (sum, value, axis) =>
          sum +
          value * (tongue.positions[3 * vertex + axis] - upper.origin[axis]),
        0,
      ),
    );
  const coordinateU = coordinates(upper.lateral),
    coordinateV = coordinates(upper.forward),
    coordinateA = coordinates(upper.apical);
  const minimumV = Math.min(...coordinateV),
    maximumV = Math.max(...coordinateV);
  if (!(maximumV > minimumV))
    throw new Error("Source tongue has no anterior-posterior body extent.");
  return {
    face,
    positions: [...tongue.positions],
    indices: [...tongue.indices],
    upper,
    lower,
    palate: createHumanFaceOralLiningField(
      upper,
      resolveHumanFaceOralLiningDimensions(oral, false),
    ),
    floor: createHumanFaceOralLiningField(
      lower,
      resolveHumanFaceOralLiningDimensions(oral, true),
    ),
    crowns: createHumanSourceCrownSolids(face, dental.positions),
    coordinateU,
    coordinateV,
    coordinateA,
    minimumV,
    maximumV,
    rootEndV: minimumV + 0.25 * (maximumV - minimumV),
    qualification:
      "Existing licensed tongue proxy in the post-occlusion arch frame; posterior-quarter root and lining geometry are authored conventions. Clinical tissue extent, volume boundary and hyoid attachment remain unknown.",
  };
}
