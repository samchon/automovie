import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/** The heights and spans a face breadth control is laid out by, metres. */
export interface IFaceBreadthFrame {
  /** Half the outer canthal distance: the eyes stay within it. */
  canthus: number;
  /** Half the face's frontal width at the zygion's height. */
  side: number;
  /** The brows' height: nothing above it moves. */
  brow: number;
  /** The zygion's height: the full span from it down to `tip`. */
  zygion: number;
  /** The nasal tip's height. */
  tip: number;
  /** The mouth's line: nothing below it moves. */
  mouth: number;
  /** The auricles' mean depth: the full span in front of it. */
  ear: number;
  /** How far behind `ear` the span fades to nothing. */
  behind: number;
}

/**
 * The face breadth revision of the connected face basis: one control for
 * the span of the cheeks and zygomatic arches, the face's breadth beside
 * the eyes.
 *
 * The cheeks' breadth beside the eyes had no control of its own. (The
 * face-skin masks of round j18 had read the renders as broader there than
 * their photographs; that reading proved an artifact of the segmenter,
 * which takes a render's unhaired ears into the face, so the control stays
 * an authoring control with no index.)
 * No control of the source moves that breadth apart from the eyes: the
 * cheek bone narrows the zygion's level by 1.7 mm at its end, the head's
 * width moves the eyes with the face. Each skin vertex beside the eyes
 * moves toward the midline (`unit` metres per unit, the positive endpoint
 * broader): fully from the side of the face at the zygion's height
 * outward, rising smoothly from nothing at the outer canthus
 * (`frame.canthus`, so the eyes and their lids stay) to all of it at
 * `frame.side`; fully between the zygion's and the nasal tip's heights,
 * fading smoothly to nothing at the brows above and at the mouth's line
 * below (the lower face's breadth is its own control, cheekFullness); and
 * fully in front of the auricles' depth, fading over `frame.behind`
 * behind them, so the ears ride with the face's side and the skull behind
 * stays. Everything else, the documents and the control map are copied,
 * restamped to `revision`. Pure.
 */
export function prepareFaceBreadthBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  skin: string;
  channel: string;
  frame: IFaceBreadthFrame;
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
    frame: IFaceBreadthFrame;
    unit: number;
    envelope: [number, number];
    rows: number;
  };
} {
  const f = input.frame;
  if (input.revision.trim() === "" || input.revision === input.basis.id)
    throw new Error("A face breadth revision needs a distinct revision.");
  if (!(f.canthus > 0 && f.side > f.canthus))
    throw new Error("The face's side lies beyond the outer canthus.");
  if (!(f.brow > f.zygion && f.zygion >= f.tip && f.tip > f.mouth))
    throw new Error(
      "The brows, the zygion, the nasal tip and the mouth descend in turn.",
    );
  if (!(f.behind > 0 && input.unit > 0))
    throw new Error("The fade behind the ears and the unit are positive.");
  if (!(input.envelope[0] < 0 && input.envelope[1] > 0))
    throw new Error("The envelope holds both directions.");
  const basis = structuredClone(input.basis);
  if (basis.channels.some((one) => one.id === input.channel))
    throw new Error(`The basis already has a channel ${input.channel}.`);
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  if (skin === undefined) throw new Error(`No surface ${input.skin}.`);
  const smooth = (t: number) => {
    const c = Math.min(1, Math.max(0, t));
    return c * c * (3 - 2 * c);
  };
  const P = skin.positions;
  const rows: number[] = [];
  for (let v = 0; v < P.length / 3; ++v) {
    const [x, y, z] = [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!];
    const across = smooth((Math.abs(x) - f.canthus) / (f.side - f.canthus));
    const height =
      y > f.zygion
        ? smooth((f.brow - y) / (f.brow - f.zygion))
        : y >= f.tip
          ? 1
          : smooth((y - f.mouth) / (f.tip - f.mouth));
    const depth = smooth((z - (f.ear - f.behind)) / f.behind);
    const weight = across * height * depth;
    if (!(weight > 0)) continue;
    rows.push(v, -Math.sign(x) * input.unit * weight, 0, 0);
  }
  const names = {
    narrower: `${input.channel}.narrower`,
    broader: `${input.channel}.broader`,
  };
  skin.targets[names.narrower] = rows;
  skin.targets[names.broader] = rows.map((value, i) =>
    i % 4 === 1 ? -value : value,
  );
  basis.channels.push({
    id: input.channel,
    description: `The face's breadth beside the eyes, narrower to broader: the cheeks and zygomatic arches ${Number((input.unit * 1000).toFixed(3))} mm per unit toward or away from the midline at full span, the eyes and the lower face left.`,
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
    })),
    controls: { ...structuredClone(input.controls), basis: input.revision },
    receipt: {
      source,
      revision: input.revision,
      channel: input.channel,
      frame: f,
      unit: input.unit,
      envelope: input.envelope,
      rows: rows.length / 4,
    },
  };
}
