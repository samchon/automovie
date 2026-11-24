import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  observeAutoMoviePlacedCamera,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The Viewer budgets camera checks per painted frame; capture and delivery
 * finish them, and an uncheckable subject is unsupported in every host.
 *
 * Scenarios:
 *
 * 1. A 262,144-triangle sphere reaching 0.25 m in front of the near plane leaves
 *    its required near-clip check deferred in the Viewer, whose
 *    200,000-triangle cap it exceeds, and is confirmed clipped with a checked
 *    row in capture and in delivery. Moved across the right edge at depth 5 m,
 *    its frame-edge surface check is deferred with a candidate cut in the
 *    Viewer, while its framing row stays checked, and is checked with a
 *    confirmed cut in capture and delivery.
 * 2. A dense opaque sphere of 32,768 triangles hides a box. The optional sparse
 *    occlusion check is deferred in the Viewer, past its 3,000-triangle ray
 *    cap, and finds the blocker as a candidate with a checked row in capture
 *    and delivery.
 * 3. A subject drawing a line has no certified bounds: framing is unsupported in
 *    every host, never deferred.
 * 4. A required pixel ratio stays deferred in a delivery sample whose host
 *    supplies no renderer audit, the case only a portable caller produces.
 */
export function test_unit_render_scene_observe_placed_camera(): void {
  const scene: THREE.Scene = new THREE.Scene();
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    90,
    1,
    1,
    20,
  );
  scene.add(camera);
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const modes: readonly IAutoMovieDrawScene.IPlacedSample["mode"][] = [
    "viewer",
    "capture",
    "delivery",
  ];
  /** The camera observer's findings and coverage for one sample. */
  type IPacket = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;

  /** Source requirements active in the sample. */
  type ITargets = Parameters<typeof observeAutoMoviePlacedCamera>[0]["targets"];
  const observe: (
    mode: IAutoMovieDrawScene.IPlacedSample["mode"],
    targets: ITargets,
  ) => IPacket = (
    mode: IAutoMovieDrawScene.IPlacedSample["mode"],
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
        mode,
      },
      targets,
    });
  };
  const status: (packet: IPacket, check: string) => string | undefined = (
    packet: IPacket,
    check: string,
  ): string | undefined =>
    packet.coverage.find(
      (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
        row.check === check,
    )?.status;
  const codes: (packet: IPacket) => string[] = (packet: IPacket): string[] =>
    packet.findings.map(
      (finding: IAutoMovieInspectionDiagnostics.IFinding): string =>
        `${finding.code}:${finding.confidence}`,
    );

  // 1. A dense subject cut by the near plane.
  const denseGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(
    0.5,
    512,
    257,
  );
  TestValidator.equals(
    "dense sphere triangle count",
    (denseGeometry.index?.count ?? 0) / 3,
    262_144,
  );
  const dense: THREE.Mesh = new THREE.Mesh(denseGeometry, material);
  dense.position.set(0, 0, -1.25);
  scene.add(dense);
  const clipStatuses: (string | undefined)[] = [];
  const clipCodes: string[][] = [];
  for (const mode of modes) {
    const packet: Pick<
      IAutoMovieInspectionDiagnostics,
      "findings" | "coverage"
    > = observe(mode, [{ path: "hero", target: dense }]);
    clipStatuses.push(status(packet, "camera-near-clip"));
    clipCodes.push(codes(packet));
  }
  TestValidator.equals(
    "near clip is budgeted only in the Viewer",
    clipStatuses,
    ["deferred", "checked", "checked"],
  );
  TestValidator.equals(
    "capture and delivery confirm the cut",
    clipCodes.slice(1),
    [
      ["camera-subject-clipped-near:confirmed"],
      ["camera-subject-clipped-near:confirmed"],
    ],
  );

  // 1b. The same dense subject across the right edge of the frame.
  dense.position.set(5, 0, -5);
  const edgeRows: (string | undefined)[][] = [];
  const edgeCodes: string[][] = [];
  for (const mode of modes) {
    const packet: IPacket = observe(mode, [{ path: "hero", target: dense }]);
    edgeRows.push([
      status(packet, "camera-framing"),
      status(packet, "camera-frame-edge"),
    ]);
    edgeCodes.push(codes(packet));
  }
  TestValidator.equals(
    "the frame-edge surface check is budgeted only in the Viewer",
    edgeRows,
    [
      ["checked", "deferred"],
      ["checked", "checked"],
      ["checked", "checked"],
    ],
  );
  TestValidator.equals(
    "the Viewer reports a candidate cut that capture and delivery confirm",
    edgeCodes,
    [
      ["frame-edge-cut:candidate"],
      ["frame-edge-cut:confirmed"],
      ["frame-edge-cut:confirmed"],
    ],
  );
  dense.removeFromParent();

  // 2. A dense blocker in front of an optional subject.
  const blockerGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(
    2,
    128,
    129,
  );
  TestValidator.equals(
    "blocker triangle count",
    (blockerGeometry.index?.count ?? 0) / 3,
    32_768,
  );
  const blocker: THREE.Mesh = new THREE.Mesh(blockerGeometry, material);
  blocker.position.set(0, 0, -6);
  const boxGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const hidden: THREE.Mesh = new THREE.Mesh(boxGeometry, material);
  hidden.position.set(0, 0, -12);
  scene.add(blocker, hidden);
  const rayStatuses: (string | undefined)[] = [];
  const rayCodes: string[][] = [];
  for (const mode of modes) {
    const packet: Pick<
      IAutoMovieInspectionDiagnostics,
      "findings" | "coverage"
    > = observe(mode, [{ path: "hidden", target: hidden }]);
    rayStatuses.push(status(packet, "camera-occlusion"));
    rayCodes.push(codes(packet));
  }
  TestValidator.equals(
    "sparse rays are budgeted only in the Viewer",
    rayStatuses,
    ["deferred", "checked", "checked"],
  );
  TestValidator.equals("capture and delivery find the blocker", rayCodes, [
    [],
    ["camera-subject-occluded:candidate"],
    ["camera-subject-occluded:candidate"],
  ]);
  blocker.removeFromParent();

  // 3. An uncheckable subject.
  const lineMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial();
  const line: THREE.Line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
    ]),
    lineMaterial,
  );
  hidden.add(line);
  TestValidator.equals(
    "unbounded subject is unsupported in every host",
    modes.map(
      (mode: IAutoMovieDrawScene.IPlacedSample["mode"]): string | undefined =>
        status(
          observe(mode, [{ path: "hidden", target: hidden }]),
          "camera-framing",
        ),
    ),
    ["unsupported", "unsupported", "unsupported"],
  );
  line.removeFromParent();
  line.geometry.dispose();
  lineMaterial.dispose();

  // 4. A required ratio without the host's renderer audit.
  hidden.position.set(0, 0, -5);
  TestValidator.equals(
    "required pixels wait for a renderer",
    status(
      observe("delivery", [
        { path: "hidden", target: hidden, maxOcclusionRatio: 0.25 },
      ]),
      "camera-occlusion",
    ),
    "deferred",
  );

  denseGeometry.dispose();
  blockerGeometry.dispose();
  boxGeometry.dispose();
  material.dispose();
}
