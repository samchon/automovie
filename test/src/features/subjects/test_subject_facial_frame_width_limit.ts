import { createPortraitEyeComponent } from "@automovie/human/face/anatomy/eye/createPortraitEyeComponent";
import { createPortraitFacialFrame } from "@automovie/human/face/anatomy/cranium/createPortraitFacialFrame";
import { portraitFacialFrameWidthLimit } from "@automovie/human/face/anatomy/cranium/portraitFacialFrameWidthLimit";
import { resolveHumanFaceDocument } from "@automovie/human/face/document/resolveHumanFaceDocument";
import { TestValidator } from "@nestia/e2e";

import { coarseHumanFaceFixture } from "../internal/humanFaceFixture";
import { throwsError } from "../internal/predicates";

/**
 * A face may widen only as far as its eyes still fit their sockets, and that
 * limit is asked of the eye's own fitting, so the documented interval and the
 * refusal come from one definition.
 *
 * Scenarios:
 * 1. A request at or below one, and one the eyes fit, is returned unchanged.
 * 2. A request the eyes do not fit (the top of the documented interval) is
 *    reduced to a scale at which both eyes fit, and a scale a hundredth wider
 *    does not fit, so the result is the boundary and not a guess.
 * 3. The document resolver names that limit in its refusal at the top of the
 *    interval and admits the limit itself; the adjacent unscaled document
 *    resolves, so the changed input is the width.
 */
export const test_subject_facial_frame_width_limit = (): void => {
  const document = coarseHumanFaceFixture("width-limit");
  const { host, bindings } = document.basis;
  const eye = document.basis.recipe.eye;
  const eyes = [
    { socket: bindings.eyes.right, shape: eye },
    { socket: bindings.eyes.left, shape: eye },
  ];
  const fits = (scale: number): boolean => {
    const framed = createPortraitFacialFrame(host, { widthScale: scale }).host;
    return !throwsError(() =>
      eyes.forEach(({ socket, shape }) =>
        createPortraitEyeComponent(socket, shape).fit(framed),
      ),
    );
  };
  TestValidator.equals(
    "no widening is unchanged",
    portraitFacialFrameWidthLimit(host, { widthScale: 1 }, eyes),
    1,
  );
  TestValidator.equals(
    "narrowing is unchanged",
    portraitFacialFrameWidthLimit(host, { widthScale: 0.8 }, eyes),
    0.8,
  );
  TestValidator.predicate("the unscaled face fits", fits(1));
  TestValidator.predicate("the top of the interval does not", !fits(1.3));
  const limit = portraitFacialFrameWidthLimit(host, { widthScale: 1.3 }, eyes);
  TestValidator.predicate(
    "the limit is inside the interval",
    limit >= 1 && limit < 1.3,
  );
  TestValidator.predicate("both eyes fit at the limit", fits(limit));
  TestValidator.predicate(
    "a hundredth wider does not fit",
    !fits(limit + 0.01),
  );
  TestValidator.equals(
    "a request the eyes fit is returned",
    portraitFacialFrameWidthLimit(host, { widthScale: limit }, eyes),
    limit,
  );

  const wide = structuredClone(document);
  wide.basis.recipe.frame = { widthScale: 1.3 };
  TestValidator.predicate(
    "the resolver refuses the top of the interval naming the limit",
    throwsError(
      () => resolveHumanFaceDocument(wide),
      "the widest at which both eyes fit their sockets",
    ),
  );
  const admitted = structuredClone(document);
  admitted.basis.recipe.frame = { widthScale: Math.floor(limit * 1000) / 1000 };
  resolveHumanFaceDocument(admitted);
  resolveHumanFaceDocument(document);
};
