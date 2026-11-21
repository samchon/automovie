import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import type { IAutoMovieDrawScene } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { cameraInspectionDeliverySubjects } from "./cameraInspectionDeliverySubjects";

/**
 * Active source requirements reach the camera packet at the host's time.
 *
 * 1. Offscreen action before activation has no finding or coverage.
 * 2. Half cover retains a clear ray and leaves exact coverage deferred.
 * 3. Full cover supplies a candidate and ray metadata, no pixel estimate.
 * 4. Whole near-plane and crop exclusions are confirmed at the owner's clock.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses
 * real placed Three meshes and source requirements to check portable packets.
 * @evidence contracts/development/testing.md#independent-expectations Near
 * depth is one metre, and the fourth side of the left crop ends at x=0. The
 * center wall blocks the target's full projected rectangle while the translated
 * wall leaves one side clear. Source activation starts at film second one.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates
 * intentionally inactive geometry, partial and full sparse occlusion, and
 * complete exclusion by a depth plane or a cropped side.
 * @evidence contracts/development/testing.md#execution-ownership The
 * portable selector uses the same scene offered to ordinary capture and
 * delivery, but starts no Draw renderer or browser.
 * @evidence contracts/development/common.md#meaningful-documentation Gives
 * active source scope, real sample modes, confidence and geometry oracles.
 */
export async function test_inspection_camera_delivery(): Promise<void> {
  const instance: IAutoMovieDrawScene =
    await cameraInspectionDeliverySubjects(null)["camera-inspection"]!.create();
  try {
    const inspectPlaced: NonNullable<IAutoMovieDrawScene["inspectPlaced"]> =
      instance.inspectPlaced!;
    const at = async (
      filmSeconds: number,
    ): Promise<IAutoMovieInspectionDiagnostics> => {
      await instance.seek(filmSeconds);
      return inspectPlaced({
        scene: instance.scene,
        camera: instance.camera,
        width: instance.width,
        height: instance.height,
        time: { filmSeconds, outputFrame: filmSeconds },
        mode: "capture",
      });
    };
    const inactive: IAutoMovieInspectionDiagnostics = await at(0);
    TestValidator.equals(
      "inactive offscreen subject creates no result",
      [inactive.findings, inactive.coverage],
      [[], []],
    );
    const partial: IAutoMovieInspectionDiagnostics = await at(2);
    TestValidator.equals(
      "a partly visible subject has no sparse occlusion alert",
      partial.findings,
      [],
    );
    TestValidator.predicate(
      "pixel coverage stays deferred when the host supplies no renderer audit",
      partial.coverage.some(
        (row: IAutoMovieInspectionDiagnostics.ICoverage): boolean =>
          row.check === "camera-occlusion" &&
          row.required &&
          row.status === "deferred",
      ),
    );
    const full: IAutoMovieInspectionDiagnostics = await at(3);
    const candidate: IAutoMovieInspectionDiagnostics.IFinding | undefined =
      full.findings[0];
    TestValidator.predicate(
      "full sparse blocker supplies a world witness without claiming pixel evidence",
      full.findings.length === 1 &&
        candidate?.code === "camera-subject-occluded" &&
        candidate.confidence === "candidate" &&
        candidate.witness.point !== undefined &&
        candidate.witness.measurements?.every(
          (value: IAutoMovieInspectionDiagnostics.IMeasurement): boolean =>
            value.unit === "rays",
        ) === true,
    );
    for (const [seconds, code] of [
      [6, "camera-subject-before-near"],
      [7, "camera-subject-outside-frame"],
    ] as const) {
      const packet: IAutoMovieInspectionDiagnostics = await at(seconds);
      TestValidator.equals(
        "source film time and confirmed camera framing",
        [
          packet.time.outputFrame,
          packet.findings[0]?.code,
          packet.findings[0]?.confidence,
        ],
        [seconds, code, "confirmed"],
      );
    }
  } finally {
    instance.dispose();
  }
}
