import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import type { IAutoMovieArtifactStore } from "../../../../packages/engine/src/cache/IAutoMovieArtifactStore";
import { decodeAutoMovieArtifactJson } from "../../../../packages/engine/src/cache/decodeAutoMovieArtifactJson";
import { encodeAutoMovieArtifactJson } from "../../../../packages/engine/src/cache/encodeAutoMovieArtifactJson";
import { resolveAutoMovieArtifact } from "../../../../packages/engine/src/cache/resolveAutoMovieArtifact";
import { autoMovieHumanCalibrationKey } from "../../../../packages/human/src/generation/autoMovieHumanCalibrationKey";
import { resolveAutoMovieHumanCalibration } from "../../../../packages/human/src/generation/resolveAutoMovieHumanCalibration";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanSex } from "../../../../packages/human/src/typings/AutoMovieHumanSex";
import { HumanPeople } from "../internal/HumanPeople";

/**
 * The Human calibration cache keys, reuses, recomputes and repairs without generating a figure.
 *
 * Scenarios:
 * 1. The key is stable for equal parameters and toolchain, and changes with a parameter or the toolchain.
 * 2. Through the engine resolver with a stub computation under that key: the first call computes, the second reuses, a changed parameter recomputes and a corrupted entry is repaired.
 * 3. A calibration-shaped value (chains, events, poles, apertures, eyes, -0 and nested arrays) round-trips exactly through the stored bytes.
 * 4. resolveAutoMovieHumanCalibration returns an entry seeded under the key without calibrating.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the Human key, the engine resolver it drives and the real resolveAutoMovieHumanCalibration over a Map store, observing keys, computation counts, outcomes and decoded values; a key ignoring parameters or toolchain, a lossy encoding or a function not reading its own key fails.
 * @evidence contracts/development/testing.md#independent-expectations Expectations follow the documented key inputs and resolver outcomes; round-trip expectations are the input value, compared with Node's isDeepStrictEqual, which distinguishes -0.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers equal and changed parameters, changed toolchain, miss, hit, recompute and repair, and a seeded hit. That a skeleton prepared from a stored real calibration equals a fresh one needs a generated figure and is production acceptance, not a unit.
 * @evidence contracts/development/testing.md#execution-ownership A millisecond unit: table parameters are read without generating anyone, the computation is a stub through the public resolver, and no calibration, file, browser or process runs. Discovered by the test runner from its exported name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and the property each pins.
 */
export async function test_cache_human_calibration(): Promise<void> {
  const params: IAutoMovieHumanParameters = HumanPeople.params(
    HumanPeople.names()[0]!,
  );
  const other: IAutoMovieHumanParameters = {
    ...params,
    body: {
      ...params.body,
      anatomy: {
        ...params.body.anatomy,
        sex:
          params.body.anatomy.sex === AutoMovieHumanSex.Female
            ? AutoMovieHumanSex.Male
            : AutoMovieHumanSex.Female,
      },
    },
  };
  const toolchain: Record<string, string> = { "@automovie/human#src": "a" };
  const key: string = autoMovieHumanCalibrationKey(params, toolchain);
  TestValidator.equals(
    "stable key",
    autoMovieHumanCalibrationKey(structuredClone(params), { ...toolchain }),
    key,
  );
  TestValidator.predicate(
    "parameter and toolchain change",
    new Set([
      key,
      autoMovieHumanCalibrationKey(other, toolchain),
      autoMovieHumanCalibrationKey(params, { "@automovie/human#src": "b" }),
    ]).size === 3,
  );

  const entries: Map<string, IAutoMovieArtifactStore.IEntry> = new Map();
  const store: IAutoMovieArtifactStore = {
    read: async (
      at: string,
    ): Promise<IAutoMovieArtifactStore.IEntry | undefined> => entries.get(at),
    write: async (
      at: string,
      entry: IAutoMovieArtifactStore.IEntry,
    ): Promise<void> => {
      entries.set(at, entry);
    },
    remove: async (at: string): Promise<void> => {
      entries.delete(at);
    },
    digest: async (bytes: Uint8Array): Promise<string> =>
      `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
  };
  const calibration: Record<string, unknown> = {
    stature: 1752.5,
    chains: [
      {
        name: "trunk",
        sections: [
          [0, -0, 12.25],
          [1e-9, 3, -4],
        ],
      },
    ],
    events: [{ chain: "trunk", at: 1, children: ["neck"] }],
    poles: [{ chain: "leftHand", point: [-0, 0, 0] }],
    apertures: [{ name: "mouth", chain: "head", closed: true }],
    eyes: [{ side: "left", centre: [31, -0, 1620], radius: 12 }],
    diagnostics: [],
  };
  let runs: number = 0;
  const compute: () => Promise<Uint8Array> = async (): Promise<Uint8Array> => {
    ++runs;
    return encodeAutoMovieArtifactJson(calibration);
  };

  const first: string = (await resolveAutoMovieArtifact(store, key, compute))
    .outcome;
  const second: Uint8Array = (
    await resolveAutoMovieArtifact(store, key, compute)
  ).bytes;
  TestValidator.equals("compute then reuse", [first, runs], ["computed", 1]);
  TestValidator.predicate(
    "exact round trip",
    isDeepStrictEqual(decodeAutoMovieArtifactJson(second), calibration),
  );
  await resolveAutoMovieArtifact(
    store,
    autoMovieHumanCalibrationKey(other, toolchain),
    compute,
  );
  TestValidator.equals("parameter change recomputes", runs, 2);
  entries.set(key, { ...entries.get(key)!, bytes: Uint8Array.from([123]) });
  TestValidator.equals(
    "corruption repaired",
    (await resolveAutoMovieArtifact(store, key, compute)).outcome,
    "repaired",
  );

  TestValidator.predicate(
    "seeded hit",
    isDeepStrictEqual(
      await resolveAutoMovieHumanCalibration(params, { store, toolchain }),
      calibration,
    ),
  );
}
