import { frameTimes } from "@automovie/render";
import assert from "node:assert/strict";

import { FilmExportPlan } from "../../../src/export/FilmExportPlan";
import { FilmPlan } from "../../../src/film/FilmPlan";

/**
 * Keep the exported schedule on the same complete programme as the Viewer.
 *
 * Scenarios:
 * 1. Public Render schedules exactly 5400 samples over [0,180), matching every FilmPlan frame.
 * 2. URL construction preserves an immutable build entry and selected model, replacing draft range and autoplay.
 * 3. Unprepared and stale fifteen-second clocks refuse, as do nonlocal or non-HTTP routes.
 *
 * @evidence contracts/testing.md#observable-behavior Executes the public Render frame scheduler, consumed FilmPlan frame function and actual export URL/admission helpers. It catches a disconnected draft clock, sample rounding or changed artifact route without inspecting source strings. No browser, GPU, server or encoder runs.
 * @evidence contracts/testing.md#independent-cases The commission independently fixes three minutes at thirty frames per second, giving 5400 samples and the last time 5399/30. Local IPv4/IPv6 and localhost, preserved query/path, malformed/remote routes, stale and unprepared clocks cover admission; actual shared scene/pixels/audio require real export inspection.
 */
export function test_film_export_plan(): void {
  const times: number[] = frameTimes(30, 180);
  assert.equal(times.length, 5400);
  for (let index: number = 0; index < 5400; index++) {
    assert.equal(times[index], index / 30);
    assert.equal(FilmPlan.frameSeconds(index), times[index]);
  }
  assert.equal(times.at(-1), 5399 / 30);
  for (const host of ["127.0.0.1", "localhost", "[::1]"]) {
    const result: URL = new URL(
      FilmExportPlan.url(
        `http://${host}:5211/inspect-011.html?start=5&end=15&speed=.25&play=1&model=polygon`,
      ),
    );
    assert.equal(result.pathname, "/inspect-011.html");
    assert.equal(result.searchParams.get("model"), "polygon");
    assert.equal(result.searchParams.get("start"), "0");
    assert.equal(result.searchParams.get("end"), "180");
    assert.equal(result.searchParams.get("speed"), "1");
    assert.equal(result.searchParams.get("w"), "1280");
    assert.equal(result.searchParams.get("h"), "720");
    assert.equal(result.searchParams.has("play"), false);
  }
  const clock: {
    ready: boolean;
    durationSeconds: number;
    fps: number;
    frameCount: number;
  } = { ready: true, durationSeconds: 180, fps: 30, frameCount: 5400 };
  FilmExportPlan.assertClock(clock);
  for (const wrong of [
    { ...clock, ready: false },
    { ...clock, durationSeconds: 15, frameCount: 450 },
    { ...clock, frameCount: 5399 },
    { ...clock, fps: 24 },
    { ...clock, durationSeconds: Number.NaN },
  ])
    assert.throws((): void => FilmExportPlan.assertClock(wrong));
  for (const route of [
    "https://127.0.0.1:5211/",
    "http://example.com/",
    "file:///viewer.html",
    "invalid",
  ])
    assert.throws((): string => FilmExportPlan.url(route));
}
