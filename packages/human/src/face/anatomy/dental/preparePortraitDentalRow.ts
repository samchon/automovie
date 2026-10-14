import type { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";
import type { IPortraitDentalArc } from "./structures/IPortraitDentalArc";

import { mergeAutoMovieMeshes } from "@automovie/engine";
import { IAutoMovieMesh, type IAutoMovieVector3 } from "@automovie/interface";

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
 * @evidence contracts/common.md#principled-implementation Planar ellipse arc stations place each crown by a shared tangent frame; actual full-surface ordered separation then shifts intact crowns before native merge.
 * @evidence contracts/common.md#clear-and-simple-design The row shares canonical arc/crown/separation owners and carries each crown's directed cervical cycle through exact merge vertex offsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nominal arc spacing is not nonpenetration and the separated row is not an exact ellipse locus; no tooth-ID offset or position search replaces actual surface clearance.
 * @evidence contracts/common.md#meaningful-documentation The prose states local millimetre guide, common gingival plane, normals, separation and input-order cervical correspondence.
 * @evidence contracts/performance.md#efficient-algorithms Crown emission/placement/merge scan total mesh size; M crowns induce O(M squared) ordered pair considerations and projected overlap work for pairs lacking an axial separation proof.
 * @evidence contracts/performance.md#reuse-equivalent-work One compiled arc serves all crown centres/tangents, each crown's own cycle is offset during its same placement pass, and surface separation uses the shared engine owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned merged mesh and cervical arrays are owned; copied profile, individual crown meshes and guide/separation temporaries expire without global retention or resources.
 */
export function preparePortraitDentalRow(input: IPortraitDentalRow): { mesh: IAutoMovieMesh; cervical: number[][]; }  {
  const shape: IPortraitDentalRow = structuredClone(input);
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
  let vertices: number = 0;
  const length: number =
    shape.crowns.reduce((sum: number, crown: IPortraitDentalCrown): number  => sum + crown.width, 0) +
    shape.gap * (shape.crowns.length - 1);
  const guide: IAutoMovieVector3[] = Array.from({ length: 33 }, (_v: unknown, i: number): IAutoMovieVector3  => {
    const theta: number = Math.PI * (i / 32 - 0.5);
    return p(
      shape.halfWidth * Math.sin(theta),
      0,
      shape.depth * (Math.cos(theta) - 1),
    );
  });
  const arc: IPortraitDentalArc = createPortraitDentalArc(guide, length);
  let cursor: number = arc.center - length / 2;
  for (let tooth: number = 0; tooth < shape.crowns.length; tooth++) {
    const profile: IPortraitDentalCrown = shape.crowns[tooth];
    const distance: number = cursor + profile.width / 2;
    const { position, tangent }: { position: IAutoMovieVector3; tangent: IAutoMovieVector3; } = arc.sample(distance);
    // The proximal side toward the common arch midpoint is mesial. Resolve it
    // from arrangement, including unequal crown widths, instead of a tooth ID.
    const crown: { mesh: IAutoMovieMesh; cervical: number[]; } = preparePortraitDentalCrown(
      profile,
      distance <= arc.center ? 1 : -1,
    );
    const { mesh }: { mesh: IAutoMovieMesh; cervical: number[]; } = crown;
    // mergeAutoMovieMeshes preserves input order and offsets all native indices
    // by preceding vertex counts. The same documented correspondence carries
    // the crown-owned cycle; no position search recovers attachment identity.
    cervical.push(crown.cervical.map((vertex: number): number  => vertices + vertex));
    vertices += mesh.positions.length / 3;
    crowns.push(mesh);
    cursor += profile.width + shape.gap;
    // The tangent is the crown's local X axis. Its perpendicular in XZ is
    // the anterior normal; this orthonormal rotation preserves enamel width.
    for (let i: number = 0; i < mesh.positions.length; i += 3) {
      const x: number = mesh.positions[i],
        z: number = mesh.positions[i + 2];
      mesh.positions[i] = position.x + tangent.x * x - tangent.z * z;
      mesh.positions[i + 1] -= profile.height / 2;
      mesh.positions[i + 2] = position.z + tangent.z * x + tangent.x * z;
      const nx: number = mesh.normals![i],
        nz: number = mesh.normals![i + 2];
      mesh.normals![i] = tangent.x * nx - tangent.z * nz;
      mesh.normals![i + 2] = tangent.z * nx + tangent.x * nz;
    }
  }
  // Arc-distance widths establish nominal centres but cannot account for the
  // rotated three-dimensional proximal faces, so the intact crowns are shifted
  // along group X until no two overlap. The nominal ellipse is a guide, not an
  // exact locus after this always-applied separation.
  const placed: IAutoMovieMesh[] = separatePortraitDentalCrowns(crowns, shape.contactGap ?? 0);
  return { mesh: mergeAutoMovieMeshes(placed), cervical };
}
