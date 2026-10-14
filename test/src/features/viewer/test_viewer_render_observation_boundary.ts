import type {
  IAutoMovieRenderObservation,
  IAutoMovieRenderReport,
} from "@automovie/interface";
import { auditAutoMovieRenderObservation } from "@automovie/render";
import { observeAutoMovieRendererFrame } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

/**
 * The submission-counter coordinator accumulates its supplied counter record and preserves the reset policy, leaving unobservable dimensions null.
 *
 * Scenarios:
 *
 * 1. Multiple render passes accumulate draw calls and triangles after one frame reset, and the renderer's reset policy is restored afterward.
 * 2. Dimensions the renderer cannot measure stay null and therefore unchecked.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual frame-counter coordinator with its existing supplied info port, then audits the returned observation against a report; catches per-draw reset losing accumulated requests and guessed values for unobservable dimensions.
 * @evidence contracts/testing.md#independent-expectations Literal counter increments sum to three calls/fourteen triangles and original autoReset must survive success or failure. The local counters exercise orchestration only and do not independently confirm renderer submissions, pixels or hardware work.
 * @evidence contracts/testing.md#distinguishing-cases Covers successful accumulation, thrown drawing, restored reset policy and nullable dimensions that cannot claim report agreement; actual native counter acquisition remains a separate observation obligation.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit uses maintained Viewer/Render source and the existing local counter record without replacing an SDK instance method; it starts no browser, GPU renderer, process or native artifact.
 */
export function test_viewer_render_observation_boundary(): void {
  const render: { calls: number; triangles: number } = {
    calls: 41,
    triangles: 99,
  };
  const info: {
    autoReset: boolean;
    render: { calls: number; triangles: number };
    reset: () => void;
  } = {
    autoReset: true,
    render,
    reset: (): void => {
      render.calls = 0;
      render.triangles = 0;
    },
  };
  const renderer: THREE.WebGLRenderer = {
    info,
  } as unknown as THREE.WebGLRenderer;
  const frame: { output: string; observed: IAutoMovieRenderObservation } =
    observeAutoMovieRendererFrame(renderer, (): string => {
      render.calls += 2;
      render.triangles += 12;
      render.calls += 1;
      render.triangles += 2;
      return "drawn";
    });
  TestValidator.equals("all passes are accumulated", frame, {
    output: "drawn",
    observed: {
      meshes: null,
      drawCalls: 3,
      triangles: 14,
      materials: null,
      textures: null,
      lights: null,
      shadowMaps: null,
      instanceSlots: null,
    },
  });
  TestValidator.equals(
    "renderer reset policy is restored",
    info.autoReset,
    true,
  );
  let refused: boolean = false;
  try {
    observeAutoMovieRendererFrame(renderer, (): never => {
      throw new Error("draw failed");
    });
  } catch {
    refused = true;
  }
  TestValidator.equals(
    "draw failures restore the reset policy",
    {
      refused,
      autoReset: info.autoReset,
    },
    {
      refused: true,
      autoReset: true,
    },
  );

  const report: IAutoMovieRenderReport = {
    version: 1,
    protocol: "automovie.render-report.v1",
    tier: "boundary-test",
    status: "within",
    findings: ["triangles", "drawCalls"].map(
      (
        metric: string,
      ): {
        metric: "triangles" | "drawCalls";
        status: "within";
        measured: number;
        limit: number;
        excess: number;
        contributors: never[];
        omittedContributors: number;
        omittedCost: number;
        recovery: null;
      } => ({
        metric: metric as "triangles" | "drawCalls",
        status: "within" as const,
        measured: metric === "triangles" ? 14 : 3,
        limit: 14,
        excess: 0,
        contributors: [],
        omittedContributors: 0,
        omittedCost: 0,
        recovery: null,
      }),
    ),
    mask: "sha256:mask",
    target: {
      protocol: "automovie.render-target.v1",
      renderer: { api: "test", vendor: "test", device: "test" },
      settings: {
        width: 1,
        height: 1,
        pixelRatio: 1,
        shadows: false,
        shadowType: "none",
        toneMapping: "none",
        exposure: 1,
      },
      assets: [],
      digest: "sha256:target",
    },
    digest: "sha256:report",
  };
  TestValidator.equals(
    "unobservable metrics cannot claim agreement",
    auditAutoMovieRenderObservation({
      report,
      observed: frame.observed as IAutoMovieRenderObservation,
    }),
    {
      agrees: false,
      breaches: [],
      unchecked: [
        "materials",
        "textures",
        "lights",
        "shadowMaps",
        "instanceSlots",
      ],
    },
  );
}
