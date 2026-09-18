import { IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";
import { AutoMovieGenericGesture } from "./AutoMovieGenericGesture";

/**
 * Synthesise a **postural or whole-body gesture**, the trunk/leg half of the
 * harness `gesture` verb, into a short ROM-safe clip. `bow`/`nod`/`shake`/
 * `crouch` are single-axis trunk/head oscillations, `kick` is a right-leg front
 * snap, `stagger` lurches the trunk off balance and catches it, `wave` raises
 * the right arm and swings the forearm, `celebrate` throws both arms up in a V,
 * `draw` pulls a bow, `throw` whips an overhand throw, and `jump` is a
 * whole-body coil-and-leap carrying root translation. The arm gestures are
 * authored in clinical space (abduction 0 = down, 90 = horizontal, 180 =
 * overhead: the same value raises either arm), read up through the rig's rest
 * frame at render. `strike` (a targeted jab) needs reach content and returns
 * `null` here, left to the richer synthesiser.
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-general-procedural-control Synthesizes a declared gesture into bounded clinical-angle keyframes.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Applies the same deterministic compact-rule model to whole-body gestures.
 * @author Samchon
 */
export const gestureMotion = (
  id: string,
  skeleton: string,
  kind: string,
  duration: number,
): IAutoMovieMotion | null => {
  if (kind === "jump") {
    const keyframes: IAutoMovieKeyframe[] = JUMP_STOPS.map(
      ([fraction, rootY, legFlex]) => ({
        time: fraction * duration,
        pose: jumpPose(skeleton, rootY, legFlex),
        expression: null,
        easing: "easeInOut",
        bezier: null,
      }),
    );
    return { id, skeleton, duration, loop: false, keyframes };
  }
  if (!GENERIC.has(kind)) return null;
  const shape = SHAPES[kind as AutoMovieGenericGesture];
  const keyframes: IAutoMovieKeyframe[] = shape.map(([fraction, joints]) => {
    const pose: IAutoMoviePose = { skeleton, root: null, joints };
    return {
      time: fraction * duration,
      pose,
      expression: null,
      easing: "easeInOut",
      bezier: null,
    };
  });
  return { id, skeleton, duration, loop: false, keyframes };
};
