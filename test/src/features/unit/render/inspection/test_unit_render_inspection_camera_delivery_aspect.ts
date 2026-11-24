import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import {
  type IAutoMovieDrawScene,
  observeAutoMoviePlacedCamera,
  observeAutoMoviePlacedInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../../../internal/predicates";

/**
 * The host's placed observation frames a required subject through the subject's
 * own delivery raster and reports a near-plane cut at the output frame.
 *
 * Scenarios:
 *
 * 1. With a stale square camera, a 2:1 delivery raster keeps a box at x 7 m, depth
 *    5 m inside the frame: framing is checked with no finding.
 * 2. Changing the delivery raster to 1:1 confirms the same box outside the frame,
 *    at the output frame of the placed second.
 * 3. A box whose front face is 0.25 m in front of the near plane is confirmed
 *    clipped with its intrusion and a witness on the near plane, where the
 *    review cube stays visible, and the near-clip coverage row is checked; the
 *    same box touching the near plane has no finding.
 * 4. A box at x 5 m, depth 5 m is inside the 2:1 raster and cut by the right edge
 *    of the 1:1 raster at the output frame, with near-clip coverage still
 *    checked.
 */
export function test_unit_render_inspection_camera_delivery_aspect(): void {
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
  const target: THREE.Mesh = new THREE.Mesh(geometry, material);
  scene.add(target);
  const subject: IAutoMovieDrawScene = {
    scene,
    camera,
    durationSeconds: 2,
    fps: 1,
    width: 200,
    height: 100,
    inspectPlaced: (
      sample: IAutoMovieDrawScene.IPlacedSample,
    ): IAutoMovieInspectionDiagnostics => ({
      scope: "aspect",
      time: sample.time,
      ...observeAutoMoviePlacedCamera({
        sample,
        targets: [{ path: "hero", target }],
      }),
    }),
    seek: async (): Promise<void> => {},
    dispose: (): void => {},
  };
  const observe: () => IAutoMovieInspectionDiagnostics =
    (): IAutoMovieInspectionDiagnostics =>
      observeAutoMoviePlacedInspection(subject, 1, "capture")!;
  const codes: (packet: IAutoMovieInspectionDiagnostics) => string[] = (
    packet: IAutoMovieInspectionDiagnostics,
  ): string[] =>
    packet.findings.map(
      (finding: IAutoMovieInspectionDiagnostics.IFinding): string =>
        finding.code,
    );

  // 1-2. The same placement through the wide and the square delivery raster.
  target.position.set(7, 0, -5);
  const wide: IAutoMovieInspectionDiagnostics = observe();
  TestValidator.equals("wide raster keeps the subject", codes(wide), []);
  TestValidator.predicate(
    "wide framing is checked",
    wide.coverage.some(
      (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
        row.check === "camera-framing" && row.status === "checked",
    ),
  );
  subject.width = 100;
  const square: IAutoMovieInspectionDiagnostics = observe();
  TestValidator.equals("square raster excludes the subject", codes(square), [
    "camera-subject-outside-frame",
  ]);
  TestValidator.equals(
    "finding carries the output frame",
    square.time.outputFrame,
    1,
  );

  // 3. A near-plane cut and a touching face.
  target.position.set(0, 0, -1.25);
  const cut: IAutoMovieInspectionDiagnostics = observe();
  const clipped: IAutoMovieInspectionDiagnostics.IFinding | undefined =
    cut.findings.find(
      (finding: IAutoMovieInspectionDiagnostics.IFinding): boolean =>
        finding.code === "camera-subject-clipped-near",
    );
  TestValidator.predicate(
    "near-plane cut is confirmed with its witness",
    clipped !== undefined &&
      clipped.confidence === "confirmed" &&
      clipped.category === "error" &&
      clipped.witness.point !== undefined &&
      nclose(clipped.witness.point.z, -1) &&
      clipped.witness.measurements?.some(
        (row: IAutoMovieInspectionDiagnostics.IMeasurement): boolean =>
          row.name === "near-plane-intrusion" &&
          typeof row.value === "number" &&
          nclose(row.value, 0.25),
      ) === true,
  );
  TestValidator.predicate(
    "near-clip coverage is checked",
    cut.coverage.some(
      (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
        row.check === "camera-near-clip" &&
        row.key === "hero" &&
        row.status === "checked",
    ),
  );
  target.position.set(0, 0, -1.5);
  TestValidator.equals("touching face has no finding", codes(observe()), []);

  // 4. The raster moves the right edge across the subject.
  target.position.set(5, 0, -5);
  subject.width = 200;
  TestValidator.equals(
    "wide raster keeps the box inside",
    codes(observe()),
    [],
  );
  subject.width = 100;
  const edge: IAutoMovieInspectionDiagnostics = observe();
  TestValidator.equals(
    "square raster cuts the box at the output frame",
    [codes(edge), edge.time.outputFrame],
    [["frame-edge-cut"], 1],
  );
  TestValidator.predicate(
    "near-clip coverage stays checked at the edge",
    edge.coverage.some(
      (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
        row.check === "camera-near-clip" && row.status === "checked",
    ),
  );

  geometry.dispose();
  material.dispose();
}
