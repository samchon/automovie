import {
  type IAutoMovieResolvedBone,
  simulateAutoMovieWearableSoftBody,
  simulateSoftBody,
  simulateSoftBodyWithBoundaries,
  validateSoftBodyDomain,
} from "@automovie/engine";
import type {
  IAutoMovieSoftBodyDomain,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, nclose, throwsError } from "../internal/predicates";

const domain = (): IAutoMovieSoftBodyDomain => ({
  version: 1,
  id: "cape",
  units: "meter",
  lattice: { columns: 1, rows: 2 },
  solver: {
    fixedStepSeconds: 0.125,
    gravity: { x: 0, y: 0, z: 0 },
    drag: 0,
    iterations: 1,
    stiffness: { structural: 0, shear: 0, bend: 0 },
    referenceSpeed: 1,
    maxSteps: 4,
  },
  rest: [0, 1, 0, 0, 0.5, 0],
  mass: [1, 1],
  anchors: [
    {
      id: "shoulder",
      particle: 0,
      position: null,
      binding: {
        kind: "actor-bone",
        actor: "actor",
        bone: "leftShoulder",
        offset: { x: 0, y: 0, z: 0 },
      },
    },
  ],
  states: [],
  colliders: [
    {
      kind: "body-capsule",
      id: "torso",
      actor: "actor",
      capsule: { from: "hips", to: "head", radius: 0.25 },
    },
  ],
  wind: null,
  selfCollision: false,
});

const bone = (
  name: IAutoMovieResolvedBone["bone"],
  x: number,
  y: number,
): IAutoMovieResolvedBone => ({
  bone: name,
  localRotation: { x: 0, y: 0, z: 0, w: 1 },
  worldPosition: { x, y, z: 0 },
  worldRotation: { x: 0, y: 0, z: 0, w: 1 },
});

const actorFrame = (step: number, shoulderX: number) => ({
  step,
  nodes: [],
  actors: [
    {
      actor: "actor",
      bones: [
        bone("leftShoulder", shoulderX, 1),
        bone("hips", 0, 0),
        bone("head", 0, 1),
      ],
    },
  ],
});

/**
 *
 * Moving attachments and shared capsules follow one fixed-step pose snapshot.
 *
 * Scenarios:
 *
 * 1. A bone-bound anchor follows its bone to x = 1, the free particle leaves the
 *    torso capsule at its radius with one contact, the budget counts one anchor
 *    and one capsule per step over four boundary records, and a repeat run is
 *    identical.
 * 2. Full structural stiffness pulls the free particle toward the moved anchor
 *    until the link regains its rest length.
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
 * 9. A particle coincident with a point, horizontal or diagonal capsule escapes
 *    to finite positions.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `simulateAutoMovieWearableSoftBody`, `simulateSoftBody`, `simulateSoftBodyWithBoundaries` and `validateSoftBodyDomain` on a two-particle cape and asserts particle coordinates, contact counts, budget records, step, validation violations and refusal fragments; it catches an anchor read from the rest pose instead of the current bone or node, a capsule taken from the wrong frame or not resolved, a stiff link that does not transmit anchor motion, a static path that drifts, a missing or duplicated boundary fact simulated with a fallback, and NaN escaping a degenerate capsule.
 * @evidence contracts/testing.md#independent-expectations The anchor's x 1 and 1.25 are the bone position and the node position plus its 0.25 m offset; the free particle's `1 - 1/sqrt(5)` is a full projection of its 0.5 m rest link from (0, 0.5) toward the anchor at (1, 1); 0.25 is the capsule radius, read on z because the solver's stated least-aligned-axis rule sends a particle on a vertical axis along -z; four boundary records are two steps of one anchor and one capsule; the degenerate escapes are checked only for finiteness, not position.
 * @evidence contracts/testing.md#distinguishing-cases Positive bone- and node-bound anchors, capsule-only and named-state domains, a stiff and a slack link, and a distant capsule that must not touch the cloth; boundary of a static curtain with zero motion and of point, horizontal and diagonal degenerate capsules; about forty negatives across validation, wearable admission and the lower boundary solver; free fall, wind, static colliders and live wearable selection belong to `test_soft_body_free_fall_hand_math`, `test_soft_body_wind_gust`, `test_soft_body_collision` and `test_soft_body_live_wearable_selection`.
 */
export const test_engine_wearable_soft_body = (): void => {
  const solved = simulateAutoMovieWearableSoftBody({
    domain: domain(),
    step: 1,
    frames: [actorFrame(0, 0), actorFrame(1, 1)],
    subjectIndex: 0,
    maxSubjects: 1,
  });
  const again = simulateAutoMovieWearableSoftBody({
    domain: domain(),
    step: 1,
    frames: [actorFrame(0, 0), actorFrame(1, 1)],
    subjectIndex: 0,
    maxSubjects: 1,
  });
  TestValidator.equals(
    "wearable cloth follows its current bone, leaves the current capsule, and reports cost",
    {
      anchorX: solved.state.positions[0],
      capsuleDistance: nclose(Math.abs(solved.state.positions[5]!), 0.25),
      contacts: solved.state.contacts,
      budget: solved.budget,
      deterministic:
        JSON.stringify(solved.state) === JSON.stringify(again.state),
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
  );

  const coupledDomain: IAutoMovieSoftBodyDomain = {
    ...domain(),
    solver: {
      ...domain().solver,
      stiffness: { structural: 1, shear: 0, bend: 0 },
    },
    colliders: [],
  };
  const coupled = simulateAutoMovieWearableSoftBody({
    domain: coupledDomain,
    step: 1,
    frames: [actorFrame(0, 0), actorFrame(1, 1)],
    subjectIndex: 0,
    maxSubjects: 1,
  });
  TestValidator.equals(
    "nonzero structural stiffness transfers a moving anchor to the free particle",
    {
      anchorX: coupled.state.positions[0],
      freeParticleMoved: coupled.state.positions[3]! > 0.5,
      // Full projection of the 0.5 m rest link from the anchor at (1, 1).
      freeParticleX: nclose(coupled.state.positions[3]!, 1 - 1 / Math.sqrt(5)),
    },
    { anchorX: 1, freeParticleMoved: true, freeParticleX: true },
  );

  const staticDomain: IAutoMovieSoftBodyDomain = {
    ...domain(),
    id: "curtain",
    anchors: [{ id: "rail", particle: 0, position: { x: 0, y: 1, z: 0 } }],
    colliders: [],
  };
  TestValidator.equals(
    "the legacy static path retains its exact rest state",
    simulateSoftBody(staticDomain, 1).positions,
    staticDomain.rest,
  );

  const invalidAnchor: IAutoMovieSoftBodyDomain = {
    ...domain(),
    anchors: domain().anchors.map((anchor) => ({
      ...anchor,
      position: { x: 0, y: 1, z: 0 },
    })),
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
  const embeddedMovingCapsule = validateSoftBodyDomain({ domain: domain() });
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
        () =>
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
        () =>
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
        () =>
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
        () => simulateSoftBody(domain(), 1),
        "resolved moving boundaries",
      ),
      missingAnchorBoundary: throwsError(
        () =>
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
        () =>
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
  const nodeFrame = {
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
  const farCapsuleFrame = actorFrame(0, 0);
  farCapsuleFrame.actors[0]!.bones = [
    bone("leftShoulder", 0, 1),
    bone("hips", 10, 0),
    bone("head", 10, 1),
  ];
  const farCapsule = simulateAutoMovieWearableSoftBody({
    domain: capsuleOnly,
    step: 0,
    frames: [farCapsuleFrame],
    subjectIndex: 0,
    maxSubjects: 1,
  });
  TestValidator.equals(
    "node anchors, capsule-only boundaries, and named state inputs remain explicit",
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
      farCapsulePositionsUnchanged:
        JSON.stringify(farCapsule.state.positions) ===
        JSON.stringify(capsuleOnly.rest),
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
  );

  TestValidator.equals(
    "wearable admission, frame identity, lookup, and transform failures are closed",
    {
      fractionalStep: throwsError(
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
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
        () =>
          simulateAutoMovieWearableSoftBody({
            domain: capsuleOnly,
            step: 0,
            frames: [{ step: 0, nodes: [], actors: [] }],
            subjectIndex: 0,
            maxSubjects: 1,
          }),
        "missing capsule actor",
      ),
      duplicateActor: throwsError(() => {
        const frame = actorFrame(0, 0);
        simulateAutoMovieWearableSoftBody({
          domain: domain(),
          step: 0,
          frames: [{ ...frame, actors: [...frame.actors, frame.actors[0]!] }],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "ids must be non-blank and unique"),
      blankNodeIdentity: throwsError(
        () =>
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
      missingBone: throwsError(() => {
        const frame = actorFrame(0, 0);
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
                    (entry) => entry.bone !== "leftShoulder",
                  ),
                },
              ],
            },
          ],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "missing bone"),
      duplicateBone: throwsError(() => {
        const frame = actorFrame(0, 0);
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
      nonfinitePosition: throwsError(() => {
        const frame = actorFrame(0, 0);
        frame.actors[0]!.bones[0]!.worldPosition.x = NaN;
        simulateAutoMovieWearableSoftBody({
          domain: domain(),
          step: 0,
          frames: [frame],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "finite coordinates"),
      nonfiniteOffset: throwsError(() => {
        const invalid = domain();
        invalid.anchors[0]!.binding!.offset.x = NaN;
        simulateAutoMovieWearableSoftBody({
          domain: invalid,
          step: 0,
          frames: [actorFrame(0, 0)],
          subjectIndex: 0,
          maxSubjects: 1,
        });
      }, "finite coordinates"),
      nonfiniteRotation: throwsError(() => {
        const frame = actorFrame(0, 0);
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
        () =>
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
        () =>
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

  const validBoundary = () => ({
    step: 0,
    anchors: [{ particle: 0, position: { x: 0, y: 1, z: 0 } }],
    capsules: [
      {
        id: "torso",
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 1, z: 0 },
        radius: 0.25,
      },
    ],
  });
  TestValidator.equals(
    "the lower moving-boundary solver refuses incomplete and foreign records",
    {
      missingSequence: throwsError(
        () => simulateSoftBodyWithBoundaries(domain(), 0, []),
        "one moving boundary",
      ),
      wrongBoundaryStep: throwsError(
        () =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            { ...validBoundary(), step: 1 },
          ]),
        "must name absolute step 0",
      ),
      fractionalParticle: throwsError(
        () =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: 0.5, position: { x: 0, y: 1, z: 0 } }],
            },
          ]),
        "invalid anchor particle",
      ),
      negativeParticle: throwsError(
        () =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: -1, position: { x: 0, y: 1, z: 0 } }],
            },
          ]),
        "invalid anchor particle",
      ),
      outOfRangeParticle: throwsError(
        () =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: 2, position: { x: 0, y: 1, z: 0 } }],
            },
          ]),
        "invalid anchor particle",
      ),
      staticAnchorOverride: throwsError(
        () =>
          simulateSoftBodyWithBoundaries(
            { ...domain(), anchors: staticDomain.anchors },
            0,
            [validBoundary()],
          ),
        "not an authored moving anchor",
      ),
      duplicateAnchor: throwsError(() => {
        const boundary = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            anchors: [...boundary.anchors, boundary.anchors[0]!],
          },
        ]);
      }, "repeats anchor particle"),
      nonfiniteAnchor: throwsError(
        () =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: 0, position: { x: NaN, y: 1, z: 0 } }],
            },
          ]),
        "finite coordinates",
      ),
      blankCapsule: throwsError(() => {
        const boundary = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [{ ...boundary.capsules[0]!, id: " " }],
          },
        ]);
      }, "id must not be blank"),
      duplicateCapsule: throwsError(() => {
        const boundary = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [...boundary.capsules, boundary.capsules[0]!],
          },
        ]);
      }, "repeats capsule"),
      foreignCapsule: throwsError(() => {
        const boundary = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [{ ...boundary.capsules[0]!, id: "foreign" }],
          },
        ]);
      }, "not an authored body capsule"),
      nonfiniteCapsuleFrom: throwsError(() => {
        const boundary = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [
              {
                ...boundary.capsules[0]!,
                from: { x: NaN, y: 0, z: 0 },
              },
            ],
          },
        ]);
      }, "finite coordinates"),
      nonfiniteCapsuleTo: throwsError(() => {
        const boundary = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [
              {
                ...boundary.capsules[0]!,
                to: { x: 0, y: NaN, z: 0 },
              },
            ],
          },
        ]);
      }, "finite coordinates"),
      nonfiniteRadius: throwsError(() => {
        const boundary = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [{ ...boundary.capsules[0]!, radius: NaN }],
          },
        ]);
      }, "radius must be finite"),
      zeroRadius: throwsError(() => {
        const boundary = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [{ ...boundary.capsules[0]!, radius: 0 }],
          },
        ]);
      }, "radius must be finite"),
    },
    {
      missingSequence: true,
      wrongBoundaryStep: true,
      fractionalParticle: true,
      negativeParticle: true,
      outOfRangeParticle: true,
      staticAnchorOverride: true,
      duplicateAnchor: true,
      nonfiniteAnchor: true,
      blankCapsule: true,
      duplicateCapsule: true,
      foreignCapsule: true,
      nonfiniteCapsuleFrom: true,
      nonfiniteCapsuleTo: true,
      nonfiniteRadius: true,
      zeroRadius: true,
    },
  );

  const capsuleEscape = (
    from: { x: number; y: number; z: number },
    to: { x: number; y: number; z: number },
  ): number[] => {
    const moving = capsuleOnly;
    moving.rest = [0, 0, 0, 5, 5, 5];
    const boundary = {
      step: 0,
      anchors: [],
      capsules: [{ id: "torso", from, to, radius: 0.25 }],
    };
    return simulateSoftBodyWithBoundaries(moving, 1, [
      boundary,
      { ...boundary, step: 1 },
    ]).positions;
  };
  TestValidator.equals(
    "coincident particles leave degenerate and differently oriented capsules deterministically",
    {
      point: capsuleEscape({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }).every(
        Number.isFinite,
      ),
      xAxis: capsuleEscape({ x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }).every(
        Number.isFinite,
      ),
      diagonal: capsuleEscape(
        { x: -1, y: -1, z: 0 },
        { x: 1, y: 1, z: 0 },
      ).every(Number.isFinite),
    },
    { point: true, xAxis: true, diagonal: true },
  );
};

const clean = (validation: IAutoMovieValidation): boolean =>
  validation.success === true;
