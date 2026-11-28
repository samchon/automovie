import { AutoMovieRenderInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspection.selectPlacedChecks` selects the declared checks active at one
 * placed sample.
 *
 * Scenarios:
 *
 * 1. A support with phases [0, 1) and [1, 2) is checked at second 1 through its
 *    second phase, `rail.phases[1]`, and at second 2 not at all; the rule's key,
 *    required flag and paths are carried.
 * 2. A grip window's expected transform given as a function is evaluated at the
 *    sample's second.
 * 3. A custody schedule picks the latest entry at or before the second; the
 *    holder is the named holder the prop sits under, `null` when it sits under
 *    the scene only, and left out when it sits elsewhere.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases describe half-open support windows, time-dependent grip and custody evidence in three scene hierarchies.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that only active placed checks are selected with their key, requirement and paths, that grip uses the sample time, and that custody distinguishes a holder, scene root and outside hierarchy.
 * @evidence contracts/development/testing.md#independent-expectations Uses fixed phase edges at 1 and 2 seconds, literal custody rows and known parent identities to specify each expected selected check.
 */
export function test_render_scene_select_placed_checks(): void {
  const scene: THREE.Group = new THREE.Group();
  const socket: THREE.Object3D = new THREE.Object3D();
  const support: THREE.Object3D = new THREE.Object3D();
  const anchor: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  const at = (filmSeconds: number): { filmSeconds: number } => ({ filmSeconds });

  const supports = [
    {
      key: "rail",
      required: true,
      path: "rail",
      paths: ["hero", "rail"],
      maxGap: 0.01,
      maxSlip: 0.02,
      phases: [
        { from: 0, to: 1, socket, support, anchor },
        { from: 1, to: 2, socket, support, anchor },
      ],
    },
  ];
  const second = AutoMovieRenderInspection.selectPlacedChecks({
    scene,
    time: at(1),
    fps: 24,
    supports,
  });
  TestValidator.equals(
    "support phase",
    second.map((check) => [check.key, check.required, check.paths, check.input.kind === "scene-support" ? check.input.path : null]),
    [["rail", true, ["hero", "rail"], "rail.phases[1]"]],
  );
  TestValidator.equals(
    "support over",
    AutoMovieRenderInspection.selectPlacedChecks({ scene, time: at(2), fps: 24, supports }),
    [],
  );

  const hand: THREE.Object3D = new THREE.Object3D();
  const prop: THREE.Object3D = new THREE.Object3D();
  const grips = [
    {
      key: "grip",
      required: false,
      path: "grip",
      maxDistance: 0.05,
      maxAngle: 0.1,
      windows: [
        {
          from: 0,
          to: 4,
          hand,
          prop,
          expected: (filmSeconds: number) => ({
            position: { x: filmSeconds, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          }),
        },
      ],
    },
  ];
  const gripped = AutoMovieRenderInspection.selectPlacedChecks({ scene, time: at(3), fps: 24, grips });
  const grip = gripped[0];
  TestValidator.equals(
    "grip expected at the second",
    grip !== undefined && grip.input.kind === "scene-grip"
      ? grip.input.sample?.expected.position.x
      : null,
    3,
  );

  const left: THREE.Object3D = new THREE.Object3D();
  const held: THREE.Object3D = new THREE.Object3D();
  left.add(held);
  scene.add(left);
  const loose: THREE.Object3D = new THREE.Object3D();
  scene.add(loose);
  const stray: THREE.Object3D = new THREE.Object3D();
  const custody = (carried: THREE.Object3D) => [
    {
      key: "custody",
      required: true,
      path: "prop",
      prop: carried,
      holders: { left },
      schedule: [
        { from: 0, holder: "left" },
        { from: 3, holder: null },
      ],
    },
  ];
  const input = (carried: THREE.Object3D, filmSeconds: number): unknown[] =>
    AutoMovieRenderInspection.selectPlacedChecks({
      scene,
      time: at(filmSeconds),
      fps: 24,
      custody: custody(carried),
    }).map((check) => check.input);
  TestValidator.equals("held", input(held, 1), [
    { kind: "custody", path: "prop", allowed: ["left"], holder: "left" },
  ]);
  TestValidator.equals("later entry", input(held, 4), [
    { kind: "custody", path: "prop", allowed: [null], holder: "left" },
  ]);
  TestValidator.equals("loose in the scene", input(loose, 1), [
    { kind: "custody", path: "prop", allowed: ["left"], holder: null },
  ]);
  TestValidator.equals("elsewhere", input(stray, 1), [
    { kind: "custody", path: "prop", allowed: ["left"] },
  ]);
}