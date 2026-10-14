import {
  type IAutoMovieWearableSoftFrame,
  simulateAutoMovieWearableSoftBody,
  simulateSoftBody,
  simulateSoftBodyWithBoundaries,
  validateSoftBodyDomain,
} from "@automovie/engine";
import type {
  IAutoMovieSoftAnchor,
  IAutoMovieSoftBodyDomain,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, nclose, throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";
import { wearableSoftBodyTestActorFrame as actorFrame } from "../internal/wearableSoftBodyTestActorFrame";
import { wearableSoftBodyTestAdmission } from "../internal/wearableSoftBodyTestAdmission";
import { wearableSoftBodyTestBone as bone } from "../internal/wearableSoftBodyTestBone";
import { wearableSoftBodyTestBoundaries } from "../internal/wearableSoftBodyTestBoundaries";
import { wearableSoftBodyTestCapsuleEscape } from "../internal/wearableSoftBodyTestCapsuleEscape";
import { wearableSoftBodyTestDomain as domain } from "../internal/wearableSoftBodyTestDomain";

/**
 * Moving attachments and shared capsules follow one fixed-step pose snapshot.
 *
 * Scenarios:
 *
 * 1. A bone-bound anchor follows its bone to x = 1, the free particle leaves the
 *    torso capsule at its radius with one contact, the budget counts one anchor
 *    and one capsule per step over four boundary records, and a repeat run is
 *    identical.
 * 2. Full structural stiffness moves the free particle toward the moved anchor
 *    and its x coordinate matches the full-projection expectation.
 * 3. A static curtain keeps its exact rest state.
 * 4. Validation refuses a bound anchor that also states a position, a blank
 *    capsule actor, a zero radius and coincident capsule ends, and leaves an
 *    unresolved moving capsule clean.
 * 5. Budget overflow, a missing actor, a non-unit rotation, a static seek of a
 *    moving domain, and boundary records missing an anchor or a capsule refuse.
 * 6. A node-bound anchor adds its offset, a capsule-only domain budgets one
 *    record, a named state starts at step 0, and a distant capsule leaves the
 *    rest untouched.
 * 7. Wearable admission refuses fractional steps, missing frames, a domain with
 *    no moving boundary, a misnumbered frame, missing or repeated nodes, actors
 *    and bones, non-finite coordinates, and invalid subject bounds.
 * 8. The boundary solver refuses missing, misnumbered, invalid, static,
 *    repeated, non-finite, blank, foreign and zero-radius records.
 * 9. A particle coincident with a point, horizontal or diagonal capsule returns
 *    finite positions.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual domain admission, wearable boundary resolution and static/moving solvers, observing anchor/capsule geometry, structural projection, exact replay/rest records, budget counts and the original refusals; directly invokes extracted original Scenarios 7, 8 and 9 in order.
 * @evidence contracts/testing.md#independent-expectations Literal bone/node targets, .25 capsule radius and two-step boundary counts determine expectations; the .5 rest link from moved anchor(1,1) independently implies free x=1-1/sqrt(5). Existing tolerances stay unchanged and formerly exact numeric/JSON records use the existing shape-preserving zero-tolerance comparator.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all nine numbered scenarios, every input/error/expected value, borrowed domain/frame identity and later capsule-only rest mutations. Finite orientation results do not prove escape distance or repeatability, and portable CPU fixtures do not establish physical cloth fidelity, continuous collision freedom or viewer rendering.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh domains, primary-motion snapshots and solver arrays; extracted assertion owners receive the same existing records in original order. It opens no file/native simulator, renderer, browser/GPU or production host and replaces no foreign method.
 */
export function test_engine_wearable_soft_body(): void {
  const solved: ReturnType<typeof simulateAutoMovieWearableSoftBody> =
    simulateAutoMovieWearableSoftBody({
      domain: domain(),
      step: 1,
      frames: [actorFrame(0, 0), actorFrame(1, 1)],
      subjectIndex: 0,
      maxSubjects: 1,
    });
  const again: ReturnType<typeof simulateAutoMovieWearableSoftBody> =
    simulateAutoMovieWearableSoftBody({
      domain: domain(),
      step: 1,
      frames: [actorFrame(0, 0), actorFrame(1, 1)],
      subjectIndex: 0,
      maxSubjects: 1,
    });
  TestValidator.predicate(
    "wearable cloth follows its current bone, leaves the current capsule, and reports cost",
    test12ValuesClose(
      {
        anchorX: solved.state.positions[0],
        capsuleDistance: nclose(Math.abs(solved.state.positions[5]!), 0.25),
        contacts: solved.state.contacts,
        budget: solved.budget,
        deterministic: test12ValuesClose(solved.state, again.state),
      },
      {
        anchorX: 1,
        capsuleDistance: true,
        contacts: 1,
        budget: {
          subjectIndex: 0,
          maxSubjects: 1,
          anchorsPerStep: 1,
          capsulesPerStep: 1,
          boundaryRecords: 4,
        },
        deterministic: true,
      },
    ),
  );

  const coupledDomain: IAutoMovieSoftBodyDomain = {
    ...domain(),
    solver: {
      ...domain().solver,
      stiffness: { structural: 1, shear: 0, bend: 0 },
    },
    colliders: [],
  };
  const coupled: ReturnType<typeof simulateAutoMovieWearableSoftBody> =
    simulateAutoMovieWearableSoftBody({
      domain: coupledDomain,
      step: 1,
      frames: [actorFrame(0, 0), actorFrame(1, 1)],
      subjectIndex: 0,
      maxSubjects: 1,
    });
  TestValidator.predicate(
    "nonzero structural stiffness transfers a moving anchor to the free particle",
    test12ValuesClose(
      {
        anchorX: coupled.state.positions[0],
        freeParticleMoved: coupled.state.positions[3]! > 0.5,
        // Full projection of the 0.5 m rest link from the anchor at (1, 1).
        freeParticleX: nclose(
          coupled.state.positions[3]!,
          1 - 1 / Math.sqrt(5),
        ),
      },
      { anchorX: 1, freeParticleMoved: true, freeParticleX: true },
    ),
  );

  const staticDomain: IAutoMovieSoftBodyDomain = {
    ...domain(),
    id: "curtain",
    anchors: [{ id: "rail", particle: 0, position: { x: 0, y: 1, z: 0 } }],
    colliders: [],
  };
  TestValidator.predicate(
    "the legacy static path retains its exact rest state",
    test12ValuesClose(
      simulateSoftBody(staticDomain, 1).positions,
      staticDomain.rest,
    ),
  );

  const invalidAnchor: IAutoMovieSoftBodyDomain = {
    ...domain(),
    anchors: domain().anchors.map(
      (anchor: IAutoMovieSoftAnchor): IAutoMovieSoftAnchor => ({
        ...anchor,
        position: { x: 0, y: 1, z: 0 },
      }),
    ),
  };
  const invalidCapsule: IAutoMovieSoftBodyDomain = {
    ...domain(),
    colliders: [
      {
        kind: "body-capsule",
        id: "bad",
        actor: "",
        capsule: { from: "hips", to: "head", radius: 0 },
      },
    ],
  };
  const embeddedMovingCapsule: ReturnType<typeof validateSoftBodyDomain> =
    validateSoftBodyDomain({ domain: domain() });
  TestValidator.equals(
    "validation refuses contradictory bindings but never invents an origin capsule",
    {
      anchorPosition: hasViolation(
        validateSoftBodyDomain({ domain: invalidAnchor }),
        "type",
        "anchors[0].position",
      ),
      blankActor: hasViolation(
        validateSoftBodyDomain({ domain: invalidCapsule }),
        "type",
        "colliders[0].actor",
      ),
      radius: hasViolation(
        validateSoftBodyDomain({ domain: invalidCapsule }),
        "range",
        "colliders[0].capsule.radius",
      ),
      distinctEndpoints: hasViolation(
        validateSoftBodyDomain({
          domain: {
            ...invalidCapsule,
            colliders: [
              {
                kind: "body-capsule",
                id: "same-endpoint",
                actor: "soloist",
                capsule: { from: "hips", to: "hips", radius: 0.25 },
              },
            ],
          },
        }),
        "range",
        "colliders[0].capsule.to",
      ),
      unresolvedDoesNotEmbed: clean(embeddedMovingCapsule),
    },
    {
      anchorPosition: true,
      blankActor: true,
      radius: true,
      distinctEndpoints: true,
      unresolvedDoesNotEmbed: true,
    },
  );

  TestValidator.equals(
    "missing moving facts and admission overflow are explicit failures",
    {
      budget: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 1,
            frames: [actorFrame(0, 0), actorFrame(1, 1)],
            subjectIndex: 1,
            maxSubjects: 1,
          }),
        "budget",
      ),
      actor: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 0,
            frames: [{ step: 0, nodes: [], actors: [] }],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        'missing actor "actor"',
      ),
      rotation: throwsError(
        (): ReturnType<typeof simulateAutoMovieWearableSoftBody> =>
          simulateAutoMovieWearableSoftBody({
            domain: domain(),
            step: 0,
            frames: [
              {
                ...actorFrame(0, 0),
                actors: [
                  {
                    actor: "actor",
                    bones: [
                      {
                        ...bone("leftShoulder", 0, 1),
                        worldRotation: { x: 0, y: 0, z: 0, w: 2 },
                      },
                      bone("hips", 0, 0),
                      bone("head", 0, 1),
                    ],
                  },
                ],
              },
            ],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "unit length",
      ),
      unresolvedStatic: throwsError(
        (): ReturnType<typeof simulateSoftBody> =>
          simulateSoftBody(domain(), 1),
        "resolved moving boundaries",
      ),
      missingAnchorBoundary: throwsError(
        (): ReturnType<typeof simulateSoftBodyWithBoundaries> =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              step: 0,
              anchors: [],
              capsules: [
                {
                  id: "torso",
                  from: { x: 0, y: 0, z: 0 },
                  to: { x: 0, y: 1, z: 0 },
                  radius: 0.25,
                },
              ],
            },
          ]),
        "missing authored moving anchor",
      ),
      missingCapsuleBoundary: throwsError(
        (): ReturnType<typeof simulateSoftBodyWithBoundaries> =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              step: 0,
              anchors: [{ particle: 0, position: { x: 0, y: 1, z: 0 } }],
              capsules: [],
            },
          ]),
        "missing authored body capsule",
      ),
    },
    {
      budget: true,
      actor: true,
      rotation: true,
      unresolvedStatic: true,
      missingAnchorBoundary: true,
      missingCapsuleBoundary: true,
    },
  );

  const nodeDomain: IAutoMovieSoftBodyDomain = {
    ...domain(),
    id: "flag",
    anchors: [
      {
        id: "pole",
        particle: 0,
        position: null,
        binding: {
          kind: "node",
          node: "pole",
          offset: { x: 0.25, y: 0, z: 0 },
        },
      },
    ],
    colliders: [],
  };
  const nodeFrame: IAutoMovieWearableSoftFrame = {
    step: 0,
    nodes: [
      {
        node: "pole",
        worldPosition: { x: 1, y: 1, z: 0 },
        worldRotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    ],
    actors: [],
  };
  const capsuleOnly: IAutoMovieSoftBodyDomain = {
    ...domain(),
    anchors: [],
  };
  const farCapsuleFrame: ReturnType<typeof actorFrame> = actorFrame(0, 0);
  farCapsuleFrame.actors[0]!.bones = [
    bone("leftShoulder", 0, 1),
    bone("hips", 10, 0),
    bone("head", 10, 1),
  ];
  const farCapsule: ReturnType<typeof simulateAutoMovieWearableSoftBody> =
    simulateAutoMovieWearableSoftBody({
      domain: capsuleOnly,
      step: 0,
      frames: [farCapsuleFrame],
      subjectIndex: 0,
      maxSubjects: 1,
    });
  TestValidator.predicate(
    "node anchors, capsule-only boundaries, and named state inputs remain explicit",
    test12ValuesClose(
      {
        nodeAnchor: simulateAutoMovieWearableSoftBody({
          domain: nodeDomain,
          step: 0,
          frames: [nodeFrame],
          subjectIndex: 0,
          maxSubjects: 1,
        }).state.positions[0],
        capsuleOnly: simulateAutoMovieWearableSoftBody({
          domain: capsuleOnly,
          step: 0,
          frames: [actorFrame(0, 0)],
          subjectIndex: 0,
          maxSubjects: 1,
        }).budget,
        namedState: simulateAutoMovieWearableSoftBody({
          domain: {
            ...domain(),
            states: [{ id: "draped", anchors: [] }],
          },
          step: 0,
          frames: [actorFrame(0, 0)],
          subjectIndex: 0,
          maxSubjects: 1,
          state: "draped",
        }).state.step,
        farCapsuleContacts: farCapsule.state.contacts,
        farCapsulePositionsUnchanged: test12ValuesClose(
          farCapsule.state.positions,
          capsuleOnly.rest,
        ),
      },
      {
        nodeAnchor: 1.25,
        capsuleOnly: {
          subjectIndex: 0,
          maxSubjects: 1,
          anchorsPerStep: 0,
          capsulesPerStep: 1,
          boundaryRecords: 1,
        },
        namedState: 0,
        farCapsuleContacts: 0,
        farCapsulePositionsUnchanged: true,
      },
    ),
  );

  wearableSoftBodyTestAdmission(
    staticDomain,
    nodeDomain,
    capsuleOnly,
    nodeFrame,
  );
  wearableSoftBodyTestBoundaries(staticDomain);
  wearableSoftBodyTestCapsuleEscape(capsuleOnly);
}

/** Observe only successful admission; this does not synthesize missing capsule geometry. */
const clean: (validation: IAutoMovieValidation) => boolean = (
  validation: IAutoMovieValidation,
): boolean => validation.success === true;
