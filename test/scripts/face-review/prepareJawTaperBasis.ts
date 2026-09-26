import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * The jaw taper revision of the connected face basis: a control for how
 * the mandible's frontal outline converges from the mouth's line to the
 * chin.
 *
 * Read on the jaw's outline, the photographs' chins are narrower than the
 * source's at the chin's level (half the eyes' height below stomion): 0.27
 * to 0.62 of the face's width against the neutral's 0.645, the renders of
 * round j13 46 percent wider at the median, and the source's `chinWidth`
 * moves that level by under one percent over its envelope (its target
 * shapes the chin's front), so it was held at its end for most subjects.
 * The outline there is the mandible's body with its soft tissue, which
 * runs from the gonial angle, lateral at the mouth's line, down to the
 * symphysis; how steeply it converges is the jaw's taper. One unit narrows
 * the skin the mandible carries toward the midline by a fraction of its
 * distance from it that grows linearly from nothing at the mouth's line
 * (`top`, where the lower face's width is read, which it leaves alone) to
 * `unit` at soft-tissue menton (`menton`) and stays at `unit` below it,
 * each vertex weighted by `carry` (the mandible's share of it, 0 to 1), so
 * the neck's base, which the mandible does not carry, stays, and by how
 * far its surface faces sideways (the unit normal's lateral component): it
 * is the mandible's body that converges, its outer face turned sideways,
 * while the chin's front, facing forward, keeps its own width (the
 * source's `chinWidth`); narrowed uniformly, the chin's front curved ever
 * tighter and folded into a ridge down the midline from -4. The negative
 * endpoint tapers the jaw (narrower toward the chin), the positive squares
 * it, and the channel spans `envelope`. Pure.
 */
export function prepareJawTaperBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  channel: string;
  /** The mandible's carry of each skin vertex, 0 to 1. */
  carry: readonly number[];
  /** The mouth's line, the mouth corners' height, metres. */
  top: number;
  /** Soft-tissue menton's height, metres. */
  menton: number;
  /** Fraction of a vertex's distance from the midline per unit at menton. */
  unit: number;
  envelope: [number, number];
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    channel: string;
    top: number;
    menton: number;
    unit: number;
    rows: number;
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("A jaw taper revision needs a distinct revision.");
  if (!(input.unit > 0 && input.unit < 1))
    throw new Error("The unit lies between zero and one.");
  if (!(input.envelope[0] < 0 && input.envelope[1] > 0))
    throw new Error("The envelope must hold both directions.");
  if (input.envelope[0] * input.unit <= -1)
    throw new Error("The envelope would close the jaw on the midline.");
  if (!(input.top > input.menton))
    throw new Error("The mouth's line lies above menton.");
  if (basis.channels.some((one) => one.id === input.channel))
    throw new Error(`The basis already has a channel ${input.channel}.`);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const count = skin.positions.length / 3;
  if (input.carry.length !== count)
    throw new Error("The carry holds one weight per skin vertex.");
  // Each vertex's unit normal, its triangles' area-weighted sum: the
  // mandible's body faces sideways, the chin's front forward.
  const P = skin.positions;
  const normal = new Array<number>(P.length).fill(0);
  const I = skin.indices;
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [I[t]!, I[t + 1]!, I[t + 2]!];
    const u = [0, 1, 2].map((k) => P[3 * b + k]! - P[3 * a + k]!);
    const w = [0, 1, 2].map((k) => P[3 * c + k]! - P[3 * a + k]!);
    const n = [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
    for (const v of [a, b, c])
      for (let k = 0; k < 3; ++k) normal[3 * v + k]! += n[k]!;
  }
  const narrower: number[] = [];
  const wider: number[] = [];
  for (let v = 0; v < count; ++v) {
    const [x, y] = [P[3 * v]!, P[3 * v + 1]!];
    const carry = Math.min(1, Math.max(0, input.carry[v]!));
    if (!(y < input.top) || carry === 0 || x === 0) continue;
    const length = Math.hypot(
      normal[3 * v]!,
      normal[3 * v + 1]!,
      normal[3 * v + 2]!,
    );
    const side = length === 0 ? 0 : Math.abs(normal[3 * v]!) / length;
    const depth = Math.min(1, (input.top - y) / (input.top - input.menton));
    const dx = -carry * input.unit * depth * side * x;
    if (dx === 0) continue;
    narrower.push(v, dx, 0, 0);
    wider.push(v, -dx, 0, 0);
  }
  if (narrower.length === 0)
    throw new Error("The mandible carries no skin below the mouth's line.");
  const names = {
    narrower: `${input.channel}.narrower`,
    wider: `${input.channel}.wider`,
  };
  skin.targets[names.narrower] = narrower;
  skin.targets[names.wider] = wider;
  basis.channels.push({
    id: input.channel,
    description: `The jaw's taper from the mouth's line to the chin, tapered to square, ${Number((input.unit * 100).toFixed(3))} percent narrower per unit at menton, nothing at the mouth's line; the skin the mandible carries.`,
    kind: "shape",
    minimum: input.envelope[0],
    maximum: input.envelope[1],
    positive: names.wider,
    negative: names.narrower,
  });
  const source = basis.id;
  basis.id = input.revision;
  return {
    basis,
    documents: input.documents.map((one) => ({
      ...one,
      basis: input.revision,
    })),
    controls: { ...input.controls, basis: input.revision },
    receipt: {
      source,
      revision: input.revision,
      channel: input.channel,
      top: input.top,
      menton: input.menton,
      unit: input.unit,
      rows: narrower.length / 4,
    },
  };
}
