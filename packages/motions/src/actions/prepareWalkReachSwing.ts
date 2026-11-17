import { Quaternion, Vector3, minimumJerk, wrapDegrees } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { walkFoot } from "./walkFoot";
import { walkLeg } from "./walkLeg";
import type { walkReach } from "./walkReach";

/** Fixed physical bounds supplied by the walking reach rule's owner. */
interface IBounds {
  /** Minimum knee flexion, degrees. */
  knee: number;
  /** Maximum thigh extension, degrees. */
  extension: number;
  /** Maximum ankle side lean, degrees. */
  side: number;
  /** Maximum hip twist, degrees. */
  twist: number;
  /** Swing share over which the ranges enter or leave. */
  fade: number;
}

/**
 * Prepare one body's swing reach bounds and heel socket for changing feet.
 *
 * @param body The fixed body and leg lengths.
 * @param side The swinging foot.
 * @param bounds The walking reach owner's fixed joint/phase bounds.
 * @returns Its original swing constraint reader over a settled pelvis and foot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/side/bounds, the varying settled frame and the optional share semantics inherited from walkReach.swing.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the original leg-length sphere, thigh-extension cone, hip-twist clamp, ankle side range, repeated ankle/clearance correction and optional boundary fade, preparing only fixed body and heel terms.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed reach/range/socket terms precede the one unchanged swing reader; walkReach owns the bounds and raw entry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains all eight possible ankle/clearance passes, exact tolerances, contact clearance and interpolation arithmetic, without fitted or sampled replacement results.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and bounded constant work per foot; repeated time queries skip body-only reach, fixed range trigonometry and socket lookup. One actual toe-angle offset serves all original clearance passes; unchanged exact foot headings share the original shank's axes/length squares across those passes, while changed exact headings use ordinary current preparation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side and the reach owner's bounds fix this reader. Each synchronous foot correction separately binds its actual toe offset and exact initial heading; every pelvis, ankle, rotation, toe angle and queried share still executes its dependent constraints, with exact heading mismatch handled by the ankle owner's raw preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action retains fixed body/bound/socket geometry, and each correction releases its actual toe-offset and fixed-heading shank reader on return or throw; no queried foot, hip, rotation or time history is retained.
 */
export function prepareWalkReachSwing(
  body: IHumanBody,
  side: "left" | "right",
  bounds: IBounds,
): (settled: walkReach.IGround, foot: walkFoot.IFoot, share?: number) => walkFoot.IEnd {
  const m: IHumanBody["measure"] = body.measure;
  const limit: number = Math.sqrt(
    m.thigh ** 2 + m.shank ** 2 +
      2 * m.thigh * m.shank * Math.cos((bounds.knee * Math.PI) / 180),
  );
  const extensionAt: number = (bounds.extension * Math.PI) / 180;
  const sideAt: number = Math.tan((bounds.side * Math.PI) / 180);
  const behind: ReturnType<typeof walkLeg.prepareBehind> = walkLeg.prepareBehind(body);
  const heel: ReturnType<typeof HumanFoot.prepareHeight> = HumanFoot.prepareHeight(body, side, "heel");
  const toeAt: ReturnType<typeof HumanFoot.prepareHeight.articulated> = HumanFoot.prepareHeight.articulated(body, side, "toe");
  return (settled: walkReach.IGround, foot: walkFoot.IFoot, share?: number): walkFoot.IEnd => {
    const h: IAutoMovieVector3 = settled.hips[side];

    // A trunk tilt counts because extension is measured in the settled pelvis.
    const frame: IAutoMovieQuaternion = settled.pelvis ??
      resolveHumanPosture.heading({ yaw: settled.yaw, pitch: 0, roll: 0 });
    let v: IAutoMovieVector3 = Vector3.subtract(foot.placement.ankle, h);
    const d: number = Vector3.length(v);
    if (d > limit) v = Vector3.scale(v, limit / d);
    const local: IAutoMovieVector3 = Quaternion.rotateVector(Quaternion.inverse(frame), v);

    // The leg's own plane includes its abduction; projecting on the same
    // reach sphere preserves the knee angle at the extension boundary.
    const down: number = Math.hypot(local.x, local.y);
    const beta: number = Math.atan2(local.x, -local.y);
    const extension: number = extensionAt + behind(Vector3.length(v));
    if (local.y < 0 && Math.atan2(-local.z, down) > extension) {
      const reach: number = Math.hypot(local.z, down);
      const y: number = -reach * Math.cos(extension);
      v = Quaternion.rotateVector(frame, {
        x: -y * Math.sin(beta), y: y * Math.cos(beta), z: -reach * Math.sin(extension),
      });
    }
    let ankle: IAutoMovieVector3 = Vector3.add(h, v);
    let rotation: IAutoMovieQuaternion = foot.placement.rotation;
    const off: number = wrapDegrees(HumanFoot.heading(rotation) - settled.yaw);
    if (Math.abs(off) > bounds.twist)
      rotation = HumanFoot.rotation(settled.yaw + Math.sign(off) * bounds.twist, HumanFoot.pitch(rotation));

    // A foot held inside the ankle's side range moves under its own hip.
    const across: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: HumanFoot.heading(rotation) },
      { x: 1, y: 0, z: 0 },
    );
    const aside: number = (ankle.x - h.x) * across.x + (ankle.z - h.z) * across.z;
    const most: number = sideAt * Math.max(0, h.y - ankle.y);
    if (Math.abs(aside) > most) {
      const shift: number = aside - Math.sign(aside) * most;
      ankle = { x: ankle.x - shift * across.x, y: ankle.y, z: ankle.z - shift * across.z };
    }

    // Toe articulation is fixed across this foot's ankle/clearance passes;
    // every pass still fits the ankle again after any clearance lift.
    const toe: ReturnType<typeof HumanFoot.prepareHeight> = toeAt(foot.toes);
    const lowest: (placement: HumanFoot.IPlacement) => number = (placement: HumanFoot.IPlacement): number =>
      Math.min(toe(placement), heel(placement));
    const clear: number = Math.max(0, lowest(foot.placement));
    const ankleRange: ReturnType<typeof walkLeg.prepareAnkleRange> = walkLeg.prepareAnkleRange(body, HumanFoot.heading(rotation));
    for (let k: number = 0; k < 8; k++) {
      rotation = ankleRange(h, ankle, rotation);
      const low: number = lowest({ ankle, rotation });
      if (low >= clear - 1e-6) break;
      ankle = { ...ankle, y: ankle.y + clear - low };
    }
    if (share === undefined) return { ankle, rotation, toes: foot.toes };

    // The caller's nonstandard stance endpoints retain the same range fade.
    const held: number = Math.min(
      minimumJerk.share(Math.min(1, Math.max(0, share) / bounds.fade)),
      minimumJerk.share(Math.min(1, Math.max(0, 1 - share) / bounds.fade)),
    );
    let joined: IAutoMovieVector3 = Vector3.lerp(foot.placement.ankle, ankle, held);
    const turned: IAutoMovieQuaternion = Quaternion.slerp(foot.placement.rotation, rotation, held);
    const low: number = lowest({ ankle: joined, rotation: turned });
    if (low < clear) joined = { ...joined, y: joined.y + clear - low };
    return { ankle: joined, rotation: turned, toes: foot.toes };
  };
}
