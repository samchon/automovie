import type { BoutTechnique } from "../choreography/BoutTechnique";
import { FilmVector as V } from "../rig/FilmVector";

/**
 * Where a narrower receiving feature faces, in the receiver's own standing
 * frame, as a world vector one metre long: projecting the receiving collider
 * from that far outside lands on the feature's surface. `jaw-neck` lies behind
 * the ear on the struck side, where the jaw meets the neck: posterior,
 * lateral and toward the skull base in equal parts.
 */
export function filmFeatureDirection(
  feature: BoutTechnique.Feature,
  heading: number,
  side: "left" | "right",
): V.Value {
  const forward: V.Value = V.rotateY([1, 0, 0], heading);
  const left: V.Value = V.rotateY([0, 0, 1], heading);
  const lateral: V.Value = V.scale(left, side === "left" ? 1 : -1);
  switch (feature) {
    case "jaw-neck":
      return V.normalize(V.add(V.sub(lateral, forward), [0, 1, 0]));
  }
}
