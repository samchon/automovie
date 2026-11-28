import {
  AutoMovieRenderDraw,
  AutoMovieRenderDrawPlacement,
  AutoMovieRenderInspection,
} from "@automovie/render";
import assert from "node:assert/strict";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";
import { createRecordedFilmSubject } from "../../internal/createRecordedFilmSubject";

/**
 * A hard cut separates even a persistent object from its previous placement.
 * The two selected paths use one placement per grid time. The draw host
 * restores the exact present frame after sampling and uses its selected marks
 * for the same world bounds. An empty request needs only that final placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hard-cut identity, shared placements and settled-frame expectations.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises both the shared public sampler and normal Draw placement on a two-shot scene. Also refuses invalid reach and excess patterns before any placement.
 * @evidence contracts/development/testing.md#independent-expectations Shot A draws hero at x=-1 before output 2 s. Shot B puts the same object at x=1 from 2 s. The independent sensor uses x=2t, so the requested grid gives 3, 4 and 5 metres with no line across the cut. The hand-written seek order includes one shared grid placement per second.
 */
export async function test_render_draw_sample_played_trails(): Promise<void> {
  const { subject, calls } = createRecordedFilmSubject({
    transition: null,
    seekShot: true,
    optics: false,
  });
  const sensor: THREE.Group = new THREE.Group();
  sensor.name = "sensor";
  subject.scene.add(sensor);
  const seek = subject.seek;
  subject.seek = async (seconds: number): Promise<void> => {
    await seek(seconds);
    sensor.position.set(seconds * 2, 0, -5);
  };
  const request = InspectionScene.ask({
    trail: ["hero", "sensor", "hero"],
    reach: 0.5,
    ticks: 2,
    marks: ["trail", "trail/now"],
  });
  const draw = new AutoMovieRenderDrawPlacement("two shots", subject, {
    localClippingEnabled: false,
  });
  const segments = await AutoMovieRenderDraw.samplePlayedTrails(
    "two shots",
    subject,
    request,
    2,
  );
  assert.deepEqual(
    calls.map(({ name, numbers }) => [name, ...numbers]),
    [
      ["seek", 2],
      ["seek", 1.5],
      ["seek", 2],
      ["seek", 2.5],
    ],
  );
  assert.deepEqual(segments, [
    { path: "hero", times: [1.5], positions: [-1, 0, -5], stationary: true },
    {
      path: "hero",
      times: [2, 2.5],
      positions: [1, 0, -5, 1, 0, -5],
      stationary: true,
    },
    { path: "sensor", times: [1.5], positions: [3, 0, -5], stationary: true },
    {
      path: "sensor",
      times: [2, 2.5],
      positions: [4, 0, -5, 5, 0, -5],
      stationary: false,
    },
  ]);
  assert.deepEqual(
    AutoMovieRenderInspection.markTrails(segments, 2)
      .filter(({ kind }) => kind === "trail/now")
      .map(({ shape }) => shape),
    [
      { type: "points", points: [1, 0, -5] },
      { type: "points", points: [4, 0, -5] },
    ],
  );
  calls.length = 0;
  const handle = await draw.inspect(request, 2);
  assert.deepEqual(
    calls.map(({ name, numbers }) => [name, ...numbers]),
    [
      ["seek", 2],
      ["seek", 1.5],
      ["seek", 2],
      ["seek", 2.5],
      ["seek", 2],
    ],
  );
  assert.equal(sensor.position.x, 4);
  assert.equal(handle.bounds(null)?.max.x, 5);
  draw.restore();

  calls.length = 0;
  const empty = InspectionScene.ask({ trail: [], marks: [] });
  assert.deepEqual(
    await AutoMovieRenderDraw.samplePlayedTrails(
      "two shots",
      subject,
      empty,
      2,
    ),
    [],
  );
  await assert.rejects(
    AutoMovieRenderDraw.samplePlayedTrails(
      "two shots",
      subject,
      { ...request, reach: Infinity },
      2,
    ),
    /finite/u,
  );
  await assert.rejects(
    AutoMovieRenderDraw.samplePlayedTrails(
      "two shots",
      subject,
      { ...request, trail: Array<string>(17).fill("hero") },
      2,
    ),
    /16 path patterns/u,
  );
  assert.deepEqual(calls, []);
  await draw.inspect(empty, 2);
  assert.deepEqual(
    calls.map(({ name, numbers }) => [name, ...numbers]),
    [["seek", 2]],
  );
  draw.restore();
}
