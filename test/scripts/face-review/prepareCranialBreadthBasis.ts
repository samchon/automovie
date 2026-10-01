import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

import type { ICranialBreadthFrame } from "./measureCranialBreadthFrame";

const smooth = (t: number): number => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/**
 * The cranial breadth revision of the connected face basis: one control for
 * the breadth of the neurocranium apart from the face, and the neutral head's
 * breadth set to a stated convention.
 *
 * `headWidth` scales the whole head across, face included, so it leaves the
 * face-to-cranium breadth ratio where it was; no control moved the vault
 * alone. Each skin vertex of the cranial side moves along x away from the
 * midline (`unit` metres per unit, the positive endpoint broader), by the
 * product of three smooth steps: across, rising from nothing at the brow
 * cards' lateral end (`frame.browSide`, so the brows and the eyes stay) to all
 * of it at the head's side (`frame.side`); upward, rising from nothing at the
 * auricles' lowest point (`frame.earBottom`) to all of it at the euryon's
 * height, so the skin around an ear changes by a gentle slope and never by a
 * step at the ear's top; and backward, all of it from the euryon's depth
 * rearward, falling to nothing at a depth that depends on height: at and
 * below the ear top the auricles' front (`frame.earFront`), so the face, whose
 * zygion lies ahead of the ear, keeps its breadth, and rising from there to the
 * brow's lateral end (`frame.front`) at the euryon's height, over the temple,
 * where only the skull lies beneath, so the forward edge of the widening is a
 * long slope and not a visible band. The euryon vertex itself has weight one by
 * construction, so a weight of one adds `2 * unit` to the breadth the
 * repository reads (twice the farthest scalp
 * vertex), and no other vertex can pass it.
 *
 * An auricle is attached to the skull and follows it: each auricle vertex takes
 * the displacement of the nearest vertex that is not an auricle's, the skin its
 * root sits on, so the ear is carried as the local skin is and is neither
 * buried by it nor left standing out of it. The hair roots of the scalp are
 * seated on skin triangles and follow the skin by construction.
 *
 * Named ceiling: the displacement rises from the auricles' lowest point, so the
 * ear is sheared rather than translated. On the published basis (left ear,
 * 652 vertices beyond 72 mm, 49.8 mm tall) the top moves 3.46 mm and the lobe
 * none, which adds about 4.0 degrees to the ear's lean away from the skull
 * (the largest single vertex moves 4.01 mm). The auriculocephalic angle of a
 * neutral is not set from a measured population here, and the retroauricular
 * sulcus is not built, because no population measurement of either was read.
 *
 * The neutral is then moved to `neutralBreadth`: the surfaces' rest positions
 * take `(neutralBreadth - 2 * frame.side) / 2` of the weight rows, so the
 * breadth the neutral reads is the convention exactly, and every other
 * control's rows, being displacements, keep their meaning. The convention is
 * a recorded choice inside both sexes' observed range, never a permitted
 * range. Each document is migrated to preserve the geometry it already
 * had: it gains this control at the negative of the baked weight, so no
 * published subject changes shape. `envelope` is in weight units around the new
 * neutral and must admit that migration weight. Everything else is copied and
 * restamped to `revision`. Pure.
 */
export function prepareCranialBreadthBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  channel: string;
  frame: ICranialBreadthFrame;
  auricles: readonly number[];
  unit: number;
  envelope: [number, number];
  neutralBreadth: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    channel: string;
    frame: ICranialBreadthFrame;
    unit: number;
    envelope: [number, number];
    neutralBreadth: number;
    bakedWeight: number;
    rows: number;
  };
} {
  const f = input.frame;
  if (input.revision.trim() === "" || input.revision === input.basis.id)
    throw new Error("A cranial breadth revision needs a distinct revision.");
  if (
    !(f.earBottom < f.euryon && f.earTop < f.euryon) ||
    !(f.browSide > 0 && f.browSide < f.side) ||
    !(f.earFront > f.depth && f.front > f.earFront)
  )
    throw new Error("The frame does not order as a head does.");
  if (!(input.unit > 0 && input.neutralBreadth > 0))
    throw new Error("The unit and the neutral breadth are positive.");
  if (!(input.envelope[0] < 0 && input.envelope[1] > 0))
    throw new Error("The envelope holds both directions.");
  const baked = (input.neutralBreadth - 2 * f.side) / (2 * input.unit);
  if (!(baked >= -input.envelope[1] && baked <= -input.envelope[0]))
    throw new Error(
      "The envelope must admit the weight that keeps each document's shape.",
    );
  const basis = structuredClone(input.basis);
  if (basis.channels.some((one) => one.id === input.channel))
    throw new Error(`The basis already has a channel ${input.channel}.`);
  if (input.documents.some((one) => input.channel in one.shape))
    throw new Error(`A document already sets ${input.channel}.`);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const P = skin.positions;
  const ear = new Set(input.auricles);
  if (ear.size === 0 || [...ear].some((v) => !(v >= 0 && v < P.length / 3)))
    throw new Error("The auricles name vertices of the skin.");
  // Below the ear top the span ends at the ears' front, where the face lies;
  // above it, over the temple, it may reach forward to the brow's lateral end.
  const reach = (y: number): number =>
    f.earFront +
    (f.front - f.earFront) * smooth((y - f.earTop) / (f.euryon - f.earTop));
  const shift = new Map<number, number>();
  const roots: number[] = [];
  for (let v = 0; v < P.length / 3; ++v) {
    const [x, y, z] = [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!];
    if (ear.has(v)) continue;
    const weight =
      smooth((Math.abs(x) - f.browSide) / (f.side - f.browSide)) *
      smooth((y - f.earBottom) / (f.euryon - f.earBottom)) *
      smooth((reach(y) - z) / (reach(y) - f.depth));
    roots.push(v);
    if (weight > 0) shift.set(v, Math.sign(x) * input.unit * weight);
  }
  for (const v of ear) {
    let nearest = -1;
    let least = Infinity;
    for (const r of roots) {
      const d =
        (P[3 * r]! - P[3 * v]!) ** 2 +
        (P[3 * r + 1]! - P[3 * v + 1]!) ** 2 +
        (P[3 * r + 2]! - P[3 * v + 2]!) ** 2;
      if (d < least) {
        least = d;
        nearest = r;
      }
    }
    const carried = shift.get(nearest);
    if (carried !== undefined) shift.set(v, carried);
  }
  const rows: number[] = [];
  for (const [v, dx] of [...shift].sort((a, b) => a[0] - b[0]))
    rows.push(v, dx, 0, 0);
  for (let i = 0; i < rows.length; i += 4)
    P[3 * rows[i]!] += baked * rows[i + 1]!;
  const names = {
    narrower: `${input.channel}.narrower`,
    broader: `${input.channel}.broader`,
  };
  skin.targets[names.broader] = rows;
  skin.targets[names.narrower] = rows.map((value, i) =>
    i % 4 === 1 ? -value : value,
  );
  basis.channels.push({
    id: input.channel,
    description: `The breadth of the neurocranium apart from the face, narrower to broader: the scalp's side ${Number((input.unit * 2000).toFixed(3))} mm of head breadth per unit at full span, the brows, eyes, ears and face left.`,
    kind: "shape",
    minimum: input.envelope[0],
    maximum: input.envelope[1],
    positive: names.broader,
    negative: names.narrower,
  });
  const source = basis.id;
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((one) => ({
      ...structuredClone(one),
      basis: input.revision,
      shape: { ...one.shape, [input.channel]: 0 - baked },
    })),
    controls: { ...structuredClone(input.controls), basis: input.revision },
    receipt: {
      source,
      revision: input.revision,
      channel: input.channel,
      frame: f,
      unit: input.unit,
      envelope: input.envelope,
      neutralBreadth: input.neutralBreadth,
      bakedWeight: baked,
      rows: rows.length / 4,
    },
  };
}
