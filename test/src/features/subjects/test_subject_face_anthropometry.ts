import { TestValidator } from "@nestia/e2e";

import {
  FACE_ANTHROPOMETRY_INDICES,
  FACE_ANTHROPOMETRY_LOWER_EDGE,
  FACE_ANTHROPOMETRY_UPPER_EDGE,
  type FaceAnthropometryPoint,
  faceAnthropometryFrame,
  faceAnthropometryWeights,
  measureFaceAnthropometry,
} from "../../../scripts/face-review/faceAnthropometry";
import { nclose, throwsError } from "../internal/predicates";

/** A symmetric synthetic face with every landmark the indices read. */
const face = (): FaceAnthropometryPoint[] => {
  const p: FaceAnthropometryPoint[] = new Array(477).fill(undefined);
  const set = (k: number, x: number, y: number) => (p[k] = [x, y]);
  const pair = (r: number, l: number, x: number, y: number) => {
    set(r, -x, y);
    set(l, x, y);
  };
  // Midline, y down.
  set(9, 0, -10);
  set(168, 0, 0);
  set(6, 0, 20);
  set(2, 0, 40);
  set(0, 0, 50);
  set(13, 0, 55);
  set(14, 0, 57);
  set(17, 0, 66);
  set(FACE_ANTHROPOMETRY_UPPER_EDGE, 0, 60);
  set(FACE_ANTHROPOMETRY_LOWER_EDGE, 0, 64);
  set(152, 0, 100);
  // The jaw outline: menton, then the mouth line's and the chin's widths.
  set(470, 0, 100);
  // The vermilion's borders from the midline's colour.
  set(475, 0, 50);
  set(476, 0, 66);
  set(199, 0, 90);
  pair(234, 454, 60, 20);
  pair(133, 362, 15, 5);
  pair(33, 263, 45, 5);
  pair(159, 386, 30, 0);
  pair(145, 374, 30, 10);
  pair(129, 358, 18, 38);
  pair(61, 291, 25, 56);
  pair(471, 472, 45, 56);
  pair(473, 474, 20, 92);
  pair(105, 334, 30, -20);
  pair(157, 384, 20, 1);
  pair(154, 381, 20, 9);
  pair(161, 388, 40, 2);
  pair(163, 390, 40, 8);
  pair(70, 300, 50, -14);
  pair(107, 336, 12, -18);
  pair(37, 267, 8, 49);
  pair(39, 269, 16, 51);
  pair(81, 311, 16, 55);
  pair(178, 402, 16, 57);
  pair(181, 405, 16, 64);
  pair(123, 352, 50, 30);
  pair(193, 417, 6, 12);
  pair(196, 419, 8, 24);
  pair(21, 251, 55, -15);
  pair(155, 382, 21, 8);
  pair(27, 257, 30, -6);
  pair(230, 450, 30, 16);
  pair(49, 279, 12, 36);
  set(1, 0, 32);
  return p;
};

/**
 * Frontal anthropometric indices.
 * Scenarios:
 * 1. On a synthetic face every index is its defining ratio (the lip heights
 *    to each lip's own inner edge, the gap between them, the upper incisal
 *    edge 5 below stomion superius and the lower 4 below the upper), every
 *    index names at least one channel, and only the lip gap's, the upper
 *    display's, the incisal gap's, the corner lift's and the mouth shift's
 *    are expression (the synthetic corners sit
 *    level with the lip centre and about the midline, a lift and a shift of
 *    zero); gains, where given, align with the channels.
 * 2. The indices are invariant to rotating, scaling and moving the image:
 *    the face frame turns the midline vertical with the chin below the
 *    brow, even for an image turned upside down, so a raised corner reads a
 *    positive lift either way.
 * 3. Lips moved 5 to the image's right over a 50 wide mouth shift by 0.097
 *    (the stomion pair is on the midline, so its move tilts the frame a
 *    little), the same in the image turned upside down, and without
 *    subnasale there is no shift; a signed index writes its magnitude to
 *    `mouthLeft` or `mouthRight` by its sign, and an unsigned one (the lip
 *    gap's lower lip depressor pair) takes its value.
 * 4. Outer canthi raised 3 above inner canthi 30 apart tilt both fissures
 *    by 3 / sqrt(909), the same in the image turned upside down; lowered,
 *    the tilt is negative; without one exocanthion, or with the canthi
 *    of each eye at one point, there is no tilt.
 * 5. A missing landmark leaves only the indices that read it null (a
 *    bilateral one when either side is missing, subnasale's eye level,
 *    a bow peak's width and depth, a lid slope without its run, every
 *    height over n-me' without the jaw outline's menton); fewer than two
 *    midline landmarks refuse.
 */
export const test_subject_face_anthropometry = (): void => {
  const points = face();
  const m = measureFaceAnthropometry(points);
  const expected: Record<string, number> = {
    faceHeight: 100 / 120,
    intercanthal: 30 / 120,
    fissureLength: 30 / 120,
    fissureHeight: 10 / 30,
    canthalTilt: 0,
    noseWidth: 36 / 120,
    noseHeight: 40 / 100,
    mouthWidth: 50 / 120,
    upperVermilion: 5 / 50,
    lowerVermilion: 9 / 50,
    upperLip: 15 / 60,
    lipParting: 2 / 50,
    upperDisplay: 5 / 50,
    incisalGap: 4 / 50,
    cornerLift: 0,
    mouthShift: 0,
    lowerFaceWidth: 90 / 120,
    chinWidth: 40 / 120,
    browHeight: 20 / 30,
    eyeLevel: 35 / 100,
    medialAperture: 8 / 30,
    lateralAperture: 6 / 30,
    browSlope: 4 / 30,
    cupidsBowWidth: 16 / 50,
    cupidsBowDepth: 1 / 50,
    upperLateralVermilion: 4 / 50,
    lowerLateralVermilion: 7 / 50,
    cheekProminence: 100 / 120,
    noseUpperWidth: 12 / 120,
    noseMiddleWidth: 16 / 120,
    templeWidth: 110 / 120,
    medialLowerLidSlope: 3 / 6,
    upperLidHeight: 6 / 30,
    infraorbitalHeight: 6 / 30,
    noseTipHeight: 8 / 40,
    nostrilHeight: 4 / 40,
  };
  TestValidator.predicate(
    "defining ratios",
    Object.entries(expected).every(([id, value]) =>
      nclose(m[id]!, value, 1e-9),
    ) &&
      FACE_ANTHROPOMETRY_INDICES.every(
        (one) =>
          one.channels.length > 0 &&
          one.id in m &&
          (one.expression === true) ===
            [
              "lipParting",
              "upperDisplay",
              "incisalGap",
              "cornerLift",
              "mouthShift",
            ].includes(one.id) &&
          (one.gains === undefined || one.gains.length === one.channels.length),
      ),
  );
  const angle = 0.3;
  const moved = points.map((p) =>
    p === undefined
      ? undefined
      : ([
          3 * (Math.cos(angle) * p[0] - Math.sin(angle) * p[1]) + 400,
          3 * (Math.sin(angle) * p[0] + Math.cos(angle) * p[1]) - 70,
        ] as const),
  );
  const n = measureFaceAnthropometry(moved);
  TestValidator.predicate(
    "similarity invariant",
    Object.keys(expected).every((id) => nclose(n[id]!, m[id]!, 1e-9)),
  );
  const frame = faceAnthropometryFrame(moved);
  TestValidator.predicate(
    "midline vertical",
    nclose(frame[168]![0], frame[152]![0], 1e-9) &&
      frame[152]![1] > frame[168]![1],
  );
  const smiling = [...points];
  smiling[61] = [-25, 52];
  smiling[291] = [25, 52];
  const flipped = smiling.map((p) =>
    p === undefined ? undefined : ([-p[0], -p[1]] as const),
  );
  TestValidator.predicate(
    "signed lift",
    nclose(measureFaceAnthropometry(smiling).cornerLift!, 4 / 50, 1e-9) &&
      nclose(measureFaceAnthropometry(flipped).cornerLift!, 4 / 50, 1e-9) &&
      faceAnthropometryFrame(flipped)[152]![1] >
        faceAnthropometryFrame(flipped)[168]![1],
  );
  const shifted = [...points];
  shifted[13] = [5, 55];
  shifted[14] = [5, 57];
  const turned = shifted.map((p) =>
    p === undefined ? undefined : ([-p[0], -p[1]] as const),
  );
  const level = [...points];
  level[2] = undefined;
  TestValidator.predicate(
    "signed mouth shift",
    nclose(measureFaceAnthropometry(shifted).mouthShift!, 0.0974149, 1e-6) &&
      nclose(
        measureFaceAnthropometry(turned).mouthShift!,
        measureFaceAnthropometry(shifted).mouthShift!,
        1e-9,
      ) &&
      measureFaceAnthropometry(level).mouthShift === null,
  );
  const shift = FACE_ANTHROPOMETRY_INDICES.find(
    (one) => one.id === "mouthShift",
  )!;
  const parting = FACE_ANTHROPOMETRY_INDICES.find(
    (one) => one.id === "lipParting",
  )!;
  TestValidator.equals(
    "signed weights",
    [
      faceAnthropometryWeights(shift, 0.3),
      faceAnthropometryWeights(shift, -0.2),
      faceAnthropometryWeights(parting, 0.5),
    ],
    [
      [
        ["mouthLeft", 0.3],
        ["mouthRight", 0],
      ],
      [
        ["mouthLeft", 0],
        ["mouthRight", 0.2],
      ],
      [
        ["mouthLowerDownLeft", 0.5],
        ["mouthLowerDownRight", 0.5],
      ],
    ],
  );
  const tilted = [...points];
  tilted[33] = [-45, 2];
  tilted[263] = [45, 2];
  const drooping = [...points];
  drooping[33] = [-45, 8];
  drooping[263] = [45, 8];
  const upside = tilted.map((p) =>
    p === undefined ? undefined : ([-p[0], -p[1]] as const),
  );
  const blind = [...tilted];
  blind[263] = undefined;
  const collapsed = [...tilted];
  collapsed[33] = collapsed[133];
  collapsed[263] = collapsed[362];
  TestValidator.predicate(
    "signed canthal tilt",
    nclose(
      measureFaceAnthropometry(tilted).canthalTilt!,
      3 / Math.sqrt(909),
      1e-9,
    ) &&
      nclose(
        measureFaceAnthropometry(upside).canthalTilt!,
        3 / Math.sqrt(909),
        1e-9,
      ) &&
      nclose(
        measureFaceAnthropometry(drooping).canthalTilt!,
        -3 / Math.sqrt(909),
        1e-9,
      ) &&
      measureFaceAnthropometry(blind).canthalTilt === null &&
      measureFaceAnthropometry(collapsed).canthalTilt === null,
  );
  const missing = [...points];
  missing[129] = undefined;
  const partial = measureFaceAnthropometry(missing);
  TestValidator.predicate(
    "missing alare",
    partial.noseWidth === null && partial.mouthWidth !== null,
  );
  const jawless = [...points];
  jawless[470] = undefined;
  const chinless = measureFaceAnthropometry(jawless);
  TestValidator.predicate(
    "missing outline menton",
    ["faceHeight", "noseHeight", "upperLip", "eyeLevel"].every(
      (id) => chinless[id] === null,
    ) &&
      chinless.chinWidth !== null &&
      chinless.mouthWidth !== null,
  );
  const sparse = [...points];
  sparse[2] = undefined;
  sparse[70] = undefined;
  sparse[37] = undefined;
  sparse[155] = undefined;
  const without = measureFaceAnthropometry(sparse);
  const upright = [...points];
  upright[382] = upright[362];
  const plumb = measureFaceAnthropometry(upright);
  TestValidator.predicate(
    "missing subnasale, brow tail and bow peak",
    without.eyeLevel === null &&
      without.browSlope === null &&
      without.cupidsBowDepth === null &&
      without.cupidsBowWidth === null &&
      without.medialLowerLidSlope === null &&
      plumb.medialLowerLidSlope === null &&
      without.cheekProminence !== null,
  );
  TestValidator.predicate(
    "no midline",
    throwsError(
      () => measureFaceAnthropometry(new Array(468).fill(undefined)),
      "two midline",
    ),
  );
};
