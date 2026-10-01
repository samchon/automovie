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
 * midline (`unit` metres per unit, the positive endpoint broader), by
 * the product of three smooth steps: across, rising from nothing at the
 * brow cards' lateral end (`frame.browSide`, so the brows and the eyes stay)
 * to all of it at the head's side (`frame.side`); upward, rising from nothing
 * at the auricles' top (`frame.earTop`, so the ears, the temporal fossa and
 * the face stay) to all of it at the euryon's height; and backward, all of it
 * from the euryon's depth rearward, falling to nothing at the brow's lateral
 * end, so the forehead's own breadth stays. The euryon vertex itself has weight
 * one by construction, so a weight of one adds `2 * unit` to the breadth
 * the repository reads (twice the farthest scalp vertex), and no other vertex
 * can pass it.
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
    !(f.earTop < f.euryon && f.browSide > 0 && f.browSide < f.side) ||
    !(f.front > f.depth)
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
  const rows: number[] = [];
  for (let v = 0; v < P.length / 3; ++v) {
    const [x, y, z] = [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!];
    const weight =
      smooth((Math.abs(x) - f.browSide) / (f.side - f.browSide)) *
      smooth((y - f.earTop) / (f.euryon - f.earTop)) *
      smooth((f.front - z) / (f.front - f.depth));
    if (!(weight > 0)) continue;
    rows.push(v, Math.sign(x) * input.unit * weight, 0, 0);
  }
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
