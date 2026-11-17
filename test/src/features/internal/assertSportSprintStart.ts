import { Vector3, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * Check the displayed sprint set on the small woman, average man and large
 * man for the sport-row test: front knee 90 degrees within the angle of a
 * 1 mm fit error, rear knee 117 +/- 11 and front hip 43 +/- 6 degrees
 * (Cavedon et al. 2019, table 2), and the sex-matched centre of mass within
 * 1 mm of 16.2 or 22.9 cm behind the start line (Ciacci et al. 2017 and
 * Slawinski et al. 2010, as reported by Valamatos et al. 2022).
 *
 * @param complaints The owning test's collected findings, appended to without throwing so its other scenarios still run.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three bodies, displayed measurements, study values, precision and complaint ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Performs the typed athletics law and reads displayed joint centres and the engine's segmental centre of mass, independently of the law's target records.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per body, then the knee, hip and centre measurements in the same scenario order as the owning sport-row test.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the study's values and all existing bounds; a refusal and a missing set event are findings, not skipped bodies.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three performances and one displayed pose and mass reading per body; planning cost belongs to athletics and is not hidden by a timing assertion.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the motion fixture body and the engine's centre-of-mass owner; each displayed bone map serves every measurement of that body.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds each performance for its measurements and retains no state after the call.
 */
export function assertSportSprintStart(complaints: string[]): void {
  // 6. The sprint start's set.
  const included: (
    a: IAutoMovieVector3,
    knee: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ) => number = (
    a: IAutoMovieVector3,
    knee: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number => {
    const u: IAutoMovieVector3 = Vector3.subtract(a, knee);
    const v: IAutoMovieVector3 = Vector3.subtract(b, knee);
    return (
      (Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            Vector3.dot(u, v) / (Vector3.length(u) * Vector3.length(v)),
          ),
        ),
      ) *
        180) /
      Math.PI
    );
  };
  for (const name of ["f-small", "m-average", "m-large"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    // The fixtures' bodies are named by sex (`f-`, `m-`), the stratum the
    // centre of mass's measured distance is read in.
    const sex: "female" | "male" = name.startsWith("f-") ? "female" : "male";
    let built: IAutoMovieMotionHumanPerformance;
    try {
      built = new HumanPerformance({
        seed: "sport",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "elite" },
          },
        ],
        composition: HumanChain.subject("a").athletics({ sex }).node,
      });
    } catch (error) {
      complaints.push(
        `${name} sprint start: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const placed: ReturnType<
      IAutoMovieMotionHumanPerformance["segments"]
    >[number] = built.segments("a")[0]!;
    const set: number =
      placed.start +
      (placed.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "set",
      )?.share ?? NaN) *
        placed.plan.duration;
    if (Number.isNaN(set)) {
      complaints.push(`${name} sprint start: no set event`);
      continue;
    }
    const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
      built.bones("a", set);
    const at: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 => bones.get(bone)!.worldPosition;

    // The front knee: 90 degrees within the angle a 1 mm miss of its
    // hip-to-ankle distance d turns it by, dd = (a b sin(theta) / d) dtheta.
    {
      const hip: IAutoMovieVector3 = at("leftUpperLeg");
      const knee: IAutoMovieVector3 = at("leftLowerLeg");
      const ankle: IAutoMovieVector3 = at("leftFoot");
      const thigh: number = Vector3.length(Vector3.subtract(knee, hip));
      const shank: number = Vector3.length(Vector3.subtract(ankle, knee));
      const d: number = Vector3.length(Vector3.subtract(ankle, hip));
      const bound: number =
        ((0.001 * d) / (thigh * shank * Math.sin(Math.PI / 2))) *
        (180 / Math.PI);
      const got: number = included(hip, knee, ankle);
      if (!(Math.abs(got - 90) <= bound))
        complaints.push(
          `${name} sprint start: the front knee is ${got.toFixed(2)} degrees at the set, 90 within ${bound.toFixed(2)} expected`,
        );
    }

    // The angles the block setting leaves, within one standard deviation of
    // Cavedon et al.'s means: the rear knee 117 (SD 11), the front hip 43
    // (SD 6), the hip angle between the thigh and the trunk's line from the
    // hip joint to the shoulder.
    const shoulder: IAutoMovieVector3 = Vector3.lerp(
      at("leftUpperArm"),
      at("rightUpperArm"),
      0.5,
    );
    for (const [label, got, mean, sd] of [
      [
        "rear knee",
        included(at("rightUpperLeg"), at("rightLowerLeg"), at("rightFoot")),
        117,
        11,
      ],
      [
        "front hip",
        included(at("leftLowerLeg"), at("leftUpperLeg"), shoulder),
        43,
        6,
      ],
    ] as const)
      if (!(Math.abs(got - mean) <= sd))
        complaints.push(
          `${name} sprint start: the ${label} is ${got.toFixed(1)} degrees at the set, ${mean} within ${sd} expected`,
        );

    // The whole body's centre of mass behind the line (the entry's foot
    // length ahead of the root, where the hands lie): 16.2 cm for women and
    // 22.9 cm for men (Ciacci et al. 2017; Slawinski et al. 2010, as
    // Valamatos et al. 2022 report them), within the limb fit's 1 mm.
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile),
      bones,
    );
    const measured: number = sex === "female" ? 0.162 : 0.229;
    const behind: number = body.measure.footLength - centre.z;
    if (!(Math.abs(behind - measured) <= 0.001))
      complaints.push(
        `${name} sprint start: the centre of mass stands ${(100 * behind).toFixed(1)} cm behind the line at the set, ${(100 * measured).toFixed(1)} within 0.1 expected`,
      );
  }
}
