import { TestValidator } from "@nestia/e2e";

import {
  FACE_ANTHROPOMETRY_INDICES,
  type FaceAnthropometryPoint,
  faceAnthropometryFrame,
  measureFaceAnthropometry,
} from "../../../scripts/face-review/faceAnthropometry";
import { nclose, throwsError } from "../internal/predicates";

/** A symmetric synthetic face with every landmark the indices read. */
const face = (): FaceAnthropometryPoint[] => {
  const p: FaceAnthropometryPoint[] = new Array(468).fill(undefined);
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
 * 1. On a synthetic face every index is its defining ratio, and every index
 *    names at least one shape channel.
 * 2. The indices are invariant to rotating, scaling and moving the image:
 *    the face frame turns the midline vertical.
 * 3. A missing landmark leaves only the indices that read it null; fewer
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
    upperVermilion: 6 / 50,
    lowerVermilion: 10 / 50,
    upperLip: 16 / 60,
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
        (one) => one.channels.length > 0 && one.id in m,
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
    nclose(frame[168]![0], frame[152]![0], 1e-9),
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
