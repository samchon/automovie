import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannelClaim,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { HumanSegment } from "../../../../../packages/motions/src/perform/internal/HumanSegment";
import { HumanSegmentOverlay } from "../../../../../packages/motions/src/perform/internal/HumanSegmentOverlay";
import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";
import { nclose } from "../../internal/nclose";

/**
 * Keep the shared displayed joint at an overlay handoff and fade according to
 * the new action's ownership.
 *
 * Scenarios:
 *
 * 1. An overlay releases to the carrier when it ends alone. With a successor hand
 *    overlay, it hands its displayed digits to that successor.
 * 2. A successor with a delayed index pose blends from that displayed joint. Its
 *    newly claimed ring finger blends from the carrier at the same time.
 * 3. An outgoing little finger without a matching claim releases at the boundary
 *    while the index stays continuous.
 * 4. A successor shorter than the fade returns to the carrier at its exact end.
 *    Reordered reads preserve the same sampled angles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the shared digit, new ownership, exact seam and short release.
 * @evidence contracts/development/testing.md#behavioral-verification The placed overlay resolver captures the same predecessor state as production and evaluates the fitted poses on both sides of its boundary.
 * @evidence contracts/development/testing.md#independent-expectations A half-share is the mean of the endpoint angles. A quarter entry fade uses the literal minimum-jerk share 0.103515625, while the short action is already halfway through its release.
 */
export async function test_motions_perform_overlay_handoff(): Promise<void> {
  const { state, context } = await standingPerformanceState();
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const segment: IAutoMovieMotionHumanSegment = person.segments[0]!;
  const base: IAutoMovieMotionHumanPosture = {
    ...person.initial,
    limbs: {},
    joints: {
      ...person.initial.joints,
      rightIndexProximal: [0, 0, 0],
      rightRingProximal: [0, 0, 0],
      rightLittleProximal: [0, 0, 0],
    },
  };
  const fade: number = HumanSegment.FADE;
  const cut: number = 1;
  const epsilon: number = 1e-5;
  const read = (seconds: number): IAutoMoviePose =>
    HumanSegmentOverlay.overlaid(person, base, seconds).pose;
  const angle = (pose: IAutoMoviePose, bone: AutoMovieHumanoidBone): number =>
    pose.joints.find((joint) => joint.bone === bone)?.flexion ?? 0;
  const index = (pose: IAutoMoviePose): number =>
    angle(pose, "rightIndexProximal");
  const ring = (pose: IAutoMoviePose): number =>
    angle(pose, "rightRingProximal");

  function overlay(
    ordinal: number,
    start: number,
    end: number,
    channels: readonly AutoMovieMotionHumanChannelClaim[],
    shape: IAutoMovieMotionHumanPosture["joints"],
    entered: IAutoMoviePose,
  ): IAutoMovieMotionHumanSegment.IOverlay {
    return {
      ...segment,
      index: ordinal,
      entry: ordinal,
      id: `overlay-${ordinal}`,
      start,
      entryTime: start,
      end,
      channels,
      context: {
        ...context,
        get params(): never {
          throw new Error(
            "The placed overlay fixture has no authored parameters",
          );
        },
        entry: { ...context.entry, pose: entered },
      },
      plan: {
        ...segment.plan,
        duration: end - start,
        contacts: [],
        channels,
        posture: () => ({ ...base, joints: { ...base.joints, ...shape } }),
      },
    };
  }

  person.overlays.push(
    overlay(
      0,
      0,
      cut,
      ["rightIndex", "rightLittle"],
      { rightIndexProximal: [30, 0, 0], rightLittleProximal: [20, 0, 0] },
      segment.context.entry.pose,
    ),
  );
  TestValidator.equals(
    "a sole overlay releases at its end",
    index(read(cut)),
    0,
  );
  const previous: IAutoMoviePose = HumanSegmentOverlay.handing(cut, () =>
    read(cut),
  );
  TestValidator.equals(
    "placement captures the predecessor's displayed digit",
    index(previous),
    30,
  );

  person.overlays.push(
    overlay(
      1,
      cut,
      cut + 2 * fade,
      ["rightHand"],
      { rightIndexProximal: [30, 0, 0] },
      previous,
    ),
  );
  TestValidator.predicate(
    "a matching raw successor keeps the predecessor's displayed digit",
    [cut - epsilon, cut, cut + epsilon].every((t) =>
      nclose(index(read(t)), 30, 1e-8),
    ),
  );

  person.overlays[1] = overlay(
    1,
    cut,
    cut + 2 * fade,
    ["rightHand"],
    { rightRingProximal: [24, 0, 0] },
    previous,
  );
  const middle: IAutoMoviePose = read(cut + fade / 2);
  TestValidator.predicate(
    "only the inherited digit starts from the old overlay",
    nclose(index(read(cut + epsilon)), 30, 1e-8) &&
      nclose(ring(read(cut + epsilon)), 0, 1e-8) &&
      nclose(index(middle), 15, 1e-8) &&
      nclose(ring(middle), 12, 1e-8),
  );
  TestValidator.equals(
    "the earlier sample is independent of read order",
    read(cut + fade / 2),
    middle,
  );

  person.overlays[1] = overlay(
    1,
    cut,
    cut + 2 * fade,
    ["rightIndex"],
    {},
    previous,
  );
  const halfwayOut: IAutoMoviePose = read(cut - fade / 2);
  TestValidator.predicate(
    "an unrelated outgoing digit releases while the right index is handed on",
    nclose(angle(halfwayOut, "rightLittleProximal"), 10, 1e-8) &&
      nclose(index(halfwayOut), 30, 1e-8) &&
      [cut - epsilon, cut, cut + epsilon].every(
        (t) =>
          nclose(angle(read(t), "rightLittleProximal"), 0, 1e-8) &&
          nclose(index(read(t)), 30, 1e-8),
      ),
  );

  const end: number = cut + fade / 2;
  person.overlays[1] = overlay(1, cut, end, ["rightHand"], {}, previous);
  const quarter: number = 0.103515625;
  TestValidator.predicate(
    "a short successor joins its previous and next displays",
    nclose(index(read(cut + epsilon)), 30, 1e-8) &&
      nclose(index(read(cut + fade / 4)), 30 * (1 - quarter) * 0.5, 1e-8) &&
      nclose(index(read(end - epsilon)), 0, 1e-8) &&
      index(read(end)) === 0 &&
      index(read(end + epsilon)) === 0,
  );
}
