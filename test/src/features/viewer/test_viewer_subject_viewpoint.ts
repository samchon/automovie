import {
  type IAutoMovieViewerSnapshotRenderer,
  type IAutoMovieViewerSubjectView,
  applyAutoMovieViewerSubjectPose,
  autoMovieViewerPoseFromHeading,
  autoMovieViewerSubjectKey,
  autoMovieViewerTurntableViewpoints,
  captureAutoMovieViewerSubjectView,
  frameAutoMovieViewerSubject,
  parseAutoMovieViewerSubjectKey,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose, vclose } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Exercises subject-key syntax, numerical viewpoint poses and the existing snapshot ordering contract.
 *
 * Scenarios:
 * 1. Subject keys round-trip, preserve an id's internal at-sign before a revision and refuse malformed keys.
 * 2. Named turntable order and exact numerical fields repeat while unusable or duplicate-label plans refuse.
 * 3. Small, large, portrait and wide-lens boxes distinguish camera distance, target, clips and angles; malformed lenses refuse.
 * 4. A degenerate box retains its exact target and a positive eye stand-off/near clip.
 * 5. Heading and camera pose application precede resolution/draw and supplied encoding for planned/ad-hoc observations; malformed clips refuse and repeated requests retain borrowed labels.
 * 6. All inspection records declare deliveryEvidence=false and the existing type-level consumer refuses them.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real key/plan/pose/capture APIs and observes ids, numerical camera fields, resolution-before-draw callbacks and inspection metadata.
 * @evidence contracts/testing.md#independent-expectations Authored keys/centers/headings and independent numeric comparisons define pose expectations; the existing supplied encoder returns fixed bytes, so equal records do not prove actual image determinism.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts malformed keys/plans/lenses/clips, small/large/degenerate boxes, landscape/portrait framing, planned/ad-hoc capture and deliveryEvidence=false without weakening refusal cases.
 * @evidence contracts/testing.md#execution-ownership The named entry owns CPU cameras and existing typed snapshot callbacks, uses no browser/WebGL renderer/new driver, and leaves current source, native encoding and visible-frame proof unobserved.
 */
export function test_viewer_subject_viewpoint(): void {
  //----
  // 1. Subject identity belongs to its own key.
  //----
  TestValidator.equals(
    "a subject is named by kind, id and revision",
    [
      autoMovieViewerSubjectKey({
        kind: "element",
        id: "hall-oriel-2",
        revision: null,
      }),
      autoMovieViewerSubjectKey({
        kind: "model",
        id: "oriel",
        revision: "r7",
      }),
    ],
    ["element:hall-oriel-2", "model:oriel@r7"],
  );
  TestValidator.equals(
    "a subject key round-trips",
    parseAutoMovieViewerSubjectKey("space:solar@rev-3"),
    { kind: "space", id: "solar", revision: "rev-3" },
  );
  TestValidator.equals(
    "an id may carry its own at-sign",
    parseAutoMovieViewerSubjectKey("part:post@2@r1"),
    { kind: "part", id: "post@2", revision: "r1" },
  );
  TestValidator.equals(
    "a key without a revision states none",
    parseAutoMovieViewerSubjectKey("primitive:shaft"),
    { kind: "primitive", id: "shaft", revision: null },
  );
  const refusedKeys: string = [
    "hall-oriel-2",
    "shot:opening",
    "element:",
    "model:a@",
  ]
    .map((key: string): string => {
      try {
        parseAutoMovieViewerSubjectKey(key);
        return `${key}: accepted`;
      } catch {
        return `${key}: refused`;
      }
    })
    .join(", ");
  TestValidator.equals(
    "an unresolvable subject name is refused rather than guessed",
    refusedKeys,
    "hall-oriel-2: refused, shot:opening: refused, element:: refused, model:a@: refused",
  );

  //----
  // 2. The viewpoint plan belongs to the inspection.
  //----
  const plan: ReturnType<typeof autoMovieViewerTurntableViewpoints> =
    autoMovieViewerTurntableViewpoints({
      azimuthCount: 4,
      elevationsDeg: [20, -15],
    });
  TestValidator.equals(
    "a turntable plan names its viewpoints deterministically",
    plan.map(
      (
        viewpoint: import("../../../../packages/viewer/src/index").IAutoMovieViewerViewpoint,
      ): string => viewpoint.id,
    ),
    [
      "az000-el020",
      "az090-el020",
      "az180-el020",
      "az270-el020",
      "az000-eln015",
      "az090-eln015",
      "az180-eln015",
      "az270-eln015",
    ],
  );
  TestValidator.predicate(
    "the plan carries its own distance rule",
    nclose(plan[0]!.distanceFactor, 1.25, 0),
  );
  const repeatedPlan: ReturnType<typeof autoMovieViewerTurntableViewpoints> =
    autoMovieViewerTurntableViewpoints({
      azimuthCount: 4,
      elevationsDeg: [20, -15],
    });
  TestValidator.predicate(
    "the same numeric plan is produced again in the same named order",
    test12ValuesClose(repeatedPlan, plan),
  );
  const refusedPlans: ("accepted" | "refused")[] = [
    { azimuthCount: 0, elevationsDeg: [0] },
    { azimuthCount: 2.5, elevationsDeg: [0] },
    { azimuthCount: 2, elevationsDeg: [] },
    { azimuthCount: 2, elevationsDeg: [0], distanceFactor: 0 },
    { azimuthCount: 2, elevationsDeg: [20, 20.2] },
  ].map(
    (
      options:
        | {
            azimuthCount: number;
            elevationsDeg: number[];
            distanceFactor?: undefined;
          }
        | {
            azimuthCount: number;
            elevationsDeg: number[];
            distanceFactor: number;
          },
    ): "accepted" | "refused" => {
      try {
        autoMovieViewerTurntableViewpoints(options);
        return "accepted";
      } catch {
        return "refused";
      }
    },
  );
  TestValidator.equals(
    "a plan that cannot be counted or named is refused",
    refusedPlans,
    ["refused", "refused", "refused", "refused", "refused"],
  );

  //----
  // 3. One framing rule handles both scale extremes.
  //----
  const lens: { fovDeg: number; aspect: number } = {
    fovDeg: 40,
    aspect: 16 / 9,
  };
  const mullion: import("../../../../packages/viewer/src/index").IAutoMovieViewerSubjectPose =
    frameAutoMovieViewerSubject(
      {
        min: { x: 0, y: 2, z: 0 },
        max: { x: 0.05, y: 2.6, z: 0.05 },
      },
      {
        id: "az000-el000",
        azimuthDeg: 0,
        elevationDeg: 0,
        distanceFactor: 1.25,
      },
      lens,
    );
  const elevation: import("../../../../packages/viewer/src/index").IAutoMovieViewerSubjectPose =
    frameAutoMovieViewerSubject(
      {
        min: { x: -25, y: 0, z: -6 },
        max: { x: 25, y: 18, z: 6 },
      },
      {
        id: "az000-el000",
        azimuthDeg: 0,
        elevationDeg: 0,
        distanceFactor: 1.25,
      },
      lens,
    );
  TestValidator.predicate(
    "each eye stands off its own subject's centre",
    nclose(mullion.target.y, 2.3) && nclose(elevation.target.x, 0),
  );
  TestValidator.predicate(
    "a small part is framed from close and a large elevation from far",
    (): boolean =>
      mullion.position.z > 0.5 &&
      mullion.position.z < 3 &&
      elevation.position.z > 40 &&
      elevation.position.z < 120,
  );
  TestValidator.predicate(
    "the depth-buffer ratio is the same at both scales",
    nclose(mullion.far / mullion.near, elevation.far / elevation.near),
  );
  const portrait: import("../../../../packages/viewer/src/index").IAutoMovieViewerSubjectPose =
    frameAutoMovieViewerSubject(
      {
        min: { x: -25, y: 0, z: -6 },
        max: { x: 25, y: 18, z: 6 },
      },
      {
        id: "az000-el000",
        azimuthDeg: 0,
        elevationDeg: 0,
        distanceFactor: 1.25,
      },
      { fovDeg: 40, aspect: 0.5 },
    );
  TestValidator.predicate(
    "a portrait viewport backs off further, fitting the narrower field",
    (): boolean => portrait.position.z > elevation.position.z,
  );
  const orbit: import("../../../../packages/viewer/src/index").IAutoMovieViewerSubjectPose =
    frameAutoMovieViewerSubject(
      { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } },
      {
        id: "az090-el030",
        azimuthDeg: 90,
        elevationDeg: 30,
        distanceFactor: 2,
      },
      lens,
    );
  TestValidator.predicate(
    "azimuth and elevation place the eye around the subject",
    (): boolean =>
      orbit.position.x > 0 &&
      orbit.position.y > 0 &&
      nclose(orbit.position.z, 0, 1e-9) &&
      Math.abs(orbit.position.z) < 1e-9,
  );
  const wide: import("../../../../packages/viewer/src/index").IAutoMovieViewerSubjectPose =
    frameAutoMovieViewerSubject(
      { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } },
      { id: "az000-el000", azimuthDeg: 0, elevationDeg: 0, distanceFactor: 1 },
      { fovDeg: 179.9, aspect: 1 },
    );
  TestValidator.predicate(
    "an eye that sits on the subject still has a positive near plane",
    (): boolean => wide.near > 0,
  );
  const refusedLenses: ("accepted" | "refused")[] = [
    { fovDeg: 0, aspect: 1 },
    { fovDeg: 180, aspect: 1 },
    { fovDeg: 40, aspect: 0 },
  ].map(
    (candidate: { fovDeg: number; aspect: number }): "accepted" | "refused" => {
      try {
        frameAutoMovieViewerSubject(
          { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } },
          {
            id: "az000-el000",
            azimuthDeg: 0,
            elevationDeg: 0,
            distanceFactor: 1,
          },
          candidate,
        );
        return "accepted";
      } catch {
        return "refused";
      }
    },
  );
  TestValidator.equals("an unusable lens is refused", refusedLenses, [
    "refused",
    "refused",
    "refused",
  ]);

  //----
  // 4. A subject with no measured extent is still aimable.
  //----
  const degenerate: import("../../../../packages/viewer/src/index").IAutoMovieViewerSubjectPose =
    frameAutoMovieViewerSubject(
      { min: { x: 3, y: 1, z: -2 }, max: { x: 3, y: 1, z: -2 } },
      { id: "az000-el000", azimuthDeg: 0, elevationDeg: 0, distanceFactor: 1 },
      lens,
    );
  TestValidator.predicate(
    "a degenerate box is aimed at where the record does state",
    vclose(degenerate.target, { x: 3, y: 1, z: -2 }, 0),
  );
  TestValidator.predicate(
    "and the eye stands off it rather than inside it",
    (): boolean => degenerate.position.z > -2 && degenerate.near > 0,
  );

  //----
  // 5. The existing callbacks record pose application and encoding requests.
  //----
  const heading: import("../../../../packages/viewer/src/index").IAutoMovieViewerSubjectPose =
    autoMovieViewerPoseFromHeading(
      { x: 1, y: 2, z: 3 },
      { yaw: 90, pitch: 0 },
      lens,
      { near: 0.05, far: 200 },
    );
  TestValidator.predicate(
    "a bare position and heading resolve to a look-at pose",
    vclose(
      {
        x: Number(heading.target.x.toFixed(6)),
        y: Number(heading.target.y.toFixed(6)),
        z: Number(heading.target.z.toFixed(6)),
      },
      { x: 0, y: 2, z: 3 },
      0,
    ),
  );
  const refusedClips: ("accepted" | "refused")[] = [
    { near: 0, far: 1 },
    { near: 1, far: 1 },
  ].map((clip: { near: number; far: number }): "accepted" | "refused" => {
    try {
      autoMovieViewerPoseFromHeading(
        { x: 0, y: 0, z: 0 },
        { yaw: 0, pitch: 0 },
        lens,
        clip,
      );
      return "accepted";
    } catch {
      return "refused";
    }
  });
  TestValidator.equals("an unusable clip range is refused", refusedClips, [
    "refused",
    "refused",
  ]);

  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  applyAutoMovieViewerSubjectPose(camera, heading);
  TestValidator.predicate(
    "the pose is staged on the camera's own world matrix",
    vclose(
      {
        x: Number(camera.matrixWorld.elements[12]!.toFixed(6)),
        y: Number(camera.matrixWorld.elements[13]!.toFixed(6)),
        z: Number(camera.matrixWorld.elements[14]!.toFixed(6)),
      },
      { x: 1, y: 2, z: 3 },
      0,
    ) &&
      nclose(camera.near, 0.05, 0) &&
      nclose(camera.far, 200, 0) &&
      nclose(camera.fov, 40, 0) &&
      nclose(camera.aspect, lens.aspect, 0),
  );

  const order: string[] = [];
  const renderer: IAutoMovieViewerSnapshotRenderer = {
    render: (): number => order.push("render"),
    domElement: {
      width: 1280,
      height: 720,
      toDataURL: (type: string | undefined): string =>
        `data:${type ?? "image/png"};base64,AA==`,
    },
  };
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  const subject: { kind: "element"; id: string; revision: string } = {
    kind: "element" as const,
    id: "hall-oriel-2",
    revision: "r7",
  };
  let resolvedHeight: number = 0;
  const view: IAutoMovieViewerSubjectView = captureAutoMovieViewerSubjectView({
    subject,
    pose: mullion,
    viewpoint: "az000-el000",
    scene,
    camera,
    renderer,
    resolveForCamera: (
      _camera: THREE.PerspectiveCamera,
      viewportHeight: number,
    ): void => {
      order.push("resolve");
      resolvedHeight = viewportHeight;
    },
    snapshot: { mimeType: "image/jpeg", quality: 0.9 },
  });
  TestValidator.equals(
    "population resolution receives the supplied viewport before the draw request",
    { order, resolvedHeight },
    { order: ["resolve", "render"], resolvedHeight: 720 },
  );
  TestValidator.equals(
    "the observation carries the subject, the viewpoint and the image",
    {
      subject: view.subject,
      viewpoint: view.viewpoint,
      mimeType: view.image.mimeType,
      width: view.image.width,
      height: view.image.height,
    },
    {
      subject,
      viewpoint: "az000-el000",
      mimeType: "image/jpeg",
      width: 1280,
      height: 720,
    },
  );
  const repeatedView: IAutoMovieViewerSubjectView =
    captureAutoMovieViewerSubjectView({
      subject,
      pose: mullion,
      viewpoint: "az000-el000",
      scene,
      camera,
      renderer,
      resolveForCamera: (): void => {},
      snapshot: { mimeType: "image/jpeg", quality: 0.9 },
    });
  TestValidator.predicate(
    "another request preserves borrowed labels and the supplied encoder result",
    repeatedView.subject === subject &&
      repeatedView.pose === mullion &&
      repeatedView.viewpoint === view.viewpoint &&
      repeatedView.image.dataUrl === view.image.dataUrl &&
      repeatedView.image.mimeType === view.image.mimeType &&
      repeatedView.image.width === view.image.width &&
      repeatedView.image.height === view.image.height &&
      repeatedView.deliveryEvidence === false,
  );
  const adHoc: IAutoMovieViewerSubjectView = captureAutoMovieViewerSubjectView({
    subject,
    pose: heading,
    scene,
    camera,
    renderer,
    resolveForCamera: (): void => {},
  });
  TestValidator.equals(
    "an unplanned look is not counted as a planned sample",
    { viewpoint: adHoc.viewpoint, mimeType: adHoc.image.mimeType },
    { viewpoint: null, mimeType: "image/png" },
  );

  //----
  // 6. Subject observations are inspection records without delivery evidence.
  //----
  TestValidator.equals(
    "every subject observation declares itself unfit for delivery review",
    [view.deliveryEvidence, adHoc.deliveryEvidence],
    [false, false],
  );
  const deliveryReview: (evidence: {
    deliveryEvidence: true;
  }) => boolean = (evidence: { deliveryEvidence: true }): boolean =>
    evidence.deliveryEvidence;
  const offered: IAutoMovieViewerSubjectView = view;
  // @ts-expect-error A subject observation is structurally refused by a consumer that requires delivery evidence, so no caller can pass one in.
  void ((): boolean => deliveryReview(offered));
}
