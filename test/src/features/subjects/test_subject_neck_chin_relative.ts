import { appendPortraitCranium } from "@automovie/human/face/anatomy/cranium/appendPortraitCranium";
import { appendPortraitNeck } from "@automovie/human/face/anatomy/cranium/appendPortraitNeck";
import { createPortraitFacialFrame } from "@automovie/human/face/anatomy/cranium/createPortraitFacialFrame";
import { portraitCranialChinHeight } from "@automovie/human/face/anatomy/cranium/portraitCranialChinHeight";
import {
  portraitNeckReferenceChin,
  portraitNeckShape,
} from "@automovie/human/face/anatomy/cranium/portraitNeckShape";
import { resolvePortraitNeckShape } from "@automovie/human/face/anatomy/cranium/resolvePortraitNeckShape";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The default neck sections hang a fixed distance below the subject's chin, so
 * a face lengthened or shortened inside its documented scale range still
 * builds, while an explicitly authored neck keeps its absolute heights.
 *
 * Scenarios:
 * 1. At the reference chin the default is the authored default unchanged.
 * 2. A chin 30 mm lower shifts every section down by 30 mm and leaves radii,
 *    axes and the ordering of the sections untouched.
 * 3. A supplied neck is returned as the same object; a nonfinite chin refuses.
 * 4. The lengthened face (length scale 1.3, the top of the documented range)
 *    builds with the resolved neck, and the absolute default is refused there,
 *    which is the failure the shift removes; the shortened face (0.7) builds
 *    with both, so the twin is the changed input and not the neck itself.
 */
export const test_subject_neck_chin_relative = (): void => {
  const same = resolvePortraitNeckShape(portraitNeckReferenceChin);
  TestValidator.equals("reference chin keeps the default", same, {
    upper: portraitNeckShape.upper,
    lower: portraitNeckShape.lower,
    crop: portraitNeckShape.crop,
  });

  const lowered = resolvePortraitNeckShape(portraitNeckReferenceChin - 30);
  TestValidator.predicate(
    "heights move with the chin",
    (["upper", "lower", "crop"] as const).every((name) =>
      nclose(lowered[name].y, portraitNeckShape[name].y - 30),
    ),
  );
  TestValidator.equals(
    "radii and axes are unchanged",
    (["upper", "lower", "crop"] as const).map((name) => ({
      ...lowered[name],
      y: 0,
    })),
    (["upper", "lower", "crop"] as const).map((name) => ({
      ...portraitNeckShape[name],
      y: 0,
    })),
  );

  const authored = structuredClone(portraitNeckShape);
  TestValidator.predicate(
    "a supplied neck is returned as given",
    resolvePortraitNeckShape(-120, authored) === authored,
  );
  TestValidator.predicate(
    "a nonfinite chin refuses",
    throwsError(() => resolvePortraitNeckShape(Number.NaN)),
  );

  const attach = (lengthScale: number, resolved: boolean): void => {
    const host = humanFaceFixture().basis.host;
    const framed = createPortraitFacialFrame(host, { lengthScale }).host;
    const cage = {
      positions: framed.positions.slice(0, 468).map((point) => [...point]),
      indices: [...framed.indices],
      groups: new Array<number>(framed.indices.length / 3).fill(0),
    };
    const chin = portraitCranialChinHeight(cage.positions);
    const collar = appendPortraitCranium(cage);
    appendPortraitNeck(
      cage,
      collar,
      resolved ? resolvePortraitNeckShape(chin) : portraitNeckShape,
    );
  };
  attach(1.3, true);
  TestValidator.predicate(
    "the absolute default refuses the lengthened face",
    throwsError(() => attach(1.3, false)),
  );
  attach(0.7, true);
  attach(0.7, false);
};
