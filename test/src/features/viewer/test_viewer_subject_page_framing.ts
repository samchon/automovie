import { describeAutoMovieSubject } from "@automovie/engine";
import {
  type IAutoMovieViewerSubjectBounds,
  type IAutoMovieViewerViewpoint,
  applyAutoMovieViewerSubjectPose,
  autoMovieViewerTurntableViewpoints,
  frameAutoMovieViewerSubject,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose } from "../internal/predicates";
import {
  subjectInspectionArtifact,
  subjectInspectionModel,
} from "../internal/subjectInspectionFixtures";

/**
 * Exercises the query-to-numerical-camera chain with deliberately different declared and content extents.
 *
 * Scenarios:
 * 1. The room's declared and content boxes differ in center and extent.
 * 2. Every planned landscape and portrait viewpoint contains all authored content corners in its numerical frustum.
 * 3. Declared-cell framing shifts the content aim and reduces its angular extent.
 * 4. The existing 60-metre stress content escapes every cell-derived planned frustum.
 * 5. Empty content retains the declared cell for numerical framing.
 * 6. Grounded/lifted inputs distinguish downward eye height, level safety and monotonic elevation.
 * 7. Placed and prototype keys report their coordinate spaces and the authored room member ids.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real subject description, turntable planning, framing and camera pose application; judges every authored box corner against all six CPU frustum planes.
 * @evidence contracts/testing.md#independent-expectations Separately computed box centers/diagonals, authored landscape/portrait aspects and literal member ids define expectations; the consumed-only fixture casts do not certify complete compiled or material validity.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts smaller content, overflowing content, absent content, grounded/lifted subjects and model/world coordinate labels. Frustum containment proves no occlusion, visible pixels or browser page wiring.
 * @evidence contracts/testing.md#execution-ownership The named entry reuses existing non-Human inspection records and CPU cameras/frusta without a renderer or new probe; source revision and real page/hardware behavior remain external.
 */
export function test_viewer_subject_page_framing(): void {
  const artifact: import("@automovie/interface").IAutoMovieSubjectArtifact =
    subjectInspectionArtifact();
  const room: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(artifact, "space:castle/hall");
  const content: import("@automovie/interface").IAutoMovieSubjectBox | null =
    room.bounds.content;
  const declared: import("@automovie/interface").IAutoMovieSubjectBox | null =
    room.bounds.declared;
  if (content === null || declared === null)
    throw new Error("The inspection fixture must state both room extents.");

  //----
  // 1. The declared and content boxes differ.
  //----
  TestValidator.equals(
    "a declared cell and its contents are different extents",
    namedFacts([
      ["world space", (): boolean => room.bounds.coordinateSpace === "world"],
      ["declared holds the contents", (): boolean => holds(declared, content)],
      [
        "aims apart",
        (): boolean => middle(declared).distanceTo(middle(content)) > 1,
      ],
      [
        "contents are smaller",
        (): boolean => radius(content) < radius(declared) / 1.5,
      ],
    ]),
    {
      "world space": true,
      "declared holds the contents": true,
      "aims apart": true,
      "contents are smaller": true,
    },
  );

  //----
  // 2. Every planned viewpoint contains the content box in its numerical frustum.
  //----
  const plan: IAutoMovieViewerViewpoint[] = autoMovieViewerTurntableViewpoints({
    azimuthCount: 8,
    elevationsDeg: [-20, 10, 45],
    distanceFactor: 1.25,
  });
  const escaped: string[] = [];
  for (const viewpoint of plan)
    // Landscape and portrait aspects exercise both limiting fields of the same numerical framing rule.
    for (const aspect of [16 / 9, 9 / 16])
      if (frames(content, viewpoint, aspect) === false)
        escaped.push(`${viewpoint.id}@${aspect.toFixed(2)}`);
  TestValidator.equals(
    "every planned viewpoint holds all authored subject corners inside its CPU frustum",
    escaped,
    [],
  );

  //----
  // 3. Declared-cell framing shifts the aim and reduces the subject's angular extent.
  //----
  const viewpoint: IAutoMovieViewerViewpoint = plan[3]!;
  const fromContent: import("../../../../packages/viewer/src/index").IAutoMovieViewerSubjectPose =
    frameAutoMovieViewerSubject(content, viewpoint, LENS);
  const fromDeclared: import("../../../../packages/viewer/src/index").IAutoMovieViewerSubjectPose =
    frameAutoMovieViewerSubject(declared, viewpoint, LENS);
  TestValidator.equals(
    "the declared cell moves the aim off the contents and shrinks them",
    namedFacts([
      [
        "content framing aims at the contents",
        (): boolean => {
          const distance: number = middle(content).distanceTo(
            vector(fromContent.target),
          );
          return nclose(distance, 0, 1e-9) && distance < 1e-9;
        },
      ],
      [
        "declared framing aims somewhere else",
        (): boolean =>
          middle(content).distanceTo(vector(fromDeclared.target)) > 1,
      ],
      [
        "and the contents subtend a smaller angle",
        (): boolean =>
          subtended(content, fromContent.position) >
          subtended(content, fromDeclared.position) * 1.5,
      ],
    ]),
    {
      "content framing aims at the contents": true,
      "declared framing aims somewhere else": true,
      "and the contents subtend a smaller angle": true,
    },
  );

  //----
  // 4. Overflowing content escapes the declared-cell frustum.
  //----
  // The historical motivating example described a 4.20 m cell and a 9.40 m tower. This existing stress input instead has its own 60 m content extent; it tests numerical frustum escape, not a reconstructed production frame.
  const overflow: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(
      subjectInspectionArtifact({
        models: [
          subjectInspectionModel({
            id: "stair-tower-model",
            min: { x: -19, y: 0, z: -19 },
            max: { x: 19, y: 60, z: 19 },
          }),
        ],
      }),
      "space:castle/hall",
    );
  const tower: import("@automovie/interface").IAutoMovieSubjectBox =
    overflow.bounds.content!;
  const cell: import("@automovie/interface").IAutoMovieSubjectBox =
    overflow.bounds.declared!;
  TestValidator.equals(
    "the overflowing contents are the larger box and frame themselves whole",
    namedFacts([
      [
        "the contents are the larger box",
        (): boolean => radius(tower) > radius(cell),
      ],
      [
        "the contents frame themselves whole",
        (): boolean =>
          plan.every((planned: IAutoMovieViewerViewpoint): boolean =>
            frames(tower, planned, 16 / 9),
          ),
      ],
    ]),
    {
      "the contents are the larger box": true,
      "the contents frame themselves whole": true,
    },
  );
  TestValidator.equals(
    "no planned viewpoint derived from the cell holds the contents",
    plan
      .filter((planned: IAutoMovieViewerViewpoint): boolean =>
        framesInside(cell, tower, planned, 16 / 9),
      )
      .map((planned: IAutoMovieViewerViewpoint): string => planned.id),
    [],
  );

  //----
  // 5. An empty room keeps its declared cell for framing.
  //----
  const bare: import("@automovie/interface").IAutoMovieSubjectDescription =
    describeAutoMovieSubject(
      subjectInspectionArtifact({ models: [], nodes: [] }),
      "space:castle/hall",
    );
  TestValidator.equals(
    "an undressed room reports no contents and keeps its declared cell",
    namedFacts([
      ["no content box", (): boolean => bare.bounds.content === null],
      ["a declared cell remains", (): boolean => bare.bounds.declared !== null],
      [
        "which frames",
        (): boolean => frames(bare.bounds.declared!, plan[0]!, 16 / 9) === true,
      ],
    ]),
    {
      "no content box": true,
      "a declared cell remains": true,
      "which frames": true,
    },
  );

  //----
  // 6. A downward ring's eye height depends on the subject bounds.
  //----
  // The prior motivation reported a -20 degree ring with an eye 7.5 m below ground on eight of twenty-four production viewpoints. That historical capture is not observed here: the existing grounded and lifted inputs distinguish only numerical eye height, level safety and monotonicity.
  const grounded: import("@automovie/interface").IAutoMovieSubjectBox =
    describeAutoMovieSubject(artifact, "space:castle/hall").bounds.content!;
  const lifted: import("@automovie/interface").IAutoMovieSubjectBox =
    describeAutoMovieSubject(
      subjectInspectionArtifact({
        models: [
          subjectInspectionModel({
            id: "roof-slate-model",
            min: { x: -0.29, y: 11.9, z: -0.29 },
            max: { x: 0.29, y: 11.95, z: 0.29 },
          }),
        ],
      }),
      "element:castle/roof-slate",
    ).bounds.content!;
  const eyeHeight: (
    bounds: IAutoMovieViewerSubjectBounds,
    elevationDeg: number,
  ) => number = (
    bounds: IAutoMovieViewerSubjectBounds,
    elevationDeg: number,
  ): number =>
    frameAutoMovieViewerSubject(
      bounds,
      { id: "probe", azimuthDeg: 0, elevationDeg, distanceFactor: 1.25 },
      LENS,
    ).position.y;
  TestValidator.equals(
    "how far down a subject may be looked at from is the subject's own answer",
    namedFacts([
      [
        "a room standing on the ground is put under it",
        (): boolean => eyeHeight(grounded, -20) < Math.min(0, grounded.min.y),
      ],
      [
        "a level eye never is",
        (): boolean => eyeHeight(grounded, 0) >= Math.min(0, grounded.min.y),
      ],
      [
        "and height rises with the angle between them",
        (): boolean =>
          [-20, -15, -10, -5, 0].every(
            (deg: number, index: number, all: number[]): boolean =>
              index === 0 ||
              eyeHeight(grounded, deg) > eyeHeight(grounded, all[index - 1]!),
          ),
      ],
      [
        "while a slate on a roof keeps the whole ring it asked for",
        (): boolean => eyeHeight(lifted, -20) > 0,
      ],
    ]),
    {
      "a room standing on the ground is put under it": true,
      "a level eye never is": true,
      "and height rises with the angle between them": true,
      "while a slate on a roof keeps the whole ring it asked for": true,
    },
  );

  //----
  // 7. A subject key identifies its coordinate space and members.
  //----
  TestValidator.equals(
    "a placed subject answers in world space and a prototype does not",
    [
      describeAutoMovieSubject(artifact, "space:castle/hall").bounds
        .coordinateSpace,
      describeAutoMovieSubject(artifact, "element:castle/solar-oriel").bounds
        .coordinateSpace,
      describeAutoMovieSubject(artifact, "prototype:solar-oriel-model").bounds
        .coordinateSpace,
    ],
    ["world", "world", "model"],
  );
  TestValidator.equals(
    "a room lists the placements standing in it, so a reviewer can descend",
    room.members.items,
    [
      "element:castle/guard-rack-west-pole-0",
      "element:castle/solar-oriel",
      "element:castle/south-half-timber-brace-0",
    ],
  );
}

/** The lens the scaffold page looks through. */
const LENS: { fovDeg: number; aspect: number } = { fovDeg: 35, aspect: 16 / 9 };

const vector: (value: {
  x: number;
  y: number;
  z: number;
}) => THREE.Vector3 = (value: {
  x: number;
  y: number;
  z: number;
}): THREE.Vector3 => new THREE.Vector3(value.x, value.y, value.z);

const middle: (bounds: IAutoMovieViewerSubjectBounds) => THREE.Vector3 = (
  bounds: IAutoMovieViewerSubjectBounds,
): THREE.Vector3 =>
  vector(bounds.min).add(vector(bounds.max)).multiplyScalar(0.5);

const radius: (bounds: IAutoMovieViewerSubjectBounds) => number = (
  bounds: IAutoMovieViewerSubjectBounds,
): number => vector(bounds.max).sub(vector(bounds.min)).length() / 2;

const corners: (bounds: IAutoMovieViewerSubjectBounds) => THREE.Vector3[] = (
  bounds: IAutoMovieViewerSubjectBounds,
): THREE.Vector3[] =>
  [bounds.min.x, bounds.max.x].flatMap((x: number): THREE.Vector3[] =>
    [bounds.min.y, bounds.max.y].flatMap((y: number): THREE.Vector3[] =>
      [bounds.min.z, bounds.max.z].map(
        (z: number): THREE.Vector3 => new THREE.Vector3(x, y, z),
      ),
    ),
  );

/** Whether the outer box contains the inner one. */
const holds: (
  outer: IAutoMovieViewerSubjectBounds,
  inner: IAutoMovieViewerSubjectBounds,
) => boolean = (
  outer: IAutoMovieViewerSubjectBounds,
  inner: IAutoMovieViewerSubjectBounds,
): boolean =>
  (["x", "y", "z"] as const).every(
    (axis: "x" | "y" | "z"): boolean =>
      outer.min[axis] <= inner.min[axis] && inner.max[axis] <= outer.max[axis],
  );

/** Half-angle the box's bounding sphere subtends from one eye position. */
const subtended: (
  bounds: IAutoMovieViewerSubjectBounds,
  eye: { x: number; y: number; z: number },
) => number = (
  bounds: IAutoMovieViewerSubjectBounds,
  eye: { x: number; y: number; z: number },
): number => Math.atan2(radius(bounds), middle(bounds).distanceTo(vector(eye)));

/**
 * Whether one viewpoint puts every corner of the box inside its CPU frustum.
 *
 * `THREE.Frustum` judges all six planes, so both side fields and the derived clip range must contain the authored corners. A near plane inside the box or a far plane short of its back fails this numerical predicate just as a side plane does.
 */
const frames: (
  bounds: IAutoMovieViewerSubjectBounds,
  viewpoint: IAutoMovieViewerViewpoint,
  aspect: number,
) => boolean = (
  bounds: IAutoMovieViewerSubjectBounds,
  viewpoint: IAutoMovieViewerViewpoint,
  aspect: number,
): boolean => framesInside(bounds, bounds, viewpoint, aspect);

/** The same question when the eye was derived from a different box. */
const framesInside: (
  framed: IAutoMovieViewerSubjectBounds,
  judged: IAutoMovieViewerSubjectBounds,
  viewpoint: IAutoMovieViewerViewpoint,
  aspect: number,
) => boolean = (
  framed: IAutoMovieViewerSubjectBounds,
  judged: IAutoMovieViewerSubjectBounds,
  viewpoint: IAutoMovieViewerViewpoint,
  aspect: number,
): boolean => {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  applyAutoMovieViewerSubjectPose(
    camera,
    frameAutoMovieViewerSubject(framed, viewpoint, { fovDeg: 35, aspect }),
  );
  const frustum: THREE.Frustum = new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    ),
  );
  return corners(judged).every((corner: THREE.Vector3): boolean =>
    frustum.containsPoint(corner),
  );
};
