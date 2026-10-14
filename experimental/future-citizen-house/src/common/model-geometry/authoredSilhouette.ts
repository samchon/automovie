import { type Bounds, MeshWriter, type Vec, cutBoxes, planarBox } from "./orthogonal-mesh";
import { SEGMENTS, TAU } from "./round-mesh";
import { textileBody } from "./textile-mesh";



/** Builds a draft bounds box; the model design owns complete topology and UVs. */
const box: (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => Bounds = (
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
): Bounds => ({ x: [x0, x1], y: [y0, y1], z: [z0, z1] });

function wheelRing(
  w: MeshWriter,
  cx: number,
  cy: number,
  z0: number,
  z1: number,
  r: number,
): void {
  const inner: number = (r * 7) / 8;
  const p: (radius: number, z: number, i: number) => Vec = (radius: number, z: number, i: number): Vec => [
    cx + Math.sin((TAU * i) / SEGMENTS) * radius,
    cy - Math.cos((TAU * i) / SEGMENTS) * radius,
    z,
  ];
  for (let i: number = 0; i < SEGMENTS; i++) {
    const a: Vec = p(r, z0, i),
      b: Vec = p(r, z0, i + 1),
      c: Vec = p(r, z1, i + 1),
      d: Vec = p(r, z1, i);
    const e: Vec = p(inner, z0, i),
      f: Vec = p(inner, z0, i + 1),
      g: Vec = p(inner, z1, i + 1),
      h: Vec = p(inner, z1, i);
    const n: Vec = [
      Math.sin((TAU * (i + 0.5)) / SEGMENTS),
      -Math.cos((TAU * (i + 0.5)) / SEGMENTS),
      0,
    ];
    w.quad([a, b, c, d], n);
    w.quad([f, e, h, g], [-n[0], -n[1], 0]);
    w.quad([a, e, f, b], [0, 0, -1]);
    w.quad([d, c, g, h], [0, 0, 1]);
  }
}


function barXY(
  w: MeshWriter,
  a: [number, number],
  b: [number, number],
  radius: number,
  z: number = 0,
): void {
  const dx: number = b[0] - a[0],
    dy: number = b[1] - a[1],
    length: number = Math.hypot(dx, dy);
  const nx: number = (-dy / length) * radius,
    ny: number = (dx / length) * radius;
  const left: Vec = [a[0] + nx, a[1] + ny, z - radius],
    right: Vec = [a[0] - nx, a[1] - ny, z - radius];
  const frontLeft: Vec = [b[0] + nx, b[1] + ny, z - radius],
    frontRight: Vec = [b[0] - nx, b[1] - ny, z - radius];
  const backLeft: Vec = [a[0] + nx, a[1] + ny, z + radius],
    backRight: Vec = [a[0] - nx, a[1] - ny, z + radius];
  const farLeft: Vec = [b[0] + nx, b[1] + ny, z + radius],
    farRight: Vec = [b[0] - nx, b[1] - ny, z + radius];
  w.quad([left, frontLeft, farLeft, backLeft], [nx / radius, ny / radius, 0]);
  w.quad(
    [frontRight, right, backRight, farRight],
    [-nx / radius, -ny / radius, 0],
  );
  w.quad([right, frontRight, frontLeft, left], [0, 0, -1]);
  w.quad([backLeft, farLeft, farRight, backRight], [0, 0, 1]);
  w.quad([right, left, backLeft, backRight], [-dx / length, -dy / length, 0]);
  w.quad(
    [frontLeft, frontRight, farRight, farLeft],
    [dx / length, dy / length, 0],
  );
}
/**
 * Existing coarse silhouette dispatch for selected draft object families.
 *
 * Authored anchor/state/part tokens select textiles, simple boxes, orthogonal piece unions or bicycle rings and bars. An unmatched token returns false without writing so ModelRepresentation can choose its ellipsoid fallback. These are production-content recipes, including fixed bicycle dimensions and coarse object proxies, rather than general engine shape inference or proof of complete design realization. Finite positive dimensions and nonzero bar lengths are caller premises.
 *
 * Branches allocate finite piece lists; their complete cost includes cutBoxes occupancy/UV work, textile clipping and writer emission. Temporary pieces and rings end with the call, the supplied writer retains output, and no geometry is cached across mutable bounds or tokens.
 */
export function authoredSilhouette(
  w: MeshWriter,
  b: Bounds,
  anchor: string,
  state: string,
  part: string,
): boolean {
  if (anchor === "household-textiles") {
    textileBody(
      w,
      b,
      ["blanket", "bedding-set", "folded-sheet"].includes(state),
    );
    return true;
  }
  const [x0, x1]: [number, number] = b.x,
    [y0, y1]: [number, number] = b.y,
    [z0, z1]: [number, number] = b.z;
  const W: number = x1 - x0,
    H: number = y1 - y0,
    D: number = z1 - z0,
    cx: number = (x0 + x1) / 2,
    cz: number = (z0 + z1) / 2;
  const union: (pieces: Bounds[]) => boolean = (pieces: Bounds[]): boolean => {
    cutBoxes(w, b, pieces, []);
    return true;
  };
  if (
    (anchor === "dining-chair" && part === "back") ||
    (anchor === "desk-chair" &&
      (part === "shell-seat" || part === "shell-back")) ||
    (anchor === "bath-accessories" && state === "tissue-pack")
  ) {
    planarBox(w, b);
    return true;
  }
  if (anchor === "household-tools") {
    if (
      state === "vacuum" ||
      state === "cleaning-tool" ||
      state === "garden-tool"
    ) {
      const head: number = state === "vacuum" ? H / 4 : H / 10,
        radius: number = state === "vacuum" ? Math.min(W, D) / 12 : Math.min(W, D) / 8;
      return union([
        box(x0, x1, y0, y0 + head, z0, z1),
        box(cx - radius, cx + radius, y0 + head, y1, cz - radius, cz + radius),
      ]);
    }
    if (state === "folded-ladder") {
      const rail: number = W / 10,
        step: number = W / 12;
      const pieces: Bounds[] = [
        box(x0, x0 + rail, y0, y1, z0, z1),
        box(x1 - rail, x1, y0, y1, z0, z1),
      ];
      for (let j: number = 1; j <= 5; j++)
        pieces.push(
          box(
            x0 + rail,
            x1 - rail,
            y0 + (j * H) / 6 - step / 2,
            y0 + (j * H) / 6 + step / 2,
            cz - D / 6,
            cz + D / 6,
          ),
        );
      return union(pieces);
    }
  }
  if (anchor === "exterior-furnishings") {
    if (
      state === "outdoor-bench" ||
      state === "outdoor-chair" ||
      state === "outdoor-table"
    ) {
      const seat: boolean = state !== "outdoor-table",
        base: number = seat ? y0 + 0.55 * H : y1 - H / 12,
        top: number = base + H / 12;
      const legW: number = W / 16,
        legD: number = D / 12;
      const pieces: Bounds[] = [box(x0, x1, base, top, z0, z1)];
      if (seat) pieces.push(box(x0, x1, base, y1, z0, z0 + D / 12));
      for (const x of [x0, x1 - legW])
        for (const z of [z0, z1 - legD])
          pieces.push(box(x, x + legW, y0, base, z, z + legD));
      return union(pieces);
    }
    if (state === "bike-rack") {
      const foot: number = H / 16,
        post: number = W / 12;
      return union([
        box(x0, x0 + post, y0, y1 - foot, z0, z1),
        box(x1 - post, x1, y0, y1 - foot, z0, z1),
        box(x0, x1, y1 - foot, y1, cz - post / 2, cz + post / 2),
        box(x0, x0 + post, y0, y0 + foot, z0, z1),
        box(x1 - post, x1, y0, y0 + foot, z0, z1),
      ]);
    }
    if (state === "bicycle") {
      const wheelX: number = 0.545 as const,
        wheelY: number = 0.34 as const,
        r: number = wheelY,
        halfZ: number = 0.0175 as const,
        frameR: number = W / 120;
      for (const x of [-wheelX, wheelX])
        wheelRing(w, x, wheelY, -halfZ, halfZ, r);
      const A: [number, number] = [-wheelX, wheelY],
        B: [number, number] = [0, 0.7],
        C: [number, number] = [wheelX, wheelY];
      const Dn: [number, number] = [0, 0.4],
        E: [number, number] = [-W / 8, 0.93 - H / 80];
      for (const [start, end] of [
        [A, B],
        [B, Dn],
        [Dn, A],
        [B, C],
        [C, Dn],
        [B, E],
      ] as [typeof A, typeof A][])
        barXY(w, start, end, frameR);
      barXY(w, C, [W / 4, H - frameR], frameR);
      planarBox(
        w,
        box(
          -W / 8 - W / 10,
          -W / 8 + W / 10,
          0.93 - H / 40,
          0.93,
          -D / 8,
          D / 8,
        ),
      );
      planarBox(
        w,
        box(W / 4 - frameR, W / 4 + frameR, H - 2 * frameR, H, z0, z1),
      );
      return true;
    }
  }
  if (anchor === "personal-articles") {
    if (state === "shoe")
      return union([
        box(x0, x1, y0, y0 + H / 8, z0, z1),
        box(x0, x1, y0 + H / 8, y1, z0, cz),
        box(x0, x1, y0 + H / 8, y0 + H / 2, cz, z1),
      ]);
    if (state === "hanger")
      return union([
        box(x0, x1, y0, y0 + H / 5, z0, z1),
        box(cx - W / 20, cx + W / 20, y0 + H / 5, y1, z0, z1),
      ]);
    if (state === "umbrella")
      return union([
        box(cx - W / 8, cx + W / 8, y0, y0 + H / 16, cz - D / 8, cz + D / 8),
        box(
          cx - W / 2,
          cx + W / 2,
          y0 + H / 16,
          y0 + (7 * H) / 8,
          cz - D / 2,
          cz + D / 2,
        ),
        box(
          cx - W / 6,
          cx + W / 6,
          y0 + (7 * H) / 8,
          y1,
          cz - D / 6,
          cz + D / 6,
        ),
      ]);
  }
  if (
    anchor === "dining-wares" &&
    (state === "fork" || state === "spoon" || state === "table-knife")
  ) {
    const handleW: number = state === "spoon" ? W / 3 : W / 2,
      headZ: number = state === "table-knife" ? cz : z0 + (3 * D) / 4;
    const pieces: Bounds[] = [
      box(cx - handleW / 2, cx + handleW / 2, y0, y0 + H / 2, z0, headZ),
    ];
    if (state === "fork")
      for (let j: number = 0; j < 4; j++)
        pieces.push(
          box(
            x0 + (j * 2 * W) / 7,
            x0 + ((j * 2 + 1) * W) / 7,
            y0,
            y1,
            headZ,
            z1,
          ),
        );
    else pieces.push(box(x0, x1, y0, y1, headZ, z1));
    return union(pieces);
  }
  if (anchor === "kitchen-smallwares") {
    if (state === "utensil")
      return union([
        box(cx - W / 6, cx + W / 6, y0, y0 + H / 2, z0, z0 + (3 * D) / 4),
        box(x0, x1, y0, y1, z0 + (3 * D) / 4, z1),
      ]);
    if (state === "drying-rack") {
      const bar: number = W / 16;
      const pieces: Bounds[] = [
        box(x0, x0 + bar, y0, y1, z0, z1),
        box(x1 - bar, x1, y0, y1, z0, z1),
      ];
      for (let j: number = 0; j < 5; j++) {
        const z: number = z0 + ((j + 1) * D) / 6;
        pieces.push(box(x0 + bar, x1 - bar, y0, y0 + H / 10, z, z + D / 24));
      }
      return union(pieces);
    }
  }
  if (anchor === "wall-accessories") {
    if (state === "wall-sconce")
      return union([
        box(x0, x1, y0, y1, z0, z0 + D / 8),
        box(
          cx - W / 16,
          cx + W / 16,
          y0 + H / 2,
          y0 + H / 2 + W / 8,
          z0 + D / 8,
          z0 + (5 * D) / 8,
        ),
        box(x0, x1, y0 + H / 2, y1, z0 + (5 * D) / 8, z1),
      ]);
    if (state === "coat-hook") {
      const arm: number = W / 16,
        armY: number = y0 + H / 2;
      return union([
        box(x0, x1, y0, armY, z0, z0 + D / 8),
        ...[x0 + W / 10, x1 - W / 10 - arm].flatMap((x: number) : Bounds[] => [
          box(x, x + arm, armY - arm / 2, armY + arm, z0 + D / 16, z1),
          box(x, x + arm, armY, y1, z1 - arm, z1),
        ]),
      ]);
    }
  }
  return false;
}
