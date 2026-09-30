import {
  createHumanPersonHeadTransform,
  resolveHumanPersonFaceBones,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceArticulationFixture } from "../internal/humanFaceArticulationFixture";
import { qclose, throwsError, vclose } from "../internal/predicates";

/**
 * The face's jaw and eye become bones under the head, by hand on the analytic
 * articulated face: the jaw turns about +X through the origin (90 degrees per
 * unit of `open`, translating (0,0,0.1) with it), and the left eye turns 90
 * degrees about -X per unit of `gazeUp` about (2,0,0), which `spacing` moves
 * one metre along +X.
 *
 * Scenarios:
 * 1. Neutral, with the head transform the identity: the jaw is at the origin
 *    and the left eye at (2,0,0), both at rest with no turn.
 * 2. Full opening: the jaw's posed position is the joint plus the coupled
 *    translation (0,0,0.1) and its turn is 90 degrees about +X.
 * 3. Half gaze up: the eye turns 45 degrees about -X about its centre, which
 *    stays.
 * 4. With `spacing` the eye's joint is at (3,0,0), the shaped landmark.
 * 5. With the head carried one metre up and turned a quarter about +Y, the
 *    jaw's rest is at (0,1,0) and the eye's at (2,1,0); posed, the eye lands at
 *    (0,1,-2), and a bone that makes no motion of its own turns exactly with
 *    the head.
 * 6. A basis without articulation has no bones, and an articulated owner with
 *    no humanoid name refuses.
 */
export const test_human_person_face_bones = (): void => {
  const { basis } = humanFaceArticulationFixture();
  const origin = { x: 0, y: 0, z: 0 };
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const still = createHumanPersonHeadTransform({
    neutral: origin,
    rest: { position: origin, rotation: identity },
    posed: { position: origin, rotation: identity },
  });
  const bones = (
    expression: Record<string, number>,
    shape: Record<string, number> = {},
    head = still,
  ) =>
    resolveHumanPersonFaceBones({
      basis,
      document: { shape, expression },
      head,
    });
  const named = (list: ReturnType<typeof bones>, bone: string) =>
    list.find((one) => one.bone === bone)!;

  const neutral = bones({});
  TestValidator.equals(
    "a jaw and one eye",
    neutral.map((one) => one.bone),
    ["jaw", "leftEye"],
  );
  TestValidator.predicate(
    "neutral bones are at their joints with no turn",
    vclose(named(neutral, "jaw").rest.position, origin) &&
      vclose(named(neutral, "jaw").posed.position, origin) &&
      vclose(named(neutral, "leftEye").rest.position, { x: 2, y: 0, z: 0 }) &&
      qclose(named(neutral, "leftEye").posed.rotation, identity),
  );

  const opened = named(bones({ open: 1 }), "jaw");
  TestValidator.predicate(
    "full opening turns the jaw and carries its joint by the coupled translation",
    vclose(opened.posed.position, { x: 0, y: 0, z: 0.1 }) &&
      qclose(opened.posed.rotation, {
        x: Math.SQRT1_2,
        y: 0,
        z: 0,
        w: Math.SQRT1_2,
      }) &&
      qclose(opened.rest.rotation, identity),
  );

  const gaze = named(bones({ gazeUp: 0.5 }), "leftEye");
  TestValidator.predicate(
    "half gaze turns the eye about its own centre",
    vclose(gaze.posed.position, { x: 2, y: 0, z: 0 }) &&
      qclose(gaze.posed.rotation, {
        x: -Math.sin(Math.PI / 8),
        y: 0,
        z: 0,
        w: Math.cos(Math.PI / 8),
      }),
  );

  TestValidator.predicate(
    "a shape that moves the landmark moves the bone",
    vclose(named(bones({}, { spacing: 1 }), "leftEye").rest.position, {
      x: 3,
      y: 0,
      z: 0,
    }),
  );

  const quarter = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  const carried = createHumanPersonHeadTransform({
    neutral: origin,
    rest: { position: { x: 0, y: 1, z: 0 }, rotation: identity },
    posed: { position: { x: 0, y: 1, z: 0 }, rotation: quarter },
  });
  const turned = bones({}, {}, carried);
  TestValidator.predicate(
    "bones ride the head's shift and turn",
    vclose(named(turned, "jaw").rest.position, { x: 0, y: 1, z: 0 }) &&
      vclose(named(turned, "leftEye").rest.position, { x: 2, y: 1, z: 0 }) &&
      vclose(named(turned, "leftEye").posed.position, { x: 0, y: 1, z: -2 }) &&
      qclose(named(turned, "jaw").posed.rotation, quarter),
  );

  TestValidator.equals(
    "a basis without articulation has no bones",
    resolveHumanPersonFaceBones({
      basis: { ...basis, articulation: undefined },
      document: { shape: {}, expression: {} },
      head: still,
    }),
    [],
  );
  TestValidator.predicate(
    "an owner without a humanoid name refuses",
    throwsError(
      () =>
        resolveHumanPersonFaceBones({
          basis: {
            ...basis,
            articulation: {
              ...basis.articulation!,
              eyes: basis.articulation!.eyes.map((eye) => ({
                ...eye,
                id: "third-eye",
              })),
            },
          },
          document: { shape: {}, expression: {} },
          head: still,
        }),
      "no humanoid bone",
    ),
  );
};
