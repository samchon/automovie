import type {
  IAutoMovieMotionHumanPerformanceSoft,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieSoftAnchor,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanForce, HumanPerformanceSoft } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../../internal/fixtures/standingPerformanceState";
import { softPanel } from "../../../internal/softPanel";

/**
 * How far an interpolated particle may stand from its closed form, metres: a
 * share of a metre difference, far above its rounding.
 */
const PARTICLE: number = 1e-12;

/** No offset. */
const ZERO = { x: 0, y: 0, z: 0 };

/**
 * `HumanPerformanceSoft` reads a soft prop's solve: `held` lists the hands its
 * domain anchors, `at` interpolates its particles between the two steps about a
 * second, `load` holds each step's hand force over its step, and `sustained`
 * gives one force record per anchored hand over the whole film and per other
 * hand grip over its window.
 *
 * A cloth solved in half-second steps moves its one particle from (0, 0, 0) to
 * (1, 2, 3) to (3, 4, 5), pulling the actor's left hand with 1 N then 2 N along
 * `+X`.
 *
 * Scenarios:
 *
 * 1. The cloth's domain anchors the actor's left hand and the other's right; a
 *    head bone or a scene node is no hand.
 * 2. At 0.25 s the particle is halfway, (0.5, 1, 1.5); at 1 s it is the last
 *    step; before the film and after its last step it is clamped.
 * 3. The left hand's load is 1 N over the first step and 2 N from the second on;
 *    a hand the cloth does not pull bears nothing.
 * 4. The sustained forces are the anchored left hand's over the whole film and
 *    the other's right-hand grip over 1 to 2 s; a grip of the anchored hand and
 *    a worn span add none.
 */
export async function test_unit_motions_perform_soft_readers(): Promise<void> {
  const anchor = (
    id: string,
    particle: number,
    binding?: IAutoMovieSoftAnchor["binding"],
  ): IAutoMovieSoftAnchor => ({
    id,
    particle,
    position: null,
    ...(binding === undefined ? {} : { binding }),
  });
  const domain = softPanel({
    columns: 2,
    rows: 4,
    overrides: {
      anchors: [
        anchor("a", 0, {
          kind: "actor-bone",
          actor: "actor",
          bone: "leftHand",
          offset: ZERO,
        }),
        anchor("b", 3, {
          kind: "actor-bone",
          actor: "actor",
          bone: "head",
          offset: ZERO,
        }),
        anchor("c", 5, { kind: "node", node: "pole", offset: ZERO }),
        anchor("d", 7, {
          kind: "actor-bone",
          actor: "other",
          bone: "rightHand",
          offset: ZERO,
        }),
        anchor("e", 6),
      ],
    },
  });
  const cloth: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop("cloth", { affordances: [] }, {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    }),
    soft: domain,
  };
  const { state } = await standingPerformanceState([]);
  const solved: IAutoMovieMotionHumanPerformanceSoft.ISolved = {
    dt: 0.5,
    steps: [
      new Float64Array([0, 0, 0]),
      new Float64Array([1, 2, 3]),
      new Float64Array([3, 4, 5]),
    ],
    loads: [
      new Map([["actor:left", { x: 1, y: 0, z: 0 }]]),
      new Map([["actor:left", { x: 2, y: 0, z: 0 }]]),
    ],
  };
  const self: IAutoMovieMotionHumanPerformanceState = {
    ...state,
    props: new Map([["cloth", cloth]]),
    soft: new Map([["cloth", solved]]),
    grips: new Map([
      [
        "cloth",
        [
          { subject: "actor", side: "left", from: 0, to: 1 },
          { subject: "other", side: "right", from: 1, to: 2 },
          { subject: "actor", side: "right", bone: "head", from: 0, to: 3 },
        ],
      ],
    ]),
  };

  // 1. Held hands.
  TestValidator.equals("the anchored hands", HumanPerformanceSoft.held(domain), [
    { particle: 0, person: "actor", side: "left" },
    { particle: 7, person: "other", side: "right" },
  ]);

  // 2. Particles.
  const at = (seconds: number): number[] =>
    HumanPerformanceSoft.at(self, "cloth", seconds);
  TestValidator.predicate(
    "interpolated particles",
    close(at(0.25), [0.5, 1, 1.5]) &&
      close(at(0.75), [2, 3, 4]) &&
      close(at(1), [3, 4, 5]) &&
      close(at(5), [3, 4, 5]) &&
      close(at(-1), [0, 0, 0]),
  );

  // 3. Loads.
  const load = (person: string, side: "left" | "right", seconds: number) =>
    HumanPerformanceSoft.load(self, "cloth", person, side, seconds).x;
  TestValidator.predicate(
    "a step's force held over it",
    load("actor", "left", 0.2) === 1 &&
      load("actor", "left", 0.5) === 2 &&
      load("actor", "left", 9) === 2 &&
      load("actor", "left", -1) === 1 &&
      load("actor", "right", 0.2) === 0,
  );

  // 4. Sustained forces.
  const forces = HumanPerformanceSoft.sustained(self);
  TestValidator.equals(
    "one force per anchored hand and other grip",
    forces.map((f) => [f.subject, f.at, f.from, f.to]),
    [
      ["actor", "palmLeft", 0, state.duration],
      ["other", "palmRight", 0, state.duration],
    ],
  );
  const gripped = HumanPerformanceSoft.sustained({
    ...self,
    props: new Map([
      ["cloth", { ...cloth, soft: { ...domain, anchors: [] } }],
    ]),
  });
  TestValidator.equals(
    "grips bear the cloth over their windows",
    gripped.map((f) => [f.subject, f.at, f.from, f.to]),
    [
      ["actor", "palmLeft", 0, 1],
      ["other", "palmRight", 1, 2],
    ],
  );
  TestValidator.predicate(
    "a force reads its hand's load",
    HumanForce.at(forces[0]!, 0.6).x === 2,
  );
}

/** Whether two rows agree within the particle bound. */
function close(actual: number[], expected: number[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every(
      (v: number, i: number): boolean => Math.abs(v - expected[i]!) <= PARTICLE,
    )
  );
}
