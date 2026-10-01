/**
 * The heights and spans a cranial breadth control is laid out by, metres in
 * the basis head frame (x anatomical left, y up, z anterior).
 */
export interface ICranialBreadthFrame {
  /** Half the greatest head breadth, euryon to euryon over the scalp. */
  side: number;
  /** The euryon's height: the control reaches its full span from here up. */
  euryon: number;
  /** The euryon's depth: the full span from here backward. */
  depth: number;
  /** The auricles' highest point: nothing at or below it moves. */
  earTop: number;
  /** The brow cards' greatest half-width: nothing within it moves. */
  browSide: number;
  /** The depth of the brow's lateral end: nothing in front of it moves. */
  front: number;
}

/**
 * Read a cranial breadth frame on a neutral skin.
 *
 * The euryon follows the repository's own cephalic-index reading
 * (`measureFaceUnseen`): the scalp vertex farthest from the midsagittal plane,
 * the head's greatest breadth above the ears, which hair hides in a photograph
 * and a calliper reads on the skull (the 3D Facial Norms study, Weinberg et
 * al. 2016, PMC4841054 Table 2, defines maximum cranial width as euryon to
 * euryon by spreading callipers; ANSUR II measures head breadth). The ear
 * top is the highest auricle vertex and the brow's lateral end the brow vertex
 * farthest from the midline; the frame is the set of four lengths and two
 * heights the control's weights are laid out by, so no number is a constant of
 * one subject. The head is read as symmetric about x = 0, the basis's own
 * convention, by absolute lateral distance.
 *
 * The frame must order the way a head does, or no cranial control exists on the
 * surface: the ears end below the euryon, the brows end inside the head's
 * side and the brow's lateral end lies in front of the euryon. Pure, and the
 * inputs are only read.
 *
 * @param props.positions Skin positions, flat xyz.
 * @param props.scalp Vertices of the scalp's hair domains.
 * @param props.auricles Every auricle vertex of both ears.
 * @param props.brows Brow-card positions, flat xyz.
 */
export function measureCranialBreadthFrame(props: {
  positions: readonly number[];
  scalp: readonly number[];
  auricles: readonly number[];
  brows: readonly number[];
}): ICranialBreadthFrame {
  const { positions: P, brows: B } = props;
  if (props.scalp.length === 0 || props.auricles.length === 0 || B.length === 0)
    throw new Error(
      "A cranial frame needs the scalp, the auricles and the brows.",
    );
  let euryon = props.scalp[0]!;
  for (const v of props.scalp)
    if (Math.abs(P[3 * v]!) > Math.abs(P[3 * euryon]!)) euryon = v;
  let lateral = 0;
  for (let i = 0; i < B.length; i += 3)
    if (Math.abs(B[i]!) > Math.abs(B[3 * lateral]!)) lateral = i / 3;
  const frame: ICranialBreadthFrame = {
    side: Math.abs(P[3 * euryon]!),
    euryon: P[3 * euryon + 1]!,
    depth: P[3 * euryon + 2]!,
    earTop: Math.max(...props.auricles.map((v) => P[3 * v + 1]!)),
    browSide: Math.abs(B[3 * lateral]!),
    front: B[3 * lateral + 2]!,
  };
  if (!(frame.earTop < frame.euryon))
    throw new Error("The ears end below the euryon.");
  if (!(frame.browSide > 0 && frame.browSide < frame.side))
    throw new Error("The brows end inside the head's side.");
  if (!(frame.front > frame.depth))
    throw new Error("The brow's lateral end lies in front of the euryon.");
  return frame;
}
