import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSupport,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import {
  HUMAN_LEXICON,
  HumanHand,
  HumanSport,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanStance } from "../../../features/internal/motionHumanStance";
import { profileHumanMotion } from "../../../features/internal/profileHumanMotion";

/**
 * A public toe touch reaches the foot and braces the opposite thigh. A public scramble transfers both feet onto the ledge.
 *
 * Scenarios:
 * 1. On the average and large bodies read the two palms at deepest flexion and measure them against the moving foot and thigh.
 * 2. On the average and small bodies enter a hip-height ledge from the original half-arm-length approach and read the exit supports.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each public action, body, event and support under observation.
 * @evidence contracts/development/testing.md#behavioral-verification Places each registered action and reads its reported event or support interval and displayed skeleton.
 * @evidence contracts/development/testing.md#independent-expectations The foot surface and contralateral femur give the target geometry. The ledge height comes from the body, and both feet must bear at the end.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves both historically refused builds for each public action.
 * @evidence contracts/development/testing.md#execution-ownership Plans only the four affected public registrations and samples their decisive interval.
 */
export function test_motion_touch_public_reach_registry(): void {
  for (const [category, name, owner] of [
    ["stageFight", "choke", "touch"],
    ["stageFight", "backhand", "touch"],
    ["sport", "taiChiPush", "martialArt"],
  ] as const) {
    const record = HUMAN_LEXICON[category]?.find(
      (candidate) => candidate.name === name,
    );
    TestValidator.equals(name + " public owner", record?.family, owner);
    const given: object =
      category === "stageFight"
        ? {
            target: { kind: "point", frame: "world", at: { x: 0, y: 0, z: 0 } },
          }
        : {};
    const resolved: object | undefined = record?.resolve?.(given);
    TestValidator.predicate(
      name + " dispatches its public arguments",
      resolved !== undefined,
    );
  }
  const complaints: string[] = [];
  for (const name of ["m-average", "m-large"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    try {
      const film: IAutoMovieMotionHumanPerformance = profileHumanMotion(
        "toeTouch/" + name,
        () =>
          new HumanPerformance({
            seed: "lexicon",
            laws: [HumanSport.toeTouch],
            performers: [
              {
                subject: "a",
                body,
                at: { x: 0, y: 0, z: 0 },
                yaw: 0,
                proficiency: { level: "trained" },
              },
            ],
            composition: HumanChain.subject("a")
              .stand({ hold: 0.3 })
              .registered("toeTouch").node,
          }),
        ["a"],
        "toeTouch",
      );
      const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
      const share: number | undefined = segment.plan.events.find(
        (event) => event.name === "deepest",
      )?.share;
      if (segment.name !== "toeTouch" || share === undefined)
        throw new Error("toe touch deepest event is absent");
      const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
        film.bones("a", segment.start + share * segment.plan.duration);
      const foot: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions.footTopRight;
      const target: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
        resolveAutoMovieHumanoidSurfaces.place(foot, bones.get(foot.bone)!);
      const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
        body,
        bones,
        "right",
        "palm",
        "flat",
      );
      const delta: IAutoMovieVector3 = Vector3.subtract(
        palm.point,
        target.point,
      );
      const miss: number = Vector3.length(
        Vector3.subtract(
          delta,
          Vector3.scale(target.normal, Vector3.dot(delta, target.normal)),
        ),
      );
      if (!(miss <= 0.01))
        complaints.push(
          name +
            " toe touch palm misses the foot site along its surface by " +
            miss +
            " m",
        );
      const knee: IAutoMovieVector3 = bones.get("leftLowerLeg")!.worldPosition;
      const femur: IAutoMovieVector3 = Vector3.subtract(
        bones.get("leftUpperLeg")!.worldPosition,
        knee,
      );
      const brace: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
        body,
        bones,
        "left",
        "palm",
        "flat",
      );
      const axis: IAutoMovieVector3 = Vector3.normalize(femur);
      const offset: IAutoMovieVector3 = Vector3.subtract(brace.point, knee);
      const along: number = Vector3.dot(offset, axis);
      const radial: IAutoMovieVector3 = Vector3.subtract(
        offset,
        Vector3.scale(axis, along),
      );
      if (!(Vector3.dot(brace.normal, radial) < 0))
        complaints.push(
          name + " toe touch support palm faces away from its thigh",
        );
      if (
        !(
          along >= body.measure.hand / 2 - 0.01 &&
          along <= Vector3.length(femur) - body.measure.hand / 2 + 0.01
        )
      )
        complaints.push(
          name +
            " toe touch support palm lies " +
            along +
            " m along the thigh from the knee",
        );
    } catch (error) {
      complaints.push("toeTouch/" + name + ": " + String(error));
    }
  }
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stance = motionHumanStance(body);
    const toes: number =
      (stance.get("leftToes")!.worldPosition.z +
        stance.get("rightToes")!.worldPosition.z) /
      2;
    const approach: number = (body.measure.upperArm + body.measure.forearm) / 2;
    try {
      const film = new HumanPerformance({
        seed: "support-rows",
        laws: [AutoMovieMotionHumanSupport.rows.scramble],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").registered("scramble", {
          on: {
            kind: "point",
            at: { x: 0, y: body.measure.hipHeight, z: toes + approach },
            frame: "world",
            normal: { x: 0, y: 1, z: 0 },
          },
        }).node,
      });
      const segment = film
        .segments("a")
        .find((entry) => entry.name === "scramble");
      const supports = segment?.plan.contacts.filter(
        (contact: IAutoMovieMotionHumanContactWindow) =>
          contact.to >= 1 - 1e-9 && contact.part.endsWith("Foot"),
      );
      if (
        supports?.length !== 2 ||
        !["leftFoot", "rightFoot"].every((foot) =>
          supports.some((contact) => contact.part === foot),
        )
      )
        complaints.push("scramble/" + name + " must end on both feet");
    } catch (error) {
      complaints.push("scramble/" + name + ": " + String(error));
    }
  }
  TestValidator.equals("public toe and support target reach", complaints, []);
}
