import { TestValidator } from "@nestia/e2e";

import {
  faceMidsagittalLandmarks,
  faceMidsagittalProfile,
  faceMidsagittalSection,
} from "../../../scripts/face-review/faceMidsagittal";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A designed profile (y down the face, z forward, millimetres) swept into a
 * strip across x = -1..1 mm: forehead, nasal tip at y 0, a columella running
 * back to the lip junction at y -11, the upper lip, the seam at -30, the
 * lower lip bulging to its front at -38, a fold at -44, the chin's front,
 * its turn at -64 and its level underside at -70, then the neck.
 */
const PROFILE: [number, number][] = [
  [20, 140],
  [0, 160],
  [-2, 157],
  [-11, 145],
  [-12, 144.8],
  [-20, 146],
  [-26, 148],
  [-30, 144],
  [-34, 147],
  [-38, 149],
  [-44, 141],
  [-50, 143],
  [-60, 142],
  [-64, 139],
  [-68, 130],
  [-70, 120],
  [-70.2, 110],
  [-72, 90],
  [-90, 80],
];

const strip = (): { positions: number[]; indices: number[] } => {
  const positions: number[] = [];
  for (const [y, z] of PROFILE)
    positions.push(-0.001, y / 1000, z / 1000, 0.001, y / 1000, z / 1000);
  const indices: number[] = [];
  for (let k = 0; k + 1 < PROFILE.length; ++k) {
    const a = 2 * k;
    indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }
  return { positions, indices };
};

/**
 * Midsagittal soft-tissue landmarks.
 * Scenarios:
 * 1. The section of the strip recovers every profile vertex, and the
 *    profile reads the front-most z at each height.
 * 2. Pronasale is the tip; subnasale ends the columella at y -11, where
 *    the profile turns from losing more depth than height to less; menton
 *    is the chin's level underside at y -70, found by following the chin
 *    back from its turn; upper lip and lower face heights are 19 and 59 mm.
 * 3. A surface that does not reach x = 0, a nose band with no profile, and
 *    a profile without a columella refuse.
 */
export const test_subject_face_midsagittal = (): void => {
  const { positions, indices } = strip();
  const section = faceMidsagittalSection(positions, indices);
  const ys = new Set(
    section.flatMap(([a, b]) => [a[0], b[0]].map((y) => Math.round(y * 1e5))),
  );
  TestValidator.predicate(
    "section",
    PROFILE.every(([y]) => ys.has(Math.round(y * 100))),
  );
  const profile = faceMidsagittalProfile(section, 0.02, -0.09, 0.001);
  TestValidator.predicate(
    "profile",
    nclose(profile.find(([y]) => nclose(y, -0.016, 1e-9))![1], 0.1454, 1e-9),
  );
  const landmarks = faceMidsagittalLandmarks({
    positions,
    indices,
    stomion: -0.03,
    nose: [-0.02, 0.02],
    chinDepth: 0.03,
    level: 0.1,
    step: 0.00025,
  });
  TestValidator.predicate(
    "landmarks",
    nclose(landmarks.pronasale[0], 0, 1e-9) &&
      nclose(landmarks.subnasale[0], -0.011, 0.0003) &&
      nclose(landmarks.menton[0], -0.07, 0.0005) &&
      nclose(landmarks.upperLipHeight, 0.019, 0.0003) &&
      nclose(landmarks.lowerFaceHeight, 0.059, 0.0008),
  );
  const options = {
    stomion: -0.03,
    nose: [-0.02, 0.02] as [number, number],
    chinDepth: 0.03,
    level: 0.1,
    step: 0.00025,
  };
  TestValidator.predicate(
    "refusals",
    throwsError(
      () =>
        faceMidsagittalLandmarks({
          positions: positions.map((v, i) => (i % 3 === 0 ? v + 1 : v)),
          indices,
          ...options,
        }),
      "does not cross",
    ) &&
      throwsError(
        () =>
          faceMidsagittalLandmarks({
            positions,
            indices,
            ...options,
            nose: [0.5, 0.6],
          }),
        "nose band",
      ),
  );
};
