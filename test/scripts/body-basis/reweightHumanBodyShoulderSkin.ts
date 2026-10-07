import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieVector3 } from "@automovie/interface";

type Skin = IAutoMovieHumanBodyBasis["surfaces"][number]["skin"];

/**
 * Move the humerus's share of the skin that lies above the glenohumeral centre
 * to the shoulder girdle, so that skin follows the girdle and not the arm.
 *
 * The rig has no scapula: the acromion, the scapular spine and the upper
 * trapezius are carried by the girdle bone (`leftShoulder`, `rightShoulder`),
 * which the scapulohumeral coupling turns by the girdle's own share of an
 * arm elevation. Only the deltoid, the lateral and inferior arm and the
 * axilla are carried by the humerus. A skin vertex above the joint centre that
 * kept a large humeral weight was turned by the whole arm elevation, so with
 * the arm raised it rode the arm into a knot beside the neck.
 *
 * The rule is geometric and applies to every vertex the same way. Let `theta`
 * be the angle at the glenohumeral centre between the vertex and the upward
 * axis (+Y) in the rest pose. The humeral weight is kept whole at
 * and beyond `fullDegrees`, kept at none at or below `onsetDegrees`, and
 * blended between them by a smoothstep. The removed
 * share is added to the girdle bone of the same side. The weights of a vertex
 * still sum to one and it keeps at most four influences: when a fifth would
 * appear the smallest is dropped and the rest are renormalised. A vertex with
 * no humeral weight, or on the far side of the midline from the joint, is
 * left unchanged.
 *
 * `onsetDegrees` and `fullDegrees` are an authored convention, not a measured
 * value: the horizontal plane through the joint centre (90 degrees) separates
 * girdle-borne skin above from arm-borne skin below, and the ramp around it
 * stops the transition from showing as a seam. Nothing here derives them from
 * a photograph or a person.
 *
 * Pure: the input skin is not modified, and the result owns its arrays. The
 * caller owns the frame: positions and centres are metres in the basis rest
 * frame (Y up, Z forward), the left arm on +X.
 * The caller supplies basis-admitted positions and four-influence skin data.
 * A vertex at the joint centre has no upward angle and is left unchanged:
 * rotation about that centre cannot move it, so no directional attachment
 * can be inferred there. Ramp endpoints must be finite and inside [0, 180],
 * the range of the angle between two nonzero vectors.
 *
 * @evidence contracts/common.md#principled-implementation A smoothstep of the angle off the rest upward axis transfers the humeral share to its same-side girdle, preserving the normalized four-influence representation. The geometric rule is an authored attachment convention, not a population motion estimate; a zero-radius vertex has no defined angle and remains unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One pass per side reads each vertex's existing shares, transfers one share and stores at most four normalized influences; the function returns independent arrays rather than mutating the input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule depends on admitted geometry and named bone ownership, with no photograph, subject-specific value or fixture case. Zero radius is a geometric degeneracy, not a selected vertex exemption.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the regeneration consumer's frame, input admission precondition, convention rather than measurement, degeneracy behavior and ownership of every returned array.
 */
export function reweightHumanBodyShoulderSkin(props: {
  positions: readonly number[];
  skin: Skin;
  centres: Record<"leftUpperArm" | "rightUpperArm", IAutoMovieVector3>;
  onsetDegrees: number;
  fullDegrees: number;
}): { skin: Skin; changed: number } {
  const { positions, skin, centres, onsetDegrees, fullDegrees } = props;
  if (
    !Number.isFinite(onsetDegrees) ||
    !Number.isFinite(fullDegrees) ||
    onsetDegrees < 0 ||
    fullDegrees > 180 ||
    !(onsetDegrees < fullDegrees)
  )
    throw new Error(
      "The girdle ramp needs finite angles in [0, 180] and onset below full.",
    );
  const boneIndices = skin.boneIndices.slice();
  const weights = skin.weights.slice();
  let changed = 0;
  for (const arm of ["leftUpperArm", "rightUpperArm"] as const) {
    const girdle = arm === "leftUpperArm" ? "leftShoulder" : "rightShoulder";
    const armIndex = skin.joints.indexOf(arm);
    const girdleIndex = skin.joints.indexOf(girdle);
    if (armIndex < 0 || girdleIndex < 0)
      throw new Error("The skin does not name " + arm + " and " + girdle + ".");
    const side = arm === "leftUpperArm" ? 1 : -1;
    const centre = centres[arm];
    for (let v = 0; v < positions.length / 3; ++v) {
      const dx = positions[3 * v] - centre.x;
      const dy = positions[3 * v + 1] - centre.y;
      const dz = positions[3 * v + 2] - centre.z;
      // the joint's own side of the midline only
      if (side * positions[3 * v] <= 0) continue;
      const radius = Math.hypot(dx, dy, dz);
      if (radius === 0) continue;
      const theta =
        (Math.acos(Math.max(-1, Math.min(1, dy / radius))) * 180) / Math.PI;
      const t = Math.min(
        1,
        Math.max(0, (theta - onsetDegrees) / (fullDegrees - onsetDegrees)),
      );
      const keep = t * t * (3 - 2 * t);
      const shares = new Map<number, number>();
      for (let k = 0; k < 4; ++k) {
        const w = weights[4 * v + k];
        if (w > 0)
          shares.set(
            boneIndices[4 * v + k],
            (shares.get(boneIndices[4 * v + k]) ?? 0) + w,
          );
      }
      const humeral = shares.get(armIndex) ?? 0;
      if (humeral === 0 || keep >= 1) continue;
      shares.set(armIndex, humeral * keep);
      shares.set(
        girdleIndex,
        (shares.get(girdleIndex) ?? 0) + humeral * (1 - keep),
      );
      const kept = [...shares]
        .filter(([, w]) => w > 0)
        .sort((a, b) => b[1] - a[1] || a[0] - b[0])
        .slice(0, 4);
      const sum = kept.reduce((total, [, w]) => total + w, 0);
      for (let k = 0; k < 4; ++k) {
        boneIndices[4 * v + k] = k < kept.length ? kept[k][0] : 0;
        weights[4 * v + k] = k < kept.length ? kept[k][1] / sum : 0;
      }
      ++changed;
    }
  }
  return {
    skin: { joints: skin.joints.slice(), boneIndices, weights },
    changed,
  };
}
