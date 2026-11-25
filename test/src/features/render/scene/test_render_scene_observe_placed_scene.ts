import { samplePhysicalContactEvents } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalFrame,
} from "@automovie/interface";
import {
  type IObserveAutoMoviePlacedScene,
  observeAutoMoviePlacedScene,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { Group, PerspectiveCamera, Scene } from "three";

import { IDENTITY_TRANSFORM } from "../../internal/fixtures";
import { nclose } from "../../internal/predicates";

/**
 * Observe a placed native scene and separately declared contact and continuity
 * evidence at exact film seconds.
 */
export function test_render_scene_observe_placed_scene(): void {
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  camera.quaternion.set(0, 0, 0, 2);
  const deck = new Group();
  deck.position.set(10, 2, 4);
  deck.rotation.z = Math.PI / 2;
  const sole = new Group();
  sole.position.set(9.875, 4, 5);
  const prop = new Group();
  prop.position.set(10, 2.5, 4);
  prop.rotation.z = Math.PI / 2;
  const manual = new Group();
  manual.matrixAutoUpdate = false;
  manual.position.x = 99;
  manual.matrix.makeTranslation(2, 5, 3);
  scene.add(deck, sole, prop, manual);
  // The observer reads the displayed world matrices the host already settled.
  scene.updateMatrixWorld();

  const time = {
    filmSeconds: 1.5,
    outputFrame: 45,
    shot: { path: "entry[2]", seconds: 4.25 },
  };
  const physicalFrame: IAutoMoviePhysicalFrame = {
    seconds: time.filmSeconds,
    bodies: {
      rook: {
        toe: {
          position: { x: 10, y: 4, z: 5 },
          rotation: IDENTITY_TRANSFORM.rotation,
          velocity: { x: 0, y: 0, z: 0 },
          angularVelocity: { x: 0, y: 0, z: 0 },
        },
      },
    },
  };
  const uninstrumented = observeAutoMoviePlacedScene({
    scene,
    camera,
    time,
    physicalFrame,
  });
  TestValidator.predicate(
    "native authority and stock unsupported coverage",
    () =>
      uninstrumented.findings.length === 1 &&
      uninstrumented.findings.some(
        ({ paths }) => paths[0] === "camera.quaternion",
      ) &&
      [
        "support",
        "grip",
        "transform-continuity",
        "custody",
        "authored-track",
      ].every((check) =>
        uninstrumented.coverage.some(
          (entry) =>
            entry.check === check &&
            !entry.required &&
            entry.status === "unsupported",
        ),
      ),
  );
  const point = { x: 9.875, y: 4, z: 5 };
  const normal = { x: 1, y: 0, z: 0 };
  const receipt: IAutoMovieContactReceipt = {
    id: "contact:toe:deck",
    source: "solver",
    seconds: time.filmSeconds,
    endSeconds: time.filmSeconds,
    a: { body: "rook", bone: "toe", shape: "sole", material: "leather" },
    b: { body: "deck", bone: "deck", shape: "floor", material: "wood" },
    point,
    normal,
    impulse: 3,
    separation: -0.02,
    compression: 0,
    samples: [
      {
        seconds: time.filmSeconds,
        duration: 1 / 120,
        point,
        normal,
        impulse: 3,
        separation: -0.02,
        compression: 0,
      },
    ],
  };
  const received = samplePhysicalContactEvents(receipt, time.filmSeconds)[0]!;
  const edge = {
    kind: "step",
    path: "lantern.transform",
    boundary: "continuous",
    before: { seconds: 1.25, transform: IDENTITY_TRANSFORM },
    after: {
      seconds: 1.375,
      transform: { ...IDENTITY_TRANSFORM, translation: { x: 0.5, y: 0, z: 0 } },
    },
    maxDistance: 0.25,
  } as const;
  const checks: readonly IObserveAutoMoviePlacedScene.ICheck[] = [
    {
      key: "rook:left-sole",
      required: true,
      paths: ["actors/rook/sole", "sets/deck"],
      input: {
        kind: "scene-support",
        path: "rook.contact",
        maxGap: 0.05,
        maxSlip: 0.05,
        sample: { socket: sole, support: deck, anchor: { x: 2, y: 0, z: 1 } },
      },
      observedContact: {
        status: "measured",
        seconds: received.seconds,
        separation: received.separation,
        impulse: received.impulse,
      },
    },
    {
      key: "rook:lantern",
      required: true,
      input: {
        kind: "scene-grip",
        path: "rook.grip",
        maxDistance: 0.1,
        maxAngle: 0.01,
        sample: {
          hand: deck,
          prop,
          expected: {
            position: { x: 0.25, y: 0, z: 0 },
            rotation: IDENTITY_TRANSFORM.rotation,
          },
        },
      },
    },
    { key: "lantern:continuous", required: true, input: edge },
    { key: "lantern:cut", required: true, input: { ...edge, boundary: "cut" } },
  ];
  const placed = observeAutoMoviePlacedScene({ scene, camera, time, checks });
  const gap = placed.findings.find(({ check }) => check === "support");
  const grip = placed.findings.find(({ check }) => check === "grip");
  const step = placed.findings.find(
    ({ check }) => check === "transform-continuity",
  );
  TestValidator.predicate(
    "support gap retains actual receipt without treating it as a placement target",
    () =>
      gap?.category === "error" &&
      gap.confidence === "confirmed" &&
      gap.paths.join("|") === "actors/rook/sole|sets/deck|rook.contact.gap" &&
      nclose(gap.witness.point?.x ?? NaN, 9.875) &&
      gap.witness.measurements?.some(
        ({ name, value }) =>
          name === "gap" && typeof value === "number" && nclose(value, 0.125),
      ) === true &&
      gap.witness.measurements?.some(
        ({ name, value }) => name === "received-normal-impulse" && value === 3,
      ) === true,
  );
  TestValidator.predicate(
    "measured hand relation and explicit continuity interval retain real units",
    () =>
      grip?.key === "rook:lantern" &&
      grip.witness.measurements?.some(
        ({ name, value }) =>
          name === "distance" &&
          typeof value === "number" &&
          nclose(value, 0.25),
      ) === true &&
      step?.key === "lantern:continuous" &&
      step.witness.interval?.from === 1.25 &&
      step.witness.interval.to === 1.375 &&
      step.witness.time?.filmSeconds === 1.375 &&
      step.witness.time.outputFrame === undefined &&
      placed.coverage.some(
        ({ key, status }) => key === "lantern:cut" && status === "excluded",
      ),
  );
  const earlier = observeAutoMoviePlacedScene({
    scene,
    camera,
    time: { filmSeconds: 1.25 },
    checks,
  });
  TestValidator.predicate(
    "earlier inspection does not reuse future receipt or the previous visit",
    () =>
      earlier.findings.some(
        ({ check, witness }) =>
          check === "support" &&
          witness.measurements?.some(({ name }) => name === "gap") === true &&
          witness.measurements.every(
            ({ name }) => name !== "received-normal-impulse",
          ),
      ),
  );
}
