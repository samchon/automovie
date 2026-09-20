import { Vector3 } from "@automovie/engine";
import { portraitNasalRimJets } from "./portraitNasalRimJets";
import { IPortraitNasalRimSection } from "./structures/IPortraitNasalRimSection";

/**
 * Construct the exterior shoulder and crest from the same ordered aperture.
 * The caller supplies the sculpted skin normals before aperture fitting. The
 * opening plane normal describes a different surface and cannot substitute for
 * those exterior tangents. The existing rim-jet calculation supplies the frame.
 * The aperture itself is copied without resizing or moving. An outer offset
 * of width and a halfway crest separate its location from tissue thickness.
 * The resulting three rings are one connected skin section, not a torus mesh
 * placed over an unrelated hole. The caller owns host fitting and subdivision.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Builds a connected shoulder and crest around the existing nostril rather than overlaying a torus.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Derives exterior directions from supplied skin normals and the shared rim jets, preserving the original inner ring exactly.
 */
export function createPortraitNasalRimSection(
  points: readonly (readonly number[])[],
  shape: IPortraitNasalRimSection,
  skinNormals: readonly (readonly number[])[],
): { outer: number[][]; crest: number[][]; rim: number[][] } {
  if (
    !Number.isFinite(shape.width) ||
    shape.width / 1000 <= 0 ||
    !Number.isFinite(shape.crest) ||
    points.length < 3 ||
    skinNormals.length !== points.length ||
    skinNormals.some((p) => p.length !== 3 || !p.every(Number.isFinite)) ||
    points.some((p) => p.length !== 3 || !p.every(Number.isFinite))
  )
    throw new Error(
      "A nasal rim section needs finite XYZ, positive width and finite crest projection.",
    );
  const rim = points.map((p) => [...p]);
  const normals = skinNormals.map((p) => {
    const n = Vector3.normalize(
      Vector3.create(...(p as [number, number, number])),
    );
    return [n.x, n.y, n.z];
  });
  const center = [0, 1, 2].map((axis) =>
    rim.reduce((sum, p) => sum + p[axis] / rim.length, 0),
  );
  const exterior = rim.map((p) => p.map((v, axis) => v + (v - center[axis])));
  const jets = portraitNasalRimJets(rim, normals, exterior);
  const outer = jets.map((j) =>
    j.point.map((v, axis) => v + shape.width * j.transverse[axis]),
  );
  const crest = jets.map((j, i) =>
    j.point.map(
      (v, axis) =>
        v +
        shape.width * 0.5 * j.transverse[axis] +
        shape.crest * normals[i][axis],
    ),
  );
  if (
    [...outer, ...crest].some((p) => !p.every(Number.isFinite)) ||
    outer.some((p, i) => p.every((v, axis) => v === rim[i][axis]))
  )
    throw new Error("A nasal rim section exceeds its representable frame.");
  return { outer, crest, rim };
}
