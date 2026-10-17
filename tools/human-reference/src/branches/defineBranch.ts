import type { Skin } from "../geometry/Skin.ts";
import type { V3 } from "../geometry/V3.ts";
import { dot } from "../geometry/dot.ts";
import { len } from "../geometry/len.ts";
import { norm } from "../geometry/norm.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { sub } from "../geometry/sub.ts";
import type { BranchDefinition } from "./BranchDefinition.ts";

/**
 * Derives a branch observation window from named rig markers in the source frame.
 * Conventional length fractions bound inspection, not anatomical shape fitting.
 * Shoulder bounds stop at neck_01 so a head extremum cannot masquerade as a shoulder.
 *
 * @evidence contracts/common.md#principled-implementation Uses the humerus or thigh rig direction as a physical cutting axis and scales conservative observation windows by that segment length. The groin uses world-level cuts. Rig markers are diagnostic source anchors, not clinical joint measurements.
 * @evidence contracts/common.md#clear-and-simple-design Owns region placement once; cutting, local surgery and camera consumers receive the same definition instead of independently estimating a boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Region-name branches express different physical section protocols. No identity-specific coordinate, source index or shoulder-height compensation is retained.
 * @evidence contracts/common.md#meaningful-documentation Names the conventional observation-window fractions, native frame requirement and geometric meaning of the optional bounded extremum.
 * @evidence contracts/performance.md#efficient-algorithms Performs constant rig lookups and one O(V) shoulder-vertex scan, retaining O(1) state; the scan is needed to measure a source skin extremum.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses loaded bone positions and skin arrays without a cross-call cache; each region definition is computed once by its calling operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates only a small returned definition and call-local vectors; it owns no handles or retained global state.
 */
export function defineBranch(
  skin: Skin,
  name: BranchDefinition["name"],
): BranchDefinition {
  const bone = (marker: string): V3 => {
    const point: V3 | undefined = skin.bones.get(marker)?.pos;
    if (!point) throw new Error(`Missing source rig marker: ${marker}`);
    return point;
  };
  if (skin.pose !== "native-A")
    throw new Error(
      "Branch anatomy observations require the declared native source pose",
    );
  const shoulder: boolean = name.startsWith("shoulder-");
  const side: "l" | "r" = name.endsWith("-r") ? "r" : "l";
  const sign: number = side === "l" ? 1 : -1;
  const root: V3 = bone(shoulder ? `upperarm_${side}` : `thigh_${side}`);
  const child: V3 = bone(shoulder ? `lowerarm_${side}` : `calf_${side}`);
  const length: number = len(sub(child, root));
  if (!(length > 0)) throw new Error("Source rig segment has zero length");
  const groin: boolean = name === "groin";
  const origin: V3 = groin ? bone("pelvis") : root;
  const axis: V3 = groin ? [0, 1, 0] : norm(sub(child, root));
  const neck: V3 = bone("neck_01");
  const halfDepth: number = 0.6 * length;
  const lateral: number = Math.abs(root[0]) + 0.6 * length;
  const low: V3 = [
    groin || sign < 0 ? -lateral : 0,
    shoulder ? root[1] - 0.6 * length : origin[1] - 0.65 * length,
    origin[2] - halfDepth,
  ];
  const high: V3 = [
    groin || sign > 0 ? lateral : 0,
    shoulder ? neck[1] : origin[1] + 0.5 * length,
    origin[2] + halfDepth,
  ];
  const definition: BranchDefinition = {
    name,
    frame: planeFrame(origin, axis, [0, 0, -1]),
    intervalMm: [-0.35 * length, 0.55 * length],
    bounds: { low, high },
    limits: [
      "Conventional inspection window: axial stations -0.35..0.55 rig segment lengths, lateral reach to the root plus 0.6 lengths, depth +/-0.6 lengths; these fractions do not define body shape.",
      "Rig markers and bounded skin extrema are geometric source observations, not clinical landmarks or validated T-pose anatomy.",
    ],
  };
  if (groin) definition.intervalMm = [-0.65 * length, 0.5 * length];
  if (shoulder) {
    const direction: V3 = norm([sign, 1, 0]);
    let best: number = -Infinity;
    for (let i: number = 0; i < skin.vertices.length; i++) {
      const point: V3 = skin.vertices[i];
      if (
        skin.part[i] !== 0 ||
        point[1] < root[1] - 0.15 * length ||
        point[1] > neck[1] ||
        sign * point[0] < 0.5 * Math.abs(root[0]) ||
        Math.abs(point[2] - root[2]) > 0.2 * length
      )
        continue;
      const score: number = dot(point, direction);
      if (score > best) {
        best = score;
        definition.corner = point;
      }
    }
    if (!definition.corner)
      definition.limits.push(
        "No body-skin vertex supports the bounded shoulder extremum; the observation is absent.",
      );
  }
  return definition;
}
