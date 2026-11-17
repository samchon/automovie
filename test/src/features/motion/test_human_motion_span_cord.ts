import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieSoftBodyDomain,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/** The declared line lengths are the sides of a 3-4-5 half-triangle in metres. */
const SPAN: number = 1;
const LENGTH: number = 5 / 4;
const RADIUS: number = 1 / 32;
const END: number = 1 / 8;

/**
 * A slack cord uses the radius, length and endpoints of a model's declared
 * span at rest and when its rigid prop and slider move.
 *
 * Scenarios:
 *
 * 1. Build three links from a span with a 1 m chord and a 1.25 m rest length.
 *    The three links sum to the authored length; the low point lies 3/8 m
 *    below the anchors; particle masses sum to the authored mass.
 * 2. At two native soft steps, both ends follow the moving owner's
 *    translation and quarter turn, and the second end follows its slider.
 * 3. A missing span or invalid link count is refused before any solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model geometry, moving endpoints, independent dimensions and refused inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Uses real Archetype span authoring and reads the prepared rest cord and the public performance's fixed-step soft states.
 * @evidence contracts/development/testing.md#independent-expectations Pythagoras gives the 3/8 m altitude for half-chord 1/2 m and leg 5/8 m. A +90 degree Y rotation sends local +X to world -Z so the endpoints follow the owner's translation and slider displacement algebraically.
 * @evidence contracts/development/testing.md#distinguishing-cases An odd link count pins unequal subdivisions without changing overall dimensions. The first endpoint follows only the owner and the second follows the articulated carrier as well. Missing line and one link fail.
 * @evidence contracts/development/testing.md#execution-ownership test_human_motion_span_cord uses an in-memory model and four soft steps, without a performer pose, action plan or visual host.
 */
export function test_human_motion_span_cord(): void {
  const model: Archetype<"slide", never> = fixture();
  const placement = (seconds: number): IAutoMovieMotionHumanObject.Placement => ({
    at: { x: 2, y: 3, z: 1 + seconds },
    yaw: 90,
  });
  const owner: IAutoMovieMotionHumanProp = HumanObject.prop(
    "carrier",
    model,
    placement(0),
    placement,
    undefined,
    [
      {
        articulation: "slide",
        start: 0,
        duration: END,
        travel: (seconds: number): number => seconds / 2,
      },
    ],
  );
  const options: IAutoMovieMotionHumanObject.ICord = {
    subject: "cord",
    owner,
    links: 3,
    mass: 1 / 5,
    friction: 0,
    solver: {
      fixedStepSeconds: 1 / 32,
      gravity: { x: 0, y: -9.80665, z: 0 },
      drag: 0,
      iterations: 4,
      stiffness: { structural: 1, shear: 0, bend: 0 },
      referenceSpeed: 1,
      maxSteps: 4,
    },
  };
  const cord: IAutoMovieMotionHumanProp = HumanObject.cord(model, "line", options);
  const domain: IAutoMovieSoftBodyDomain = cord.soft!;
  let actualLength: number = 0;
  for (let index: number = 1; index < domain.lattice.rows; ++index)
    actualLength += Vector3.length(
      Vector3.subtract(point(domain.rest, index), point(domain.rest, index - 1)),
    );
  TestValidator.predicate(
    "the cord takes its physical dimensions from the span",
    () =>
      domain.lattice.columns === 1 &&
      domain.lattice.rows === 4 &&
      nclose(actualLength, LENGTH, 1e-9) &&
      vclose(point(domain.rest, 1), { x: 2, y: 3 - 3 / 8, z: 0.5 }, 1e-9) &&
      nclose(domain.contact?.thickness ?? NaN, RADIUS, 1e-9),
  );
  TestValidator.predicate("the particle masses keep the supplied total", () =>
    nclose(
      domain.mass.reduce((sum: number, mass: number): number => sum + mass, 0),
      1 / 5,
      1e-9,
    ),
  );

  // The rig's cue gives the performance a horizon without an unrelated actor.
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "span",
    performers: [],
    props: [owner, cord],
    cues: { rig: [{ name: "end", seconds: END }] },
    composition: {
      kind: "at",
      anchor: "rig",
      event: "end",
      offset: 0,
      part: { kind: "sequence", parts: [] },
    },
  });
  for (const seconds of [0, 1 / 16, 1 / 8]) {
    const positions: number[] = performance.soft("cord", seconds);
    TestValidator.predicate(
      "both hard anchors follow their placed and articulated endpoints",
      () =>
        vclose(point(positions, 0), { x: 2, y: 3, z: 1 + seconds }, 1e-9) &&
        vclose(
          point(positions, 3),
          { x: 2, y: 3, z: seconds / 2 },
          1e-9,
        ),
    );
  }
  TestValidator.error("span must be declared", (): IAutoMovieMotionHumanProp =>
    HumanObject.cord(model, "missing", options),
  );
  TestValidator.error("slack cord needs two or more links", () =>
    HumanObject.cord(model, "line", { ...options, links: 1 }),
  );
}

/** Two fixtures separated by the chord, with the second on a +X slider. */
function fixture(): Archetype<"slide", never> {
  const v: typeof Vector3.create = Vector3.create;
  return new ArchetypeBuilder<"slide", never>({
    material: "steel",
    name: "fixture",
    draw: new ArchetypeDrawSession<never>("fixture", {}, undefined),
  })
    .box("stand", v(1 / 8, 1 / 8, 1 / 8), v(0, 0, 0))
    .box("runner", v(1 / 8, 1 / 8, 1 / 8), v(SPAN, 0, 0))
    .affordance({
      id: "slide",
      kind: "slider",
      frame: ArchetypeFrame.facing(v(SPAN, 0, 0), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      travel: 1 / 4,
      parts: ["runner"],
    })
    .span(
      "line",
      { part: "stand", at: v(0, 0, 0) },
      { part: "runner", at: v(0, 0, 0) },
      RADIUS,
      undefined,
      LENGTH,
    )
    .build(5);
}

/** Read an xyz particle from the flat lattice. */
function point(positions: readonly number[], index: number): IAutoMovieVector3 {
  return {
    x: positions[index * 3]!,
    y: positions[index * 3 + 1]!,
    z: positions[index * 3 + 2]!,
  };
}
