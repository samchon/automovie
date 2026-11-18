import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { HumanColliders } from "../posture/HumanColliders";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { StrikingBody } from "../striking/StrikingBody";

/**
 * The existing knockdown fold and its body's floor fit. The law owns the
 * clock and heading; this owner evaluates the clinical fold, its collision
 * bounds and the unchanged knee, arm and elbow bisections.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the owned geometry and the law's separate clock and heading responsibility.
 * @evidence contracts/development/design.md#principled-representation A fitted angle record and one folded posture, measured against the body's own colliders in the original root frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law consumes fold, fit, prepareMeasure and rest; fixed-body floor and support intervals consume prepareRest. No motion parameter or public barrel export is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The original provisional angles, clinical ranges, collider predicates and 16-step bisections remain unchanged.
 */
export namespace KnockdownFloor {
  /**
   * The trunk pitch and clinical joint angles at one phase sample.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field names its unit and posture role.
   * @evidence contracts/development/design.md#principled-representation The two parts of the same sampled fold share one record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The law writes both fields and the measure reader resolves them together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing clinical-angle map rather than a second pose type.
   */
  export interface IFold {
    /** Trunk pitch, degrees. */
    pitch: number;
    /** Clinical angle triples, degrees by bone. */
    joints: IAutoMovieMotionHumanJoints.Angles;
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
   * @evidence contracts/development/design.md#minimal-and-owned-surface The prepareMeasure reader produces all three and the law's root writer consumes them.
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
   * Prepare one plan's reader of a fold's floor height and ankle/hip
   * offsets, for a body that stays unchanged through the plan.
   *
   * @param body The body.
   * @returns A reader of an evaluated fold, with an optional exact FK source and same-body ROM projector borrowed from the synchronous caller and never retained; it returns the three measures, metres in the root frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed-body premise, the frame, the units and the borrowed inputs.
   * @evidence contracts/development/implementation.md#principled-implementation Each reading resolves the folded trunk at root zero facing +Z, negates its lowest collider bound and reads the ankles' mean and the hips' Z.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The collider, hip and foot demand and the collider minimum are bound once; one trunk reading per fold supplies all three measures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every fold's joints are admitted and every collider bound is evaluated; nothing read is kept between folds.
   * @evidence contracts/development/implementation.md#efficient-algorithms The name demand and the minimum's neutral entries are prepared once per plan instead of once per reading; each reading is one demanded forward kinematics and one pass over the shapes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan that owns the reader keeps its body unchanged, so the prepared demand stays valid; the optional FK source and projector share only their equal prerequisites.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns the reader and its bounded demand until it is released; each reading's maps end with it and only three numbers escape.
   */
  export function prepareMeasure(body: IAutoMovieMotionHumanBody): (
    folded: IFold,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IMeasure {
    const requested: Set<AutoMovieHumanoidBone> = new Set(HumanColliders.bones(body));
    requested.add("hips").add("leftFoot").add("rightFoot");
    const read: ReturnType<typeof StrikingBody.prepareTrunk> = StrikingBody.prepareTrunk(body, requested);
    const minimum: ReturnType<typeof HumanColliders.prepareMinima> = HumanColliders.prepareMinima(body);
    return (
      folded: IFold,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IMeasure => {
      const bones: ReturnType<typeof StrikingBody.trunk> = read(foldPosture(folded), resolution, projection);
      return {
        floor: -(minimum(bones)[0]!),
        ankle:
          (bones.get("leftFoot")!.worldPosition.z +
            bones.get("rightFoot")!.worldPosition.z) /
          2,
        hips: bones.get("hips")!.worldPosition.z,
      };
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared gap producer binds each angle's actual FK/profile demand and pure part/support membership; the unchanged bracket solver consumes its changing folds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every trial still resolves its actual posture and collider bounds; no goal, trial or fit result is memoized.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most eighteen gap evaluations per angle remain. Three genuine FK/group-minimum producers prepare actual profile unions/name sorting once. Trials admit every authored joint, stage only current selected Y/rotation/name/shape inputs and evaluate every original bound without unused placed/pose/XYZ records. Each shape supplies both ordered minima once, and exact FK shares unchanged dependencies; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One synchronous exact FK reader/projector reaches every actual trunk trial. Each name union binds its genuine trunk reader; prepareMinima copies part/support memberships and selects their neutral union. Actual posed bone names determine the original group updates after all placement inputs stage. No floor verdict, trial, bound or changed dependency is reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local reader/projector, three bounded FK/group-minimum producers, current bone maps and four-array scalar staging release on synchronous return/throw. Each temporary two-number minimum ends with its gap reading; only three fitted angles escape without a workspace, callback or history.
   */
  export function fit(body: IAutoMovieMotionHumanBody, landed: number): IFit {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(body);
    const prepare: (part: (bone: string) => boolean, support: (bone: string) => boolean) => (folded: IFold) => number = (part: (bone: string) => boolean, support: (bone: string) => boolean): (folded: IFold) => number => {
      const requested: Set<AutoMovieHumanoidBone> = new Set();
      const parts: Set<AutoMovieHumanoidBone> = new Set();
      const supports: Set<AutoMovieHumanoidBone> = new Set();
      for (const bone of HumanColliders.bones(body)) {
        if (part(bone)) parts.add(bone);
        if (support(bone)) supports.add(bone);
        if (parts.has(bone) || supports.has(bone)) requested.add(bone);
      }
      const trunk: ReturnType<typeof StrikingBody.prepareTrunk> = StrikingBody.prepareTrunk(body, requested);
      const minimum: ReturnType<typeof HumanColliders.prepareMinima> = HumanColliders.prepareMinima(body, [parts, supports]);
      return (folded: IFold): number => {
        const bounds: number[] = minimum(trunk(foldPosture(folded), resolution, projection));
        return bounds[0]! - bounds[1]!;
      };
    };
    const knees: ReturnType<typeof prepare> = prepare(SHANK, SEAT);
    const arms: ReturnType<typeof prepare> = prepare(UPPER_ARM, BODY);
    const elbows: ReturnType<typeof prepare> = prepare(FOREARM, BODY);

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
      (knee: number): number => knees(fold({ ...fitted, knee }, 1, landed)),
    );
    fitted.arm = solve(
      ANGLES.lift,
      AutoMovieMotionHumanRange.limit("leftUpperArm", "extension") ?? 0,
      (arm: number): number => arms(fold({ ...fitted, arm }, 1, 1)),
    );

    // Flexion raises the forearm, so the elbow's bracket runs from 90 to zero.
    fitted.elbow = solve(90, 0, (elbow: number): number =>
      elbows(fold({ ...fitted, elbow }, 1, 1)),
    );
    return fitted;
  }

  /**
   * The root height placing an actual posture's lowest collider on zero.
   *
   * @param body The body.
   * @param posture The posture, with its root Y ignored.
   * @param resolution Optional exact FK reader or supplier borrowed from this synchronous body's planning operation.
   * @param projection Optional genuine same-body direct ROM projector borrowed only during this floor reading.
   * @returns Root height, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the exact floor rule, ignored root Y and metre unit.
   * @evidence contracts/development/implementation.md#principled-implementation The trunk resolved at root Y zero, then the negated minimum of every collider's exact world bounds (`physicalShapeBounds`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading of the reader `prepareRest` binds, so a single floor rule has one owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No collider, posture solve or floor condition is removed.
   * @evidence contracts/development/implementation.md#efficient-algorithms One demand preparation, one demanded forward kinematics and one linear collider reduction; a caller that reads many postures of one body binds `prepareRest` once instead.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `prepareRest`; optional parent FK/projector sources share their equal prerequisites while every current joint is projected.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The one-shot reader, its maps and the borrowed loans end with the call; only the height escapes.
   */
  export function rest(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): number {
    return prepareRest(body)(posture, resolution, projection);
  }

  /**
   * Bind one unchanged body's floor readers for repeated current postures.
   *
   * @param body The canonical body whose rig, rest and profile stay unchanged for the owning plan or interval.
   * @returns A reader of the actual posture and optional current-call FK/ROM metadata; its root Y is ignored and the result is the original floor height in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed-body scope, changing posture/metadata inputs, root-Y-zero convention, metre output and caller-owned reader lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the trunk with every joint admitted at root Y zero and negates the exact minimum Y over every available collider in profile, shape and vertex order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bind the existing genuine collider-demand trunk reader and HumanColliders.prepareMinima once; each call constructs its current root-zero request, fresh bones and the same whole-profile scalar reduction as raw rest.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every current joint projection, digit solve, required FK ancestor, collider duplicate/skip, shape bound and empty minimum; no pose, floor verdict, threshold or sampled posture is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed demand/neutral metadata bind once for K collider names and S profile entries. Queries retain complete native admission/fits, demanded FK and every shape/vertex bound. Four scalar/rotation/name/shape arrays replace unused placed/pose/XYZ records while preserving the original two phases; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work HumanColliders.bones supplies exactly the canonical frames rest requests; the genuine minimum producer retains unchanged neutral entries/order and still skips every absent current frame. All current posture/FK/ROM inputs and actual bounds remain evaluated; no cached floor or pose supplies the result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan/interval owns one fixed trunk reader and O(S) neutral minimum binding until release. Query posture, borrowed FK/ROM, bone map, four staging arrays and one-number minimum end on return/throw; no dynamic workspace, result or time history enters the retained closure.
   */
  export function prepareRest(body: IAutoMovieMotionHumanBody): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => number {
    const read: ReturnType<typeof StrikingBody.prepareTrunk> = StrikingBody.prepareTrunk(body, HumanColliders.bones(body));
    const minimum: ReturnType<typeof HumanColliders.prepareMinima> = HumanColliders.prepareMinima(body);
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): number => {
      const bones: ReturnType<typeof StrikingBody.trunk> = read({
        ...posture,
        root: { ...posture.root, y: 0 },
      }, resolution, projection);
      return -(minimum(bones)[0]!);
    };
  }

  /** The folded clinical request, with its root at zero facing +Z. */
  function foldPosture(folded: IFold): IAutoMovieMotionHumanPosture {
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: folded.pitch,
      roll: 0,
      joints: folded.joints,
      limbs: {},
    };
  }

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
