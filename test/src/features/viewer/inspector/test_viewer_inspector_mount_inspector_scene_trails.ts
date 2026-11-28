import type {
  IAutoMovieInspectionLegendEntry,
  IAutoMovieInspectionTrail,
} from "@automovie/interface";
import {
  AutoMovieViewerInspector,
  AutoMovieViewerInspectorPlayhead,
} from "@automovie/viewer";
import assert from "node:assert/strict";

import { createRecordedFilmSubject } from "../../internal/createRecordedFilmSubject";
import { filmResponseRendererFields } from "../../internal/filmResponseRendererFields";

/**
 * The inspector mounts a selected world trail, then reads it across the same
 * hard-cut scope as Draw. A new request during a held seek discards the old
 * trail without painting it. Playback after clearing the trail places only its
 * displayed pose. Numeric trail reports follow the painted sample across the
 * cut and clear when the selection is removed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the observed trail, the late request and the plain playback result.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the normal inspector mount with controlled frame callbacks, the two-shot subject and an owner-controlled asynchronous seek.
 * @evidence contracts/development/testing.md#independent-expectations The fixture has a cut at output 2 s. The trail grid at 2 is 1.5, 2 and 2.5. The newer unselected request seeks to 3 and a later playhead tick seeks to 3.25. The output frames 36, 48 and 60 and the source shot clocks 2.5, 0 and 0.5 distinguish the entries. The placed seconds, source reads and post-paint reports distinguish restored and discarded work.
 */
export async function test_viewer_inspector_mount_inspector_scene_trails(): Promise<void> {
  const { subject, calls } = createRecordedFilmSubject({
    transition: null,
    seekShot: true,
    optics: false,
  });
  const reads: number[] = [];
  subject.inspectMotionTrail = {
    read(query) {
      reads.push(query.time.filmSeconds);
      return { forwardAxis: { x: 0, y: 0, z: 1 } };
    },
  };
  const seek = subject.seek;
  let hold: Promise<void> | undefined;
  subject.seek = async (seconds: number): Promise<void> => {
    await seek(seconds);
    if (seconds === 1.5) await hold;
  };
  const { promise, resolve } = Promise.withResolvers<void>();
  const playhead = new AutoMovieViewerInspectorPlayhead();
  const request = AutoMovieViewerInspector.readAddress(
    "at=2&trail=hero&reach=.5&ticks=2&marks=trail,trail/now",
  );
  let frame: ((now: number) => void) | undefined;
  let paints: number = 0;
  let legend: readonly IAutoMovieInspectionLegendEntry[] = [];
  const errors: string[] = [];
  const reports: {
    trails: readonly IAutoMovieInspectionTrail[];
    seconds: number;
    paints: number;
  }[] = [];
  const mounted = AutoMovieViewerInspector.mountScene({
    name: "two shots",
    subject: { create: async () => subject },
    request,
    playhead,
    host: {
      size: () => ({ width: 64, height: 36, pixelRatio: 1 }),
      requestFrame: (callback) => {
        frame = callback;
        return 1;
      },
      cancelFrame: () => {
        frame = undefined;
      },
      createRenderer: () => ({
        compositor: null,
        renderer: {
          ...filmResponseRendererFields(),
          localClippingEnabled: false,
          setPixelRatio: () => {},
          setSize: () => {},
          dispose: () => {},
          render: () => {
            paints++;
          },
        },
      }),
    },
    report: {
      ready: () => {},
      legend: (entries) => {
        legend = entries;
      },
      labels: () => {},
      motionTrails: (trails, seconds) => {
        reports.push({ trails, seconds, paints });
      },
      error: (message) => {
        if (message !== null) errors.push(message);
      },
      refused: (_request, error) => {
        errors.push(error);
      },
    },
  });
  const positions = (): number[][] =>
    calls
      .splice(0)
      .filter(({ name }) => name === "seek" || name === "seekShot")
      .map(({ numbers }) => numbers);
  try {
    await settle();
    assert.deepEqual(positions(), [[2]]);
    frame!(0);
    await settle();
    assert.deepEqual(positions(), [[2], [1.5], [2], [2.5], [2]]);
    assert.equal(playhead.getSnapshot().seconds, 2);
    assert.equal(paints, 1);
    assert.deepEqual(
      legend.map(({ label, count }) => [label, count]),
      [
        ["trail", 2],
        ["trail at the drawn second", 1],
      ],
    );

    assert.deepEqual(reads, [1.5, 2, 2.5]);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.seconds, 2);
    assert.equal(reports[0]?.paints, 1);
    assert.deepEqual(
      reports[0]?.trails.map(({ motion, positions }) => ({
        positions,
        samples: motion?.samples.map(({ time, entry, forward, support }) => ({
          time,
          entry,
          forward,
          support,
        })),
      })),
      [
        {
          positions: [-1, 0, -5],
          samples: [
            {
              time: {
                filmSeconds: 1.5,
                outputFrame: 36,
                shot: { path: "shot:a", seconds: 2.5 },
              },
              entry: 0,
              forward: { x: 0, y: 0, z: 1 },
              support: undefined,
            },
          ],
        },
        {
          positions: [1, 0, -5, 1, 0, -5],
          samples: [
            {
              time: {
                filmSeconds: 2,
                outputFrame: 48,
                shot: { path: "shot:b", seconds: 0 },
              },
              entry: 1,
              forward: { x: 0, y: 0, z: 1 },
              support: undefined,
            },
            {
              time: {
                filmSeconds: 2.5,
                outputFrame: 60,
                shot: { path: "shot:b", seconds: 0.5 },
              },
              entry: 1,
              forward: { x: 0, y: 0, z: 1 },
              support: undefined,
            },
          ],
        },
      ],
    );

    hold = promise;
    mounted.apply(
      AutoMovieViewerInspector.readAddress(
        "at=2&trail=hero&reach=1&ticks=2&marks=trail,trail/now",
      ),
    );
    frame!(100);
    await settle();
    assert.deepEqual(positions(), [[2], [1], [1.5]]);
    mounted.apply(AutoMovieViewerInspector.readAddress("at=3"));
    resolve();
    await settle();
    assert.equal(paints, 1);
    assert.deepEqual(positions(), []);
    assert.equal(playhead.getSnapshot().seconds, 3);
    frame!(200);
    await settle();
    assert.equal(paints, 2);
    assert.deepEqual(positions(), [[3]]);
    assert.deepEqual(legend, []);

    playhead.play();
    frame!(450);
    await settle();
    assert.equal(paints, 3);
    assert.deepEqual(positions(), [[3.25]]);
    assert.deepEqual(reports.slice(1), [{ trails: [], seconds: 2, paints: 1 }]);
    assert.deepEqual(reads, [1.5, 2, 2.5, 1]);
    assert.deepEqual(errors, []);
  } finally {
    resolve();
    mounted.dispose();
  }
}

/* Let all immediately ready placements and their paint callbacks settle. */
async function settle(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}
