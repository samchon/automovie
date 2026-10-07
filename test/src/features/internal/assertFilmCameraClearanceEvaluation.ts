import { TestValidator } from "@nestia/e2e";

import type { IFilmCameraClearanceEvaluationInputs } from "./IFilmCameraClearanceEvaluationInputs";

/** Run the original continuous numerical clearance and malformed clock assertions. */
export function assertFilmCameraClearanceEvaluation(
  input: IFilmCameraClearanceEvaluationInputs,
): void {
  const { identity, box, envelope, evaluate, throws } = input;
  const boundary = evaluate({
    samples: [0, 1].map((time) => ({
      time,
      camera: identity(),
      obstacles: [{ node: "wall", bounds: box({ x: 0.2, y: 0, z: 0 }, 0.1) }],
    })),
  });
  TestValidator.equals(
    "inclusive static boundary contact",
    boundary.status,
    "blocked",
  );
  TestValidator.equals("boundary finding is addressed", boundary.findings, [
    { part: "body", obstacle: "wall", start: 0, end: 1 },
  ]);

  const midpoint = evaluate({
    samples: [
      {
        time: 0,
        camera: identity(-2),
        obstacles: [{ node: "wall", bounds: box({ x: 0, y: 0, z: 0 }) }],
      },
      {
        time: 1,
        camera: identity(2),
        obstacles: [{ node: "wall", bounds: box({ x: 0, y: 0, z: 0 }) }],
      },
    ],
  });
  TestValidator.equals(
    "clear endpoints still catch midpoint penetration",
    midpoint.status,
    "blocked",
  );
  const causalMidpoint = evaluate({
    samples: [
      {
        time: 0,
        camera: identity(-2),
        obstacles: [{ node: "wall", bounds: box({ x: 0, y: 0, z: 0 }) }],
      },
      {
        time: 0.5,
        camera: identity(),
        obstacles: [{ node: "wall", bounds: box({ x: 0, y: 0, z: 0 }) }],
      },
      {
        time: 1,
        camera: identity(-2),
        obstacles: [{ node: "wall", bounds: box({ x: 0, y: 0, z: 0 }) }],
      },
    ],
  });
  TestValidator.equals(
    "an off-clock causal key refines rather than replaces the fixed clock",
    [
      causalMidpoint.status,
      causalMidpoint.intervals,
      causalMidpoint.sampleTimes,
    ],
    ["blocked", 2, [0, 0.5, 1]],
  );

  const rigOnly = evaluate({
    envelope: envelope(
      { center: { x: 0, y: 3, z: 0 }, radius: 0.1 },
      { center: { x: 0, y: 0, z: 0 }, radius: 0.1 },
    ),
    samples: [0, 1].map((time) => ({
      time,
      camera: identity(),
      obstacles: [{ node: "support", bounds: box({ x: 0, y: 0, z: 0 }) }],
    })),
  });
  TestValidator.equals("rig-only collision is distinct", rigOnly.findings, [
    { part: "parent-rig", obstacle: "support", start: 0, end: 1 },
  ]);

  const moving = evaluate({
    samples: [
      {
        time: 0,
        camera: identity(),
        obstacles: [{ node: "actor", bounds: box({ x: -2, y: 0, z: 0 }) }],
      },
      {
        time: 1,
        camera: identity(),
        obstacles: [{ node: "actor", bounds: box({ x: 2, y: 0, z: 0 }) }],
      },
    ],
  });
  TestValidator.equals(
    "moving subject same-sample crossing",
    moving.status,
    "blocked",
  );
  const skewMiss = evaluate({
    samples: [
      {
        time: 0,
        camera: identity(-2, 2, 0),
        obstacles: [
          { node: "z-wall", bounds: box({ x: 0, y: 0, z: 0 }) },
          { node: "a-floor", bounds: box({ x: 8, y: 8, z: 8 }) },
          { node: "m-opening", bounds: box({ x: 9, y: 9, z: 9 }) },
        ],
      },
      {
        time: 1,
        camera: identity(2, 3, 0),
        obstacles: [
          { node: "z-wall", bounds: box({ x: 0, y: 0, z: 0 }) },
          { node: "a-floor", bounds: box({ x: 8, y: 8, z: 8 }) },
          { node: "m-opening", bounds: box({ x: 9, y: 9, z: 9 }) },
        ],
      },
    ],
  });
  TestValidator.equals(
    "disjoint moving slabs remain clear in stable obstacle order",
    skewMiss.status,
    "clear",
  );

  const rotating = evaluate({
    envelope: envelope({ center: { x: 1, y: 0, z: 0 }, radius: 0.01 }),
    samples: [
      {
        time: 0,
        camera: identity(),
        obstacles: [
          { node: "ceiling", bounds: box({ x: 0, y: 1, z: 0 }, 0.01) },
        ],
      },
      {
        time: 1,
        camera: {
          ...identity(),
          rotation: { x: 0, y: 0, z: 1, w: 0 },
        },
        obstacles: [
          { node: "ceiling", bounds: box({ x: 0, y: 1, z: 0 }, 0.01) },
        ],
      },
    ],
  });
  TestValidator.equals(
    "offset rotation arc is conservatively covered",
    rotating.status,
    "blocked",
  );

  const clear = evaluate();
  const stale = evaluate({ currentRevision: "revision-8" });
  const instant = evaluate({
    duration: 0,
    samples: [
      {
        time: 0,
        camera: { ...identity(), scale: { x: 2, y: 1, z: 1 } },
        obstacles: [{ node: "wall", bounds: box({ x: 5, y: 0, z: 0 }) }],
      },
    ],
  });
  const instantContact = evaluate({
    duration: 0,
    samples: [
      {
        time: 0,
        camera: identity(),
        obstacles: [{ node: "wall", bounds: box({ x: 0, y: 0, z: 0 }) }],
      },
    ],
  });
  TestValidator.equals(
    "current, stale, and zero-duration contact reports stay distinct",
    [
      [clear.status, clear.intervals, clear.findings.length],
      [stale.status, stale.intervals, stale.findings.length],
      [instant.status, instant.intervals, instant.findings.length],
      [
        instantContact.status,
        instantContact.intervals,
        instantContact.findings,
      ],
    ],
    [
      ["clear", 1, 0],
      ["stale", 0, 0],
      ["clear", 0, 0],
      ["blocked", 0, [{ part: "body", obstacle: "wall", start: 0, end: 0 }]],
    ],
  );

  TestValidator.equals(
    "malformed evaluation inputs are refused",
    [
      throws(() => evaluate({ sampleRate: 0 }), "sampleRate"),
      throws(() => evaluate({ duration: -1 }), "duration"),
      throws(() => evaluate({ samples: [] }), "fixed-clock"),
      throws(
        () =>
          evaluate({
            samples: [
              { time: 0, camera: identity(), obstacles: [] },
              { time: 0.5, camera: identity(), obstacles: [] },
            ],
          }),
        "fixed-clock",
      ),
      throws(
        () =>
          evaluate({
            samples: [
              { time: 0, camera: identity(), obstacles: [] },
              { time: 0, camera: identity(), obstacles: [] },
              { time: 1, camera: identity(), obstacles: [] },
            ],
          }),
        "strict time order",
      ),
      throws(
        () =>
          evaluate({
            samples: [
              { time: 0, camera: identity(), obstacles: [] },
              { time: Number.NaN, camera: identity(), obstacles: [] },
              { time: 1, camera: identity(), obstacles: [] },
            ],
          }),
        "strict time order",
      ),
      throws(
        () =>
          evaluate({
            samples: [
              { time: 0, camera: identity(), obstacles: [] },
              { time: -0.5, camera: identity(), obstacles: [] },
              { time: 1, camera: identity(), obstacles: [] },
            ],
          }),
        "strict time order",
      ),
      throws(
        () =>
          evaluate({
            samples: [
              { time: 0, camera: identity(), obstacles: [] },
              { time: 1.5, camera: identity(), obstacles: [] },
              { time: 1, camera: identity(), obstacles: [] },
            ],
          }),
        "strict time order",
      ),
      throws(
        () =>
          evaluate({
            samples: [0, 1].map((time) => ({
              time,
              camera: identity(),
              obstacles: [
                {
                  node: "wall",
                  bounds: {
                    min: { x: Number.NaN, y: 0, z: 0 },
                    max: { x: 1, y: 1, z: 1 },
                  },
                },
              ],
            })),
          }),
        "finite coordinates",
      ),
      throws(
        () =>
          evaluate({
            samples: [0, 1].map((time) => ({
              time,
              camera: identity(),
              obstacles: [
                {
                  node: "wall",
                  bounds: {
                    min: { x: 2, y: 0, z: 0 },
                    max: { x: 1, y: 1, z: 1 },
                  },
                },
              ],
            })),
          }),
        "minimum",
      ),
      throws(
        () =>
          evaluate({
            samples: [0, 1].map((time) => ({
              time,
              camera: identity(),
              obstacles: [
                { node: "wall", bounds: box({ x: 5, y: 0, z: 0 }) },
                { node: "wall", bounds: box({ x: 6, y: 0, z: 0 }) },
              ],
            })),
          }),
        "duplicates",
      ),
      throws(
        () =>
          evaluate({
            samples: [
              {
                time: 0,
                camera: identity(),
                obstacles: [
                  { node: "wall", bounds: box({ x: 5, y: 0, z: 0 }) },
                ],
              },
              {
                time: 1,
                camera: identity(),
                obstacles: [
                  { node: "floor", bounds: box({ x: 5, y: 0, z: 0 }) },
                ],
              },
            ],
          }),
        "identity set",
      ),
    ],
    [true, true, true, true, true, true, true, true, true, true, true, true],
  );
}
