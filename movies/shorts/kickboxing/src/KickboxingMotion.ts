import type { IAutoMovieHumanPose } from "@automovie/human";
import { MotionPhase } from "./MotionPhase";
import { sampleKickboxingAttack } from "./sampleKickboxingAttack";
import { sampleKickboxingDefense } from "./sampleKickboxingDefense";

/**
 * One reusable technique/receiver response instance with its own generic clip clock.
 *
 * @evidence contracts/common.md#implementation-and-ownership Attack and response definitions accept a base clinical pose, side and local timing. Instances own distinct phase clips and carry no actor ids, world roots or First15 imports. The bout binds actor and target separately.
 * @evidence contracts/common.md#authoring-interface Movie-owned kickboxing tactics use public RigControls and clinical Human input. These are requested shapes and phases whose actual actor support and target fitting remain separate.
 */
export class KickboxingMotion {
  /** Distinct caller-owned action parameters. */
  public readonly request: KickboxingMotion.Request;
  /** Public generic clip for preparation through return to guard. */
  public readonly phase: MotionPhase;
  /** Independently timed receiver clip, including post-impact recoil. */
  public readonly response: MotionPhase;
  /** Construct one actor/target-independent placement of the reusable definition. */
  public constructor(request: KickboxingMotion.Request) {
    this.request = structuredClone(request);
    this.phase = new MotionPhase(request.id, request);
    const recovery: number = request.end - request.peak;
    this.response = new MotionPhase(`${request.id}:response`, request.defense === "recoil" ? { start: request.peak, peak: request.peak + Math.min(.08, recovery * .3), end: request.end } : { start: request.peak - Math.min(request.defense === "check" ? .25 : .15, (request.peak - request.start) * .8), peak: request.peak, end: request.defense === "check" ? request.end - recovery * .07 : request.peak + Math.min(.26, recovery) });
  }
  /**
   * Reuse the attack on any supported performer with its own supplied base pose.
   * @evidence contracts/common.md#implementation-and-ownership Delegates the same jab/cross/hook/body/kick definition with this instance's side, clock and caller pose.
   * @evidence contracts/common.md#authoring-interface Output contains clinical degrees, local metre shifts and free-leg intent; it does not move a target or certify contact.
   */
  public attack(base: IAutoMovieHumanPose, seconds: number): KickboxingMotion.Body { return sampleKickboxingAttack(base, this.request, this.phase.weight(seconds), seconds); }
  /**
   * Reuse the receiving response independently of the attacking actor identity.
   * @evidence contracts/common.md#implementation-and-ownership Receiver timing and anatomical side are parameters, with post-impact recoil separate from anticipatory defense.
   * @evidence contracts/common.md#authoring-interface Output is an owned clinical candidate; actor support and final displayed receiver surfaces remain authoritative.
   */
  public defend(base: IAutoMovieHumanPose, seconds: number): KickboxingMotion.Body { return sampleKickboxingDefense(base, this.request, this.response.weight(seconds)); }
}

/** Movie-owned definitions and instance inputs, independent of a particular bout schedule. */
export namespace KickboxingMotion {
  /**
   * Reusable attacking family.
   * @evidence contracts/common.md#implementation-and-ownership Definition dispatch uses these technique names while each instance supplies its own side and timing.
   * @evidence contracts/common.md#authoring-interface Names request clinical staging, not successful impacts.
   */
  export type Technique = "jab" | "cross" | "hook" | "body" | "lowKick" | "bodyKick";
  /**
   * Reusable receiving family.
   * @evidence contracts/common.md#implementation-and-ownership The response sampler consumes the chosen family on the receiver's own pose and side.
   * @evidence contracts/common.md#authoring-interface Defenses require actual target/clearance review and do not imply automatic avoidance.
   */
  export type Defense = "parry" | "cover" | "catch" | "slip" | "weave" | "check" | "elbow" | "forearm" | "recoil";
  /**
   * Parameterized placement of an attack and its receiving response.
   * @evidence contracts/common.md#implementation-and-ownership Each motion copies these typed inputs and owns separate delivery/reaction clip instances.
   * @evidence contracts/common.md#authoring-interface Side and defenseSide are anatomical; times are caller seconds. No actor identity, target root or first15 duration belongs here.
   */
  export interface Request extends MotionPhase.Timing { /** Instance id. */ id: string; /** Definition. */ technique: Technique; /** Receiver definition. */ defense: Defense; /** Attacking own side. */ side: "left" | "right"; /** Receiving own side/direction. */ defenseSide: "left" | "right"; }
  /**
   * One sampled clinical body request before support fitting.
   * @evidence contracts/common.md#implementation-and-ownership Samplers return independent pose records and local movement hints; the supported performer owns their placement.
   * @evidence contracts/common.md#authoring-interface Drop/shifts are metres, pivot is a normalized phase, and freeLeg identifies the requested unloaded limb.
   */
  export interface Body { /** Public clinical pose. */ pose: IAutoMovieHumanPose; /** Body-height request. */ drop: number; /** Own forward/left shift. */ shift: [number, number]; /** Forefoot pivot phase. */ pivot: number; /** Requested unloaded limb. */ freeLeg?: "left" | "right"; }
}
