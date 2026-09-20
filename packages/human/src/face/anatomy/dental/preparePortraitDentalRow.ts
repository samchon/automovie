import { p } from "../../mesh/p";
import { assertPortraitDentalCrown } from "./assertPortraitDentalCrown";
import { createPortraitDentalArc } from "./createPortraitDentalArc";
import { preparePortraitDentalCrown } from "./preparePortraitDentalCrown";
import { IPortraitDentalRow } from "./structures/IPortraitDentalRow";
import { mergeAutoMovieMeshes, separateAutoMovieMeshSequence } from "@automovie/engine";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Compose one resident enamel group before attaching it to the face. The local
 * guide is an ellipse: x=a*sin(theta), z=b*(cos(theta)-1), y=0. Its cumulative
 * arc length establishes nominal crown centres. The same tangent rotates each crown's
 * positions and normals, while all cervical ends share the group's Y=0 plane.
 * Neither a lip landmark's height nor an individual ray hit can tilt one tooth.
 * Returns the merged owned mesh and one directed cervical cycle per input
 * crown in that crown's order, expressed in merged native vertex identities.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Places independent crowns along one dental arch without tilting each tooth to a lip landmark.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Samples an elliptical guide, rotates crown positions and normals together, and optionally separates their complete proximal surfaces.
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
  // rotated three-dimensional proximal faces. An optional complete-surface fit
  // shifts each intact crown along group X and balances the two end shifts. It
  // retains Y/Z, crown orientation and shape; the nominal ellipse is a guide,
  // not an exact locus after this explicitly requested contact adjustment.
  const placed =
    shape.contactGap === undefined
      ? crowns
      : separateAutoMovieMeshSequence(
          crowns.map((mesh) => ({
            ...mesh,
            positions: mesh.positions.map((value) => value / 1000),
          })),
          "x",
          shape.contactGap / 1000,
        ).map((mesh, index) => {
          const shift =
            (mesh.positions[0] - crowns[index].positions[0] / 1000) * 1000;
          return {
            ...mesh,
            positions: crowns[index].positions.map((value, axis) =>
              axis % 3 === 0 ? value + shift : value,
            ),
          };
        });
  return { mesh: mergeAutoMovieMeshes(placed), cervical };
}
