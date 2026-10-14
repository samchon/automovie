/** Open ceramic wares and unmarked scroll silhouettes */
import type { IAutoMovieModel } from "@automovie/interface";

import { modelBox } from "../geometry/model-source-shapes";
import { ObjectMesh } from "../geometry/object-mesh";

const p = (x: number, y: number, z: number) => ({ x, y, z });

/**
 * One closed tube around the convex hull of the three scroll axes in YZ.
 * Each 120-degree corner has sixteen samples; straight tangents join the
 * corners. The 32.5 mm offset minus the 2.5 mm tube radius meets the 30 mm
 * paper radius. Unlike a circle centred on the lower pair, this path encloses
 * the upper scroll and has no hanging lower loop. UV U follows the whole
 * closed path and V follows its eight-sided tube circumference in metres.
 */
const bundleTie = (m: ObjectMesh): void => {
  const path: { y: number; z: number; ny: number; nz: number }[] = [];
  for (const [y, z, start] of [
    [0, -0.03, 150],
    [0, 0.03, 270],
    [0.03 * Math.sqrt(3), 0, 30],
  ])
    for (let i = 0; i <= 16; i++) {
      const angle = ((start! + (120 * i) / 16) * Math.PI) / 180;
      const ny = Math.sin(angle),
        nz = Math.cos(angle);
      path.push({ y: y! + 0.0325 * ny, z: z! + 0.0325 * nz, ny, nz });
    }
  const ring = path.map((center) =>
    Array.from({ length: 8 }, (_, j) => {
      const angle = (2 * Math.PI * j) / 8;
      return p(
        0.0025 * Math.cos(angle),
        center.y + 0.0025 * Math.sin(angle) * center.ny,
        center.z + 0.0025 * Math.sin(angle) * center.nz,
      );
    }),
  );
  let distance = 0;
  for (let i = 0; i < path.length; i++) {
    const next = (i + 1) % path.length;
    const length = Math.hypot(
      path[next]!.y - path[i]!.y,
      path[next]!.z - path[i]!.z,
    );
    for (let j = 0; j < 8; j++) {
      const k = (j + 1) % 8,
        v0 = (2 * Math.PI * 0.0025 * j) / 8,
        v1 = (2 * Math.PI * 0.0025 * (j + 1)) / 8;
      m.face(
        "tie",
        [ring[i]![j]!, ring[next]![j]!, ring[next]![k]!, ring[i]![k]!],
        [
          [distance, v0],
          [distance + length, v0],
          [distance + length, v1],
          [distance, v1],
        ],
      );
    }
    distance += length;
  }
};
const jar = (
  id: string,
  name: string,
  outside: readonly (readonly [number, number])[],
  inside: readonly (readonly [number, number])[],
  handles: readonly (readonly [number, number, number, number])[],
  n: number,
): IAutoMovieModel => {
  const m = new ObjectMesh();
  m.vessel("body", 0, 0, outside, inside, n);
  for (const [x, y, r, t] of handles) m.loop("handle", x, y, 0, r, t, "xy", 16);
  return m.model(id, name);
};

/**
 * Open vessel and unmarked scroll silhouettes in their own local frames.
 */
export class TempleWares {
  storageJar(): IAutoMovieModel {
    return jar(
      "ware.storage-jar",
      "Large storage jar",
      [
        [0, 0.1],
        [0.4, 0.24],
        [0.58, 0.18],
        [0.64, 0.08],
        [0.7, 0.1],
      ],
      [
        [0.7, 0.08],
        [0.64, 0.055],
        [0.55, 0.04],
      ],
      [
        [-0.2, 0.58, 0.04, 0.0075],
        [0.2, 0.58, 0.04, 0.0075],
      ],
      16,
    );
  }
  carryJar(): IAutoMovieModel {
    return jar(
      "ware.carry-jar",
      "Carrying jar",
      [
        [0, 0.07],
        [0.28, 0.15],
        [0.4, 0.1],
        [0.45, 0.05],
        [0.5, 0.06],
      ],
      [
        [0.5, 0.04],
        [0.45, 0.03],
        [0.4, 0.025],
      ],
      [
        [-0.145, 0.365, 0.065, 0.018],
        [0.145, 0.365, 0.065, 0.018],
      ],
      16,
    );
  }
  smallVessel(): IAutoMovieModel {
    return jar(
      "ware.small-vessel",
      "Small table vessel",
      [
        [0, 0.05],
        [0.1, 0.08],
        [0.16, 0.035],
        [0.2, 0.045],
      ],
      [
        [0.2, 0.028],
        [0.16, 0.022],
        [0.15, 0.018],
      ],
      [[0.0675, 0.13, 0.0325, 0.01]],
      12,
    );
  }
  offeringBowl(): IAutoMovieModel {
    const m = new ObjectMesh();
    m.vessel(
      "bowl",
      0,
      0,
      [
        [0.01, 0.04],
        [0.018, 0.085],
        [0.04, 0.104],
        [0.06, 0.11],
      ],
      [
        [0.06, 0.098],
        [0.043, 0.08],
        [0.027, 0.05],
        [0.015, 0.01],
      ],
      24,
    );
    return m.model("ware.offering-bowl", "Shallow offering bowl");
  }
  basket(): IAutoMovieModel {
    const m = new ObjectMesh();
    m.vessel(
      "wall",
      0,
      0,
      [
        [0.02, 0.18],
        [0.305, 0.2],
      ],
      [
        [0.305, 0.185],
        [0.02, 0.165],
      ],
      24,
    );
    m.frustum("floor", 0, 0, 0, 0.02, 0.18, 0.18, 24);
    m.loop("rim", 0, 0.305, 0, 0.2, 0.015, "xz", 24);
    for (let i = 0; i < 10; i++) {
      const y = 0.02 + (i + 0.5) * (0.285 / 10);
      m.loop("wall", 0, y, 0, 0.2 + (i % 2 === 0 ? 0.004 : 0), 0.008, "xz", 24);
    }
    return m.model("ware.basket", "Carrying basket");
  }
  scroll(state: "rolled" | "bundle" | "open"): IAutoMovieModel {
    const m = new ObjectMesh();
    if (state === "open") {
      modelBox(m, "sheet", p(-0.125, 0, -0.175), p(0.125, 0.002, 0.175), {
        origin: p(-0.125, 0, -0.175),
        direction: p(0, 0, 1),
      });
      for (const z of [-0.1837, 0.1837])
        m.cylinder(
          "sheet",
          p(-0.125, 0.02, z),
          p(0.125, 0.02, z),
          0.02,
          16,
          "x",
        );
    } else {
      const centers =
        state === "rolled"
          ? [[0, 0]]
          : [
              [0, -0.03],
              [0, 0.03],
              [0.03 * Math.sqrt(3), 0],
            ];
      centers.forEach(([y, z], i) => {
        const part = state === "rolled" ? "sheet" : `sheet-${i + 1}`;
        m.cylinder(part, p(-0.14, y!, z!), p(0.14, y!, z!), 0.03, 16, "x");
        for (const x of [-0.144, 0.14])
          m.cylinder(part, p(x, y!, z!), p(x + 0.004, y!, z!), 0.012, 16, "x");
      });
      if (state === "rolled") m.loop("tie", 0, 0, 0, 0.0325, 0.0025, "yz", 16);
      else bundleTie(m);
    }
    return m.model(`ware.scroll.${state}`, `Scroll ${state}`);
  }
}
