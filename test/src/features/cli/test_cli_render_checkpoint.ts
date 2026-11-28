import { AutoMovieCliRender } from "automovie";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { CliRenderDeliveryFixture } from "../internal/CliRenderDeliveryFixture";

/**
 * Reuse only verified frame data from the requested render identity.
 * An interrupted sequence keeps its prefix, a complete sequence can be encoded
 * with the draw host unavailable, and a foreign or damaged checkpoint fails.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the resume, restart and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the CLI render owner with a real temporary checkpoint and records all session opens and frame requests. Uses the real Render composer and an injected encoder. Compares the publication before and after refusals.
 * @evidence contracts/development/testing.md#independent-expectations Four native 4 fps samples have seconds 0, 0.25, 0.5 and 0.75. The first two succeed before the injected interruption. A changed digest and one appended byte independently invalidate checkpoint identity and frame integrity.
 */
export async function test_cli_render_checkpoint(): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "automovie-checkpoint-"));
  const delivery = new CliRenderDeliveryFixture(root);
  const directory = path.join(root, "retained");
  const identity = "1".repeat(64);
  const checkpoint = { directory, identity, rendererIdentity: "fixture-backend" };
  const attempted: number[] = [];
  let interrupted = true;
  let opened = 0;
  let unavailable = false;
  const input = {
    ...delivery.input,
    checkpoint,
    host: {
      ...delivery.input.host,
      async session(props: Parameters<typeof delivery.input.host.session>[0]) {
        ++opened;
        if (unavailable) throw new Error("Fixture draw host unavailable");
        const session = await delivery.input.host.session(props);
        return {
          ...session,
          async frame(seconds: number, ...rest: Parameters<typeof session.frame> extends [number, ...infer P] ? P : never) {
            attempted.push(seconds);
            if (interrupted && seconds === 0.5) throw new Error("Fixture stopped");
            return session.frame(seconds, ...rest);
          },
        };
      },
    },
  };
  try {
    await assert.rejects(AutoMovieCliRender.renderVideo(input, delivery.run), /Fixture stopped/u);
    assert.deepEqual(attempted, [0, 0.25, 0.5]);
    assert.deepEqual((await delivery.readReport()).checkpoint.retainedFrames, [0, 1]);

    interrupted = false;
    attempted.length = 0;
    await AutoMovieCliRender.renderVideo(input, delivery.run);
    assert.deepEqual(attempted, [0.5, 0.75]);
    assert.equal(opened, 2);
    assert.deepEqual((await delivery.readReport()).checkpoint.retainedFrames, [0, 1, 2, 3]);
    assert.deepEqual((await delivery.readReport()).checkpoint.reusedFrames, [0, 1]);
    const previous = await fs.readFile(delivery.video);

    unavailable = true;
    attempted.length = 0;
    await AutoMovieCliRender.renderVideo(input, delivery.run);
    assert.equal(opened, 2);
    assert.deepEqual(attempted, []);
    assert.deepEqual((await delivery.readReport()).checkpoint.reusedFrames, [0, 1, 2, 3]);
    assert.deepEqual(await fs.readFile(delivery.video), previous);

    await assert.rejects(
      AutoMovieCliRender.renderVideo({ ...input, checkpoint: { ...checkpoint, identity: "2".repeat(64) } }, delivery.run),
      /checkpoint.*identity/u,
    );
    const native = (await fs.readdir(directory)).find((file) => /^frame-\d+\.bin$/u.test(file));
    assert(native);
    await fs.appendFile(path.join(directory, native), "corruption");
    await assert.rejects(AutoMovieCliRender.renderVideo(input, delivery.run), /checkpoint.*digest/u);
    assert.equal(opened, 2);
    assert.deepEqual(await fs.readFile(delivery.video), previous);
  } finally {
    await fs.rm(root, { recursive: true });
  }
}
