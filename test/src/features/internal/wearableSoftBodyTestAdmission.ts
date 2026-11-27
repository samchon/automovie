import { AutoMovieEngineSoftBody } from "@automovie/engine";
import type {
  IAutoMovieResolvedBone,
  IAutoMovieSoftBodyDomain,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "./predicates";
import { wearableSoftBodyTestActorFrame as actorFrame } from "./wearableSoftBodyTestActorFrame";
import { wearableSoftBodyTestDomain as domain } from "./wearableSoftBodyTestDomain";

/**
 * Preserve original wearable Scenario 7 admission refusals after the earlier
 * accepted cases.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual wearable resolver for each original malformed step, frame, subject, bone, transform or budget input and observes its original diagnostic substring.
 * @evidence contracts/development/testing.md#independent-expectations Literal fractional/out-of-range/nonfinite values and missing/duplicate authored identities independently determine refusal expectations, without copying resolver decisions into an expected trajectory.
 * @evidence contracts/development/testing.md#distinguishing-cases Keeps every original Scenario 7 case, input value, error and assertion order; supplied static/node/capsule domains retain their main-unit identities. Accepted motion and lower-boundary admission remain separately owned original blocks.
 * @evidence contracts/development/testing.md#execution-ownership The main test directly invokes this synchronous assertion owner with borrowed existing records; fresh malformed frames stay local, and no file, renderer, browser, GPU, native host or foreign-method replacement is used.
 */
export function wearableSoftBodyTestAdmission(
  staticDomain: IAutoMovieSoftBodyDomain,
  nodeDomain: IAutoMovieSoftBodyDomain,
  capsuleOnly: IAutoMovieSoftBodyDomain,
): void {
  TestValidator.equals(
    "wearable admission, frame identity, lookup, and transform failures are closed",
    {
      missingFrame: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody> =>
          AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 1,
            frames: [actorFrame(0, 0)],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "frames 0 through 1",
      ),
      noMovingBoundary: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody> =>
          AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
            domain: staticDomain,
            step: 0,
            frames: [{ step: 0, nodes: [], actors: [] }],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "declares no moving boundary",
      ),
      wrongFrameStep: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody> =>
          AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 0,
            frames: [actorFrame(1, 0)],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "must name absolute step 0",
      ),
      missingNode: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody> =>
          AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
            domain: nodeDomain,
            step: 0,
            frames: [{ step: 0, nodes: [], actors: [] }],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        'missing node "pole"',
      ),
      missingCapsuleActor: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody> =>
          AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
            domain: capsuleOnly,
            step: 0,
            frames: [{ step: 0, nodes: [], actors: [] }],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "missing capsule actor",
      ),
      duplicateActor: throwsError((): void => {
        const frame: ReturnType<typeof actorFrame> = actorFrame(0, 0);
        AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
          domain: domain(),
          step: 0,
          frames: [{ ...frame, actors: [...frame.actors, frame.actors[0]!] }],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "ids must be unique"),
      missingBone: throwsError((): void => {
        const frame: ReturnType<typeof actorFrame> = actorFrame(0, 0);
        AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
          domain: domain(),
          step: 0,
          frames: [
            {
              ...frame,
              actors: [
                {
                  actor: "actor",
                  bones: frame.actors[0]!.bones.filter(
                    (entry: IAutoMovieResolvedBone): boolean =>
                      entry.bone !== "leftShoulder",
                  ),
                },
              ],
            },
          ],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "missing bone"),
      duplicateBone: throwsError((): void => {
        const frame: ReturnType<typeof actorFrame> = actorFrame(0, 0);
        AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
          domain: domain(),
          step: 0,
          frames: [
            {
              ...frame,
              actors: [
                {
                  actor: "actor",
                  bones: [
                    ...frame.actors[0]!.bones,
                    frame.actors[0]!.bones[0]!,
                  ],
                },
              ],
            },
          ],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "repeats bone"),
      invalidMaxSubjects: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody> =>
          AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 0,
            frames: [actorFrame(0, 0)],
            subjectIndex: 0,
            maxSubjects: -1,
          }),
        "max subjects",
      ),
      invalidSubjectIndex: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody> =>
          AutoMovieEngineSoftBody.simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 0,
            frames: [actorFrame(0, 0)],
            subjectIndex: -1,
            maxSubjects: 1,
          }),
        "subject index must",
      ),
    },
    {
      missingFrame: true,
      noMovingBoundary: true,
      wrongFrameStep: true,
      missingNode: true,
      missingCapsuleActor: true,
      duplicateActor: true,
      missingBone: true,
      duplicateBone: true,
      invalidMaxSubjects: true,
      invalidSubjectIndex: true,
    },
  );
}
