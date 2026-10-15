import { slots } from "./slots";

/** Coverage verdict for one texture axis of one bound material slot. */
export type Axis = {
  /** Input path of the axis, from the model list down to the slot and axis. */
  path: string;

  /** Model identity. */
  model: string;

  /** Part identity within the model. */
  part: string;

  /** Material texture slot the binding occupies. */
  slot: (typeof slots)[number];

  /** Texture axis. */
  axis: "u" | "v";

  /** `checked` when the engine can compare the axis, `clamped` for a clamp fit, `unverified` otherwise. */
  status: "checked" | "clamped" | "unverified";

  /** Machine-readable cause of the status, such as `surface-metres-tile` or `missing-uv`. */
  reason: string;
};
