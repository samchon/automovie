import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { capAutoMovieHumanHead } from "./capAutoMovieHumanHead";
import { loopAutoMovieHumanEyelids } from "./loopAutoMovieHumanEyelids";
import { loopAutoMovieHumanLips } from "./loopAutoMovieHumanLips";

/**
 * Lay the head's quads over its sweep: the same connectivity for every person, placed by the person's anatomy.
 *
 * The layout is a lattice of 60 columns round the head in three blocks. Thirty-six columns cover the face between {@link FACE_HALF} degrees either side of the midline, three times as dense as the 24 over the sides and the back, because the face carries the features; the midline is a column line, so the head is mirror-symmetric through vertices, and the back-left line through each ear's centre spaces the side columns. Six vault rows from the crown to the hairline run round every column. Below the hairline the face takes 21 rows spaced by anatomy (four over the forehead, five through the eyes, four over the nose, five through the mouth, three over the chin to the jawline) and the sides a third as many, two of them each ear's height; in the column beside each edge of the face, three-to-one units take three face rows onto one side row, and the side rows next to them continue every third face row so those units stay square. Five openings cut the lattice, each a rectangle of whole cells: an eye opening of ten columns by five rows on each side, the mouth's of twelve by five, and each ear's of two by two side cells, whose eight corners are the ear ring.
 *
 * Inside each eye and the mouth, concentric loops of the opening's own count run from the opening's rim to the feature's inner edge ({@link loopAutoMovieHumanEyelids}, {@link loopAutoMovieHumanLips}). These loops are the fold lines of orbicularis oculi and oris: an expression that narrows the eye or purses, stretches or opens the mouth moves each loop as a whole along its own course, so the creases it makes fall on loop lines and the corners (the canthi and the commissures, short edges where a loop's upper and lower runs meet) stay where they are. The mouth opening's rim, from beside the alae round the commissures to the labiomental fold, follows the nasolabial and labiomental folds, and the face's rows over the brow and the forehead are the lines frontalis creases. Over the crown a 14 by 16 grid closes the lattice's top row ({@link capAutoMovieHumanHead}). Between the jawline and the neck-top ring, under the chin and the occiput, two bands of three-to-one reductions take the 60 columns to the ring's twelve, the face's 36 to 12 and then all 36 to 12, and one row reaches the ring, pinned to its shared shape.
 *
 * @param props The domain, the network builder, the head measurements and the ring shapes, model frame
 * @returns Nothing; the quads and rings go to the builder
 */
export function layoutAutoMovieHumanHead(props: {
  domain: AutoMovieHumanHeadDomain;
  network: AutoMovieHumanHeadNetwork;
  head: IAutoMovieHumanIdentity.IHead;
  neck: IAutoMovieHumanRingShape;
  ears: Record<"left" | "right", IAutoMovieHumanRingShape>;
}): void {
  const { domain, network, head } = props;
  const frame = domain.frame;
  const profile = domain.profile;
  const fh: number = head.faceHeight;
  const features: IAutoMovieHumanIdentity.IFeatures = head.features;

  // ---- columns: v of each column line, back-left 0..11, front 12..47, back-right 48..59
  const earLeft = located(domain, props.ears.left.positions);
  const edge: number = 0.5 - FACE_HALF / 360;
  const vEar: number = Math.min(earLeft.v, edge - 2 / 36);
  const lines: number[] = [];
  for (let k: number = 0; k < 12; ++k)
    lines.push(k <= EAR_LINE ? (vEar * k) / EAR_LINE : vEar + ((edge - vEar) * (k - EAR_LINE)) / (12 - EAR_LINE));
  for (let k: number = 0; k < FRONT; ++k) lines.push(edge + ((1 - 2 * edge) * k) / FRONT);
  for (let k: number = 0; k < 12; ++k) lines.push(1 - lines[12 - k]!);
  const C: number = lines.length;

  // ---- rows: the vault's shared by every column, the face's spaced by anatomy, the sides' a third as many
  const pfl: number = features.palpebralFissureLength;
  const hairline: number = domain.front(frame.nasion.y + TRICHION * fh);
  const vaultRows: number[] = Array.from(
    { length: ROWS.vault + 1 },
    (_: unknown, k: number): number => (hairline * k) / ROWS.vault,
  );
  const anchors: Array<[number, number]> = [
    [frame.eye.y + 0.55 * pfl, ROWS.forehead],
    [frame.eye.y - 0.6 * pfl, ROWS.eyes],
    [profile.subnasale.y - 0.02 * fh, ROWS.nose],
    [frame.stomion.y - 0.15 * fh, ROWS.mouth],
  ];
  const faceRows: number[] = [hairline];
  let previous: number = hairline;
  anchors.forEach(([y, count]: [number, number]): void => {
    const target: number = domain.front(y);
    for (let k: number = 1; k <= count; ++k) faceRows.push(previous + ((target - previous) * k) / count);
    previous = target;
  });
  // the chin's rows end part of the way to the continued ring, the reductions take the rest
  // the chin's rows end on the jawline, the plane through gnathion, and the reductions and the ring's row share the chin's underside
  const jawU: number = domain.loft.shares[domain.loft.shares.length - 2]!;
  const chinU: number = jawU;
  const bandU: number = jawU + (1 - jawU) / 3;
  const collarU: number = jawU + (2 * (1 - jawU)) / 3;
  for (let k: number = 1; k <= ROWS.chin; ++k) faceRows.push(previous + ((chinU - previous) * k) / ROWS.chin);
  const R: number = faceRows.length - 1;
  const S: number = R / 3;
  // the side's rows put the ear's opening on two of them, the rest evenly above and below
  const earTop: number = Math.min(...earLeft.us);
  const earBottom: number = Math.max(...earLeft.us);
  let earRow: number = 1;
  let best: number = Infinity;
  for (let k: number = 1; k + 2 < S; ++k) {
    const above: number = (earTop - hairline) / k;
    const below: number = (chinU - earBottom) / (S - k - 2);
    const ear: number = (earBottom - earTop) / 2;
    const spread: number = Math.abs(Math.log(above / ear)) + Math.abs(Math.log(below / ear));
    if (above > 0 && below > 0 && spread < best) {
      best = spread;
      earRow = k;
    }
  }
  const sideRows: number[] = Array.from({ length: S + 1 }, (_: unknown, k: number): number =>
    k <= earRow
      ? hairline + ((earTop - hairline) * k) / earRow
      : k <= earRow + 2
        ? earTop + ((earBottom - earTop) * (k - earRow)) / 2
        : earBottom + ((chinU - earBottom) * (k - earRow - 2)) / (S - earRow - 2),
  );
  const vault: AutoMovieHumanHeadNetwork.IPoint[][] = vaultRows.map((u: number) =>
    lines.map((v: number) => network.on(u, v)),
  );
  // the face block over lines 12 to 48, its top row the vault's last
  const face: AutoMovieHumanHeadNetwork.IPoint[][] = faceRows.map((u: number, i: number) =>
    Array.from({ length: FRONT + 1 }, (_: unknown, k: number) =>
      i === 0 ? vault[ROWS.vault]![12 + k]! : network.on(u, lines[12 + k]!),
    ),
  );
  // the side block from line 48 round the back to line 12, its top row the vault's last
  const sideLine = (m: number): number => (48 + m) % C;
  // beside the face each side row continues every third face row, so the reductions there are square; toward the ears and the back the side rows take the ears' spacing
  const toEar = (m: number): number => {
    const t: number = Math.min(1, Math.max(0, (Math.min(m, SIDE - m) - 1) / 2));
    return t * t * (3 - 2 * t);
  };
  const side: AutoMovieHumanHeadNetwork.IPoint[][] = sideRows.map((u: number, s: number) =>
    Array.from({ length: SIDE + 1 }, (_: unknown, m: number) =>
      s === 0
        ? vault[ROWS.vault]![sideLine(m)]!
        : network.on(faceRows[3 * s]! + (u - faceRows[3 * s]!) * toEar(m), lines[sideLine(m)]!),
    ),
  );
  const at = (block: AutoMovieHumanHeadNetwork.IPoint[][], i: number, k: number): AutoMovieHumanHeadNetwork.IPoint =>
    block[i]![k]!;

  // ---- openings, in their blocks' rows and columns
  const eyeRow: number = ROWS.forehead;
  const mouthRow: number = eyeRow + ROWS.eyes + ROWS.nose;
  const mid: number = FRONT / 2;
  type IOpening = {
    block: AutoMovieHumanHeadNetwork.IPoint[][];
    rows: [number, number];
    columns: [number, number];
  };
  const earColumn: number = SIDE - (12 - EAR_LINE);
  const openings: IOpening[] = [
    { block: face, rows: [eyeRow, eyeRow + ROWS.eyes], columns: [mid - EYE.lateral, mid - EYE.medial] },
    { block: face, rows: [eyeRow, eyeRow + ROWS.eyes], columns: [mid + EYE.medial, mid + EYE.lateral] },
    { block: face, rows: [mouthRow, mouthRow + ROWS.mouth], columns: [mid - MOUTH, mid + MOUTH] },
    { block: side, rows: [earRow, earRow + 2], columns: [earColumn - 1, earColumn + 1] },
    { block: side, rows: [earRow, earRow + 2], columns: [SIDE - earColumn - 1, SIDE - earColumn + 1] },
  ];
  const open = (block: AutoMovieHumanHeadNetwork.IPoint[][], i: number, k: number): boolean =>
    openings.some(
      (o: IOpening): boolean =>
        o.block === block && i >= o.rows[0] && i < o.rows[1] && k >= o.columns[0] && k < o.columns[1],
    );
  for (let i: number = 0; i < ROWS.vault; ++i)
    for (let j: number = 0; j < C; ++j)
      network.quad([vault[i]![j]!, vault[i]![(j + 1) % C]!, vault[i + 1]![(j + 1) % C]!, vault[i + 1]![j]!], "vault");
  for (let i: number = 0; i < R; ++i)
    for (let k: number = 0; k < FRONT; ++k)
      if (!open(face, i, k))
        network.quad([at(face, i, k), at(face, i, k + 1), at(face, i + 1, k + 1), at(face, i + 1, k)], "face");
  for (let s: number = 0; s < S; ++s)
    for (let m: number = 1; m + 1 < SIDE; ++m)
      if (!open(side, s, m))
        network.quad([at(side, s, m), at(side, s, m + 1), at(side, s + 1, m + 1), at(side, s + 1, m)], "side");
  // the face's rows three to one onto the side's, in the column beside each edge of the face
  for (let s: number = 0; s < S; ++s) {
    reduce(
      network,
      [at(face, 3 * s, 0), at(face, 3 * s + 1, 0), at(face, 3 * s + 2, 0), at(face, 3 * s + 3, 0)],
      [at(side, s, SIDE - 1), at(side, s + 1, SIDE - 1)],
    );
    reduce(
      network,
      [at(face, 3 * s, FRONT), at(face, 3 * s + 1, FRONT), at(face, 3 * s + 2, FRONT), at(face, 3 * s + 3, FRONT)],
      [at(side, s, 1), at(side, s + 1, 1)],
    );
  }

  // the rim of an opening, from the middle of its first column side round over the top
  const rim = (o: IOpening): AutoMovieHumanHeadNetwork.IPoint[] => {
    const [i0, i1] = o.rows;
    const [j0, j1] = o.columns;
    const g = (i: number, j: number): AutoMovieHumanHeadNetwork.IPoint => at(o.block, i, j);
    const out: AutoMovieHumanHeadNetwork.IPoint[] = [];
    const half: number = Math.floor((i1 - i0) / 2);
    for (let i: number = i0 + half; i > i0; --i) out.push(g(i, j0));
    for (let j: number = j0; j < j1; ++j) out.push(g(i0, j));
    for (let i: number = i0; i <= i0 + half; ++i) out.push(g(i, j1));
    for (let i: number = i0 + half + 1; i < i1; ++i) out.push(g(i, j1));
    for (let j: number = j1; j > j0; --j) out.push(g(i1, j));
    for (let i: number = i1; i > i0 + half; --i) out.push(g(i, j0));
    return out;
  };
  loopAutoMovieHumanEyelids({ domain, network, features, rims: { left: rim(openings[0]!), right: rim(openings[1]!) } });
  loopAutoMovieHumanLips({ domain, network, head, rim: rim(openings[2]!) });
  for (const [name, o] of [
    ["left", openings[3]!],
    ["right", openings[4]!],
  ] as const) {
    const [i0, i1] = o.rows;
    const [j0, j1] = o.columns;
    const g = (i: number, j: number): AutoMovieHumanHeadNetwork.IPoint => at(side, i, j);
    pinRing(
      domain,
      network,
      `ear.${name}`,
      [g(i0, j0), g(i0, j0 + 1), g(i0, j1), g(i0 + 1, j1), g(i1, j1), g(i1, j0 + 1), g(i1, j0), g(i0 + 1, j0)],
      props.ears[name].positions,
    );
  }

  capAutoMovieHumanHead({ domain, network, top: vault[0]!, lines });
  const bottom: AutoMovieHumanHeadNetwork.IPoint[] = lines.map((_: number, j: number) =>
    j >= 12 && j <= 48 ? at(face, R, j - 12) : at(side, S, (j - 48 + C) % C),
  );

  // ---- reductions to the ring under the chin and the occiput
  const isFront = (j: number): boolean => j >= 12 && j < 12 + FRONT;
  // band one: the face's columns three to one, the rest straight down
  const bandLines: number[] = lines.filter((_: number, j: number): boolean => !isFront(j) || (j - 12) % 3 === 0);
  const band: AutoMovieHumanHeadNetwork.IPoint[] = bandLines.map((v: number) => network.on(bandU, v));
  const top: AutoMovieHumanHeadNetwork.IPoint[] = bottom;
  let b: number = 0;
  for (let j: number = 0; j < C; ) {
    if (isFront(j)) {
      reduce(network, [top[j]!, top[j + 1]!, top[j + 2]!, top[(j + 3) % C]!], [band[b]!, band[(b + 1) % band.length]!]);
      j += 3;
    } else {
      network.quad([top[j]!, top[(j + 1) % C]!, band[(b + 1) % band.length]!, band[b]!], "reduction");
      j += 1;
    }
    b += 1;
  }
  // band two: everything three to one onto the continued ring
  const ringLines: number[] = bandLines.filter((_: number, k: number): boolean => k % 3 === 0);
  const collarPoints: AutoMovieHumanHeadNetwork.IPoint[] = ringLines.map((v: number) => network.on(collarU, v));
  for (let k: number = 0; k < ringLines.length; ++k)
    reduce(
      network,
      [band[3 * k]!, band[3 * k + 1]!, band[3 * k + 2]!, band[(3 * k + 3) % band.length]!],
      [collarPoints[k]!, collarPoints[(k + 1) % collarPoints.length]!],
    );
  const ringPoints: AutoMovieHumanHeadNetwork.IPoint[] = ringLines.map((v: number) => network.on(1, v));
  for (let k: number = 0; k < ringLines.length; ++k)
    network.quad(
      [collarPoints[k]!, collarPoints[(k + 1) % ringLines.length]!, ringPoints[(k + 1) % ringLines.length]!, ringPoints[k]!],
      "ring",
    );
  pinRing(domain, network, "neckTop", ringPoints, props.neck.positions);
}

/** Domain points of model-frame millimetre positions, and their `u` values. */
const located = (
  domain: AutoMovieHumanHeadDomain,
  positions: IAutoMovieVector3[],
): { u: number; v: number; us: number[] } => {
  const points = positions.map((p: IAutoMovieVector3) =>
    domain.locate(domain.toHead({ x: p.x / 1000, y: p.y / 1000, z: p.z / 1000 })),
  );
  const v0: number = points[0]!.v;
  const vs: number[] = points.map((p) => p.v + Math.round(v0 - p.v));
  return {
    u: points.reduce((a, p) => a + p.u, 0) / points.length,
    v: (((vs.reduce((a, x) => a + x, 0) / vs.length) % 1) + 1) % 1,
    us: points.map((p) => p.u),
  };
};

/**
 * Pin a loop of points to a ring's positions: ring vertex `k` takes the loop point a fixed turn round from it, the turn and direction that bring the two loops closest, so the pairing follows the loop's order for any shape.
 */
const pinRing = (
  domain: AutoMovieHumanHeadDomain,
  network: AutoMovieHumanHeadNetwork,
  name: string,
  loop: AutoMovieHumanHeadNetwork.IPoint[],
  positions: IAutoMovieVector3[],
): void => {
  const n: number = loop.length;
  if (positions.length !== n) throw new Error(`head ring ${name} has ${positions.length} vertices for a loop of ${n}`);
  const at: IAutoMovieVector3[] = loop.map((p: AutoMovieHumanHeadNetwork.IPoint): IAutoMovieVector3 => {
    const m: IAutoMovieVector3 = domain.toModel(domain.point(p.domain.u, p.domain.v));
    return AutoMovieHumanVector.of(m.x * 1000, m.y * 1000, m.z * 1000);
  });
  let best: { shift: number; sign: number; cost: number } = { shift: 0, sign: 1, cost: Infinity };
  for (const sign of [1, -1])
    for (let shift: number = 0; shift < n; ++shift) {
      let cost: number = 0;
      for (let k: number = 0; k < n; ++k) {
        const q: IAutoMovieVector3 = at[(((shift + sign * k) % n) + n) % n]!;
        const p: IAutoMovieVector3 = positions[k]!;
        cost += (q.x - p.x) ** 2 + (q.y - p.y) ** 2 + (q.z - p.z) ** 2;
      }
      if (cost < best.cost) best = { shift, sign, cost };
    }
  network.ring(
    name,
    positions.map((_: IAutoMovieVector3, k: number) => loop[(((best.shift + best.sign * k) % n) + n) % n]!),
    positions.map((p: IAutoMovieVector3) => ({ x: p.x / 1000, y: p.y / 1000, z: p.z / 1000 })),
  );
};

/** One three-to-one unit: four quads round two valence-3 vertices between three spans on one side and one on the other, each interior vertex {@link UNIT} of the way from its span point to the opposite side. */
const reduce = (
  network: AutoMovieHumanHeadNetwork,
  a: [AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint],
  b: [AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint],
): void => {
  const ref: number = a[0].domain.v;
  const unwrap = (v: number): number => v + Math.round(ref - v);
  const inner = (k: 1 | 2): AutoMovieHumanHeadNetwork.IPoint => {
    const t: number = k / 3;
    const u: number = a[k].domain.u * (1 - UNIT) + (b[0].domain.u * (1 - t) + b[1].domain.u * t) * UNIT;
    const v: number = unwrap(a[k].domain.v) * (1 - UNIT) + (unwrap(b[0].domain.v) * (1 - t) + unwrap(b[1].domain.v) * t) * UNIT;
    return network.on(u, v);
  };
  const p: AutoMovieHumanHeadNetwork.IPoint = inner(1);
  const q: AutoMovieHumanHeadNetwork.IPoint = inner(2);
  network.quad([b[0], a[0], a[1], p], "reduction");
  network.quad([p, a[1], a[2], q], "reduction");
  network.quad([q, a[2], a[3], b[1]], "reduction");
  network.quad([b[0], p, q, b[1]], "reduction");
};

/** Half the face's angle about the spine, degrees, inside which its dense columns lie. Conventional: past the zygomatic arches. */
const FACE_HALF: number = 60;

/** Share of the way from a reduction's dense side to its sparse one at which its two inner vertices lie: nearer the dense side keeps its four quads closer in size. Chosen on renders. */
const UNIT: number = 0.3;

/** Columns over the face, between {@link FACE_HALF} degrees either side of the midline. */
const FRONT: number = 36;

/** Columns round the sides and the back, between the face's edges. */
const SIDE: number = 24;

/** Back-left column line through the ear's centre. */
const EAR_LINE: number = 8;

/** Rows of each band of the face, from the crown down. */
const ROWS = { vault: 6, forehead: 4, eyes: 5, nose: 4, mouth: 5, chin: 3 } as const;

/** Each eye's opening, columns from the midline to its medial and lateral sides. */
const EYE = { medial: 3, lateral: 13 } as const;

/** The mouth's opening, columns from the midline to either side. */
const MOUTH: number = 6;

/** Trichion above nasion over face height: trichion-nasion 72.2 mm in Kenyan men and 67.5 in women (Virdi et al. 2019), about 0.57 of face height. Grade: derived. */
const TRICHION: number = 0.57;

