import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";

/**
 * Authored inputs and independently evaluated results of a sternal rest cycle.
 *
 * Ellis, Rankin and Hutchinson 2018 studied symmetrical belly-lying greyhound
 * rises without stepping (doi:10.3389/fbioe.2018.00162). Their study does not
 * supply other species' ROM, descent, side rolling or this control rig's angles.
 * Therefore all durations, distal carriage and phase windows are explicit
 * authoring inputs. The law promises geometric support, not measured dynamics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States metres, seconds, model axes, authoring provenance, support semantics and the excluded biological claims on the members below.
 * @evidence contracts/development/design.md#principled-representation A closed rest cycle has separate timed phases, one level floor and four named limbs; degree inputs and normalized movement windows remain runtime-admitted numbers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns only the rest producer's input, sampler and observable support result; the model, bone vocabulary and transform types remain imported from their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No animal kind, human bone, optional outcome combination or fixture constant determines the motion; unsupported exact timing, ROM and force fidelity are explicitly absent.
 */
export namespace AutoMovieArchetypeQuadrupedRestPlan {
  /**
   * A minimum-jerk movement's start and end, as shares of a transition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines normalized start/end time and minimum-jerk interpolation within that window.
   * @evidence contracts/development/design.md#principled-representation A readonly ordered pair carries normalized endpoints; the law admits finite 0 <= start < end <= 1 at runtime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the two endpoints consumed by the rest clock are exposed; seconds stay with the owning transition duration.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No preset species timing or optional endpoint is encoded; malformed numeric ordering is explicitly left to admission.
   */
  export type Window = readonly [number, number];

  /**
   * Generic-rig degree rotations, with null meaning neutral.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States degrees, rig coordinates and null-neutral interpretation.
   * @evidence contracts/development/design.md#principled-representation Aliases the shared rig pose owner's coordinates, retaining the interface's nullable neutral convention without another joint format.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only coordinates consumed by the generic rig are included; quadruped bone identities remain the map key's existing owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No humanoid bone slot, measured ROM claim, widened value type or parallel joint declaration is introduced.
   */
  export type Rotation = QuadrupedPosePlan.Rotation;

  /**
   * A complete symmetric fixed-footprint cycle from standing through rest and back.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every member states its units, model frame, timing, authored provenance or attachment ownership; foot rolling and biological limits are documented by the namespace and producer.
   * @evidence contracts/development/design.md#principled-representation Required finite durations, pitch, tail/distal carriage, normalized windows and complete carriers describe one level-floor cycle. Numeric domains and geometric feasibility are runtime-admitted rather than asserted by number types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only the clock, geometry goals and bindings the rest producer consumes; the existing bone and transform owners supply their vocabularies.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All unsourced performance quantities are required authored inputs; no species preset, optional outcome combination, fixture geometry or invented clinical ROM determines an answer.
   */
  export interface IParams {
    /** Height of the horizontal floor in model space, metres. */
    floorY: number;

    /** Positive authored standing-to-rest duration, seconds; no descent study is implied. */
    loweringSeconds: number;

    /** Nonnegative authored duration of the supported resting hold, seconds. */
    restingSeconds: number;

    /** Positive authored rest-to-standing duration, seconds. */
    risingSeconds: number;

    /** Authored rest pitch about model +X, degrees; positive raises the rear. Roll and yaw stay neutral. */
    restPitch: number;

    /** Authored resting tail direction, degrees from down toward +Z. Returning to standing restores its source direction. */
    tailDirection: number;

    /**
     * Authored world directions of the third and fourth bars when resting,
     * degrees from straight down toward +Z. A distal fourth bar must point
     * downward; left/right share carriage, while their lengths differ.
     */
    folded: Readonly<Record<"fore" | "hind", readonly [number, number]>>;

    /**
     * Authored windows during rising. The body is lifted within body; the
     * distal two bars return within fore/hind. Lowering reverses this same
     * geometric path. A window sequence is not a measured clinical trajectory.
     */
    windows: Readonly<Record<"body" | "fore" | "hind", Window>>;

    /** Explicit carrier of every non-bone part, including tack and ears. */
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;

    /** Explicit carrier of every source affordance, preserving its exact id and semantics. */
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;
  }

  /**
   * A newly evaluated physical drawing plus the goals used to make it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents posed ownership, model-space transforms, degree joints, fixed footprints, metre clearance, support boolean and authored phase.
   * @evidence contracts/development/design.md#principled-representation One archetype, its generic joint/root coordinates and achieved support goals describe the same instant. A closed phase union excludes unnamed phases; runtime checks exclude goal misses and below-floor solids beyond binary64 roundoff.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The capture consumes the animal and composition/verification consume the clock, root and support result; no renderer object, simulated force or second bone vocabulary is exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The returned model preserves the source Id/Dimension type parameters and current contact semantics. No fixture snapshot, widened contact union or unsupported no-slip/ROM/GRF claim substitutes for it.
   */
  export interface ISample<Id extends string, Dimension extends string> {
    /** New part/contact transforms; the source animal is not modified. */
    animal: AutoMovieArchetype<Id, Dimension>;

    /** Current local degree coordinates in the quadruped rig. */
    joints: ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Bone, Rotation>;

    /** Current complete-rig placement in model space, metres and unit scale. */
    root: IAutoMovieTransform;

    /** Terminal-bar cap centres, with fixed X/Z footprints and exact floor clearance. */
    feet: ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieVector3>;

    /** Minimum primitive surface height minus floor height, metres. */
    floorClearance: number;

    /** Whether the trunk's surface is on the floor during the resting hold. */
    bellySupported: boolean;

    /** Authored phase at this time; endpoints belong to the following phase. */
    phase: "lowering" | "resting" | "rising" | "standing";
  }

  /**
   * A finite plan that is independent of playback rate and sample order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States seconds, exact authored support/phase events, independent time evaluation, retained plan ownership and sample refusal.
   * @evidence contracts/development/design.md#principled-representation A finite duration, four named event times and a sample-by-seconds operation represent one deterministic cycle. The producer admits time and geometry at runtime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Captures need the duration/events and model at a requested time; no frame-rate state, stepping API, process or speculative cache member is added.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All successful times run the geometry law and return the source's typed contact vocabulary; invalid times or impossible configurations cannot select a static fallback result.
   */
  export interface IClip<Id extends string, Dimension extends string> {
    /** Full cycle length in seconds. */
    readonly duration: number;

    /** Exact authored support/phase event times, seconds, for capture and composition. */
    readonly events: Readonly<{
      bellyOn: number;
      riseStart: number;
      bellyOff: number;
      standing: number;
    }>;

    /**
     * Evaluate from time alone. Time outside the finite cycle is refused;
     * unreachable, below-floor and inconsistent source rigs are refused too.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States seconds, the finite time domain, independently posed output and geometry/input refusals.
     * @evidence contracts/development/implementation.md#principled-implementation The producer evaluates one authored root clock, fixed footprint goals and exact length IK, then generic FK and primitive support checks at this time.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The retained producer plan supplies scalar source data; the operation returns one complete sample without a frame-history dependency.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No last-frame state, geometry fallback, stretched bone, missed-contact clamp or unsupported clinical/dynamic claim is permitted by this operation.
     * @evidence contracts/development/implementation.md#efficient-algorithms One O(P+B+A) sample over parts, bones and affordances with four bounded analytic limb fits.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Immutable admitted source measurements and the authored plan are shared; completed frames are recomputed because the output owns current transforms.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns each output and the clip lifetime. Sampling acquires no process, file, global cache or external handle.
     */
    sample(seconds: number): ISample<Id, Dimension>;
  }
}
