import { AutoMovieEngineCaptureRecord } from "@automovie/engine";
import type {
  IAutoMovieCaptureSubject,
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
  IAutoMovieInspectionTrail,
} from "@automovie/interface";
import {
  AutoMovieRenderCapture,
  AutoMovieRenderCaptureFolder,
  AutoMovieRenderDrawSession,
  type IAutoMovieRenderDrawPage,
  type IAutoMovieRenderDrawPageRequest,
} from "@automovie/render";
import assert from "node:assert/strict";

import { createCaptureMemory } from "../../capture/createCaptureMemory";

/**
 * Retains the exact source-backed motion samples of a drawn still and compares
 * the bytes against capture without trail evidence. A custom host cannot add
 * evidence for an unselected path. Both readers accept old rows and reject
 * corrupt optional motion data.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The test states the retained drawing, old-row bytes and rejected corrupt fields.
 * @evidence contracts/development/testing.md#behavioral-verification Opens the normal draw session through a typed page double, runs Capture with a memory folder and reads its complete record through both public reader methods.
 * @evidence contracts/development/testing.md#independent-expectations The source clock, world coordinates, support-local numbers and route pace are fixture literals. The expected omission and pixel byte equality distinguish recorded motion evidence from rendering or resolving a second time. The same source receipt supplied to an unselected draw leaves its whole record byte-identical.
 */
export async function test_render_capture_retain_motion_trails(): Promise<void> {
  const subject: IAutoMovieCaptureSubject = {
    name: "walker",
    durationSeconds: 3,
    fps: 24,
    width: 64,
    height: 36,
    views: [],
    drawables: [
      { path: "walker", min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 2, z: 2 } },
    ],
    marks: [],
  };
  const point = { x: 0, y: 0, z: 0 };
  const trail: IAutoMovieInspectionTrail = {
    path: "walker",
    times: [1.25, 1.5, 1.75],
    positions: [1, 0.01, 0.25, 1.5, 0.02, 0.25, 1.75, 0, 0.5],
    stationary: false,
    motion: {
      route: {
        id: "corner",
        points: [
          { x: 1, y: 0, z: 0.25 },
          { x: 1.75, y: 0, z: 0.5 },
        ],
        requestedSpeed: 1,
        effectiveSpeed: 0.75,
      },
      samples: [
        {
          time: { filmSeconds: 1.25, outputFrame: 30 },
          entry: null,
          projection: { status: "behind" },
        },
        {
          time: {
            filmSeconds: 1.5,
            outputFrame: 36,
            shot: { path: "turn", seconds: 0.625 },
          },
          entry: 2,
          baseline: {
            time: 0.625,
            position: { x: 1.5, y: 0, z: 0.25 },
            yawDeg: 90,
            tangent: { x: 1, y: 0, z: 0 },
          },
          forward: { x: 1, y: 0, z: 0 },
          phase: 0.375,
          projection: {
            status: "in-frame",
            ndc: { x: 0.25, y: -0.5, z: 0.75 },
          },
          support: {
            status: "observed",
            path: "deck",
            local: { x: 0.25, y: 0.005, z: -0.5 },
            gap: 0.005,
            slip: 0.02,
          },
        },
        {
          time: { filmSeconds: 1.75, outputFrame: 42 },
          entry: null,
          projection: { status: "unprojectable" },
          support: { status: "unavailable" },
        },
      ],
    },
  };
  const { motion: _source, ...providerless } = trail;
  let tracks: readonly IAutoMovieInspectionTrail[] | undefined;
  const times: number[] = [];
  const page: IAutoMovieRenderDrawPage = {
    addInitScript: async () => {},
    goto: async () => {},
    waitForFunction: async () => {},
    evaluate,
    close: async () => {},
  };
  const session = await AutoMovieRenderDrawSession.open({
    page,
    url: "http://test.invalid/",
    props: { subject: "walker", props: null },
    backend: "fixture",
    timeout: 2000,
  });
  try {
    const inactive = await capture(undefined);
    const legacy = await capture([providerless]);
    const selected = await capture([
      providerless,
      { ...trail, path: "another-actor" },
      trail,
    ]);
    const unselected = await capture(undefined, false);
    const unsolicited = await capture([trail], false);
    assert.deepEqual(times, [1.5, 1.5, 1.5, 1.5, 1.5]);
    assert.equal(unsolicited.bytes, unselected.bytes);
    assert.deepEqual(unsolicited.stills, unselected.stills);
    assert.equal("motionTrails" in unsolicited.row, false);
    assert.equal(legacy.bytes, inactive.bytes);
    assert.deepEqual(legacy.stills, inactive.stills);
    assert.deepEqual(selected.stills, inactive.stills);
    assert.equal("motionTrails" in inactive.row, false);
    assert.deepEqual(selected.row.motionTrails, [trail]);
    assert.deepEqual(
      AutoMovieEngineCaptureRecord.comparison(selected.record)?.rows,
      selected.record.rows,
    );
    const observed = AutoMovieEngineCaptureRecord.observe(selected.record);
    assert.equal(observed.type, "observed");
    assert.equal(observed.rows[0]?.type, "drawn");
    assert.deepEqual(observed.rows[0]?.motionTrails, [trail]);
    assert.equal(
      AutoMovieEngineCaptureRecord.observe(legacy.record).type,
      "observed",
    );
    assert(AutoMovieEngineCaptureRecord.comparison(legacy.record));

    const excessiveTimes = Array.from({ length: 1_202 }, (_, at) => at / 60);
    for (const value of [
      [],
      [{ ...trail, motion: undefined }],
      [{ ...trail, times: [1, 1.5, 1.75] }],
      [{ ...trail, positions: [1, 2, 3] }],
      [
        {
          ...trail,
          motion: {
            ...trail.motion,
            route: { ...trail.motion!.route, effectiveSpeed: 0 },
          },
        },
      ],
      [
        {
          ...trail,
          motion: {
            ...trail.motion,
            samples: [
              {
                ...trail.motion!.samples[0],
                projection: { status: "behind", ndc: point },
              },
              ...trail.motion!.samples.slice(1),
            ],
          },
        },
      ],
      [{ ...trail, times: excessiveTimes }],
      Array.from({ length: 65 }, (_, at) => ({ ...trail, path: String(at) })),
    ]) {
      const corrupt = {
        ...selected.record,
        rows: [{ ...selected.row, motionTrails: value }],
      };
      assert.deepEqual(AutoMovieEngineCaptureRecord.observe(corrupt), {
        type: "unobserved",
        reason: "malformed",
      });
      assert.equal(AutoMovieEngineCaptureRecord.comparison(corrupt), null);
    }
    const failed = {
      ...selected.record,
      rows: [{ ...selected.row, state: "failed", cause: "aborted" }],
    };
    assert.equal(AutoMovieEngineCaptureRecord.comparison(failed), null);
    assert.deepEqual(AutoMovieEngineCaptureRecord.observe(failed), {
      type: "unobserved",
      reason: "malformed",
    });
  } finally {
    await session.close();
  }

  async function capture(evidence: typeof tracks, selectTrail: boolean = true) {
    tracks = evidence;
    const memory = createCaptureMemory();
    const plan = AutoMovieRenderCapture.plan({
      request: AutoMovieRenderCapture.parsePlanRequest(
        new URLSearchParams(
          selectTrail ? "at=1.5&trail=walker&reach=.25&ticks=4" : "at=1.5",
        ),
      ),
      subject: session.subject,
      cuts: [],
    });
    const result = await AutoMovieRenderCapture.run({
      plan,
      draw: (cell) => session.drawing(cell, plan),
      folder: await AutoMovieRenderCaptureFolder.open({
        storage: memory.storage,
        root: "capture",
        round: null,
        compare: null,
      }),
      revision: "same-source",
      match: "cell",
    });
    const bytes: string = memory.text("capture/record.json");
    const record = JSON.parse(bytes) as typeof result;
    const row = record.rows[0];
    assert(row?.state === "drawn");
    return {
      bytes,
      record,
      row,
      stills: [...memory.files].filter(([name]) => name.endsWith(".png")),
    };
  }

  function evaluate(
    task: unknown,
    request: IAutoMovieRenderDrawPageRequest.IDescribe,
  ): Promise<IAutoMovieDrawDescription>;
  function evaluate(
    task: unknown,
    request: IAutoMovieRenderDrawPageRequest.ISpeak,
  ): Promise<void>;
  function evaluate(
    task: unknown,
    request: IAutoMovieRenderDrawPageRequest.IDraw,
  ): Promise<IAutoMovieDrawResult>;
  async function evaluate(
    _task: unknown,
    request: IAutoMovieRenderDrawPageRequest,
  ): Promise<IAutoMovieDrawDescription | IAutoMovieDrawResult | void> {
    if (request.kind === "describe") return { subject, renderer: "fixture" };
    if (request.kind === "speak") return;
    const filmSeconds: number = request.call.seconds;
    times.push(filmSeconds);
    return structuredClone({
      pixels: Buffer.alloc(subject.width * subject.height * 4, 127).toString(
        "base64",
      ),
      width: subject.width,
      height: subject.height,
      labels: [],
      legend: [],
      resolved: [],
      camera: {
        view: "film",
        projection: "perspective",
        position: { x: 0, y: 0, z: 4 },
        target: point,
        up: { x: 0, y: 1, z: 0 },
        fovDeg: 45,
        metresPerPixel: null,
        near: 0.1,
        far: 100,
      },
      diagnostics: {
        time: { filmSeconds, outputFrame: 36 },
        findings: [],
        coverage: [],
      },
      ...(tracks === undefined ? {} : { motionTrails: tracks }),
    } satisfies IAutoMovieDrawResult);
  }
}
