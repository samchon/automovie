import {
  sampleSoftBody,
  simulateSoftBody,
  softBodyStateDigest,
} from "@automovie/engine";
import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";
import { exactValues, softPanel } from "../internal/softFixtures";

/** A panel with every accumulating term live: gravity, drag, wind, contact. */
const seekable: () => IAutoMovieSoftBodyDomain = (): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns: 4,
    rows: 4,
    origin: { x: -0.375, y: 0, z: 0 },
    overrides: {
      id: "seekable",
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: { x: 0, y: -8, z: 0 },
        drag: 0.75,
        iterations: 3,
        stiffness: { structural: 1, shear: 0.5, bend: 0.25 },
        referenceSpeed: 4,
        maxSteps: 64,
      },
      anchors: [
        { id: "hook", particle: 0, position: null },
        { id: "hem", particle: 3, position: null },
      ],
      states: [
        {
          id: "gathered",
          anchors: [{ anchor: "hem", position: { x: -0.25, y: 0, z: 0 } }],
        },
      ],
      colliders: [
        {
          kind: "plane",
          id: "floor",
          normal: { x: 0, y: 1, z: 0 },
          offset: -1.5,
        },
      ],
      wind: {
        direction: { x: 0.5, y: 0, z: 1 },
        acceleration: 1,
        gustAcceleration: 3,
        gustHz: 6,
      },
    },
  });

/**
 * Seeking a soft body is absolute: any order of requests yields the same states
 * as playing straight through, and the same request twice yields bit-identical
 * bytes.
 *
 * This is the product contract that lets a shot be scrubbed, re-rendered from
 * the middle, or chunked across workers. It holds because a state is a pure
 * function of `(domain, step, namedState)` with nothing cached between calls.
 * This case checks selected local replay results on a panel with gravity, drag, a gusting
 * draught, a reflecting floor and two anchors.
 *
 * Scenarios:
 *
 * 1. Steps 0..16 requested in a scrambled order digest identically to the same
 *    steps requested in ascending order, and the digests actually move, so the
 *    match is not the match of a state that never changed.
 * 2. Asking twice for the same step returns bit-identical position, velocity and
 *    measurement arrays.
 * 3. A named state is part of the identity of a state: the same step under
 *    `gathered` differs from the default, and both are individually stable.
 * 4. `sampleSoftBody` snaps a shot second down to its step: any time inside a step
 *    reads that step's state, a negative time reads step 0, and the exact step
 *    boundary reads the new step and not the old one.
 * 5. An unreachable seek is refused rather than guessed: a fractional step, a
 *    negative step, a step past the declared budget, a non-finite sample time
 *    and an undeclared named state each throw with the domain named, while the
 *    exact budget boundary is reachable. A solve that genuinely leaves the
 *    reals is named at the step it first did so, rather than turning into NaN
 *    frames a renderer would draw as nothing at all.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls simulateSoftBody in ascending and scrambled order, repeats a step with exact numeric-array/scalar checks, separates a held named state, exercises sampleSoftBody quantization, and checks located refusal messages for invalid seeks, times, states and a nonfinite integration result.
 * @evidence contracts/testing.md#independent-expectations Absolute replay must be independent of prior calls, while a moved anchor changes its boundary condition. The dyadic 1/64 s clock independently maps 9.75 steps to 9 and the exact tenth boundary to 10; budget 64 admits 64 and refuses 65. Cross-order digests are a metamorphic oracle with 32-bit collisions and omitted metadata, not an independent physical trajectory or universal cross-host proof; exactValues/Object.is preserve the separate repeat case's bit-sensitive numerical contract.
 * @evidence contracts/testing.md#distinguishing-cases Five groups preserve scrambled steps 0..16, a repeated nontrivial step, default/held states, negative/zero/interior/boundary times, integer/domain/budget refusals and a runaway step. Near-boundary allowance, live moving boundaries and analytic physical accuracy are covered elsewhere or outside this replay test.
 * @evidence contracts/testing.md#execution-ownership The named test_soft_body_seek_determinism entry runs portable CPU replay and sampling directly with shared softPanel/exactValues fixtures; no worker, renderer, host or dynamically registered case participates.
 */
export function test_soft_body_seek_determinism(): void {
  const domain: IAutoMovieSoftBodyDomain = seekable();
  const ascending: string[] = Array.from(
    { length: 17 },
    (_: unknown, step: number): string =>
      softBodyStateDigest(simulateSoftBody(domain, step)),
  );
  const scrambled: number[] = [
    13, 0, 7, 16, 2, 11, 4, 9, 15, 1, 6, 12, 3, 10, 5, 8, 14,
  ];
  TestValidator.equals(
    "an absolute seek does not care what was sampled before it",
    namedFacts([
      [
        "digestsMatch",
        (): boolean =>
          scrambled.every(
            (step: number): boolean =>
              softBodyStateDigest(simulateSoftBody(domain, step)) ===
              ascending[step],
          ),
      ],
      [
        "digestsMove",
        (): boolean => new Set(ascending).size === ascending.length,
      ],
    ]),
    { digestsMatch: true, digestsMove: true },
  );

  const once: IAutoMovieSoftBodyState = simulateSoftBody(domain, 48);
  const twice: IAutoMovieSoftBodyState = simulateSoftBody(domain, 48);
  TestValidator.equals(
    "the same seek twice is bit-identical",
    namedFacts([
      [
        "positions",
        (): boolean => exactValues(once.positions, twice.positions),
      ],
      [
        "velocities",
        (): boolean => exactValues(once.velocities, twice.velocities),
      ],
      ["speed", (): boolean => Object.is(once.maxSpeed, twice.maxSpeed)],
      ["strain", (): boolean => Object.is(once.maxStrain, twice.maxStrain)],
      ["contacts", (): boolean => once.contacts === twice.contacts],
      [
        "digest",
        (): boolean => softBodyStateDigest(once) === softBodyStateDigest(twice),
      ],
    ]),
    {
      positions: true,
      velocities: true,
      speed: true,
      strain: true,
      contacts: true,
      digest: true,
    },
  );

  const gathered: IAutoMovieSoftBodyState = simulateSoftBody(
    domain,
    48,
    "gathered",
  );
  TestValidator.equals(
    "a named state is part of the identity of a solved state",
    namedFacts([
      [
        "differs",
        (): boolean =>
          softBodyStateDigest(gathered) !== softBodyStateDigest(once),
      ],
      [
        "stable",
        (): boolean =>
          softBodyStateDigest(simulateSoftBody(domain, 48, "gathered")) ===
          softBodyStateDigest(gathered),
      ],
      ["named", (): boolean => gathered.state === "gathered"],
      ["default", (): boolean => once.state === null],
    ]),
    { differs: true, stable: true, named: true, default: true },
  );

  const dt: number = domain.solver.fixedStepSeconds;
  TestValidator.equals(
    "a shot second snaps down to its fixed step",
    namedFacts([
      ["inside", (): boolean => sampleSoftBody(domain, dt * 9.75).step === 9],
      ["boundary", (): boolean => sampleSoftBody(domain, dt * 10).step === 10],
      ["negative", (): boolean => sampleSoftBody(domain, -5).step === 0],
      ["zero", (): boolean => sampleSoftBody(domain, 0).step === 0],
      [
        "sameAsSeek",
        (): boolean =>
          softBodyStateDigest(sampleSoftBody(domain, dt * 9.75)) ===
          ascending[9],
      ],
      [
        "namedSample",
        (): boolean =>
          sampleSoftBody(domain, dt * 3, "gathered").state === "gathered",
      ],
    ]),
    {
      inside: true,
      boundary: true,
      negative: true,
      zero: true,
      sameAsSeek: true,
      namedSample: true,
    },
  );

  TestValidator.equals(
    "an unreachable seek is refused, never guessed",
    namedFacts([
      [
        "fractional",
        (): boolean =>
          throwsError(
            (): IAutoMovieSoftBodyState => simulateSoftBody(domain, 1.5),
            ["seekable", "non-negative integer"],
          ),
      ],
      [
        "negativeStep",
        (): boolean =>
          throwsError(
            (): IAutoMovieSoftBodyState => simulateSoftBody(domain, -1),
            ["non-negative integer"],
          ),
      ],
      [
        "pastBudget",
        (): boolean =>
          throwsError(
            (): IAutoMovieSoftBodyState => simulateSoftBody(domain, 65),
            ["budget stops at 64"],
          ),
      ],
      ["atBudget", (): boolean => simulateSoftBody(domain, 64).step === 64],
      [
        "nonFiniteTime",
        (): boolean =>
          throwsError(
            (): IAutoMovieSoftBodyState => sampleSoftBody(domain, Number.NaN),
            ["non-finite time"],
          ),
      ],
      [
        "runaway",
        (): boolean =>
          throwsError(
            (): IAutoMovieSoftBodyState =>
              simulateSoftBody(
                softPanel({
                  columns: 2,
                  rows: 2,
                  overrides: {
                    id: "runaway",
                    solver: {
                      ...domain.solver,
                      gravity: { x: 0, y: Number.NEGATIVE_INFINITY, z: 0 },
                    },
                    anchors: [],
                    states: [],
                    colliders: [],
                    wind: null,
                  },
                }),
                1,
              ),
            ['soft body "runaway" produced a non-finite state at step 1'],
          ),
      ],
      [
        "unknownState",
        (): boolean =>
          throwsError(
            (): IAutoMovieSoftBodyState => simulateSoftBody(domain, 1, "shut"),
            ['does not declare a named state "shut"'],
          ),
      ],
    ]),
    {
      fractional: true,
      negativeStep: true,
      pastBudget: true,
      atBudget: true,
      nonFiniteTime: true,
      unknownState: true,
      runaway: true,
    },
  );
}
