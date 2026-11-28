import { AutoMovieEnginePhysicalGeometry } from "@automovie/engine";
import type {
  IAutoMovieInspectionDiagnostics as Diagnostics,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieRenderCaptureRecord,
  AutoMovieRenderInspection,
  AutoMovieRenderInspectionMarks,
} from "@automovie/render";
import assert from "node:assert/strict";
import * as THREE from "three";

/**
 * A path selection reads original coverage and findings from the same placed
 * packets available to the Viewer and to a retained capture. A complete layer
 * can give no receipt for an unrelated or unaddressed pair.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies selected path boundaries, original placed and retained clocks, distinct observed statuses and historical records without path metadata.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public static, swept and placed-check producers, reduces their published packets, and compares the shared selected display against the admitted serialized capture while inspecting exact source objects.
 * @evidence contracts/development/testing.md#independent-expectations Two unit boxes at 0.9 m centres overlap by 0.1 m. The named 0.25 m allowance excludes the static finding only while active. Its start falls inside the independently supplied swept interval, deferring that cell. A valid identity transform is clear, an explicit missing solver receipt is unsupported, and the later tested frame after the allowance must retain the observed pair.
 */
export async function test_viewer_inspector_selected_coverage(): Promise<void> {
  const geometry = await AutoMovieEnginePhysicalGeometry.prepare();
  const scene = new THREE.Scene();
  const material = new THREE.MeshBasicMaterial();
  const box = new THREE.BoxGeometry();
  const actor = new THREE.Group();
  actor.name = "actor";
  const hand = new THREE.Mesh(box, material);
  hand.name = "hand";
  actor.add(hand);
  const prop = new THREE.Mesh(box, material);
  prop.name = "prop";
  prop.position.x = 0.9;
  const unrelated = new THREE.Mesh(box, material);
  unrelated.name = "actor2";
  unrelated.position.set(1.75, 0.1, 0);
  scene.add(actor, prop, unrelated);
  scene.updateMatrixWorld(true);
  const paths = ["actor/hand", "prop"] as const;
  const first: Diagnostics.ITime = { filmSeconds: 0.5, outputFrame: 12 };
  const second: Diagnostics.ITime = { filmSeconds: 14 / 24, outputFrame: 14 };
  const limits = {
    comparisons: 12_000,
    posedVertices: 100_000,
    surfaceTriangles: 1_000_000,
    sweptCells: 100,
  };
  const point = (x: number): IAutoMovieVector3 => ({ x, y: 0, z: 0 });
  const transformed = AutoMovieRenderInspection.observePlacedScene({
    scene,
    camera: new THREE.PerspectiveCamera(),
    time: first,
    checks: [
      {
        key: "hand-transform",
        required: true,
        paths: [paths[0]],
        input: {
          kind: "transform",
          path: "hand-transform",
          observation: {
            kind: "present",
            transform: {
              translation: point(0),
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
          },
        },
        observedContact: {
          status: "unobservable",
          seconds: first.filmSeconds,
          reason: "no solver receipt",
        },
      },
    ],
  });
  const firstCollision = AutoMovieRenderInspection.observePlacedSceneCollisions(
    {
      time: first,
      geometry,
      limits,
      layers: [
        {
          id: "main",
          root: scene,
          localSeconds: first.filmSeconds,
          required: true,
          allowances: [
            {
              first: paths[0],
              second: paths[1],
              startSeconds: 0.49,
              endSeconds: 0.525,
              maxPenetration: 0.25,
            },
          ],
          sweeps: [
            {
              paths,
              filmOffset: 0,
              props: {
                first: {
                  a0: point(-1),
                  b0: point(-1),
                  a1: point(1),
                  b1: point(1),
                  radius: 0.1,
                  basis: "displayed",
                },
                second: {
                  a0: point(0),
                  b0: point(0),
                  a1: point(0),
                  b1: point(0),
                  radius: 0.1,
                  basis: "displayed",
                },
                startSeconds: 0.45,
                endSeconds: 0.5,
                maxIntervals: 20,
              },
            },
          ],
        },
      ],
    },
  );
  const secondCollision =
    AutoMovieRenderInspection.observePlacedSceneCollisions({
      time: second,
      geometry,
      limits,
      layers: [
        {
          id: "main",
          root: scene,
          localSeconds: second.filmSeconds,
          required: true,
        },
      ],
    });
  const packets: Diagnostics[] = [
    {
      scope: "one",
      time: first,
      coverage: [...transformed.coverage, ...firstCollision.coverage],
      findings: [...transformed.findings, ...firstCollision.findings],
    },
    { scope: "one", time: second, ...secondCollision },
  ];
  const audit = AutoMovieRenderInspectionMarks.reduceEpisodes(packets);
  const select = (
    observations: Diagnostics.IObservations,
    roots: readonly string[],
  ) =>
    AutoMovieRenderInspectionMarks.selectDiagnostics({
      observations,
      paths: roots,
    });
  const live = select(audit, ["actor"]);
  assert.deepEqual(
    live.coverage.map(({ status, range }) => [
      range.first.outputFrame,
      range.last.outputFrame,
      range.coverage.check,
      range.coverage.basis ?? null,
      status,
    ]),
    [
      [12, 12, "received-contact", null, "unsupported"],
      [12, 12, "authored-transform", null, "checked-clear"],
      [12, 12, "collision", "static", "excluded"],
      [12, 12, "collision", "swept", "deferred"],
      [14, 14, "collision", "static", "checked-with-findings"],
    ],
  );
  assert.equal(
    live.coverage
      .find(({ status }) => status === "excluded")
      ?.range.coverage.paths?.join(),
    paths.join(),
  );
  assert.equal(live.episodes.length, 1);
  assert.deepEqual(live.episodes[0]?.worst.finding.paths, paths);
  assert.equal(live.episodes[0]?.worst.time.outputFrame, 14);
  assert.equal(live.totalCoverage, audit.coverage.length);
  assert.equal(live.totalEpisodes, audit.episodes.length);
  assert.equal(select(audit, ["actor", "never-recorded"]).coverage.length, 0);
  assert(
    !select(audit, ["actor2"]).episodes.some(({ first: witness }) =>
      witness.finding.paths.every((path) =>
        paths.some((pair) => path === pair),
      ),
    ),
  );
  assert.equal(audit.hasBlockingFinding, true);
  const journal = {
    state: "complete",
    subject: { name: "placed" },
    rows: [
      {
        view: "film",
        pass: "beauty",
        time: { seconds: 0.5, frame: 12 },
        state: "drawn",
        file: "drawn.png",
      },
    ],
    diagnostics: audit,
  };
  const stored = AutoMovieRenderCaptureRecord.observe(journal);
  assert.equal(stored.type, "observed");
  assert.deepEqual(select(stored, ["actor"]), live);
  assert.strictEqual(stored.coverage, journal.diagnostics.coverage);
  const reloaded = AutoMovieRenderCaptureRecord.observe(
    JSON.parse(JSON.stringify(journal)),
  );
  assert.equal(reloaded.type, "observed");
  assert.equal(JSON.stringify(select(reloaded, ["actor"])), JSON.stringify(live));
  assert.deepEqual(
    AutoMovieRenderInspectionMarks.reduceEpisodes(packets),
    audit,
  );

  const legacyJournal = {
    ...journal,
    diagnostics: {
      ...audit,
      coverage: audit.coverage.map((range) => {
        const { paths: _paths, basis: _basis, ...coverage } = range.coverage;
        return { ...range, coverage };
      }),
    },
  };
  const legacy = AutoMovieRenderCaptureRecord.observe(legacyJournal);
  assert.equal(legacy.type, "observed");
  assert.equal(select(legacy, ["actor"]).coverage.length, 0);
  assert.equal(select(legacy, ["actor"]).episodes.length, 1);
  const sample = legacyJournal.diagnostics.coverage[0]!;
  for (const malformed of [{ paths: [null] }, { basis: "estimated" }]) {
    const invalid = {
      ...legacyJournal,
      diagnostics: {
        ...legacyJournal.diagnostics,
        coverage: [
          { ...sample, coverage: { ...sample.coverage, ...malformed } },
        ],
      },
    };
    assert.deepEqual(AutoMovieRenderCaptureRecord.observe(invalid), {
      type: "unobserved",
      reason: "malformed",
    });
  }
  box.dispose();
  material.dispose();
}
