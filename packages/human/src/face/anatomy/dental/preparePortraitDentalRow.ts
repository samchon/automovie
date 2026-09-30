import { mergeAutoMovieMeshes } from "@automovie/engine";
import { IAutoMovieMesh } from "@automovie/interface";

import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import { assertPortraitDentalCrown } from "./assertPortraitDentalCrown";
import { createPortraitDentalArc } from "./createPortraitDentalArc";
import { preparePortraitDentalCrown } from "./preparePortraitDentalCrown";
import { separatePortraitDentalCrowns } from "./separatePortraitDentalCrowns";
import { IPortraitDentalRow } from "./structures/IPortraitDentalRow";

/**
 * Compose one resident enamel group before attaching it to the face. The local
 * guide is an ellipse: x=a*sin(theta), z=b*(cos(theta)-1), y=0. Its cumulative
 * arc length establishes nominal crown centres. The same tangent rotates each crown's
 * positions and normals, while all cervical ends share the group's Y=0 plane.
 * Neither a lip landmark's height nor an individual ray hit can tilt one tooth.
 * Nominal arc spacing cannot keep rotated proximal faces apart, so the intact
 * crowns are then shifted along group X until they no longer overlap.
 * Returns the merged owned mesh and one directed cervical cycle per input
 * crown in that crown's order, expressed in merged native vertex identities.
 *
 * @evidence contracts/common.md#principled-implementation Crowns are placed by cumulative arc length along an ellipse guide, each rotated by the arc tangent (an orthonormal rotation of positions and normals, so enamel width is preserved), and then shifted along X by the engine's sequence separation until the complete proximal surfaces clear. The merge preserves input order, so the per-crown cervical cycles are carried by an offset of native vertex identities and never recovered by position. The premises are positive semiaxes, a nonnegative gap and at least one crown.
 * @evidence contracts/modeling.md#part-identity-and-grouping The declaration is the arch group: it composes the crowns, owns their order, spacing, rotation and separation and copies no crown's shape.
 * @evidence contracts/modeling.md#emitted-geometry The population is the crowns' own meshes, one loft per crown, so the count grows with the number of crowns the caller authors and each crown's size is fixed by its constructor.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the group's local frame (+X across the arch, +Y towards the gingiva, +Z towards the lip); the separation solves in metres and converts back at one named step in `separatePortraitDentalCrowns`.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration consumes the row's dimensions and defines no channel of its own.
 * @evidence contracts/modeling.md#shared-boundaries Neighbouring crowns meet at one boundary definition, the contact gap: every adjacent pair is separated from complete surfaces so they touch at most, verified by the sequence separation's clearance measurement along X, and the nominal ellipse is only a guide. The join is measured along one axis, so a crown pair whose rotated proximal faces overlap in a direction the X measurement does not see is a limit of the engine measurement.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function beyond the row type's named dimensions.
 */
export function preparePortraitDentalRow(input: IPortraitDentalRow) {
  const shape = structuredClone(input);
  if (
    ![shape.halfWidth, shape.depth, shape.gap].every(Number.isFinite) ||
    shape.halfWidth <= 0 ||
    shape.depth <= 0 ||
    shape.gap < 0 ||
    shape.crowns.length === 0
  )
    throw new Error(
      "A dental row needs positive arch dimensions, a nonnegative gap and crowns.",
    );
  shape.crowns.forEach(assertPortraitDentalCrown);
  if (
    shape.contactGap !== undefined &&
    (!Number.isFinite(shape.contactGap) || shape.contactGap < 0)
  )
    throw new Error(
      "Dental surface contact gap must be finite and nonnegative.",
    );
  const crowns: IAutoMovieMesh[] = [];
  const cervical: number[][] = [];
  let vertices = 0;
  const length =
    shape.crowns.reduce((sum, crown) => sum + crown.width, 0) +
    shape.gap * (shape.crowns.length - 1);
  const guide = Array.from({ length: 33 }, (_v, i) => {
    const theta = Math.PI * (i / 32 - 0.5);
    return p(
      shape.halfWidth * Math.sin(theta),
      0,
      shape.depth * (Math.cos(theta) - 1),
    );
  });
  const arc = createPortraitDentalArc(guide, length);
  let cursor = arc.center - length / 2;
  for (let tooth = 0; tooth < shape.crowns.length; tooth++) {
    const profile = shape.crowns[tooth];
    const distance = cursor + profile.width / 2;
    const { position, tangent } = arc.sample(distance);
    // The proximal side toward the common arch midpoint is mesial. Resolve it
    // from arrangement, including unequal crown widths, instead of a tooth ID.
    const crown = preparePortraitDentalCrown(
      profile,
      distance <= arc.center ? 1 : -1,
    );
    const { mesh } = crown;
    // mergeAutoMovieMeshes preserves input order and offsets all native indices
    // by preceding vertex counts. The same documented correspondence carries
    // the crown-owned cycle; no position search recovers attachment identity.
    cervical.push(crown.cervical.map((vertex) => vertices + vertex));
    vertices += mesh.positions.length / 3;
    crowns.push(mesh);
    cursor += profile.width + shape.gap;
    // The tangent is the crown's local X axis. Its perpendicular in XZ is
    // the anterior normal; this orthonormal rotation preserves enamel width.
    for (let i = 0; i < mesh.positions.length; i += 3) {
      const x = mesh.positions[i],
        z = mesh.positions[i + 2];
      mesh.positions[i] = position.x + tangent.x * x - tangent.z * z;
      mesh.positions[i + 1] -= profile.height / 2;
      mesh.positions[i + 2] = position.z + tangent.z * x + tangent.x * z;
      const nx = mesh.normals![i],
        nz = mesh.normals![i + 2];
      mesh.normals![i] = tangent.x * nx - tangent.z * nz;
      mesh.normals![i + 2] = tangent.z * nx + tangent.x * nz;
    }
  }
  // Arc-distance widths establish nominal centres but cannot account for the
  // rotated three-dimensional proximal faces, so the intact crowns are shifted
  // along group X until no two overlap. The nominal ellipse is a guide, not an
  // exact locus after this always-applied separation.
  const placed = separatePortraitDentalCrowns(crowns, shape.contactGap ?? 0);
  return { mesh: mergeAutoMovieMeshes(placed), cervical };
}
