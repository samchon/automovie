import { AutoMovieCliRender } from "automovie";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { CliRenderDeliveryFixture } from "../internal/CliRenderDeliveryFixture";

/**
 * Report where rendering stopped and which output samples it actually observed.
 * Mount and draw refusals preserve the previously published film.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two failure boundaries and the evidence that should survive each.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public render operation with the real draw composer, a controlled draw session and a fixture encoder. It reads the installed report and checks the previous file's bytes. The test owns the temporary directory.
 * @evidence contracts/development/testing.md#independent-expectations A four-frame schedule at 4 fps has completed indices 0 and 1 before the injected failure at 0.5 seconds. A mount failure cannot hold any frames. The prior publication is the literal fixture bytes, compared directly after both failures.
 */
export async function test_cli_render_progress(): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "automovie-progress-"));
  const delivery = new CliRenderDeliveryFixture(root);
  const { input, run } = delivery;
  try {
    await AutoMovieCliRender.renderVideo(input, run);
    const published = await fs.readFile(delivery.video);

    delivery.sceneError = true;
    await assert.rejects(
      AutoMovieCliRender.renderVideo(
        {
          ...input,
          host: {
            ...input.host,
            async session(props) {
              const session = await input.host.session(props);
              return {
                ...session,
                async frame(seconds, ...rest) {
                  if (seconds === 0.5) throw new Error("Fixture draw stopped");
                  return session.frame(seconds, ...rest);
                },
              };
            },
          },
        },
        run,
      ),
      /Fixture draw stopped/u,
    );
    const draw = await delivery.readReport();
    assert.deepEqual(draw.frames.map((frame: { index: number }) => frame.index), [0, 1]);
    assert.equal(draw.progress.frameCount, 4);
    assert.equal(draw.progress.requested.stage, "draw-frame");
    assert.equal(draw.progress.requested.frame, 2);
    assert.equal(draw.progress.acknowledged.stage, "write-frame");
    assert.equal(draw.progress.acknowledged.frame, 1);
    assert.equal(draw.diagnostics.observedOutputFrames, 2);
    assert.equal(draw.diagnostics.expectedOutputFrames, 4);
    assert.equal(draw.diagnostics.unresolvedRequiredCoverage, true);
    assert.deepEqual(await fs.readFile(delivery.video), published);

    await assert.rejects(
      AutoMovieCliRender.renderVideo(
        {
          ...input,
          host: {
            ...input.host,
            async session() {
              throw new Error("Fixture mount stopped");
            },
          },
        },
        run,
      ),
      /Fixture mount stopped/u,
    );
    const mount = await delivery.readReport();
    assert.equal(mount.status, "failed");
    assert.equal(mount.failure.phase, "mount");
    assert.equal(mount.progress.requested.stage, "mount");
    assert.equal(mount.progress.acknowledged, null);
    assert.equal(mount.progress.frameCount, null);
    assert.deepEqual(mount.frames, []);
    assert.deepEqual(await fs.readFile(delivery.video), published);
  } finally {
    await fs.rm(root, { recursive: true });
  }
}
