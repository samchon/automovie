import { TestValidator } from "@nestia/e2e";

import {
  FACE_ANTHROPOMETRY_INDICES,
  FACE_ANTHROPOMETRY_UPPER_EDGE,
  type FaceAnthropometryPoint,
  faceAnthropometryFrame,
  faceAnthropometryWeights,
  measureFaceAnthropometry,
} from "../../../scripts/face-review/faceAnthropometry";
import { nclose, throwsError } from "../internal/predicates";

/** A symmetric synthetic face with every landmark the indices read. */
const face = (): FaceAnthropometryPoint[] => {
  const p: FaceAnthropometryPoint[] = new Array(469).fill(undefined);
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
  set(152, 0, 100);
  set(199, 0, 90);
  pair(234, 454, 60, 20);
  pair(133, 362, 15, 5);
  pair(33, 263, 45, 5);
  pair(159, 386, 30, 0);
  pair(145, 374, 30, 10);
  pair(129, 358, 18, 38);
  pair(61, 291, 25, 56);
  pair(136, 365, 45, 70);
  pair(176, 400, 20, 92);
  pair(105, 334, 30, -20);
  return p;
};

/**
 * Frontal anthropometric indices.
 * Scenarios:
 * 1. On a synthetic face every index is its defining ratio (the lip heights
 *    to each lip's own inner edge, the gap between them, and the upper
 *    incisal edge 5 below stomion superius), every index names at least one
 *    channel, and only the lip gap's, the upper display's, the corner
 *    lift's and the mouth shift's are expression (the synthetic corners sit
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
 * 4. A missing landmark leaves only the indices that read it null; fewer
 *    than two midline landmarks refuse.
 */
export const test_subject_face_anthropometry = (): void => {
  const points = face();
  const m = measureFaceAnthropometry(points);
  const expected: Record<string, number> = {
    faceHeight: 100 / 120,
    intercanthal: 30 / 120,
    fissureLength: 30 / 120,
    fissureHeight: 10 / 30,
    noseWidth: 36 / 120,
    noseHeight: 40 / 100,
    mouthWidth: 50 / 120,
    upperVermilion: 5 / 50,
    lowerVermilion: 9 / 50,
    upperLip: 15 / 60,
    lipParting: 2 / 50,
    upperDisplay: 5 / 50,
    cornerLift: 0,
    mouthShift: 0,
    lowerFaceWidth: 90 / 120,
    chinWidth: 40 / 120,
    chinHeight: 34 / 100,
    browHeight: 20 / 30,
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
            ["lipParting", "upperDisplay", "cornerLift", "mouthShift"].includes(
              one.id,
            ) &&
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
  const missing = [...points];
  missing[129] = undefined;
  const partial = measureFaceAnthropometry(missing);
  TestValidator.predicate(
    "missing alare",
    partial.noseWidth === null && partial.mouthWidth !== null,
  );
  TestValidator.predicate(
    "no midline",
    throwsError(
      () => measureFaceAnthropometry(new Array(468).fill(undefined)),
      "two midline",
    ),
  );
};
