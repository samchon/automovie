import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_NECK_COLUMN } from "./AUTOMOVIE_HUMAN_NECK_COLUMN";
import { IAutoMovieHumanRingShape } from "./IAutoMovieHumanRingShape";

/**
 * Plan a neck cut independently of the unchanged circumference-fit plane.
 *
 * The neck base's control hull and the complete column ellipse's clearance
 * from the base plane bound the lower end of the available tube. The cut
 * bisects the interval from that bound to the fit plane. Equal support
 * distances bisect its remaining halves. These are geometric partitions of
 * shared construction, not new anatomical measurements.
 *
 * The upper-neck guide bisects the anterior column generator's interval from
 * the fit plane to its intersection with the mandibular plane. It is a named
 * construction guide, not a measured hyoid or cervicomental landmark. Unlike a
 * menton-height projection, it does not require the chin to lie above C7 in
 * world Y. No identity, age branch or anatomical offset is used.
 *
 * Cervicale height remains the existing circumference proxy. This neither
 * moves it nor claims infrathyroid registration. The head owns that plane
 * above the cut and fits it on its own named free section.
 *
 * @param skeleton Shared rest skeleton, model millimetres
 * @param base Shared neck-base definition in its neck-side orientation
 * @returns Cut, equal collar spacing and the separate physical fit plane
 * @throws For a base leaving no simple tube below the fit plane
 */
export function planAutoMovieHumanNeckCut(
  skeleton: IAutoMovieHumanSkeleton,
  base: IAutoMovieHumanRingShape,
): {
  origin: IAutoMovieVector3;
  axis: IAutoMovieVector3;
  cervical: IAutoMovieVector3;
  cervicalCentre: IAutoMovieVector3;
  support: number;
  fit: {origin: IAutoMovieVector3; normal: IAutoMovieVector3; owner: "head" | "neck"};
} {
  const joint: (bone: string) => IAutoMovieVector3 = (bone: string): IAutoMovieVector3 => skeleton.joints.find(
    (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
  )!.position;
  const lower: IAutoMovieVector3 = joint("neck");
  const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(joint("head"), [lower, -1]),
  );
  const front: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 1), [axis, -axis.z]),
  );
  const across: IAutoMovieVector3 = AutoMovieHumanVector.cross(axis, front);
  const mean: number = AutoMovieHumanVector.distance(skeleton.landmarks.cervicale.position, lower);
  const radius: number = AUTOMOVIE_HUMAN_NECK_COLUMN.front * mean;
  const normal: IAutoMovieVector3 = base.frame.normal;
  const q: number = AutoMovieHumanVector.dot(normal, front);
  const lateral: number = AutoMovieHumanVector.dot(normal, across);
  const extent: number = mean * Math.hypot(
    q * (q >= 0 ? AUTOMOVIE_HUMAN_NECK_COLUMN.back : AUTOMOVIE_HUMAN_NECK_COLUMN.front),
    lateral * AUTOMOVIE_HUMAN_NECK_COLUMN.across,
  );
  const clearance: number = (AutoMovieHumanVector.dot(
    AutoMovieHumanVector.offset(base.frame.origin, [lower, -1]), normal,
  ) + extent) / AutoMovieHumanVector.dot(normal, axis);
  const controlBound: number = Math.max(...base.positions.map(
    (p: IAutoMovieVector3): number => AutoMovieHumanVector.dot(
      AutoMovieHumanVector.offset(p, [lower, -1]), axis,
    ),
  ));
  const bound: number = Math.max(clearance, controlBound);
  if (!(bound < 0)) throw new Error("The shared neck base leaves no tube below the circumference-fit plane");
  const a: IAutoMovieVector3 = skeleton.landmarks.right.gonion.position;
  const b: IAutoMovieVector3 = skeleton.landmarks.left.gonion.position;
  const chin: IAutoMovieVector3 = skeleton.landmarks.menton.position;
  const jaw: IAutoMovieVector3 = AutoMovieHumanVector.normalize(AutoMovieHumanVector.cross(
    AutoMovieHumanVector.offset(b, [a, -1]), AutoMovieHumanVector.offset(chin, [a, -1]),
  ));
  const entry: number = AutoMovieHumanVector.dot(
    AutoMovieHumanVector.offset(chin, [lower, -1], [front, -radius]), jaw,
  ) / AutoMovieHumanVector.dot(axis, jaw) / 2;
  if (!(entry > 0)) throw new Error("The anterior neck column has no interval above its fit plane");
  return {
    origin: AutoMovieHumanVector.offset(lower, [axis, bound / 2]), axis,
    cervical: AutoMovieHumanVector.offset(lower, [axis, entry], [front, radius]),
    cervicalCentre: AutoMovieHumanVector.offset(lower, [axis, entry]),
    support: -bound / 4,
    fit: {origin: lower, normal: axis, owner: "head"},
  };
}
