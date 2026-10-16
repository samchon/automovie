import { layoutAutoMovieSurfaceTransition } from "@automovie/engine";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { capAutoMovieHumanHead } from "./capAutoMovieHumanHead";
import { columnAutoMovieHumanHead } from "./columnAutoMovieHumanHead";
import { locateAutoMovieHumanHeadRing } from "./locateAutoMovieHumanHeadRing";
import { loopAutoMovieHumanEyelids } from "./loopAutoMovieHumanEyelids";
import { loopAutoMovieHumanLips } from "./loopAutoMovieHumanLips";
import { pinAutoMovieHumanHeadRing } from "./pinAutoMovieHumanHeadRing";

/**
 * Lay the head's quads over its sweep: the same connectivity for every person, placed by the person's anatomy.
 *
 * The layout is a lattice of 60 columns round the head in three blocks. Thirty-six columns cover the face between the form's half-angle either side of the midline, on average three times as dense as the 24 over the sides and the back, because the face carries the features; they are spaced smoothly through the edges of the eye and mouth openings, which the form sets on the canthi and the commissures ({@link IAutoMovieHumanHeadForm.ILayout}), so the openings hold the features whatever the face's proportions; the midline is a column line, so the head is mirror-symmetric through vertices, and the back-left line through each ear's centre spaces the side columns. Six vault rows from the crown to the hairline run round every column. Below the hairline the face takes 21 rows spaced by anatomy (four over the forehead, five through the eyes, four over the nose, five through the mouth, three over the chin to the jawline) and the sides the same row count, two of them each ear's height; each face row continues around the sides without reduction poles at the lateral orbital and malar boundary, while the rows ease to the ear's spacing away from the face. Five openings cut the lattice, each a rectangle of whole cells: an eye opening of ten columns by five rows on each side, the mouth's of twelve by five, and each ear's of two by two side cells, whose eight corners are the ear ring.
 *
 * Inside each eye and the mouth, concentric geometric loop bands fill each opening ({@link loopAutoMovieHumanEyelids}, {@link loopAutoMovieHumanLips}), with short end edges at the upper and lower runs. Their topology does not establish muscle paths, expression behavior, or anatomical fold correspondence. The mouth perimeter comes from height rows and interpolated columns; its nasolabial and labiomental registration remains unverified. The forehead rows interpolate height levels and do not establish frontalis crease locations. Over the crown a 14 by 16 grid closes the lattice's top row ({@link capAutoMovieHumanHead}). Between the jawline and the neck-top ring, under the chin and the occiput, two transition bands take the 60 columns to 40 and then to the ring's 28, and one row reaches the ring, pinned to its shared shape. Every change of count is the engine's transition strip ({@link layoutAutoMovieSurfaceTransition}): 2-to-1 blocks among straight columns, each with two poles of valence three inside and valence five at its coarse corners, the pole pairs where loops end that reference faces use; a count at least three fifths of the finer keeps every block between straight columns, so no vertex takes valence six, and each closed band's blocks mirror about both midlines.
 *
 * @param props The domain, the network builder, the head measurements and the ring shapes, model frame
 * @returns Nothing; the quads and rings go to the builder
 */
export function layoutAutoMovieHumanHead(props: {
  domain: AutoMovieHumanHeadDomain;
  network: AutoMovieHumanHeadNetwork;
  head: IAutoMovieHumanIdentity.IHead;
  form: IAutoMovieHumanHeadForm;
  neck: IAutoMovieHumanRingShape;
  ears: Record<"left" | "right", IAutoMovieHumanRingShape>;
}): void {
  const { domain, network, head }: typeof props = props;
  const layout: IAutoMovieHumanHeadForm.ILayout = props.form.layout;
  const frame: AutoMovieHumanHeadDomain["frame"] = domain.frame;
  const profile: AutoMovieHumanHeadDomain["profile"] = domain.profile;
  const fh: number = head.faceHeight;
  const features: IAutoMovieHumanIdentity.IFeatures = head.features;

  // ---- columns: v of each column line, back-left 0..11, front 12..47, back-right 48..59
  const earLeft: ReturnType<typeof locateAutoMovieHumanHeadRing> =
    locateAutoMovieHumanHeadRing(domain, props.ears.left.positions);
  const edge: number = 0.5 - layout.faceHalf / 360;
  const vEar: number = Math.min(earLeft.v, edge - 2 / 36);
  const lines: number[] = [];
  for (let k: number = 0; k < 12; ++k)
    lines.push(
      k <= EAR_LINE
        ? (vEar * k) / EAR_LINE
        : vEar + ((edge - vEar) * (k - EAR_LINE)) / (12 - EAR_LINE),
    );
  const turn: (k: number) => number = columnAutoMovieHumanHead(
    domain,
    head,
    layout,
    0.5 - edge,
    { front: FRONT, eye: EYE, mouth: MOUTH },
  );
  for (let k: number = 0; k < FRONT; ++k)
    lines.push(0.5 + Math.sign(k - FRONT / 2) * turn(Math.abs(k - FRONT / 2)));
  for (let k: number = 0; k < 12; ++k) lines.push(1 - lines[12 - k]!);
  const C: number = lines.length;

  // ---- rows: the vault and face row counts continue around the sides, spaced at the ears
  const pfl: number = features.palpebralFissureLength;
  const hairline: number = domain.front(frame.nasion.y + layout.trichion * fh);
  const vaultRows: number[] = Array.from(
    { length: ROWS.vault + 1 },
    (_: unknown, k: number): number => (hairline * k) / ROWS.vault,
  );
  const anchors: Array<[number, number]> = [
    [frame.eye.y + layout.eyeOpening.above * pfl, ROWS.forehead],
    [frame.eye.y - layout.eyeOpening.below * pfl, ROWS.eyes],
    [profile.subnasale.y - layout.mouthOpening.top * fh, ROWS.nose],
    [frame.stomion.y - layout.mouthOpening.bottom * fh, ROWS.mouth],
  ];
  const faceRows: number[] = [hairline];
  let previous: number = hairline;
  anchors.forEach(([y, count]: [number, number]): void => {
    const target: number = domain.front(y);
    for (let k: number = 1; k <= count; ++k)
      faceRows.push(previous + ((target - previous) * k) / count);
    previous = target;
  });
  // the chin's rows end on the jawline, the plane through gnathion, and the reductions and the ring's row share the chin's underside
  const jawU: number = domain.loft.shares[domain.loft.shares.length - 2]!;
  const chinU: number = jawU;
  const bandU: number = jawU + (1 - jawU) / 3;
  const collarU: number = jawU + (2 * (1 - jawU)) / 3;
  for (let k: number = 1; k <= ROWS.chin; ++k)
    faceRows.push(previous + ((chinU - previous) * k) / ROWS.chin);
  const R: number = faceRows.length - 1;
  const S: number = R;
  // the side's rows put the ear's opening on two of them, the rest evenly above and below
  const earTop: number = Math.min(...earLeft.us);
  const earBottom: number = Math.max(...earLeft.us);
  let earRow: number = 1;
  let best: number = Infinity;
  for (let k: number = 1; k + 2 < S; ++k) {
    const above: number = (earTop - hairline) / k;
    const below: number = (chinU - earBottom) / (S - k - 2);
    const ear: number = (earBottom - earTop) / 2;
    const spread: number =
      Math.abs(Math.log(above / ear)) + Math.abs(Math.log(below / ear));
    if (above > 0 && below > 0 && spread < best) {
      best = spread;
      earRow = k;
    }
  }
  const sideRows: number[] = Array.from(
    { length: S + 1 },
    (_: unknown, k: number): number =>
      k <= earRow
        ? hairline + ((earTop - hairline) * k) / earRow
        : k <= earRow + 2
          ? earTop + ((earBottom - earTop) * (k - earRow)) / 2
          : earBottom +
            ((chinU - earBottom) * (k - earRow - 2)) / (S - earRow - 2),
  );
  const vault: AutoMovieHumanHeadNetwork.IPoint[][] = vaultRows.map(
    (u: number): AutoMovieHumanHeadNetwork.IPoint[] =>
      lines.map(
        (v: number): AutoMovieHumanHeadNetwork.IPoint => network.on(u, v),
      ),
  );
  // the face block over lines 12 to 48, its top row the vault's last
  const face: AutoMovieHumanHeadNetwork.IPoint[][] = faceRows.map(
    (u: number, i: number): AutoMovieHumanHeadNetwork.IPoint[] =>
      Array.from(
        { length: FRONT + 1 },
        (_: unknown, k: number): AutoMovieHumanHeadNetwork.IPoint =>
          i === 0 ? vault[ROWS.vault]![12 + k]! : network.on(u, lines[12 + k]!),
      ),
  );
  // the side block from line 48 round the back to line 12, its top row the vault's last
  const sideLine: (m: number) => number = (m: number): number => (48 + m) % C;
  // Every face row continues into the side; toward the ears and back, the same rows take the ears' spacing.
  const edgeRow: (s: number) => number = (s: number): number =>
    along(
      faceRows.map(
        (u: number): AutoMovieHumanHeadNetwork.IPoint => network.on(u, 0),
      ),
      false,
      (s * R) / S,
    ).u;
  const toEar: (m: number) => number = (m: number): number => {
    const t: number = Math.min(1, Math.max(0, (Math.min(m, SIDE - m) - 1) / 2));
    return t * t * (3 - 2 * t);
  };
  const side: AutoMovieHumanHeadNetwork.IPoint[][] = sideRows.map(
    (u: number, s: number): AutoMovieHumanHeadNetwork.IPoint[] =>
      Array.from(
        { length: SIDE + 1 },
        (_: unknown, m: number): AutoMovieHumanHeadNetwork.IPoint =>
          s === 0
            ? vault[ROWS.vault]![sideLine(m)]!
            : network.on(
                edgeRow(s) + (u - edgeRow(s)) * toEar(m),
                lines[sideLine(m)]!,
              ),
      ),
  );
  const at: (
    block: AutoMovieHumanHeadNetwork.IPoint[][],
    i: number,
    k: number,
  ) => AutoMovieHumanHeadNetwork.IPoint = (
    block: AutoMovieHumanHeadNetwork.IPoint[][],
    i: number,
    k: number,
  ): AutoMovieHumanHeadNetwork.IPoint => block[i]![k]!;

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
    {
      block: face,
      rows: [eyeRow, eyeRow + ROWS.eyes],
      columns: [mid - EYE.lateral, mid - EYE.medial],
    },
    {
      block: face,
      rows: [eyeRow, eyeRow + ROWS.eyes],
      columns: [mid + EYE.medial, mid + EYE.lateral],
    },
    {
      block: face,
      rows: [mouthRow, mouthRow + ROWS.mouth],
      columns: [mid - MOUTH, mid + MOUTH],
    },
    {
      block: side,
      rows: [earRow, earRow + 2],
      columns: [earColumn - 1, earColumn + 1],
    },
    {
      block: side,
      rows: [earRow, earRow + 2],
      columns: [SIDE - earColumn - 1, SIDE - earColumn + 1],
    },
  ];
  const open: (
    block: AutoMovieHumanHeadNetwork.IPoint[][],
    i: number,
    k: number,
  ) => boolean = (
    block: AutoMovieHumanHeadNetwork.IPoint[][],
    i: number,
    k: number,
  ): boolean =>
    openings.some(
      (o: IOpening): boolean =>
        o.block === block &&
        i >= o.rows[0] &&
        i < o.rows[1] &&
        k >= o.columns[0] &&
        k < o.columns[1],
    );
  for (let i: number = 0; i < ROWS.vault; ++i)
    for (let j: number = 0; j < C; ++j)
      network.quad(
        [
          vault[i]![j]!,
          vault[i]![(j + 1) % C]!,
          vault[i + 1]![(j + 1) % C]!,
          vault[i + 1]![j]!,
        ],
        "vault",
      );
  for (let i: number = 0; i < R; ++i)
    for (let k: number = 0; k < FRONT; ++k)
      if (!open(face, i, k))
        network.quad(
          [
            at(face, i, k),
            at(face, i, k + 1),
            at(face, i + 1, k + 1),
            at(face, i + 1, k),
          ],
          "face",
        );
  for (let s: number = 0; s < S; ++s)
    for (let m: number = 1; m + 1 < SIDE; ++m)
      if (!open(side, s, m))
        network.quad(
          [
            at(side, s, m),
            at(side, s, m + 1),
            at(side, s + 1, m + 1),
            at(side, s + 1, m),
          ],
          "side",
        );
  // Equal-count bands join the face and sides without a density reduction at the orbit-cheek boundary.
  const column: (
    block: AutoMovieHumanHeadNetwork.IPoint[][],
    k: number,
  ) => AutoMovieHumanHeadNetwork.IPoint[] = (
    block: AutoMovieHumanHeadNetwork.IPoint[][],
    k: number,
  ): AutoMovieHumanHeadNetwork.IPoint[] =>
    block.map(
      (
        row: AutoMovieHumanHeadNetwork.IPoint[],
      ): AutoMovieHumanHeadNetwork.IPoint => row[k]!,
    );
  strip(
    network,
    layout.reduction,
    column(face, 0),
    column(side, SIDE - 1),
    false,
    "transition",
  );
  strip(
    network,
    layout.reduction,
    column(face, FRONT),
    column(side, 1),
    false,
    "transition",
  );
  // the rim of an opening, from the middle of its first column side round over the top
  const rim: (o: IOpening) => AutoMovieHumanHeadNetwork.IPoint[] = (
    o: IOpening,
  ): AutoMovieHumanHeadNetwork.IPoint[] => {
    const [i0, i1]: [number, number] = o.rows;
    const [j0, j1]: [number, number] = o.columns;
    const g: (i: number, j: number) => AutoMovieHumanHeadNetwork.IPoint = (
      i: number,
      j: number,
    ): AutoMovieHumanHeadNetwork.IPoint => at(o.block, i, j);
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
  loopAutoMovieHumanEyelids({
    domain,
    network,
    features,
    form: props.form.eyelids,
    rims: { left: rim(openings[0]!), right: rim(openings[1]!) },
  });
  loopAutoMovieHumanLips({
    domain,
    network,
    head,
    form: props.form.lips,
    rim: rim(openings[2]!),
  });
  for (const [name, o] of [
    ["left", openings[3]!],
    ["right", openings[4]!],
  ] as const) {
    const [i0, i1]: [number, number] = o.rows;
    const [j0, j1]: [number, number] = o.columns;
    const g: (i: number, j: number) => AutoMovieHumanHeadNetwork.IPoint = (
      i: number,
      j: number,
    ): AutoMovieHumanHeadNetwork.IPoint => at(side, i, j);
    pinAutoMovieHumanHeadRing(
      domain,
      network,
      `ear.${name}`,
      [
        g(i0, j0),
        g(i0, j0 + 1),
        g(i0, j1),
        g(i0 + 1, j1),
        g(i1, j1),
        g(i1, j0 + 1),
        g(i1, j0),
        g(i0 + 1, j0),
      ],
      props.ears[name].positions,
    );
  }

  capAutoMovieHumanHead({ domain, network, top: vault[0]!, lines });
  const bottom: AutoMovieHumanHeadNetwork.IPoint[] = lines.map(
    (_: number, j: number): AutoMovieHumanHeadNetwork.IPoint =>
      j >= 12 && j <= 48 ? at(face, R, j - 12) : at(side, S, (j - 48 + C) % C),
  );

  // ---- transition bands to the ring under the chin and the occiput
  const band: (
    from: AutoMovieHumanHeadNetwork.IPoint[],
    count: number,
    u: number,
  ) => AutoMovieHumanHeadNetwork.IPoint[] = (
    from: AutoMovieHumanHeadNetwork.IPoint[],
    count: number,
    u: number,
  ): AutoMovieHumanHeadNetwork.IPoint[] => {
    const to: AutoMovieHumanHeadNetwork.IPoint[] = Array.from(
      { length: count },
      (_: unknown, j: number): AutoMovieHumanHeadNetwork.IPoint =>
        network.on(u, along(from, true, (j * from.length) / count).v),
    );
    strip(network, layout.reduction, from, to, true, "transition");
    return to;
  };
  const collar: AutoMovieHumanHeadNetwork.IPoint[] = band(
    band(bottom, BANDS[0], bandU),
    BANDS[1],
    collarU,
  );
  const ringPoints: AutoMovieHumanHeadNetwork.IPoint[] = collar.map(
    (p: AutoMovieHumanHeadNetwork.IPoint): AutoMovieHumanHeadNetwork.IPoint =>
      network.on(1, p.domain.v),
  );
  for (let k: number = 0; k < ringPoints.length; ++k)
    network.quad(
      [
        collar[k]!,
        collar[(k + 1) % collar.length]!,
        ringPoints[(k + 1) % ringPoints.length]!,
        ringPoints[k]!,
      ],
      "ring",
    );
  pinAutoMovieHumanHeadRing(
    domain,
    network,
    "neckTop",
    ringPoints,
    props.neck.positions,
  );
}

/**
 * A strip of quads between a finer and a coarser run of points, by the engine's transition layout: 2-to-1 reduction blocks among straight columns, each block's two interior poles of valence three and its coarse corners of valence five. The runs are closed rings or open runs whose ends meet the neighbours; a corner of the layout's coarse or fine side is that run's point, and an interior corner lies `unit` of the way from the fine run toward the coarse at its own place along them.
 */
function strip(
  network: AutoMovieHumanHeadNetwork,
  unit: number,
  fine: AutoMovieHumanHeadNetwork.IPoint[],
  coarse: AutoMovieHumanHeadNetwork.IPoint[],
  closed: boolean,
  group: string,
): void {
  const F: number = closed ? fine.length : fine.length - 1;
  const K: number = closed ? coarse.length : coarse.length - 1;
  const corner: (c: {
    s: number;
    t: number;
  }) => AutoMovieHumanHeadNetwork.IPoint = (c: {
    s: number;
    t: number;
  }): AutoMovieHumanHeadNetwork.IPoint => {
    if (c.t <= 0) return fine[Math.round(c.s * F) % fine.length]!;
    if (c.t >= 1) return coarse[Math.round(c.s * K) % coarse.length]!;
    const a: { u: number; v: number } = along(fine, closed, c.s * F);
    const b: { u: number; v: number } = along(coarse, closed, c.s * K);
    const v: number = b.v + Math.round(a.v - b.v);
    return network.on(a.u + (b.u - a.u) * unit, a.v + (v - a.v) * unit);
  };
  for (const quad of layoutAutoMovieSurfaceTransition(F, K, 1))
    network.quad(
      [corner(quad[0]), corner(quad[1]), corner(quad[2]), corner(quad[3])],
      group,
    );
}

/** The domain point at a fractional index along a run of points, closed or open. */
function along(
  points: AutoMovieHumanHeadNetwork.IPoint[],
  closed: boolean,
  x: number,
): { u: number; v: number } {
  const n: number = points.length;
  const i: number = Math.min(Math.floor(x), closed ? Infinity : n - 2);
  const f: number = x - i;
  const a: AutoMovieHumanHeadNetwork.IPoint = points[((i % n) + n) % n]!;
  const b: AutoMovieHumanHeadNetwork.IPoint = points[(((i + 1) % n) + n) % n]!;
  const v: number = b.domain.v + Math.round(a.domain.v - b.domain.v);
  return {
    u: a.domain.u + (b.domain.u - a.domain.u) * f,
    v: a.domain.v + (v - a.domain.v) * f,
  };
}

/** Columns over the face, between the form's half-angle either side of the midline. */
const FRONT: number = 36;

/** Columns round the sides and the back, between the face's edges. */
const SIDE: number = 24;

/** Back-left column line through the ear's centre. */
const EAR_LINE: number = 8;

/** Columns of the two transition bands under the chin and the occiput, from the lattice's 60 to the neck-top ring's 28, each at least three fifths of the one before. */
const BANDS: [number, number] = [40, 28];

/** Rows of each band of the face, from the crown down. */
const ROWS: {
  readonly vault: 6;
  readonly forehead: 4;
  readonly eyes: 5;
  readonly nose: 4;
  readonly mouth: 5;
  readonly chin: 3;
} = {
  vault: 6,
  forehead: 4,
  eyes: 5,
  nose: 4,
  mouth: 5,
  chin: 3,
} as const;

/** Each eye's opening, columns from the midline to its medial and lateral sides. */
const EYE: { readonly medial: 3; readonly lateral: 13 } = {
  medial: 3,
  lateral: 13,
} as const;

/** The mouth's opening, columns from the midline to either side. */
const MOUTH: number = 6;
