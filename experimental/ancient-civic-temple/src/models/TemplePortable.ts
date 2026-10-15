/** Basic portable silhouettes; no finish or motion. */
import { triangulateAutoMovieRegion } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import {
  modelBox,
} from "../geometry/modelBox";
import { reviewedModel } from "../geometry/reviewedModel";
import { modelMesh } from "../geometry/modelMesh";
import { ObjectMesh } from "../geometry/ObjectMesh";
import { TempleRectilinearUnion } from "./TempleRectilinearUnion";

const p = (x: number, y: number, z: number) => ({ x, y, z });
const box = (
  m: ObjectMesh,
  id: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) => m.box(id, x, y, z, w, h, d);
const woodBox = (
  m: ObjectMesh,
  id: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) => {
  const min = p(x - w / 2, y, z - d / 2),
    max = p(x + w / 2, y + h, z + d / 2);
  const direction =
    w >= h && w >= d ? p(1, 0, 0) : h >= d ? p(0, 1, 0) : p(0, 0, 1);
  modelBox(m, id, min, max, { origin: min, direction });
};

/**
 * Portable fixed-form props without room placement or animated use.
 */
export class TemplePortable {
  /** Stone bench on two piers, standard or short. */
  bench(kind: "standard" | "short"): IAutoMovieModel {
    const m = new ObjectMesh(),
      w = kind === "standard" ? 1.4 : 1.1;
    box(m, "seat", 0, 0.4, 0, w, 0.06, 0.45);
    for (const x of [-w / 2 + 0.17, w / 2 - 0.17])
      box(m, "pier", x, 0, 0, 0.12, 0.4, 0.36);
    return m.model(`portable.bench.${kind}`, `Stone bench ${kind}`);
  }
  /** Small portable oil lamp: foot, stem and dish. */
  portableLamp(): IAutoMovieModel {
    const m = new ObjectMesh();
    m.frustum("foot", 0, 0, 0, 0.035, 0.1, 0.1, 16);
    m.frustum("stem", 0, 0, 0.035, 0.23, 0.012, 0.012, 16);
    m.vessel(
      "dish",
      0,
      0,
      [
        [0.23, 0.12],
        [0.28, 0.12],
      ],
      [
        [0.28, 0.105],
        [0.238, 0.105],
      ],
      16,
    );
    return m.model("portable.lamp", "Small oil lamp");
  }
  /** Rack board with two round jar holes. */
  jarRack(): IAutoMovieModel {
    const m = new ObjectMesh();
    const outer = [
      [-0.59, -0.29],
      [0.59, -0.29],
      [0.59, 0.29],
      [-0.59, 0.29],
    ].map(([x, z]) => ({ x: x!, y: z! }));
    const holes = [-0.29, 0.29].map((x) =>
      Array.from({ length: 16 }, (_, i) => ({
        x: x + 0.16 * Math.cos((2 * Math.PI * i) / 16),
        y: 0.16 * Math.sin((2 * Math.PI * i) / 16),
      })),
    );
    const cap = triangulateAutoMovieRegion({ outer, holes });
    for (let i = 0; i < cap.triangles.length; i += 3) {
      const corners = cap.triangles.slice(i, i + 3).map((j) => cap.points[j]!);
      m.face(
        "top",
        corners.reverse().map((q) => p(q.x, 0.28, q.y)),
      );
    }
    m.face(
      "top",
      outer.map((q) => p(q.x, 0.22, q.y)),
    );
    for (let i = 0; i < outer.length; i++) {
      const a = outer[i]!,
        b = outer[(i + 1) % outer.length]!;
      m.face("top", [
        p(a.x, 0.22, a.y),
        p(a.x, 0.28, a.y),
        p(b.x, 0.28, b.y),
        p(b.x, 0.22, b.y),
      ]);
    }
    for (const hole of holes) {
      m.face(
        "well",
        [...hole].reverse().map((q) => p(q.x, 0.268, q.y)),
      );
      for (let i = 0; i < hole.length; i++) {
        const a = hole[i]!,
          b = hole[(i + 1) % hole.length]!;
        m.face("top", [
          p(a.x, 0.268, a.y),
          p(b.x, 0.268, b.y),
          p(b.x, 0.28, b.y),
          p(a.x, 0.28, a.y),
        ]);
      }
    }
    for (const x of [-0.52, 0.52])
      for (const z of [-0.22, 0.22])
        woodBox(m, "leg", x, 0, z, 0.07, 0.22, 0.07);
    return m.model("portable.jar-rack", "Two-place jar rack");
  }
  /** Two-handed carrying yoke with two hooks. */
  carryingYoke(): IAutoMovieModel {
    const m = new ObjectMesh();
    box(m, "beam", 0, -0.025, 0, 1.16, 0.05, 0.05);
    for (const x of [-0.5, 0.5])
      m.loop("hook", x, -0.085, 0, 0.05, 0.01, "yz", 16);
    return m.model("portable.carrying-yoke", "Two-handed carrying yoke");
  }
  /** Handcart: deck, axle and two wheels. */
  handcart(): IAutoMovieModel {
    const m = new ObjectMesh();
    woodBox(m, "deck", 0, 0.43, -0.025, 0.6, 0.06, 1.25);
    m.cylinder("axle", p(-0.34, 0.23, 0.1), p(0.34, 0.23, 0.1), 0.018, 16, "x");
    for (const x of [-0.34, 0.34]) {
      m.cylinder(
        "wheel",
        p(x - 0.04, 0.23, 0.1),
        p(x + 0.04, 0.23, 0.1),
        0.23,
        16,
        "x",
      );
      woodBox(
        m,
        "support",
        x < 0 ? -0.24 : 0.24,
        0.248,
        0.1,
        0.04,
        0.182,
        0.04,
      );
    }
    for (const x of [-0.24, 0.24])
      m.rod("handle", p(x, 0.45, -0.65), p(x, 0.7, -1.2), 0.02, 8);
    return m.model("portable.handcart", "Small handcart");
  }
  /** Open bucket. */
  bucket(): IAutoMovieModel {
    const m = new ObjectMesh();
    m.vessel(
      "body",
      0,
      0,
      [
        [0, 0.11],
        [0.28, 0.15],
      ],
      [
        [0.28, 0.135],
        [0.02, 0.095],
      ],
      16,
    );
    // The reviewed fixed carry arc remains open above the vessel mouth.
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * i) / 12,
        b = (Math.PI * (i + 1)) / 12;
      m.rod(
        "handle",
        p(0.1475 * Math.cos(a), 0.27 + 0.17 * Math.sin(a), 0),
        p(0.1475 * Math.cos(b), 0.27 + 0.17 * Math.sin(b), 0),
        0.01,
        8,
      );
    }
    return m.model("portable.bucket", "Handled water bucket");
  }
  /** Open planter pot. */
  planter(): IAutoMovieModel {
    const m = new ObjectMesh();
    m.vessel(
      "pot",
      0,
      0,
      [
        [0, 0.14],
        [0.36, 0.21],
      ],
      [
        [0.36, 0.19],
        [0.03, 0.12],
      ],
      16,
    );
    m.frustum("soil", 0, 0, 0.03, 0.27, 0.12, 0.165, 16);
    return m.model("portable.planter", "Low planter");
  }
  /** Plain votive plaque on a base. */
  votivePlaque(): IAutoMovieModel {
    const m = new ObjectMesh();
    box(m, "base", 0, 0, 0, 0.36, 0.04, 0.14);
    box(m, "slab", 0, 0.04, 0, 0.32, 0.38, 0.035);
    return m.model("portable.votive-plaque", "Plain votive plaque");
  }
  /** Low offering tray with a closed rim. */
  offeringTray(): IAutoMovieModel {
    const m = new ObjectMesh();
    box(m, "floor", 0, 0, 0, 0.52, 0.018, 0.34);
    const solids = [
      { min: p(-0.26, 0.018, -0.17), max: p(0.26, 0.055, -0.155) },
      { min: p(-0.26, 0.018, 0.155), max: p(0.26, 0.055, 0.17) },
      { min: p(-0.26, 0.018, -0.155), max: p(-0.245, 0.055, 0.155) },
      { min: p(0.245, 0.018, -0.155), max: p(0.26, 0.055, 0.155) },
    ];
    return reviewedModel("portable.offering-tray", "Low offering tray", [
      ["floor", modelMesh(m, "floor")],
      ["rim", TempleRectilinearUnion.mesh("rim", solids)],
    ]);
  }
  /** Folded textile, standard or small. */
  textile(kind: "standard" | "small"): IAutoMovieModel {
    const w = kind === "standard" ? 0.55 : 0.42;
    const d = kind === "standard" ? 0.4 : 0.36,
      t = kind === "standard" ? 0.045 : 0.03;
    return reviewedModel(`portable.textile.${kind}`, `Folded textile ${kind}`, [
      [
        "cloth",
        TempleRectilinearUnion.mesh("cloth", [
          { min: p(-w / 2, 0, -d / 2), max: p(w / 2, t / 4, d / 2) },
          { min: p(-w / 2, (3 * t) / 4, -d / 2), max: p(w / 2, t, d / 2) },
          {
            min: p(-w / 2, t / 4, -d / 2),
            max: p(w / 2, (3 * t) / 4, -d / 2 + 0.015),
          },
          {
            min: p(-w / 2, t / 4, d / 2 - 0.015),
            max: p(w / 2, (3 * t) / 4, d / 2),
          },
        ]),
      ],
    ]);
  }
  /** Writing stylus with a pointed tip. */
  stylus(): IAutoMovieModel {
    const m = new ObjectMesh();
    m.cylinder("shaft", p(-0.11, 0, 0), p(0.09, 0, 0), 0.006, 8, "x");
    for (let i = 0; i < 8; i++) {
      const a = (2 * Math.PI * i) / 8,
        b = (2 * Math.PI * (i + 1)) / 8;
      m.face("tip", [
        p(0.09, 0.006 * Math.cos(a), 0.006 * Math.sin(a)),
        p(0.09, 0.006 * Math.cos(b), 0.006 * Math.sin(b)),
        p(0.11, 0, 0),
      ]);
    }
    return m.model("portable.stylus", "Writing stylus");
  }
  /** Blank writing tablet in a raised frame. */
  writingTablet(): IAutoMovieModel {
    const m = new ObjectMesh();
    box(m, "writing-face", 0, 0.013, 0, 0.244, 0.001, 0.184);
    return reviewedModel("portable.writing-tablet", "Blank writing tablet", [
      [
        "frame",
        TempleRectilinearUnion.mesh("frame", [
          { min: p(-0.14, 0, -0.11), max: p(0.14, 0.013, 0.11) },
          { min: p(-0.14, 0.013, -0.11), max: p(-0.122, 0.025, 0.11) },
          { min: p(0.122, 0.013, -0.11), max: p(0.14, 0.025, 0.11) },
          { min: p(-0.122, 0.013, -0.11), max: p(0.122, 0.025, -0.092) },
          { min: p(-0.122, 0.013, 0.092), max: p(0.122, 0.025, 0.11) },
        ]),
      ],
      ["writing-face", modelMesh(m, "writing-face")],
    ]);
  }
  /** Tied coil of three rope loops. */
  ropeCoil(): IAutoMovieModel {
    const m = new ObjectMesh();
    for (const r of [0.045, 0.075, 0.105])
      m.loop("rope", 0, 0.008, 0, r, 0.008, "xz", 16);
    box(m, "tie", 0, 0.016, 0, 0.024, 0.008, 0.226);
    return m.model("portable.rope-coil", "Tied rope coil");
  }
}
