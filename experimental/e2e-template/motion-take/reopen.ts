import type { IAutoMovieMotionTake } from "@automovie/interface";
import assert from "node:assert/strict";
import { readFile, rename, writeFile } from "node:fs/promises";

import { openMotionTake } from "../../src/executable/motionTake/openMotionTake";
import { draw } from "./draw";
import {
  assertObserved,
  cues,
  observe,
  playbackOrder,
  sampleTimes,
} from "./observe";
import { fixture } from "./source";

/** The uninterrupted observations saved by the first installed process. */
interface IReference {
  artifact: string;
  events: ReturnType<typeof cues>;
  images: string[];
  samples: ReturnType<typeof observe>[];
}

/** Bind all operations to the generated production created by the packed CLI. */
const original: Parameters<typeof openMotionTake>[0] = {
  root: process.cwd(),
  source: fixture.source,
  artifact: fixture.artifact,
};

/**
 * Refuse malformed, incompatible or incomplete inputs before a rerender can use
 * them.
 */
async function verifyRefusals(take: IAutoMovieMotionTake): Promise<void> {
  const rejected: string = `${fixture.directory}/rejected.json`;
  for (const { change, diagnostic } of [
    { change: { version: 2 }, diagnostic: /take-version/ },
    { change: { frames: [] }, diagnostic: /take-schema/ },
    {
      change: {
        provenance: {
          ...take.provenance,
          providers: take.provenance.providers.map(
            (provider): typeof provider =>
              provider.id === "carrier-motion"
                ? { ...provider, version: "2" }
                : provider,
          ),
        },
      },
      diagnostic: /take-provenance:.*provider/i,
    },
    {
      change: {
        provenance: {
          ...take.provenance,
          files: take.provenance.files.map((file): typeof file =>
            file.path === fixture.data
              ? { ...file, sha256: "0".repeat(64) }
              : file,
          ),
        },
      },
      diagnostic: /take-provenance:.*sha256 changed/,
    },
  ]) {
    await writeFile(rejected, JSON.stringify({ ...take, ...change }));
    await assert.rejects(
      openMotionTake({ ...original, artifact: rejected }),
      diagnostic,
    );
  }
  const moved: string = `${fixture.data}.missing`;
  await rename(fixture.data, moved);
  try {
    await assert.rejects(
      openMotionTake(original),
      /Motion take path is unavailable|Could not resolve "\.\/body\.json"/,
    );
  } finally {
    await rename(moved, fixture.data);
  }
  const opaqueArtifact: string = `${fixture.directory}/opaque-rejected.json`;
  await assert.rejects(
    openMotionTake({
      ...original,
      source: fixture.opaqueSource,
      artifact: opaqueArtifact,
      create: { mode: "save", outputSeconds: fixture.seconds },
    }),
    /take-provider: opaque provider at .*\.articulateSite/u,
  );
  await assert.rejects(readFile(opaqueArtifact), { code: "ENOENT" });
  await assert.rejects(
    openMotionTake({
      ...original,
      artifact: rejected,
      create: { mode: "save", outputSeconds: 2.7 },
    }),
    /take-overlap/,
  );
  const overlap: Awaited<ReturnType<typeof openMotionTake>> =
    await openMotionTake({
      ...original,
      artifact: `${fixture.directory}/overlap.json`,
      create: { mode: "save", outputSeconds: 2.7, entry: 1 },
    });
  assert.equal(overlap.take.anchor.entry, 1);
  assertObserved(
    overlap.take.anchor.sourceSeconds,
    2.95,
    "selected overlap clock",
  );
}

/**
 * Reopen in a fresh process, rerender across the seam and replace an existing
 * suffix.
 */
async function reopen(): Promise<void> {
  const reference: IReference = JSON.parse(
    await readFile(fixture.reference, "utf8"),
  );
  const { take, replay } = await openMotionTake(original);
  assert.deepEqual(take.anchor, {
    sequence: "retimed-catch",
    entry: 1,
    shot: "staged-catch",
    outputSeconds: fixture.seconds,
    sourceSeconds: fixture.sourceSeconds,
    side: "after",
  });
  for (const index of playbackOrder) {
    const seconds: number = sampleTimes[index]!;
    assertObserved(
      observe(replay.performanceAt(seconds), seconds),
      reference.samples[index],
      `reopened at ${seconds}`,
    );
  }
  assertObserved(cues(replay.source), reference.events, "source cue sequence");
  assert.deepEqual(
    await draw(take),
    reference.images,
    "reopened raster pixels across the seam",
  );

  const identical: Awaited<ReturnType<typeof openMotionTake>> =
    await openMotionTake({
      ...original,
      source: fixture.sameSource,
      artifact: fixture.sameArtifact,
      create: { mode: "branch" },
    });
  assert.equal(identical.replay.branchStart, 2);
  for (const [index, seconds] of sampleTimes.entries())
    if (seconds >= 2)
      assertObserved(
        observe(identical.replay.performanceAt(seconds), seconds),
        reference.samples[index],
        `identical continuation at ${seconds}`,
      );

  const alternative: Awaited<ReturnType<typeof openMotionTake>> =
    await openMotionTake({
      ...original,
      source: fixture.branchSource,
      artifact: fixture.branchArtifact,
      create: { mode: "branch" },
    });
  assert.equal(alternative.replay.branchStart, 2);
  assert.equal(alternative.take.parent?.path, fixture.artifact);
  for (const [index, seconds] of sampleTimes.entries())
    if (seconds < 2)
      assertObserved(
        observe(alternative.replay.performanceAt(seconds), seconds),
        reference.samples[index],
        `branch prefix at ${seconds}`,
      );
  const replaced: ReturnType<typeof observe> = observe(
    alternative.replay.performanceAt(2.5),
    2.5,
  );
  assert.notDeepEqual(
    replaced.catcher.root,
    reference.samples[7]!.catcher.root,
    "replacement changes the pose",
  );
  assert.equal(
    alternative.replay.branch?.segments("catcher").at(-1)?.id,
    "new-tail",
  );
  assert.equal(replay.source.segments("catcher").at(-1)?.id, "old-tail");
  assertObserved(
    cues(alternative.replay.branch!),
    reference.events,
    "branch cue sequence",
  );
  assertObserved(
    observe(replay.source, 2.5),
    reference.samples[7],
    "original tail after branch",
  );
  assert.equal(
    await readFile(fixture.artifact, "utf8"),
    reference.artifact,
    "original artifact is unchanged",
  );

  await verifyRefusals(take);
}

await reopen();
