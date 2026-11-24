import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { EquineSwimStroke } from "./EquineSwimStroke";
import { QuadrupedScapula } from "./QuadrupedScapula";
import type { QuadrupedWorldPose } from "./QuadrupedWorldPose";

/** The model's lateral axis, about which every sagittal swim rotation turns. */
const LATERAL: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * A floating horse's world pose at one second: the trunk carried level under a
 * placement, the neck raised by an authored angle with the head riding it, and
 * each limb at its own phase of its end's measured stroke
 * (`EquineSwimStroke`).
 *
 * Each shoulder blade stays at rest, so the fore limb's stroke turns from the
 * shoulder joint as before the blade existed. Each limb keeps its bar lengths
 * and attachments. Its upper bone takes the stroke's slope, degrees from
 * straight down toward the front; each lower bone then takes the included angle
 * the stroke gives at the joint above it, in the source's landmark convention
 * measured in the side view: the fore elbow on its dorsal side, the carpus and
 * fetlock on their palmar side; the stifle on its caudal side, the tarsus on
 * its dorsal side and the hind fetlock on its plantar side. A bar is turned
 * only about the model's lateral axis, so a limb's lateral offset and the bar's
 * own twist are unchanged.
 *
 * @param neutral The source's neutral model-space bone frames
 *   (`QuadrupedWorldPose`).
 * @param placement The trunk's carriage in the world: the neutral trunk frame
 *   placed by it.
 * @param phases Each limb's stroke phase, cycles.
 * @param neck The neck's raise above its neutral carriage about its root,
 *   degrees, positive up.
 * @returns The world pose.
 * @throws {RangeError} For a nonfinite phase or raise.
 */
export function EquineSwimPose(
  neutral: ReadonlyMap<
    AutoMovieArchetypeQuadrupedBody.Bone,
    IAutoMovieTransform
  >,
  placement: IAutoMovieTransform,
  phases: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, number>>,
  neck: number,
): QuadrupedWorldPose.IPose {
  const frames: Map<AutoMovieArchetypeQuadrupedBody.Bone, IAutoMovieTransform> =
    new Map(neutral);

  // The neck turns about its root and the head rides it.
  const raise: IAutoMovieQuaternion = Quaternion.fromAxisAngle(LATERAL, -neck);
  const root: IAutoMovieVector3 = neutral.get("neck")!.translation;
  for (const bone of ["neck", "head"] as const) {
    const frame: IAutoMovieTransform = neutral.get(bone)!;
    frames.set(bone, {
      translation: Vector3.add(
        root,
        Quaternion.rotateVector(
          raise,
          Vector3.subtract(frame.translation, root),
        ),
      ),
      rotation: Quaternion.multiply(raise, frame.rotation),
      scale: { ...frame.scale },
    });
  }

  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
    const fore: boolean = limb.endsWith("Fore");
    const angles: EquineSwimStroke.IAngles = EquineSwimStroke(
      fore ? "fore" : "hind",
      phases[limb],
    );

    // Side-view turn from each bar's direction to the next one's: the supplement of the front-side included angle.
    const fronts: readonly number[] = fore
      ? [angles.upper, 360 - angles.middle, 360 - angles.lower]
      : [360 - angles.upper, angles.middle, 360 - angles.lower];
    const chain: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
      AutoMovieArchetypeQuadrupedBody.BONES[limb];
    let polar: number = angles.swing - 90;
    let origin: IAutoMovieVector3 = neutral.get(chain[0]!)!.translation;
    for (let k: number = 0; k < chain.length; k++) {
      const frame: IAutoMovieTransform = neutral.get(chain[k]!)!;
      const direction: IAutoMovieVector3 = Quaternion.rotateVector(
        frame.rotation,
        { x: 0, y: 1, z: 0 },
      );
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        LATERAL,
        (Math.atan2(direction.y, direction.z) * 180) / Math.PI - polar,
      );
      frames.set(chain[k]!, {
        translation: origin,
        rotation: Quaternion.multiply(turn, frame.rotation),
        scale: { ...frame.scale },
      });
      if (k + 1 < chain.length) {
        const next: IAutoMovieTransform = neutral.get(chain[k + 1]!)!;
        origin = Vector3.add(
          origin,
          Quaternion.rotateVector(
            turn,
            Vector3.subtract(next.translation, frame.translation),
          ),
        );
        polar += 180 - fronts[k]!;
      }
    }
  }

  // Parent-local rotations of the posed model frames, the trunk placed in the world.
  const local: Map<AutoMovieArchetypeQuadrupedBody.Bone, IAutoMovieQuaternion> =
    new Map();
  for (const [bone, frame] of frames) {
    const parent: AutoMovieArchetypeQuadrupedBody.Bone | null = PARENTS(bone);
    if (parent !== null)
      local.set(
        bone,
        Quaternion.multiply(
          Quaternion.inverse(frames.get(parent)!.rotation),
          frame.rotation,
        ),
      );
  }
  return {
    root: AutoMovieArchetypeFrame.compose(placement, frames.get("trunk")!),
    local,
  };
}

/**
 * The shared quadruped tree's parent of a bone, as
 * `AutoMovieArchetypeQuadrupedSkeleton.of` builds it.
 */
function PARENTS(
  bone: AutoMovieArchetypeQuadrupedBody.Bone,
): AutoMovieArchetypeQuadrupedBody.Bone | null {
  if (bone === "trunk") return null;
  if (bone === "hindquarters" || bone === "neck") return "trunk";
  if (bone === "head") return "neck";
  if (bone === "tail") return "hindquarters";
  if (bone === "leftForeScapula" || bone === "rightForeScapula") return "trunk";
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
    const chain: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
      AutoMovieArchetypeQuadrupedBody.BONES[limb];
    const index: number = chain.indexOf(bone);
    if (index > 0) return chain[index - 1]!;
    if (index === 0)
      return limb === "leftFore" || limb === "rightFore"
        ? QuadrupedScapula.BONES[limb]
        : "hindquarters";
  }
  throw new RangeError(`Unknown quadruped bone ${bone}`);
}
