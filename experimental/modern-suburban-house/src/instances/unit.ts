import { Vec } from "./Vec";


/** Unit vector along `v`. */
export const unit = (v: Vec): Vec => {
  const d = Math.hypot(...v);
  return [v[0] / d, v[1] / d, v[2] / d];
};
