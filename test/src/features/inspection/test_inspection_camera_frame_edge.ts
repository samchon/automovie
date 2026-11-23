import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import {
  observeAutoMovieCameraInspection,
  observeAutoMoviePlacedCamera,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/**
 * A required subject cut by a side of the delivery frame gets a
 * `frame-edge-cut` warning under its own optional `camera-frame-edge` check.
 *
 * Scenarios:
 *
 * 1. A unit box at depth 5 m centred at x 3.5 m lies inside the square frame: the
 *    row is checked and nothing is found.
 * 2. Centred at x 5 m it is cut by the right edge, confirmed on its opaque
 *    surface, with a right extent of 2 / 9 and that extent as rank.
 * 3. Centred at x 5 m and y 5 m it crosses the right and the top edges.
 * 4. A flat 1 m square facing the camera at depth 5 m and centred at x 5 m has
 *    half its area in frame and a right extent of 0.1.
 * 5. A unit box turned 45 degrees about y and centred at x 4 m has a world box
 *    that crosses the right edge while its surface stays inside: no finding.
 *    The same box with a certified envelope and an unreadable surface gives a
 *    candidate and an unsupported row.
 * 6. A unit box centred at x 1 m and 1.25 m from the camera crosses the right side
 *    and the near plane: its right extent is measured beyond the near plane,
 *    and it keeps its near-clip finding.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls observeAutoMoviePlacedCamera in capture mode on real Three meshes and asserts the frame-edge coverage row, finding code, category, confidence, crossed sides, extents, rank and visible fraction; catches a cut left unreported, a whole-box crossing reported as a confirmed cut, an extent measured before the near plane and a blocking category.
 * @evidence contracts/development/testing.md#independent-expectations The 90-degree square camera projects a point at x and depth d to x / d, with the frame edge at 1. The x 3.5 m box reaches 4 / 4.5 = 0.889; the x 5 m box reaches 5.5 / 4.5 = 1.222, 2 / 9 past the edge, on x and on y when raised to y 5 m. The flat square spans x 4.5 to 5.5 m at depth 5 m, so 0.9 to 1.1: half its area is inside and it reaches 0.1 past the edge. The turned box's corners reach 4.707 / 5 = 0.941 and 4 / 4.293 = 0.932, while its world box corner reaches 4.707 / 4.293 = 1.096. With the near plane at 1 m, the near-crossing box is cut by that plane at depth 1 m, where its x 1.5 m edge projects to 1.5, 0.5 past the edge; its x 1.5 m corner at 0.75 m, before the near plane, would give 1.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs inside, crossing and corner-crossing boxes, a confirmed surface cut with a bounds-only crossing on a readable and an unreadable surface, and a side crossing beyond the near plane with one before it; whole-subject exclusion is owned by test_inspection_camera_visibility, host budgets by test_inspection_camera_host_budgets and the delivery raster by test_inspection_camera_delivery_aspect.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit over in-memory Three objects without a GL context, browser or film.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario, its geometry and its expected packet.
 */
export function test_inspection_camera_frame_edge(): void {
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    90,
    1,
    1,
    20,
  );
  scene.add(camera);
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const box: THREE.Mesh = new THREE.Mesh(geometry, material);
  scene.add(box);

  /** The camera observer's findings and coverage for one sample. */
  type IPacket = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;

  /** Source requirements active in the sample. */
  type ITargets = Parameters<typeof observeAutoMoviePlacedCamera>[0]["targets"];
  const observe: (targets: ITargets) => IPacket = (
    targets: ITargets,
  ): IPacket => {
    scene.updateMatrixWorld(true);
    camera.updateWorldMatrix(true, false);
    return observeAutoMoviePlacedCamera({
      sample: {
        time: { filmSeconds: 0 },
        scene,
        camera,
        width: 100,
        height: 100,
        mode: "capture",
      },
      targets,
    });
  };
  const row: (
    packet: IPacket,
  ) => IAutoMovieInspectionDiagnostics.ICoverage | undefined = (
    packet: IPacket,
  ): IAutoMovieInspectionDiagnostics.ICoverage | undefined =>
    packet.coverage.find(
      (item: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
        item.check === "camera-frame-edge",
    );
  const cut: (
    packet: IPacket,
  ) => IAutoMovieInspectionDiagnostics.IFinding | undefined = (
    packet: IPacket,
  ): IAutoMovieInspectionDiagnostics.IFinding | undefined =>
    packet.findings.find(
      (finding: IAutoMovieInspectionDiagnostics.IFinding): boolean =>
        finding.code === "frame-edge-cut",
    );
  const measure: (
    finding: IAutoMovieInspectionDiagnostics.IFinding | undefined,
    name: string,
  ) => number | string | undefined = (
    finding: IAutoMovieInspectionDiagnostics.IFinding | undefined,
    name: string,
  ): number | string | undefined =>
    finding?.witness.measurements?.find(
      (item: IAutoMovieInspectionDiagnostics.IMeasurement): boolean =>
        item.name === name,
    )?.value;
  const near: (
    value: number | string | undefined,
    expected: number,
  ) => boolean = (
    value: number | string | undefined,
    expected: number,
  ): boolean => typeof value === "number" && nclose(value, expected);

  // 1. Inside the frame.
  box.position.set(3.5, 0, -5);
  const inside: IPacket = observe([{ path: "hero", target: box }]);
  TestValidator.equals(
    "a box inside the frame has a checked row and no finding",
    [row(inside)?.status, row(inside)?.required, inside.findings],
    ["checked", false, []],
  );

  // 2. Across the right edge.
  box.position.set(5, 0, -5);
  const right: IPacket = observe([{ path: "hero", target: box }]);
  const rightCut: IAutoMovieInspectionDiagnostics.IFinding | undefined =
    cut(right);
  TestValidator.equals(
    "the right edge cuts the box as a confirmed warning",
    [
      rightCut?.check,
      rightCut?.key,
      rightCut?.category,
      rightCut?.confidence,
      measure(rightCut, "crossed-sides"),
      row(right)?.status,
    ],
    ["camera-frame-edge", "hero", "warning", "confirmed", "right", "checked"],
  );
  TestValidator.predicate(
    "the right extent and rank are 2 / 9",
    near(measure(rightCut, "right-edge-extent"), 2 / 9) &&
      near(rightCut?.witness.rank, 2 / 9),
  );

  // 3. Across the right and top edges.
  box.position.set(5, 5, -5);
  const corner: IAutoMovieInspectionDiagnostics.IFinding | undefined = cut(
    observe([{ path: "hero", target: box }]),
  );
  TestValidator.predicate(
    "a corner crossing reports the right and top edges",
    measure(corner, "crossed-sides") === "right top" &&
      near(measure(corner, "right-edge-extent"), 2 / 9) &&
      near(measure(corner, "top-edge-extent"), 2 / 9),
  );

  // 4. A flat square half in frame.
  const flatGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(1, 1);
  const flat: THREE.Mesh = new THREE.Mesh(flatGeometry, material);
  flat.position.set(5, 0, -5);
  scene.add(flat);
  const half: IAutoMovieInspectionDiagnostics.IFinding | undefined = cut(
    observe([{ path: "card", target: flat }]),
  );
  TestValidator.predicate(
    "a square half in frame has a visible fraction of one half",
    near(measure(half, "visible-fraction-by-projected-surface-area"), 0.5) &&
      near(measure(half, "right-edge-extent"), 0.1),
  );
  flat.removeFromParent();

  // 5. A turned box whose world box alone crosses the edge.
  box.position.set(4, 0, -5);
  box.rotation.set(0, Math.PI / 4, 0);
  scene.updateMatrixWorld(true);
  TestValidator.equals(
    "the turned box's world box crosses the right side",
    observeAutoMovieCameraInspection({ scene, camera, target: box }).framing,
    "crosses-side",
  );
  const turned: IPacket = observe([{ path: "hero", target: box }]);
  TestValidator.equals(
    "a surface inside the frame gives no finding",
    [row(turned)?.status, turned.findings],
    ["checked", []],
  );
  const shader: THREE.ShaderMaterial = new THREE.ShaderMaterial();
  box.material = shader;
  const envelope: THREE.Box3 = new THREE.Box3().setFromObject(box);
  const bounded: IPacket = observe([
    {
      path: "hero",
      target: box,
      targetBounds: {
        min: { x: envelope.min.x, y: envelope.min.y, z: envelope.min.z },
        max: { x: envelope.max.x, y: envelope.max.y, z: envelope.max.z },
      },
    },
  ]);
  TestValidator.equals(
    "an envelope alone gives a candidate",
    [cut(bounded)?.confidence, row(bounded)?.status],
    ["candidate", "unsupported"],
  );
  box.material = material;
  box.rotation.set(0, 0, 0);

  // 6. Across the right side and the near plane.
  box.position.set(1, 0, -1.25);
  const both: IPacket = observe([{ path: "hero", target: box }]);
  const nearCut: IAutoMovieInspectionDiagnostics.IFinding | undefined =
    cut(both);
  TestValidator.predicate(
    "the right extent is measured beyond the near plane",
    measure(nearCut, "crossed-sides") === "right" &&
      near(measure(nearCut, "right-edge-extent"), 0.5),
  );
  TestValidator.predicate(
    "the near-clip finding remains",
    both.findings.some(
      (finding: IAutoMovieInspectionDiagnostics.IFinding): boolean =>
        finding.code === "camera-subject-clipped-near",
    ),
  );

  geometry.dispose();
  flatGeometry.dispose();
  material.dispose();
  shader.dispose();
}
