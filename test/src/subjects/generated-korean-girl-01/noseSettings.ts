/**
 * Frozen nasal dimensions and attachments for the retained reference study.
 * configuration.ts assembles these values; unit document fixtures own separate
 * immutable input data. Lengths use head millimetres and socket IDs refer to
 * controlNet. These are the unchanged historical inputs, not a new fitting pass.
 * Callers clone a profile before editing it; shared configuration stays fixed.
 */
import { portraitNostrilContains } from "@automovie/human/face/anatomy/nose/portraitNostrilContains";
import { type IPortraitNoseShape } from "@automovie/human/face/anatomy/nose/structures/IPortraitNoseShape";
import { type IPortraitNoseSocket } from "@automovie/human/face/anatomy/nose/structures/IPortraitNoseSocket";

import { referenceControlNet } from "./controlNet";

/** Measured nasal binding. Its original cut population remains stable across shapes. */
export const portraitNoseSocket: IPortraitNoseSocket = {
  // Nasal root and paired alar-facial support, rather than an arbitrary origin.
  supportPlane: [6, 129, 358],
  midline: 0,
  tipY: -6,
  tipRadius: [8, 9],
  alarOffset: 12.5,
  alarY: -13.5,
  alarRadius: 5.5,
  surface: referenceControlNet.positions
    .slice(0, 468)
    .flatMap((point, id) =>
      Math.abs(point[0]) < 24 && point[1] >= -25 && point[1] < 15 ? [id] : [],
    ),
  nostrils: [-1, 1].map((side) => {
    const selected: number[] = [];
    for (let i = 0; i < referenceControlNet.indices.length; i += 3) {
      const triangle = referenceControlNet.indices
        .slice(i, i + 3)
        .map((id) => referenceControlNet.positions[id]);
      const x = triangle.reduce((sum, p) => sum + p[0], 0) / 3,
        y = triangle.reduce((sum, p) => sum + p[1], 0) / 3;
      if (
        portraitNostrilContains(x, y, {
          x: side * 10.3,
          y: -14.5,
          width: 4.3,
          height: 1.9,
        })
      )
        selected.push(i / 3);
    }
    return selected;
  }),
};

/** Subject-owned nasal offsets and cavity dimensions; see IPortraitNoseShape for units. */
export const portraitNoseShape: IPortraitNoseShape = {
  widthScale: 1,
  // The original monocular depth is inferred. Scale it from the common facial
  // support so tip, sidewall and rim samples follow one projection relationship.
  // This fitting trial changes depth, not a claim that tip roundness is solved.
  depthScale: 0.78,
  // Only the basic construction remains; richer nasal forms are not inputs.
  // Their tested presets did not improve the complete nasal surface, so the
  // active fit uses the prior basic construction rather than its pinched trial.
  // Zero offsets preserve the control net's inferred tip and alar depths.
  // The nostril frame controls aperture shape and orientation independently.
  // Give the bridge-to-tip turn a shallow central cushion. The positive
  // Gaussian is deliberately smaller than the alar relief so the tip joins
  // the bridge as one soft surface instead of becoming a second lobe.
  tipProjection: 0.85,
  // A restrained positive alar relief rounds the paired wing beneath each
  // opening while leaving the fitted nostril boundary and its topology intact.
  // Keep this small: the target has a soft ala, not a separate lateral bump.
  alarProjection: 0.45,
  // Aperture width/height are independent from its complete rim and lining's
  // shared eight-degree downward orientation. The current contour is provisional.
  // These are source-guided authored ratios, not measured airway dimensions.
  nostrilWidthScale: 0.88,
  nostrilHeightScale: 0.65,
  nostrilRise: 0,
  nostrilTilt: 8,
  cavityContraction: 0.6,
  rimSupport: 0.1,
  // Blend the sparse cut boundary towards its own fitted ellipse. The shared
  // skin and lining receive that same rim; orientation, centroid and connectivity
  // remain owned by the original opening. An optional final section grid cannot
  // move or independently reinterpret this aperture boundary.
  rimRoundness: 0.55,
  cavityOffset: [0, 3, -5],
  blendReach: 14,
};

/** A narrower, less projecting nose with smaller inferior openings. */
export const alternatePortraitNose: IPortraitNoseShape = {
  ...portraitNoseShape,
  widthScale: 0.94,
  tipProjection: -4,
  alarProjection: 1,
  nostrilWidthScale: 0.65,
  nostrilHeightScale: 0.7,
  nostrilRise: -0.4,
};
