/** Compose the retained reference study from separate anatomical settings. */
import { type IPortraitCheekShape } from "@automovie/human/face/anatomy/cheek/IPortraitCheekShape";
import { type IPortraitCheekSocket } from "@automovie/human/face/anatomy/cheek/IPortraitCheekSocket";
import { createPortraitCheekLayer } from "@automovie/human/face/anatomy/cheek/createPortraitCheekLayer";
import { createPortraitDentalComponent } from "@automovie/human/face/anatomy/dental/createPortraitDentalComponent";
import { createPortraitEyeComponent } from "@automovie/human/face/anatomy/eye/createPortraitEyeComponent";
import { type IPortraitEyeShape } from "@automovie/human/face/anatomy/eye/structures/IPortraitEyeShape";
import { createPortraitMaterials } from "@automovie/human/face/anatomy/cranium/createPortraitMaterials";
import { createPortraitMouthComponent } from "@automovie/human/face/anatomy/mouth/createPortraitMouthComponent";
import { type IPortraitMouthShape } from "@automovie/human/face/anatomy/mouth/structures/IPortraitMouthShape";
import { createPortraitNoseComponent } from "@automovie/human/face/anatomy/nose/createPortraitNoseComponent";
import { type IPortraitNoseShape } from "@automovie/human/face/anatomy/nose/structures/IPortraitNoseShape";
import { createPortraitOrbitalSupport } from "@automovie/human/face/anatomy/eye/createPortraitOrbitalSupport";
import { type IPortraitOrbitalSupportShape } from "@automovie/human/face/anatomy/eye/structures/IPortraitOrbitalSupportShape";
import type { IPortraitComponent } from "@automovie/human/face/surface/structures/IPortraitComponent";
import { createPortraitReliefCurveLayer } from "@automovie/human/face/anatomy/skin/createPortraitReliefCurveLayer";
import { createPortraitReliefLayer } from "@automovie/human/face/anatomy/skin/createPortraitReliefLayer";
import type { IPortraitSurfaceLayer } from "@automovie/human/face/surface/structures/IPortraitSurfaceLayer";

import {
  type IPortraitNasalDetail,
  portraitNasalLayerFor,
  portraitOrbitalRelief,
  portraitPerioralRelief,
  portraitPhiltralCurves,
} from "./anatomy";
import { portraitEyeShape, portraitEyeSockets } from "./eyeSettings";
import type { IPortraitHairShape } from "./hairProxy";
import {
  portraitDentalPlacement,
  portraitDentalRow,
  portraitDentalSocket,
  portraitMouthShape,
  portraitMouthSocket,
} from "./mouthSettings";
import { portraitNoseShape, portraitNoseSocket } from "./noseSettings";

export {
  portraitEyeSockets,
  portraitEyeShape,
  alternatePortraitEye,
} from "./eyeSettings";

export {
  portraitNoseSocket,
  portraitNasalSection,
  portraitNoseShape,
  alternatePortraitNose,
} from "./noseSettings";

export {
  portraitMouthSocket,
  portraitMouthShape,
  portraitDentalRow,
  portraitDentalSocket,
  portraitDentalPlacement,
} from "./mouthSettings";

/** Subject-owned continuous hair-cap boundary fit for the reference fringe. */
export const portraitHairShape: IPortraitHairShape = {
  // The photograph's heavier fringe falls toward anatomical +X. Keep the
  // offset within the cap's transition band so both sides remain continuous.
  fringeBias: 0.18,
};

/**
 * Retained skin identities for the paired cheek masses and nasolabial paths.
 * The path begins beside the nasal wing and ends lateral to the mouth corner.
 * These bindings identify anatomy on this measured host; the layer factory
 * reads their final refined coordinates after eye, nose and mouth fitting.
 */
export const portraitCheekSockets: IPortraitCheekSocket[] = [
  {
    side: "right",
    malar: 118,
    medial: 205,
    buccal: 187,
    modiolus: 57,
    nasolabial: [98, 92, 186, 57],
  },
  {
    side: "left",
    malar: 347,
    medial: 425,
    buccal: 411,
    modiolus: 287,
    nasolabial: [327, 322, 410, 287],
  },
];

/**
 * Added soft-tissue relief in millimetres, fitted against the supplied smile.
 * Broad overlapping support gives the cheek a continuous envelope. The narrow
 * groove controls the transition into the lower perioral surface independently.
 * These are authored estimates; no measured fat thickness is claimed. Lift is
 * zero because the host already contains the photographed smile.
 */
export const portraitCheekShape: IPortraitCheekShape = {
  // The reference carries a broad, high malar cushion rather than a planar
  // cheek. Increase its shallow anterior turn and lift together so the light
  // rolls across one soft mass; the neighboring medial field remains a
  // separate transition control.
  malar: { width: 32, height: 34, reach: 40, projection: 4.8, lift: 0.7 },
  // This bound vertex lies lateral/inferior to the desired medial prominence.
  // Move the envelope inward/up relative to its live anchor; the cheek builder
  // mirrors the outward axis automatically. Keep lower cheek support smaller
  // so the smile's high medial mass does not become an enlarged lower cheek.
  medial: {
    offset: [-7, 6, 0],
    width: 29,
    height: 27,
    // Extend the medial malar field along the curved cheek-to-nose path while
    // lowering its crest. The wider support is a transition control, not a
    // second cheek mass, so its lower projection stays below the baseline.
    reach: 48,
    projection: 4.5,
    lift: 0.45,
  },
  // Keep the lower cheek's crest tight around its live support so the buccal
  // mass tapers into the mandibular plane instead of reading as one flat pad.
  // The downward centre shift leaves the malar field untouched and places the
  // transition below the smile rather than widening the midface.
  buccal: {
    offset: [0, -3, 0],
    width: 24,
    height: 27,
    reach: 35,
    projection: 1.2,
    lift: 0,
  },
  modiolus: { width: 12, height: 14, reach: 24, projection: 0.2, lift: 0 },
  foldWidth: 5,
  foldDepth: 0.45,
  foldReach: 30,
};

/** Select each cheek's shape independently while retaining subject-owned attachments. */
export function portraitCheekLayersFor(
  right: IPortraitCheekShape,
  left: IPortraitCheekShape,
): IPortraitSurfaceLayer[] {
  return [
    createPortraitCheekLayer(portraitCheekSockets[0], right),
    createPortraitCheekLayer(portraitCheekSockets[1], left),
  ];
}

/** Assemble independently selectable eyes, nose and mouth against this subject's sockets. */
export function portraitComponentsFor(
  rightEye: IPortraitEyeShape,
  leftEye: IPortraitEyeShape,
  nose: IPortraitNoseShape,
  mouth: IPortraitMouthShape = portraitMouthShape,
): IPortraitComponent[] {
  return [
    createPortraitEyeComponent(portraitEyeSockets[0], rightEye),
    createPortraitEyeComponent(portraitEyeSockets[1], leftEye),
    createPortraitNoseComponent(portraitNoseSocket, nose),
    createPortraitMouthComponent(portraitMouthSocket, mouth),
  ];
}

/**
 * Upper-orbit sections retained as authored data for both assembly and capture.
 * These small fitted displacements are not anatomical population dimensions.
 */
export const portraitOrbitalSupportShapes: readonly {
  side: "right" | "left";
  shape: IPortraitOrbitalSupportShape;
}[] = (["right", "left"] as const).map((side, i) => ({
  side,
  shape: {
    radius: 14,
    stations: (i === 0 ? [107, 105, 70] : [336, 334, 300]).map(
      (anchor, station) => ({
        name: ["medial", "middle", "lateral"][station],
        anchor,
        forehead: { height: 9, projection: 0 },
        browProjection: [0.6, 0.7, 0.25][station],
        sulcus: { descent: 8, projection: [0.03, -0.12, -0.05][station] },
      }),
    ),
  },
}));

/** Restore the basic nose and its original supports after the patch-join regression. */
export const portraitNasalSupportDetail: IPortraitNasalDetail | undefined =
  undefined;

/** Retained measured-cage baseline for independent component experiments. */
export const measuredPortraitAssembly = {
  // Appearance is authored independently of the shared anatomical source basis.
  materials: createPortraitMaterials().map((material) => {
    const finishes: Record<string, { rgb: number[]; roughness: number }> = {
      skin: { rgb: [0.62, 0.42, 0.32], roughness: 0.72 },
      lips: { rgb: [0.48, 0.12, 0.15], roughness: 0.65 },
      teeth: { rgb: [0.78, 0.73, 0.62], roughness: 0.35 },
    };
    const finish = finishes[material.id];
    if (finish === undefined) return material;
    return {
      ...material,
      baseColor: {
        r: finish.rgb[0],
        g: finish.rgb[1],
        b: finish.rgb[2],
        a: 1,
        hex: null,
      },
      roughness: finish.roughness,
      ...(material.id === "skin" ? { clearcoat: 0.02 } : {}),
    };
  }),
  hairProxy: true,
  components: portraitComponentsFor(
    portraitEyeShape,
    portraitEyeShape,
    portraitNoseShape,
  ),
  subdivisionRounds: 3,
  surfaceLayers: [
    ...portraitCheekLayersFor(portraitCheekShape, portraitCheekShape),
    // The restored procedural nose requires its original support field.
    portraitNasalLayerFor(portraitNasalSupportDetail),
    createPortraitReliefLayer("orbital-support", portraitOrbitalRelief),
    createPortraitReliefLayer("perioral-support", portraitPerioralRelief),
    createPortraitReliefCurveLayer("philtral-curves", portraitPhiltralCurves),
    // Upper orbital support belongs to skin form, independently of brow hair.
    // Paired small anterior pad sections sit between fixed forehead witnesses
    // and a shallow superior orbital sulcus. Values are fitting hypotheses.
    ...portraitOrbitalSupportShapes.map(({ side, shape }) =>
      createPortraitOrbitalSupport(side, shape),
    ),
  ],
};

/**
 * Active measured-surface assembly with a grouped dental interior. The skin
 * components own openings; the dental component attaches after shared skin
 * refinement. Disable the mouth's legacy crowns so the row has exactly one
 * owner. The procedural nose and its original support field restore the earlier
 * continuous skin. The later reference-patch experiments remain unaccepted and
 * are not selected here; their perimeter failures must not replace working form.
 */
export const portraitAssembly = {
  ...measuredPortraitAssembly,
  // An explicit 0.2 mm construction gap keeps the entire upper arch behind the
  // actual lip and the cavity behind the enamel, without per-crown distortion.
  oralContact: {
    lips: "lips",
    enamel: "tooth-upper-arch",
    cavity: "oral-cavity",
    clearance: 0.0002,
  },
  components: [
    ...portraitComponentsFor(
      portraitEyeShape,
      portraitEyeShape,
      portraitNoseShape,
      {
        ...portraitMouthShape,
        crowns: [],
      },
    ),
    createPortraitDentalComponent(
      portraitDentalSocket,
      portraitDentalRow,
      portraitDentalPlacement,
    ),
  ],
};
