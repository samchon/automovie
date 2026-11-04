import { AutoMovieHumanRigControls, type IAutoMovieHumanPose } from "@automovie/human";
import type { KickboxingMotion } from "./KickboxingMotion";
import { MotionPhase } from "./MotionPhase";

/**
 * Reusable side-parameterized jab, cross, hook, body straight and round-kick shapes.
 *
 * @evidence contracts/common.md#implementation-and-ownership All authored controls derive from the supplied base and local request. Public RigControls blends preparation, delivery and recovery; no actor id, opposing root or fixed film timestamp is read. Kicks explicitly fold, extend and refold rather than holding one knee angle.
 * @evidence contracts/common.md#authoring-interface Weight is the instance's generic clip output. Local shifts/drop use metres; clinical angles use degrees. Support and actual target fitting remain owned by the bound performers.
 */
export function sampleKickboxingAttack(base: IAutoMovieHumanPose, request: KickboxingMotion.Request, weight: number, seconds: number): KickboxingMotion.Body {
  const result: KickboxingMotion.Body = { pose: structuredClone(base), drop: 0, shift: [0, 0], pivot: 0 };
  if (weight <= 0) return result;
  const shaped: IAutoMovieHumanPose = structuredClone(base);
  const right: boolean = request.side === "right";
  const sign: number = right ? 1 : -1;
  const kick: boolean = request.technique === "lowKick" || request.technique === "bodyKick";
  shaped.pelvis = { ...shaped.pelvis, rotation: (base.pelvis?.rotation ?? 0) + (right ? 12 : -7) };
  shaped.spine = { thoracic: { ...base.spine?.thoracic, rotation: right ? 14 : -10, flexion: request.technique === "body" ? 18 : 7 }, lumbar: { ...base.spine?.lumbar, flexion: request.technique === "body" ? 9 : 3 } };
  if (!kick) {
    shaped.arms ??= { left: {}, right: {} };
    shaped.arms[request.side] = { ...base.arms?.[request.side], shoulder: { flexion: request.technique === "hook" ? 85 : 88, abduction: request.technique === "hook" ? 45 : 3, rotation: request.technique === "hook" ? 20 : 0 }, elbow: { flexion: request.technique === "hook" ? 85 : 15 }, forearm: { pronation: 65 } };
  }
  if (request.technique === "body") { result.drop = .06 * weight; result.shift[0] = -.035 * weight; }
  if (kick) {
    const preparation: number = request.peak - request.start;
    const recovery: number = request.end - request.peak;
    if (seconds >= request.start + preparation * .2 && seconds < request.end - recovery * .2) result.freeLeg = request.side;
    result.shift = [.035 * weight, sign * .08 * weight];
    result.pivot = weight;
    shaped.pelvis.rotation = sign * 12;
    const extension: number = seconds <= request.peak ? MotionPhase.ease((seconds - request.start - preparation * .35) / (preparation * .65)) : 1 - MotionPhase.ease((seconds - request.peak) / (recovery * .3));
    shaped.legs ??= { left: {}, right: {} };
    shaped.legs[request.side] = { hip: { flexion: request.technique === "bodyKick" ? 100 : 65, abduction: 25, rotation: 35 }, knee: { flexion: 100 - (request.technique === "bodyKick" ? 72 : 80) * extension }, ankle: { dorsiflexion: -15 } };
    const supporting: "left" | "right" = right ? "left" : "right";
    shaped.legs[supporting] = { ...shaped.legs[supporting], foot: { ...base.legs?.[supporting].foot, hallux: { mtpFlexion: -8 * weight }, second: { mtpFlexion: -8 * weight }, third: { mtpFlexion: -8 * weight }, fourth: { mtpFlexion: -8 * weight }, fifth: { mtpFlexion: -8 * weight } } };
  }
  result.pose = AutoMovieHumanRigControls.blend(base, shaped, weight);
  return result;
}
