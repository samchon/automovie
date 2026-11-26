import { strict as assert } from "node:assert";
import LZString from "lz-string";
import type { IAutoMovieIntent } from "@automovie/interface";

import { formatSceneChain } from "../src/scenes/formatSceneChain";
import { PlaygroundAddress } from "../src/playground/PlaygroundAddress";
import type { IPlaygroundComposition } from "../src/playground/structures/IPlaygroundComposition";

/** The exact untagged cut shapes saved by earlier playground links. */
const LEGACY: readonly unknown[] = [
  { share: 0.5 },
  { event: "impact" },
  { of: "strike", event: "impact", index: 1 },
  {
    proximity: {
      effector: "palmRight",
      target: { kind: "point", at: { x: 0, y: 1, z: 2 }, frame: "world" },
      distance: 0,
    },
  },
];

/** Their canonical tagged forms. */
const CANONICAL: readonly IAutoMovieIntent.IUntil[] = [
  { type: "share", share: 0.5 },
  { type: "event", event: "impact" },
  { type: "anchor-event", of: "strike", event: "impact", index: 1 },
  {
    type: "proximity",
    proximity: {
      effector: "palmRight",
      target: { kind: "point", at: { x: 0, y: 1, z: 2 }, frame: "world" },
      distance: 0,
    },
  },
];

/**
 * Check that old links across all saved versions decode to tagged cuts, encode
 * writes the tagged form, invalid combinations are refused, and displayed
 * scene code calls the SDK with tagged cuts.
 */
export function checkPlaygroundScheduleCuts(): void {
  for (const version of [1, 2, 3] as const)
    for (const [index, cut] of LEGACY.entries()) {
      const source = saved(version, cut);
      const decoded = PlaygroundAddress.decode(hash(source))!;
      const action = decoded.performers[0]!.actions[0]!;
      assert.deepEqual(action.until, CANONICAL[index]);
      assert.equal(decoded.seed, "cut-seed");
      assert.equal(decoded.version, version);
      assert.equal(action.params.marker, "preserved");
      assert.deepEqual(
        PlaygroundAddress.decode(hash(saved(version, CANONICAL[index])))!
          .performers[0]!.actions[0]!.until,
        CANONICAL[index],
      );
      assert.deepEqual(
        PlaygroundAddress.decode(
          PlaygroundAddress.encode(source as IPlaygroundComposition),
        )!.performers[0]!.actions[0]!.until,
        CANONICAL[index],
      );

      if (index === 0) {
        assert.deepEqual(action.over?.[0]?.until, CANONICAL[1]);
      }
    }

  for (const invalid of [
    { share: 0.5, event: "impact" },
    { type: "share", share: 0.5, event: "impact" },
    { type: "unknown", value: 1 },
  ])
    assert.throws(() => PlaygroundAddress.decode(hash(saved(3, invalid))));

  const composition: IPlaygroundComposition = saved(3, LEGACY[0]) as
    IPlaygroundComposition;
  const code = formatSceneChain(composition, {
    bodySex: {},
    rows: {},
    mutuals: {},
    frames: [],
    formats: [],
    laws: [],
  });
  assert.match(code, /\.until\(\{\s*type: "share",\s*share: 0\.5\s*\}\)/);
}

/** A saved v1, v2 or v3 payload with a legacy cut and an overlaid cut. */
function saved(version: 1 | 2 | 3, until: unknown): unknown {
  return {
    version,
    seed: "cut-seed",
    performers: [
      {
        subject: "actor",
        body: "m1",
        x: 0,
        z: 0,
        yaw: 0,
        proficiency: "trained",
        actions: [
          {
            name: "stand",
            params: { seconds: 2, marker: "preserved" },
            until,
            ...(typeof until === "object" && until !== null && "share" in until
              ? {
                  over: [
                    { name: "stand", params: { seconds: 1 }, until: LEGACY[1] },
                  ],
                }
              : {}),
          },
        ],
      },
    ],
    mutuals: [],
  };
}

/** Compress a saved payload without routing through the canonical writer. */
function hash(value: unknown): string {
  return `#c=${LZString.compressToEncodedURIComponent(JSON.stringify(value))}`;
}
