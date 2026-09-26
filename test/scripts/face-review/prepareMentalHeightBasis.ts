import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * The mental height revision of the connected face basis: a control for the
 * chin's height below the labiomental fold.
 *
 * Measured by the jaw's outline, the photographs' chins are shorter than the
 * source's: stomion to soft-tissue menton is 0.36 to 0.42 of the face's
 * height on them, and the source's `chinHeight` at its end still reads 0.39
 * to 0.43 on most, while past it the chin lifts off the neck and opens the
 * junction (the connected head's neck ends 16 mm below menton). The soft
 * tissue below the labiomental fold (supramentale, `fold`) lies on the
 * mandible's symphysis, and it is the mandible that carries it: the skin
 * the jaw's opening moves with the lower lip's seam is the mandible's, the
 * neck's and the submental skin's carry falling off toward the neck. One
 * unit scales the skin below the fold vertically toward the fold, each
 * vertex by its `carry` (the mandible's share of it, 0 to 1), so that a
 * vertex carried whole at menton's height moves `unit` metres; the lips,
 * the teeth and everything above the fold stay, and the neck's base, which
 * the mandible does not carry, stays. The negative endpoint shortens the
 * chin, the positive lengthens it, and the channel spans `envelope` of
 * them. Pure.
 */
export function prepareMentalHeightBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  channel: string;
  /** The mandible's carry of each skin vertex, 0 to 1. */
  carry: readonly number[];
  /** The labiomental fold's height, metres. */
  fold: number;
  /** Soft-tissue menton's height, metres. */
  menton: number;
  /** Metres a vertex carried whole at menton's height moves per unit. */
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
    fold: number;
    menton: number;
    unit: number;
    rows: number;
  };
} {
  const basis = structuredClone(input.basis);
  if (input.revision.trim() === "" || input.revision === basis.id)
    throw new Error("A mental height revision needs a distinct revision.");
  if (!(input.unit > 0)) throw new Error("The unit must be positive.");
  if (!(input.envelope[0] < 0 && input.envelope[1] > 0))
    throw new Error("The envelope must hold both directions.");
  if (!(input.fold > input.menton))
    throw new Error("The fold lies above menton.");
  if (basis.channels.some((one) => one.id === input.channel))
    throw new Error(`The basis already has a channel ${input.channel}.`);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const count = skin.positions.length / 3;
  if (input.carry.length !== count)
    throw new Error("The carry holds one weight per skin vertex.");
  const scale = input.unit / (input.fold - input.menton);
  const shorter: number[] = [];
  const taller: number[] = [];
  for (let v = 0; v < count; ++v) {
    const y = skin.positions[3 * v + 1]!;
    const carry = Math.min(1, Math.max(0, input.carry[v]!));
    if (!(y < input.fold) || carry === 0) continue;
    const dy = carry * scale * (input.fold - y);
    shorter.push(v, 0, dy, 0);
    taller.push(v, 0, -dy, 0);
  }
  if (shorter.length === 0)
    throw new Error("The mandible carries no skin below the fold.");
  const names = {
    shorter: `${input.channel}.shorter`,
    taller: `${input.channel}.taller`,
  };
  skin.targets[names.shorter] = shorter;
  skin.targets[names.taller] = taller;
  basis.channels.push({
    id: input.channel,
    description: `The chin's height below the labiomental fold, shorter to taller, ${Number((input.unit * 1000).toFixed(3))} mm per unit at menton; the skin the mandible carries scales toward the fold.`,
    kind: "shape",
    minimum: input.envelope[0],
    maximum: input.envelope[1],
    positive: names.taller,
    negative: names.shorter,
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
      fold: input.fold,
      menton: input.menton,
      unit: input.unit,
      rows: shorter.length / 4,
    },
  };
}
