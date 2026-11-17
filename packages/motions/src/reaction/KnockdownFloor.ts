import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law consumes fold, fit, measure and rest; fixed-body floor/support intervals consume prepareRest, and joint-only gymnastics consumes the same lowest reduction on its actual posed map. No new motion parameter or public barrel is introduced.
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
   * @param projection Optional genuine same-body ROM projector borrowed only during this reading.
   * @returns The original three measures, metres in the root frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and already evaluated input.
   * @evidence contracts/development/implementation.md#principled-implementation Resolve the folded trunk at root zero facing +Z, negate its lowest collider bound and read the original ankle mean and hip Z.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk reading supplies the shared fused collider minimum and the original ankle/hip offsets.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same trunk admission and exact collider minimum determine the floor; every authored joint and actual bound remains evaluated under its original owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms A genuine fixed collider/hip/foot name demand prepares once per unchanged body. Final FK admits all authored joints/required ancestors; the scalar owner stages current segment Y/rotation/names/shapes in four arrays instead of unused XYZ/pose/placed records, then evaluates every original shape/vertex bound. No sample drops and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Consumes the same fold the law writes. The body owns only static collider/hip/foot demand membership, while every current fold projects normally. Optional synchronous FK/projector sources share only equal FK prerequisites and static ROM metadata; no posed measure is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One bounded static demand is weakly owned per body and releases with it, retaining no pose or workspace. Query fold/maps/scalar staging end on return/throw, optional FK/projector loans stay with their synchronous caller, and only three numeric measures escape.
   */
  export function measure(body: IAutoMovieMotionHumanBody, folded: IFold, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): IMeasure {
    const bones: ReturnType<typeof StrikingBody.trunk> = measureReader(body)(foldPosture(folded), resolution, projection);
    return {
      floor: -lowest(body, bones),
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
   * @evidence contracts/development/implementation.md#principled-implementation The original full trunk resolution at root Y zero followed by the negated minimum physicalShapeBounds height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the trunk and reduce its collider bounds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No collider, posture solve or floor condition is removed.
   * @evidence contracts/development/implementation.md#efficient-algorithms A genuine fixed collider-name demand prepares once per unchanged body. Every query keeps complete canonical trunk admission/digit work, requested collider ancestry and the same linear collider reduction; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual canonical collider demand and lowest's exact reduction retain geometry policy. Weak body ownership shares only fixed name membership, while optional parent FK/projector sources share equal prerequisites/static ROM metadata and every current joint is projected without a retained floor verdict.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One bounded genuine demand is weakly owned per body and releases with it; it retains neither raw pose nor FK/projector workspace. Optional loans, actual maps/placements and numeric floor readings end with the synchronous query and never enter history here.
   */
  export function rest(body: IAutoMovieMotionHumanBody, posture: IAutoMovieMotionHumanPosture, resolution?: Parameters<typeof prepareHumanPoseResolution>[0], projection?: ReturnType<typeof prepareHumanPostureProjection>): number {
    const bones: ReturnType<typeof StrikingBody.trunk> = restReader(body)({
      ...posture,
      root: { ...posture.root, y: 0 },
    }, resolution, projection);
    return -lowest(body, bones);
  }

  /**
   * Bind one unchanged body's floor readers for repeated current postures.
   *
   * @param body The canonical body whose rig, rest and profile stay unchanged for the owning plan or interval.
   * @returns A reader of the actual posture and optional current-call FK/ROM metadata; its root Y is ignored and the result is the original floor height in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed-body scope, changing posture/metadata inputs, root-Y-zero convention, metre output and caller-owned reader lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Runs rest's same complete trunk admission/digit path at root Y zero and negates the physical owner's exact minimum Y over every actually available collider in original profile/shape/vertex order.
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
    const read: ReturnType<typeof StrikingBody.prepareTrunk> = restReader(body);
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

  /**
   * Read the lowest exact world bound of a body's already posed colliders.
   *
   * @param body The body whose collider table is used.
   * @param bones Its canonical posed bones, with every collider bone present.
   * @returns The lowest collider bound, world metres; Infinity for no colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States canonical bone provenance, required collider coverage, world units and the empty reduction.
   * @evidence contracts/development/implementation.md#principled-implementation The genuine whole-profile minimum producer applies the same neutral offset/orientation and physicalShapeBounds minimum-Y formulas to current canonical bones in original profile/shape/vertex order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One genuine default prepareMinima reading supplies the existing scalar floor API, retaining Infinity for empty geometry independently of HumanColliders.lowest's separate refusal policy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No collider, bound, contact tolerance or posture goal changes; the supplied map is geometry, not a cached floor verdict.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S+C) staging/shape traversal plus every hull vertex omits unused placed/pose/XYZ records, bound axes/maxima and a second solve/FK. Four arrays preserve all placement-input reads before bounds; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Raw and fixed-body floor readers share the same physical minimum owner. Every supplied current bone/shape still participates normally, including duplicates, absent-frame skips and NaN; no body identity certifies a posed answer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary default binding, four staging arrays and one-number output end on return/throw; this entry retains no body, map, posed frame, bound or history.
   */
  export function lowest(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    return HumanColliders.prepareMinima(body)(bones)[0]!;
  }

  /** Genuine collider-only name demands, weakly bound to unchanged bodies without any posed state. */
  const REST_READERS: WeakMap<IAutoMovieMotionHumanBody, ReturnType<typeof StrikingBody.prepareTrunk>> = new WeakMap();

  /** Genuine collider/hip/foot name demands, independent of all fold values and operation workspaces. */
  const MEASURE_READERS: WeakMap<IAutoMovieMotionHumanBody, ReturnType<typeof StrikingBody.prepareTrunk>> = new WeakMap();

  /** Bind floor rest's fixed names once; current raw admission and optional operation loans stay with each call. */
  function restReader(body: IAutoMovieMotionHumanBody): ReturnType<typeof StrikingBody.prepareTrunk> {
    let read: ReturnType<typeof StrikingBody.prepareTrunk> | undefined = REST_READERS.get(body);
    if (read === undefined) {
      read = StrikingBody.prepareTrunk(body, HumanColliders.bones(body));
      REST_READERS.set(body, read);
    }
    return read;
  }

  /** Bind the fold's fixed observation union once; neither a sampled fold nor its measured answer is retained. */
  function measureReader(body: IAutoMovieMotionHumanBody): ReturnType<typeof StrikingBody.prepareTrunk> {
    let read: ReturnType<typeof StrikingBody.prepareTrunk> | undefined = MEASURE_READERS.get(body);
    if (read === undefined) {
      const requested: Set<AutoMovieHumanoidBone> = new Set(HumanColliders.bones(body));
      requested.add("hips").add("leftFoot").add("rightFoot");
      read = StrikingBody.prepareTrunk(body, requested);
      MEASURE_READERS.set(body, read);
    }
    return read;
  }

  /** The original folded clinical request, with its root at zero facing +Z. */
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
