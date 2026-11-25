import type { IAutoMovieSolidSurface } from "@automovie/interface";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { FamilyConicCaptureFrame as Frame } from "../../../reference-conics/FamilyConicCaptureFrame";
import { FamilyConicNeutralViews as Views } from "../../../reference-conics/FamilyConicNeutralViews";
import type { NodeCanvasTypes as N } from "../../../reference-conics/render/NodeCanvasTypes";

/**
 * The shared whole-case writer draws matching clay and atlas guides, and
 * reports missing original joints even when some frames are available.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Takes the normal writer with a literal indexed skin and chart, checks the completed PNG receipts and compares one prepared image pair with two independent raster calls.
 * @evidence contracts/development/testing.md#independent-expectations A planar triangle at x=40 mm is the supplied exact three-point boundary. Either incident chart names it once. The named absent shoulder has no indices.
 * @evidence contracts/development/testing.md#distinguishing-cases Body and left shoulder pairs must use the same camera and skin within each pair, and the missing right shoulder must have zero frames.
 * @evidence contracts/development/testing.md#execution-ownership Runs the existing raster and PNG pipeline on a tetrahedron, with temporary output cleanup and no generated Human case or reference asset.
 * @evidence contracts/development/common.md#meaningful-documentation The finite sampled geometry grounds the image and provenance expectations.
 */
export async function test_human_neutral_case_views(): Promise<void> {
  const shoulder: string = "blend.arm.left.trunk";
  const edge: [number, number][] = [
    [420, 80],
    [420, 160],
    [500, 120],
  ];
  const point = (u: number, v: number): [number, number, number] => [40, u, v];
  const surface: IAutoMovieSolidSurface = {
    name: shoulder,
    orientation: 1,
    point,
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: point(u, v),
      u: [0, 1, 0],
      v: [0, 0, 1],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
  const body: Parameters<typeof Views.write>[0] = {
    mesh: {
      positions: [
        0.04, 0.42, 0.08, 0.04, 0.42, 0.16, 0.04, 0.5, 0.12, -0.05, 0.44, 0.12,
      ],
      indices: [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0],
      normals: null,
      uvs: null,
      skin: null,
    },
    calibration: {
      stature: 1000,
      chains: [],
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
      bodies: [
        {
          name: "skin",
          points: edge.map((chart) => ({ chain: shoulder, chart })),
          faces: [
            {
              chain: shoulder,
              cycles: [{ kind: "start", points: [0, 1, 2], chart: edge }],
            },
            {
              chain: "trunk",
              cycles: [
                { kind: "hole", points: [2, 1, 0], chart: [...edge].reverse() },
              ],
            },
          ],
        },
      ],
    },
    solidSurfaces: new Map([[shoulder, surface]]),
    triangleGroups: [{ name: `${shoulder}/solid`, start: 0 }],
    diagnostics: [],
  };
  const directory: string = await mkdtemp(
    path.join(tmpdir(), "automovie-neutral-views-"),
  );
  try {
    const receipt = await Views.write(body, directory, "fixture");
    assert.equal(
      receipt.frames.filter(({ scope }) => scope === "body").length,
      12,
    );
    assert.equal(
      receipt.frames.filter(({ scope }) => scope === "shoulder.left").length,
      8,
    );
    assert.equal(receipt.preparations.length, 10);
    assert(!receipt.frames.some(({ scope }) => scope === "shoulder.right"));
    assert(
      receipt.unavailable.some((failure) =>
        failure.startsWith("shoulder.right:"),
      ),
    );
    assert(
      !receipt.unavailable.some((failure) =>
        failure.startsWith("shoulder.left"),
      ),
    );

    for (const clay of receipt.frames.filter(({ stage }) => stage === "clay")) {
      const overlay = receipt.frames.find(
        ({ scope, stage, camera }) =>
          scope === clay.scope &&
          stage === "curves-over-clay" &&
          camera.name === clay.camera.name,
      );
      assert(overlay);
      assert.deepEqual(clay.camera, overlay.camera);
      assert.deepEqual(clay.meshes, overlay.meshes);
      assert.deepEqual(clay.curves, []);
      assert.deepEqual(overlay.curves, [`atlas/0/${shoulder}/start/0`]);
      assert(clay.pixels.surface > 0);
      assert.equal(clay.pixels.surface, overlay.pixels.surface);
      assert.equal(
        receipt.preparations.filter(
          ({ scope, view, milliseconds }) =>
            scope === clay.scope &&
            view === clay.camera.name &&
            Number.isFinite(milliseconds) &&
            milliseconds >= 0,
        ).length,
        1,
      );
      for (const frame of [clay, overlay]) {
        const bytes: Buffer = await readFile(path.join(directory, frame.file));
        assert.equal(
          createHash("sha256").update(bytes).digest("hex"),
          frame.sha256,
        );
      }
    }
    assert(
      receipt.frames.some(
        ({ scope, stage, pixels }) =>
          scope === "shoulder.left" &&
          stage === "curves-over-clay" &&
          pixels.line > 0,
      ),
    );
    const unprepared = {
      frames: [] as typeof receipt.frames,
      input: { selected: { id: "ANSUR neutral fixture" } },
    };
    const mesh: N.Mesh = {
      id: "fixture/skin",
      positions: body.mesh.positions,
      indices: body.mesh.indices!,
      colour: [0.64, 0.65, 0.67],
    };
    const curves: N.Curve[] = [
      {
        id: `atlas/0/${shoulder}/start/0`,
        points: edge.map(([u, v]): N.Point => [0.04, u * 0.001, v * 0.001]),
        closed: true,
      },
    ];
    const front = receipt.frames.filter(
      ({ scope, camera }) => scope === "body" && camera.name === "front",
    );
    assert.equal(front.length, 2);
    for (const frame of front) {
      await Frame.write(
        unprepared,
        directory,
        `direct.${frame.file}`,
        frame.camera,
        [mesh],
        frame.stage === "clay" ? [] : curves,
        "depth",
        "fixture | body | front",
        frame.stage,
        frame.scope,
        frame.observation,
      );
      const direct = unprepared.frames.at(-1)!;
      assert.equal(direct.sha256, frame.sha256);
      assert.deepEqual(direct.pixels, frame.pixels);
      assert.deepEqual(direct.camera, frame.camera);
      assert.deepEqual(direct.meshes, frame.meshes);
    }
    const camera: N.Camera = front[0]!.camera;
    const prepared = Frame.prepare(camera, [mesh]);
    await assert.rejects(
      Frame.write(
        null,
        directory,
        "foreign.png",
        { ...camera },
        [mesh],
        [],
        "depth",
        "fixture",
        "clay",
        "body",
        undefined,
        undefined,
        prepared,
      ),
      /different camera or original skin/,
    );
  } finally {
    await rm(directory, { recursive: true });
  }
}
