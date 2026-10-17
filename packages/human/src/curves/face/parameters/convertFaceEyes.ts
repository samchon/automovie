import type { IAutoMovieHumanCurveSpecimen } from "../../IAutoMovieHumanCurveSpecimen";
import type { IAutoMovieFaceMeasurements as M } from "../family/IAutoMovieFaceMeasurements";
import type { IFaceIndependentMeasurements as I } from "./IFaceIndependentMeasurements";

/** Convert clinical canthal chord length to native transverse aperture extent. With signed Z recession d and Y slant a, X=sqrt((L*L-d*d)/(1+tan(a)^2)); therefore the emitted endpoint chord remains L. Clinical 3D distances and projected extents are distinct: https://www.facebase.org/resources/human/facial_norms/notes/. The actual eye child anchors placement; lid depths remain supplied support conventions. Only globeRadiiMm[2] shifts the anchor. The copied envelope object emits no ocular geometry, so slots 0/1 have no output effect in this family.
 *
 * @param s One current admitted identity, resolved measurements and actual skeleton.
 * @param p Explicit bilateral slant/recession and support measurements, in mm/degrees.
 * @returns Native semantic eye courses with shared fold/roll support offsets.
 * @throws Error for missing eye children, non-real chord projections or unequal bilateral fold/roll offsets.
 * @author Samchon
 */
export function convertFaceEyes(
  s: IAutoMovieHumanCurveSpecimen,
  p: I.Value,
): M.Eyes {
  const f: typeof s.measurements.identity.head.features =
    s.measurements.identity.head.features;
  const eyes: Partial<Record<M.Side, M.Eye>> = {};
  for (const side of ["left", "right"] as const) {
    const e: I.Eye = p.eyes[side];
    const sign: number = side === "left" ? 1 : -1;
    const tangent: number = Math.tan((e.canthalSlantDegrees * Math.PI) / 180);
    const square: number =
      f.palpebralFissureLength ** 2 - e.canthalRecessionMm ** 2;
    if (square <= 0 || !Number.isFinite(tangent))
      throw new Error(
        "Canthal recession must leave a real clinical chord projection",
      );
    const width: number = Math.sqrt(square / (1 + tangent * tangent));
    const joint: (typeof s.skeleton.joints)[number] | undefined =
      s.skeleton.joints.find(
        (j: (typeof s.skeleton.joints)[number]): boolean =>
          j.bone === (side === "left" ? "leftEye" : "rightEye"),
      );
    if (!joint) throw new Error("Actual eye child joint required");
    const anchor: [number, number, number] = [
      (sign * f.intercanthalWidth) / 2,
      joint.position.y - (width * tangent) / 2,
      joint.position.z + p.globeRadiiMm[2] / 2 - e.canthalRecessionMm / 2,
    ];
    const lid: (upper: boolean) => M.Lid = (upper: boolean): M.Lid => {
      // Two-thirds above and one-third below allocate the public aperture
      // height. Depth reductions by half the support offset and brow ratios
      // below are authored support choices, not globe-contact constraints.
      const height: number =
        f.palpebralFissureHeight * (upper ? 2 / 3 : -1 / 3);
      const depths: M.Lid["depth"] = {
        "aperture-margin": { bulgeMm: e.marginDepthBulgeMm, skewMm: 0 },
        "lid-roll": {
          bulgeMm: e.marginDepthBulgeMm - e.rollOffsetMm / 2,
          skewMm: 0,
        },
      };
      depths[upper ? "lid-fold" : "infraorbital-transition"] = {
        bulgeMm: e.marginDepthBulgeMm - e.foldOffsetMm / 2,
        skewMm: 0,
      };
      return { archHeightMm: height, archSkewMm: 0, depth: depths };
    };
    eyes[side] = {
      placement: {
        medialAnchorMm: anchor,
        canthalRecessionMm: e.canthalRecessionMm,
      },
      projectedApertureWidthMm: width,
      canthalSlantDegrees: e.canthalSlantDegrees,
      eyeComponent: {
        centerMm: [joint.position.x, joint.position.y, joint.position.z],
        radiiMm: p.globeRadiiMm,
      },
      browDepth: {
        medialZMm: anchor[2],
        recessionMm: e.canthalRecessionMm * 1.5,
        bulgeMm: e.marginDepthBulgeMm / 2,
        skewMm: 0,
      },
      upper: lid(true),
      lower: lid(false),
    };
  }
  // The source family has shared offsets; unequal side measurements must not be
  // silently collapsed into an average. A future bilateral ABI is explicit.
  if (
    p.eyes.left.foldOffsetMm !== p.eyes.right.foldOffsetMm ||
    p.eyes.left.rollOffsetMm !== p.eyes.right.rollOffsetMm
  )
    throw new Error("Frozen eye support ABI requires shared fold/roll offsets");
  return {
    eyes: eyes as Record<M.Side, M.Eye>,
    supports: {
      marginArchOffsetMm: 0,
      rollArchOffsetMm: p.eyes.left.rollOffsetMm,
      upperFoldArchOffsetMm: p.eyes.left.foldOffsetMm,
      lowerTransitionArchOffsetMm: p.eyes.left.foldOffsetMm,
      brow: {
        medialExtensionWidthRatio: 0.1,
        widthRatio: 1.4,
        heightAboveMedialProxyMm: f.palpebralFissureHeight,
        tailDropMm: f.palpebralFissureHeight / 4,
        archHeightMm: f.palpebralFissureHeight / 3,
        archSkewMm: 0,
      },
    },
  };
}
