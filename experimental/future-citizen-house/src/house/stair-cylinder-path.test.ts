import { tessellateToMesh } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import assert from "node:assert/strict";

import { passageClearance } from "./passage-clearance";
import { stairCylinderPath } from "./stair-cylinder-path";

export function verifyStairCylinderPath(): void {
  const v = (x: number, y: number, z: number) => ({ x, y, z });
  const rectangle = (x0: number, x1: number, z0: number, z1: number) => [
    v(x0, 0, z0),
    v(x1, 0, z0),
    v(x1, 0, z1),
    v(x0, 0, z1),
  ];
  const route = [v(-0.5, 0, 0), v(0.5, 0.2, 0)];
  const environment: IAutoMovieBuiltEnvironment = {
    version: 1,
    id: "fixture",
    units: "meter",
    buildings: [],
    models: [],
    modelReferences: [],
    elements: [],
    populations: [],
    boundaries: [],
    openings: [],
    walkable: [],
    spaces: [
      {
        id: "entry",
        parent: null,
        kind: "room",
        cells: [
          {
            id: "cell",
            planes: [
              { normal: v(1, 0, 0), offset: 2 },
              { normal: v(-1, 0, 0), offset: 2 },
              { normal: v(0, 1, 0), offset: 4 },
              { normal: v(0, -1, 0), offset: 0 },
              { normal: v(0, 0, 1), offset: 2 },
              { normal: v(0, 0, -1), offset: 2 },
            ],
          },
        ],
      },
    ],
    connectors: [
      {
        id: "stair",
        kind: "stair",
        from: "entry",
        to: "entry",
        route,
        bidirectional: true,
        width: 1,
        clearHeight: 2,
        elements: [],
      },
    ],
    surfaces: [
      {
        space: "entry",
        surface: {
          id: "floor",
          kind: "floor",
          polygon: rectangle(-2, 2, -2, 2),
          height: { kind: "constant", value: 0 },
        },
      },
      {
        space: "entry",
        surface: {
          id: "step",
          kind: "floor",
          polygon: rectangle(0.2, 0.8, -0.5, 0.5),
          height: { kind: "constant", value: 0.2 },
        },
      },
    ],
  };
  const path = stairCylinderPath(environment, route, "entry");
  const lift = path.find((p, i) => i > 0 && p.y > path[i - 1].y);
  assert.ok(lift && Math.abs(lift.x + 0.1) < 1e-8 && lift.y === 0.2);
  assert.equal(path[0].y, 0);
  assert.equal(path.at(-1)!.y, 0.2);
  for (let i = 1; i < path.length; i++)
    assert.ok(
      path[i].y === path[i - 1].y ||
        (path[i].x === path[i - 1].x && path[i].z === path[i - 1].z),
    );
  assert.throws(() => stairCylinderPath(environment, [], "entry"), /route/);
  assert.throws(
    () => stairCylinderPath(environment, route, "missing"),
    /entry space/,
  );
  assert.throws(
    () => stairCylinderPath({ ...environment, surfaces: [] }, route, "entry"),
    /unsupported interval/,
  );
  const quaternion = { x: 0, y: 0, z: 0, w: 1 },
    scale = v(1, 1, 1);
  const mesh = tessellateToMesh({
    type: "box",
    width: 0.05,
    height: 0.2,
    depth: 0.2,
  });
  const models = [{ id: "obstacle", parts: [{ mesh, transform: null }] }];
  const props = {
    environment,
    models,
    placements: [
      {
        node: "head-obstacle",
        model: "obstacle",
        position: v(0, 1.8, 0),
        rotation: quaternion,
        scale,
      },
    ],
  };
  assert.equal(passageClearance(props)[0].status, "blocked");
  assert.deepEqual(passageClearance(props)[0].obstacles, ["head-obstacle"]);
  assert.equal(
    passageClearance({ ...props, placements: [] })[0].status,
    "clear",
  );
  assert.equal(
    passageClearance({
      ...props,
      placements: [{ ...props.placements[0], position: v(0, 3, 0) }],
    })[0].status,
    "clear",
  );
  const support = tessellateToMesh({
    type: "box",
    width: 0.6,
    height: 0.2,
    depth: 1,
  });
  const withSupport = {
    environment,
    models: [{ id: "support", parts: [{ mesh: support, transform: null }] }],
    placements: [
      {
        node: "actual-step",
        model: "support",
        position: v(0.5, 0.1, 0),
        rotation: quaternion,
        scale,
      },
    ],
  };
  assert.equal(passageClearance(withSupport)[0].status, "clear");
  // The same support solid is still queried: an unraised body intersects its riser.
  const flat = {
    ...environment,
    connectors: [
      {
        ...environment.connectors[0],
        kind: "passage" as const,
        route: [v(-0.5, 0, 0), v(0.5, 0, 0)],
      },
    ],
  };
  assert.equal(
    passageClearance({ ...withSupport, environment: flat })[0].status,
    "blocked",
  );
  assert.deepEqual(
    passageClearance({ ...withSupport, environment: flat })[0].obstacles,
    ["actual-step"],
  );
}
