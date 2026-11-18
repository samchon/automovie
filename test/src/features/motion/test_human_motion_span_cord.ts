import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "@automovie/archetypes";
import { Vector3, softBodySurfaceGeometry } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodySurface,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject, HumanPerformance } from "@automovie/motions";
import {
  type IAutoMovieSceneSoftProps,
  buildSceneSoftProps,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose, vclose } from "../internal/predicates";

/** The declared line lengths are the sides of a 3-4-5 half-triangle in metres. */
const SPAN: number = 1;
const LENGTH: number = 5 / 4;
const RADIUS: number = 1 / 32;
const END: number = 1 / 8;

/** Native first travel is nonzero so the placed seed differs from the model rest. */
const START_TRAVEL: number = 1 / 16;

/**
 * A slack cord uses the radius, length and endpoints of a model's declared
 * span at rest and when its rigid prop and slider move.
 *
 * Scenarios:
 *
 * 1. Build three links from a span with a 1 m chord and a 1.25 m rest length.
 *    The three links sum to the authored length; the low point lies 3/8 m
 *    below the anchors; particle masses sum to the authored mass.
 * 2. The native initial step rebuilds the rest legs for a nonzero slider
 *    starting travel. Later samples follow that slider and the moving owner.
 *    The final allowed sample reaches the CPU scene tube. A reverse seek
 *    restores the initial particles.
 * 3. Overextended and nonfinite initial placements refuse on sampling. A
 *    missing span, one link and a film beyond the step budget also refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the model geometry, moving endpoints, independent dimensions and refused inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Uses real Archetype span authoring, observes the public performance's native soft samples and projects the final allowed sample through the canonical surface into a CPU scene tube. The direct samples distinguish incorrect placement and playback from tube construction, which test_render_soft_cord checks.
 * @evidence contracts/development/testing.md#independent-expectations Pythagoras gives the 3/8 m altitude for half-chord 1/2 m and leg 5/8 m. A +90 degree Y rotation sends local +X to world -Z so the endpoints follow the owner's translation and slider displacement algebraically. The render check measures only longitudinal ring centres, within 1e-6 m for Float32 rounding. The reverse seek compares two observations of the same film instant.
 * @evidence contracts/development/testing.md#distinguishing-cases An odd link count pins unequal subdivisions without changing overall dimensions. An owner subject with the grip prefix still supplies both anchors. Nonzero initial travel distinguishes declared geometry from the actual start placement. The budget permits its final step and refuses one additional step. Initial overextension, nonfinite placement, a missing span and one link exercise distinct refusals.
 * @evidence contracts/development/testing.md#execution-ownership test_human_motion_span_cord uses an in-memory model and four soft steps, without a performer pose, action plan or visual host, plus CPU-only geometry.
 */
export function test_human_motion_span_cord(): void {
  const model: Archetype<"slide", never> = fixture();
  const placement = (
    seconds: number,
  ): IAutoMovieMotionHumanObject.Placement => ({
    at: { x: 2, y: 3, z: 1 + seconds },
    yaw: 90,
  });
  const owner: IAutoMovieMotionHumanProp = HumanObject.prop(
    "grip:carrier",
    model,
    placement(0),
    placement,
    undefined,
    [
      {
        articulation: "slide",
        start: 0,
        duration: END,
        travel: (seconds: number): number => START_TRAVEL + seconds / 2,
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
  const cord: IAutoMovieMotionHumanProp = HumanObject.cord(
    model,
    "line",
    options,
  );
  const domain: IAutoMovieSoftBodyDomain = cord.soft!;
  let actualLength: number = 0;
  for (let index: number = 1; index < domain.lattice.rows; ++index)
    actualLength += Vector3.length(
      Vector3.subtract(
        point(domain.rest, index),
        point(domain.rest, index - 1),
      ),
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

  const performance: IAutoMovieMotionHumanPerformance = place(owner, cord, END);
  const first: number[] = [...performance.soft("cord", 0)];
  TestValidator.predicate(
    "the initial seed uses the actual slider pose",
    () => {
      const restLeg: number = LENGTH / 2;
      const halfChord: number = (SPAN + START_TRAVEL) / 2;
      return vclose(
        point(first, 1),
        {
          x: 2,
          y: 3 - Math.sqrt(restLeg * restLeg - halfChord * halfChord),
          z: (1 - START_TRAVEL) / 2,
        },
        1e-9,
      );
    },
  );

  const middle: number[] = performance.soft("cord", END / 2);
  const last: number[] = performance.soft("cord", END);
  const samples: readonly (readonly [number, readonly number[]])[] = [
    [0, first],
    [END / 2, middle],
    [END, last],
  ];
  TestValidator.predicate(
    "the hard anchors follow the owner and slider through the last allowed step",
    () =>
      samples.every(
        ([seconds, positions]: readonly [number, readonly number[]]): boolean =>
          vclose(point(positions, 0), { x: 2, y: 3, z: 1 + seconds }, 1e-9) &&
          vclose(
            point(positions, 3),
            { x: 2, y: 3, z: seconds / 2 - START_TRAVEL },
            1e-9,
          ),
      ),
  );
  const rewound: number[] = performance.soft("cord", 0);
  TestValidator.predicate(
    "seeking back restores the initial particle positions",
    () =>
      rewound.length === first.length &&
      first.every((coordinate: number, index: number): boolean =>
        nclose(rewound[index]!, coordinate, 1e-9),
      ),
  );

  // A single moved sample crosses the producer-to-renderer boundary.
  const surface: IAutoMovieSoftBodySurface = softBodySurfaceGeometry({
    domain,
    state: {
      domain: domain.id,
      state: null,
      step: END / options.solver.fixedStepSeconds,
      time: END,
      positions: last,
      velocities: [],
      maxSpeed: 0,
      maxStrain: 0,
      contacts: 0,
    },
  });
  const scene: THREE.Scene = new THREE.Scene();
  const layer: IAutoMovieSceneSoftProps = buildSceneSoftProps(scene);
  try {
    layer.update([
      {
        subject: cord.subject,
        status: "solved",
        cordRadius: domain.contact!.thickness,
        surface,
      },
    ]);
    const mesh: THREE.Object3D | undefined = scene.getObjectByName("soft:cord");
    TestValidator.predicate("the scene tube reaches the moved anchors", () => {
      if (!(mesh instanceof THREE.Mesh) || !mesh.visible) return false;
      const vertices: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
        mesh.geometry.getAttribute("position");
      const ringSize: number = vertices.count / 4;
      const lastRing: number = vertices.count - ringSize;
      const opposite: number = (ringSize - 1) / 2;
      return (
        mesh.userData.step === options.solver.maxSteps &&
        Number.isInteger(opposite) &&
        opposite > 0 &&
        nclose(
          (vertices.getZ(0) + vertices.getZ(opposite)) / 2,
          1 + END,
          1e-6,
        ) &&
        nclose(
          (vertices.getZ(lastRing) + vertices.getZ(lastRing + opposite)) / 2,
          END / 2 - START_TRAVEL,
          1e-6,
        )
      );
    });
  } finally {
    layer.dispose();
  }
  const extended: IAutoMovieMotionHumanProp = {
    ...owner,
    tracks: [{ articulation: "slide", start: 0, travel: (): number => 3 / 8 }],
  };
  const overextended: IAutoMovieMotionHumanPerformance = place(
    extended,
    cord,
    0,
  );
  TestValidator.error(
    "the placed start cannot be longer than its declared cord",
    (): number[] => overextended.soft("cord", 0),
  );
  const unplaced: IAutoMovieMotionHumanPerformance = place(
    {
      ...owner,
      motion: (): IAutoMovieRigidTransform => ({
        ...owner.frame,
        position: { ...owner.frame.position, y: Infinity },
      }),
    },
    cord,
    0,
  );
  TestValidator.error(
    "a nonfinite initial position refuses before integration",
    () => unplaced.soft("cord", 0),
  );
  TestValidator.error("over-budget films refuse at construction", () =>
    place(owner, cord, END + domain.solver.fixedStepSeconds),
  );
  TestValidator.error(
    "span must be declared",
    (): IAutoMovieMotionHumanProp =>
      HumanObject.cord(model, "missing", options),
  );
  TestValidator.error("slack cord needs two or more links", () =>
    HumanObject.cord(model, "line", { ...options, links: 1 }),
  );
}

/** The rig's cue gives the performance a horizon without an unrelated actor. */
function place(
  owner: IAutoMovieMotionHumanProp,
  cord: IAutoMovieMotionHumanProp,
  end: number,
): IAutoMovieMotionHumanPerformance {
  return new HumanPerformance({
    seed: "span",
    performers: [],
    props: [owner, cord],
    cues: { rig: [{ name: "end", seconds: end }] },
    composition: {
      kind: "at",
      anchor: "rig",
      event: "end",
      offset: 0,
      part: { kind: "sequence", parts: [] },
    },
  });
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
      travel: 1 / 2,
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
