import { type IAutoMovieResolvedBone, type IAutoMovieWearableSoftFrame, simulateAutoMovieWearableSoftBody } from "@automovie/engine";
import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "./predicates";
import { wearableSoftBodyTestDomain as domain } from "./wearableSoftBodyTestDomain";
import { wearableSoftBodyTestActorFrame as actorFrame } from "./wearableSoftBodyTestActorFrame";

/**
 * Preserve original wearable Scenario 7 admission refusals after the earlier accepted cases.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual wearable resolver for each original malformed step, frame, subject, bone, transform or budget input and observes its original diagnostic substring.
 * @evidence contracts/testing.md#independent-expectations Literal fractional/out-of-range/nonfinite values and missing/duplicate authored identities independently determine refusal expectations, without copying resolver decisions into an expected trajectory.
 * @evidence contracts/testing.md#distinguishing-cases Keeps every original Scenario 7 case, input value, error and assertion order; supplied static/node/capsule domains retain their main-unit identities. Accepted motion and lower-boundary admission remain separately owned original blocks.
 * @evidence contracts/testing.md#execution-ownership The main test directly invokes this synchronous assertion owner with borrowed existing records; fresh malformed frames stay local, and no file, renderer, browser, GPU, native host or foreign-method replacement is used.
 */
export function wearableSoftBodyTestAdmission(staticDomain: IAutoMovieSoftBodyDomain, nodeDomain: IAutoMovieSoftBodyDomain, capsuleOnly: IAutoMovieSoftBodyDomain, nodeFrame: IAutoMovieWearableSoftFrame): void {
  TestValidator.equals(
    "wearable admission, frame identity, lookup, and transform failures are closed",
    {
      fractionalStep: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 0.5,
            frames: [],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "non-negative integer",
      ),
      missingFrame: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 1,
            frames: [actorFrame(0, 0)],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "frames 0 through 1",
      ),
      noMovingBoundary: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: staticDomain,
            step: 0,
            frames: [{ step: 0, nodes: [], actors: [] }],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "declares no moving boundary",
      ),
      wrongFrameStep: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 0,
            frames: [actorFrame(1, 0)],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "must name absolute step 0",
      ),
      missingNode: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: nodeDomain,
            step: 0,
            frames: [{ step: 0, nodes: [], actors: [] }],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        'missing node "pole"',
      ),
      missingCapsuleActor: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
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
        simulateAutoMovieWearableSoftBody({
          domain: domain(),
          step: 0,
          frames: [{ ...frame, actors: [...frame.actors, frame.actors[0]!] }],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "ids must be non-blank and unique"),
      blankNodeIdentity: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: nodeDomain,
            step: 0,
            frames: [
              {
                ...nodeFrame,
                nodes: [{ ...nodeFrame.nodes[0]!, node: " " }],
              },
            ],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "ids must be non-blank and unique",
      ),
      missingBone: throwsError((): void => {
        const frame: ReturnType<typeof actorFrame> = actorFrame(0, 0);
        simulateAutoMovieWearableSoftBody({
          domain: domain(),
          step: 0,
          frames: [
            {
              ...frame,
              actors: [
                {
                  actor: "actor",
                  bones: frame.actors[0]!.bones.filter(
                    (entry: IAutoMovieResolvedBone): boolean => entry.bone !== "leftShoulder",
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
        simulateAutoMovieWearableSoftBody({
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
      nonfinitePosition: throwsError((): void => {
        const frame: ReturnType<typeof actorFrame> = actorFrame(0, 0);
        frame.actors[0]!.bones[0]!.worldPosition.x = NaN;
        simulateAutoMovieWearableSoftBody({
          domain: domain(),
          step: 0,
          frames: [frame],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "finite coordinates"),
      nonfiniteOffset: throwsError((): void => {
        const invalid: ReturnType<typeof domain> = domain();
        invalid.anchors[0]!.binding!.offset.x = NaN;
        simulateAutoMovieWearableSoftBody({
          domain: invalid,
          step: 0,
          frames: [actorFrame(0, 0)],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "finite coordinates"),
      nonfiniteRotation: throwsError((): void => {
        const frame: ReturnType<typeof actorFrame> = actorFrame(0, 0);
        frame.actors[0]!.bones[0]!.worldRotation.x = NaN;
        simulateAutoMovieWearableSoftBody({
          domain: domain(),
          step: 0,
          frames: [frame],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "finite coordinates"),
      invalidMaxSubjects: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 0,
            frames: [actorFrame(0, 0)],
            subjectIndex: 0,
            maxSubjects: -1,
          }),
        "max subjects",
      ),
      invalidSubjectIndex: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
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
      fractionalStep: true,
      missingFrame: true,
      noMovingBoundary: true,
      wrongFrameStep: true,
      missingNode: true,
      missingCapsuleActor: true,
      duplicateActor: true,
      blankNodeIdentity: true,
      missingBone: true,
      duplicateBone: true,
      nonfinitePosition: true,
      nonfiniteOffset: true,
      nonfiniteRotation: true,
      invalidMaxSubjects: true,
      invalidSubjectIndex: true,
    },
  );
}
