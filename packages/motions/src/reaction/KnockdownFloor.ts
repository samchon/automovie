import { type IAutoMovieResolvedBone, physicalShapeBounds } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { StrikingBody } from "../striking/StrikingBody";

/**
 * The existing knockdown fold and its body's floor fit. The law owns the
 * clock and heading; this owner evaluates the clinical fold, its collision
 * bounds and the unchanged knee, arm and elbow bisections.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the owned geometry and the law's separate clock and heading responsibility.
 * @evidence contracts/development/design.md#principled-representation A fitted angle record and one folded posture, measured against the body's own colliders in the original root frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law consumes fold, fit, measure and rest; joint-only gymnastics consumes the same lowest reduction with its actual posed map, without a new public barrel or motion parameter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The original provisional angles, clinical ranges, collider predicates and 16-step bisections remain unchanged.
 */
export namespace KnockdownFloor {
  /**
   * The trunk pitch and clinical joint angles at one phase sample.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field names its unit and posture role.
   * @evidence contracts/development/design.md#principled-representation The two parts of the same sampled fold share one record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The law writes both fields and measure resolves them together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing clinical-angle map rather than a second pose type.
   */
  export interface IFold {
    /** Trunk pitch, degrees. */
    pitch: number;
    /** Clinical angle triples, degrees by bone. */
    joints: AutoMovieMotionHumanJoints.Angles;
  }

  /**
   * The knee, upper arm and elbow angles fitted to this body's floor rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field identifies the angle and unit.
   * @evidence contracts/development/design.md#principled-representation Three scalar initial conditions for the original fold law.
   * @evidence contracts/development/design.md#minimal-and-owned-surface fit produces all three and fold consumes them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values come from actual collider bounds and the original clinical range brackets.
   */
  export interface IFit {
    /** Seated knee flexion, degrees. */
    knee: number;
    /** Lying upper-arm flexion, degrees. */
    arm: number;
    /** Lying elbow flexion, degrees. */
    elbow: number;
  }

  /**
   * A fold's floor height and ankle/hip offsets at root zero facing +Z.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its frame and metre unit.
   * @evidence contracts/development/design.md#principled-representation The three geometric measures used by the law's root placement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measure produces all three and the law's root writer consumes them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Measures use actual posed bones and collision bounds.
   */
  export interface IMeasure {
    /** Root height resting the lowest collider on the floor, metres. */
    floor: number;
    /** Mean ankle Z relative to the root, metres. */
    ankle: number;
    /** Hip Z relative to the root, metres. */
    hips: number;
  }

  /**
   * Evaluate the existing fold at shares of sitting and rolling back.
   *
   * @param fitted This body's fitted angles, degrees.
   * @param sit The sitting profile's share.
   * @param back The rolling-back profile's share.
   * @returns The trunk pitch and joint angles, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phase inputs and angle units.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the original seat=sit*(1-back) formula, provisional angle constants and arithmetic order for every joint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute the five angle scalars and return the original nine joint triples and pitch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No new phase, limit, clamp or physical assumption is introduced.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed number of scalar operations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The law supplies one fold to both its floor measurement and final posture writer.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function retaining no phase state.
   */
  export function fold(fitted: IFit, sit: number, back: number): IFold {
    const seat: number = sit * (1 - back);
    const hip: number = ANGLES.hip * seat + 0.9 * ANGLES.lying * back;
    const knee: number = fitted.knee * seat + ANGLES.lying * back;
    const arm: number = ANGLES.lift * (1 - back) + fitted.arm * back;
    const elbow: number = ANGLES.elbow * (1 - back) + fitted.elbow * back;
    return {
      pitch: -(ANGLES.recline * seat + 88 * back),
      joints: {
        neck: [ANGLES.neck * back, 0, 0],
        leftUpperLeg: [hip, 5, 0],
        rightUpperLeg: [hip, 5, 0],
        leftLowerLeg: [knee, 0, 0],
        rightLowerLeg: [knee, 0, 0],
        leftUpperArm: [arm, ANGLES.open, 0],
        rightUpperArm: [arm, ANGLES.open, 0],
        leftLowerArm: [elbow, 0, 0],
        rightLowerArm: [elbow, 0, 0],
      },
    };
  }

  /**
   * Measure the floor height and ankle/hip offsets of one evaluated fold.
   *
   * @param body The body.
   * @param folded The already sampled fold.
   * @param resolution Optional exact FK source borrowed from the synchronous caller; never retained in the measures.
   * @returns The original three measures, metres in the root frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and already evaluated input.
   * @evidence contracts/development/implementation.md#principled-implementation Resolve the folded trunk at root zero facing +Z, negate its lowest collider bound and read the original ankle mean and hip Z.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk/collider reading and three measures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same trunk admission and exact collider minimum determine the floor; every authored joint and actual bound remains evaluated under its original owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms Final FK observes collider ancestry plus the hips/two feet actually read here; all authored joint admission and original linear segment/shape bounds remain. Nested reduction avoids flattened wrappers, without dropping a bound or sample; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Consumes the same folded record the law writes instead of recomputing its phase. The canonical collider owner supplies actual profile bones and the three direct observations are explicitly added; an optional synchronous source shares only exact FK dependencies.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary demanded names, fold geometry and local reader release on return/throw. An optional borrowed workspace stays with its synchronous caller, and only three numeric measures escape without a reader or history.
   */
  export function measure(body: IHumanBody, folded: IFold, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IMeasure {
    const requested: Set<AutoMovieHumanoidBone> = new Set(HumanColliders.bones(body));
    requested.add("hips").add("leftFoot").add("rightFoot");
    const { bones, placements }: ReturnType<typeof shapes> = shapes(body, folded, resolution, requested);
    return {
      floor: -selectedLowest(placements, ALL),
      ankle:
        (bones.get("leftFoot")!.worldPosition.z +
          bones.get("rightFoot")!.worldPosition.z) /
        2,
      hips: bones.get("hips")!.worldPosition.z,
    };
  }

  /**
   * Fit the original knee, upper-arm and elbow floor contacts by bisection.
   *
   * @param body The body.
   * @param landed The roll-back share when the seat lands.
   * @returns The fitted angles, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each fitted floor contact, its phase and angle units.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the original range brackets, endpoint tests, collider predicates, knee/arm/elbow order and sixteen bisections; a range end reached first stays at that end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One gap reader and one unchanged bracket solver serve the three angles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every trial still resolves its actual posture and collider bounds; no goal, trial or fit result is memoized.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most eighteen gap evaluations per angle remain. Three genuine fixed-demand trunk producers prepare actual profile unions/name lookup/sorting once; each real trial admits every authored joint but computes only observed collider ancestry. One exact FK reader shares unchanged dependencies and nested bounds avoid flattened wrappers; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same synchronous fit's lazy reader reaches every actual trunk trial. Genuine StrikingBody.prepareTrunk readers share its original admission owner and cover exactly every profile segment either gap predicate observes; fresh placed geometry and every selected shape bound still evaluate independently, without demanding unrelated subtree FK/placements.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The lazy reader and trial geometry are released at synchronous return or throw; the result retains only three angles and no reader enters the plan.
   */
  export function fit(body: IHumanBody, landed: number): IFit {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const demand: (part: (bone: string) => boolean, support: (bone: string) => boolean) => ReadonlySet<AutoMovieHumanoidBone> = (part: (bone: string) => boolean, support: (bone: string) => boolean): ReadonlySet<AutoMovieHumanoidBone> => {
      const requested: Set<AutoMovieHumanoidBone> = new Set();
      for (const bone of HumanColliders.bones(body))
        if (part(bone) || support(bone)) requested.add(bone);
      return requested;
    };
    const knees: ReturnType<typeof StrikingBody.prepareTrunk> = StrikingBody.prepareTrunk(body, demand(SHANK, SEAT));
    const arms: ReturnType<typeof StrikingBody.prepareTrunk> = StrikingBody.prepareTrunk(body, demand(UPPER_ARM, BODY));
    const elbows: ReturnType<typeof StrikingBody.prepareTrunk> = StrikingBody.prepareTrunk(body, demand(FOREARM, BODY));
    const gap: (fitted: IFit, back: number, part: (bone: string) => boolean, support: (bone: string) => boolean, trunk: ReturnType<typeof StrikingBody.prepareTrunk>) => number = (
      fitted: IFit,
      back: number,
      part: (bone: string) => boolean,
      support: (bone: string) => boolean,
      trunk: ReturnType<typeof StrikingBody.prepareTrunk>,
    ): number => {
      const { placements }: ReturnType<typeof shapes> = shapes(body, fold(fitted, 1, back), resolution, undefined, trunk);
      return selectedLowest(placements, part) - selectedLowest(placements, support);
    };

    // Positive at above, falling toward below, as in the original fit.
    const solve: (above: number, below: number, of: (value: number) => number) => number = (
      above: number,
      below: number,
      of: (value: number) => number,
    ): number => {
      if (of(above) <= 0) return above;
      if (of(below) >= 0) return below;
      let high: number = above;
      let low: number = below;
      for (let i: number = 0; i < 16; ++i) {
        const mid: number = (high + low) / 2;
        if (of(mid) > 0) high = mid;
        else low = mid;
      }
      return (high + low) / 2;
    };
    const fitted: IFit = { knee: 0, arm: ANGLES.lift, elbow: 0 };
    fitted.knee = solve(
      0,
      AutoMovieMotionHumanRange.degrees("leftLowerLeg", "flexion", "full"),
      (knee: number): number => gap({ ...fitted, knee }, landed, SHANK, SEAT, knees),
    );
    fitted.arm = solve(
      ANGLES.lift,
      AutoMovieMotionHumanRange.limit("leftUpperArm", "extension") ?? 0,
      (arm: number): number => gap({ ...fitted, arm }, 1, UPPER_ARM, BODY, arms),
    );

    // Flexion raises the forearm, so the elbow's bracket runs from 90 to zero.
    fitted.elbow = solve(90, 0, (elbow: number): number =>
      gap({ ...fitted, elbow }, 1, FOREARM, BODY, elbows),
    );
    return fitted;
  }

  /**
   * The root height placing an actual posture's lowest collider on zero.
   *
   * @param body The body.
   * @param posture The posture, with its root Y ignored.
   * @param resolution Optional exact FK reader or supplier borrowed from this synchronous body's planning operation.
   * @returns Root height, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the exact floor rule, ignored root Y and metre unit.
   * @evidence contracts/development/implementation.md#principled-implementation The original full trunk resolution at root Y zero followed by the negated minimum physicalShapeBounds height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the trunk and reduce its collider bounds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No collider, posture solve or floor condition is removed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Full canonical trunk admission/digit work remains, with final FK restricted to observed collider bone ancestry and the same linear collider reduction. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Collider placement supplies its actual unchanged-body bone demand; lowest owns the shared exact reduction. An optional parent reader shares only unchanged FK dependencies across actual floor postures, without reusing a floor verdict.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows an optional operation reader/supplier only through return or throw; neither it nor resolved geometry is retained here.
   */
  export function rest(body: IHumanBody, posture: IHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): number {
    const bones: ReturnType<typeof StrikingBody.trunk> = StrikingBody.trunk(body, {
      ...posture,
      root: { ...posture.root, y: 0 },
    }, resolution, HumanColliders.bones(body));
    return -lowest(body, bones);
  }

  /**
   * Read the lowest exact world bound of a body's already posed colliders.
   *
   * @param body The body whose collider table is used.
   * @param bones Its canonical posed bones, with every collider bone present.
   * @returns The lowest collider bound, world metres; Infinity for no colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States canonical bone provenance, required collider coverage, world units and the empty reduction.
   * @evidence contracts/development/implementation.md#principled-implementation Reduces physicalShapeBounds.lowest over the same ordered HumanColliders placements/shapes used by the full bounds path; its engine owner preserves original minimum-Y formulas and frame composition for every actual transform and shape.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One placement reader and the shared selectedLowest reduction keep floor-bound policy here while the real COM consumer shares its same bones.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No collider, bound, contact tolerance or posture goal changes; the supplied map is geometry, not a cached floor verdict.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S+C) placement/shape traversal plus each hull's original vertex count avoids flattened wrappers/map arrays and unused bounds axes/maxima, without another canonical solve/FK or removed vertex; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Floor rest and joint-only gymnastic COM/floor preparation consume the same exact reduction. The caller establishes the current body's canonical bone map rather than relying on an identity cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains neither the body, map nor temporary collider list after return or throw.
   */
  export function lowest(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    return selectedLowest(HumanColliders.placed(body, bones), ALL);
  }

  /** The body's shapes in a fold, root zero facing +Z, borrowing only this fit's reader. */
  function shapes(
    body: IHumanBody,
    folded: IFold,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    trunk?: ReturnType<typeof StrikingBody.prepareTrunk>,
  ): {
    bones: ReturnType<typeof StrikingBody.trunk>;
    placements: HumanColliders.IPlaced[];
  } {
    const posture: IHumanPosture = {
        root: { x: 0, y: 0, z: 0 },
        yaw: 0,
        pitch: folded.pitch,
        roll: 0,
        joints: folded.joints,
        limbs: {},
    };
    const bones: ReturnType<typeof StrikingBody.trunk> = trunk === undefined
      ? StrikingBody.trunk(body, posture, resolution, requested)
      : trunk(posture, resolution);
    return { bones, placements: HumanColliders.placed(body, bones) };
  }

  /** The lowest exact collider bound whose bone matches. */
  function selectedLowest(
    placements: readonly HumanColliders.IPlaced[],
    of: (bone: string) => boolean,
  ): number {
    let low: number = Infinity;
    for (const segment of placements)
      if (of(segment.bone))
        for (const shape of segment.shapes)
          low = Math.min(low, physicalShapeBounds.lowest(segment.pose, shape));
    return low;
  }

  /** Every profile segment contributes to ordinary floor rest. */
  const ALL: (bone: string) => boolean = (): boolean => true;

  /** The seat's pelvis and thigh shapes. */
  const SEAT: (bone: string) => boolean = (bone: string): boolean =>
    bone === "hips" || bone.endsWith("UpperLeg");

  /** Shapes below the knee. */
  const SHANK: (bone: string) => boolean = (bone: string): boolean => /(LowerLeg|Foot|Toes)$/.test(bone);

  /** Upper-arm shapes. */
  const UPPER_ARM: (bone: string) => boolean = (bone: string): boolean => bone.endsWith("UpperArm");

  /** Shapes below the elbow. */
  const FOREARM: (bone: string) => boolean = (bone: string): boolean =>
    /(LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(bone);

  /** All shapes outside the arms. */
  const BODY: (bone: string) => boolean = (bone: string): boolean => !UPPER_ARM(bone) && !FOREARM(bone);

  /** The law's unchanged provisional clinical angle levels, degrees. */
  const ANGLES: Record<
    "recline" | "hip" | "lying" | "neck" | "lift" | "open" | "elbow",
    number
  > = {
    recline: AutoMovieMotionHumanRange.lean("half"),
    hip: AutoMovieMotionHumanRange.degrees("leftUpperLeg", "flexion", {
      level: "deep",
      scale: 1.1,
    }),
    lying: AutoMovieMotionHumanRange.degrees("leftLowerLeg", "flexion", "slight"),
    neck: AutoMovieMotionHumanRange.degrees("neck", "flexion", "half"),
    lift: AutoMovieMotionHumanRange.degrees("leftUpperArm", "flexion", {
      level: "slight",
      scale: 0.5,
    }),
    open: AutoMovieMotionHumanRange.degrees("leftUpperArm", "abduction", "slight"),
    elbow: AutoMovieMotionHumanRange.degrees("leftLowerArm", "flexion", {
      level: "light",
      scale: 0.8,
    }),
  };
}
