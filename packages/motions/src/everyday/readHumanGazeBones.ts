import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanTrunk } from "./HumanTrunk";

/**
 * Read actual gaze frames through one immutable body/name-demand preparation.
 *
 * @param body The unchanged canonical body owning its genuine FK producer.
 * @param posture The current raw authored posture, retaining whole-body root rotation.
 * @param mode The existing direction, cervical-rest or eye-solving name set.
 * @param joints Current ordered authored override, or the posture's ordinary joints.
 * @param resolution Exact FK workspace borrowed only for this synchronous observation.
 * @returns Fresh demanded maps/frames after every current joint receives ordinary ordered admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/name prerequisites, current posture/override/source inputs, raw limb policy, synchronous borrowing and fresh output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Each actual observation delegates HumanTrunk.prepareResolve's same authored joint/root assembly and genuine poseBones.prepare body/name producer; only fixed name membership/order is shared.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One weak body record lazily owns at most three named-demand readers; direction, zeroed-head and actual-eye consumers all use the same current raw FK owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every supplied joint, including stray and unrequested records, still receives original admission. No target, ROM clamp, goal, raw-policy change, external numeric index, fitted pose or completed world frame enters retained state.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each body/mode pays fixed name lookup/sorting once across Q observations instead of Q times; actual ordered joint admission, exact dependency checks, demanded ancestor FK and fresh output allocation remain. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable canonical body and closed fixed sets establish genuine static name equivalence. Every current root/joint value and optional operation workspace reaches the same actual reader; posture, target, source identity and time never key a result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak body ownership retains at most three bounded static demand readers and no current posture, override, dynamic workspace, output map, target or history. A body and its metadata may collect together; returned fresh frames retain no reader.
 */
export function readHumanGazeBones(body: IHumanBody, posture: IHumanPosture, mode: Mode,
  joints: IHumanPosture["joints"] = posture.joints,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  let known: Partial<Record<Mode, ReturnType<typeof HumanTrunk.prepareResolve>>> | undefined = READERS.get(body);
  if (known === undefined) {
    known = {};
    READERS.set(body, known);
  }
  let read: ReturnType<typeof HumanTrunk.prepareResolve> | undefined = known[mode];
  if (read === undefined) {
    read = HumanTrunk.prepareResolve(body, NAMES[mode]);
    known[mode] = read;
  }
  return read(posture, resolution, joints);
}

/** Existing gaze observations; each set names only the actual returned frames. */
type Mode = "direction" | "head" | "eyes";

/** Fixed immutable rig-demand metadata; no posed/query answer belongs here. */
const READERS: WeakMap<IHumanBody, Partial<Record<Mode, ReturnType<typeof HumanTrunk.prepareResolve>>>> = new WeakMap();

/** Original eye-midpoint, cervical-rest and final-eye frame demands. */
const NAMES: Readonly<Record<Mode, ReadonlySet<AutoMovieHumanoidBone>>> = {
  direction: new Set<AutoMovieHumanoidBone>(["hips", "leftEye", "rightEye"]),
  head: new Set<AutoMovieHumanoidBone>(["hips", "head"]),
  eyes: new Set<AutoMovieHumanoidBone>(["head", "leftEye", "rightEye"]),
};