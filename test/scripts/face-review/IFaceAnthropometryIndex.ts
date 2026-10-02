/** Detector landmark, image pixels (+x right, +y down); undefined when absent. */
export type FaceAnthropometryPoint = readonly [number, number] | undefined;

/** One anthropometric index and the shared control that answers for it. */
export interface IFaceAnthropometryIndex {
  id: string;
  /** Anatomical definition in landmark terms. */
  definition: string;
  /** Channels set together as one control. */
  channels: readonly string[];
  /**
   * Each channel's share of the control, aligned with `channels`; absent,
   * every channel takes the control's value.
   */
  gains?: readonly number[];
  /**
   * The channels are expression channels: the index reads a state of the
   * face, not its form, so the control is written as expression.
   */
  expression?: true;
  /**
   * The index whose control uncovers what this one reads: the upper incisal
   * edge shows below the lip only with the teeth apart, so the upper lip
   * raiser's index is read, and calibrated, with the jaw open.
   */
  uncoveredBy?: string;
  /**
   * Channels a negative control writes, at its magnitude: a signed index
   * whose two directions are two units (the mouth moved to either side).
   * `channels` then take the positive values only.
   */
  negative?: readonly string[];
}
