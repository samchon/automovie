import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  ROM_TOLERANCE,
  clampJointToSkeleton,
  decomposeJointRotation,
  decomposeJointRotationOnBasis,
  getConstraint,
  jointToQuaternion,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  skeletonJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import type { HumanArmGeometryTypes as T } from "./HumanArmGeometryTypes";
import { placeHumanArmGeometry } from "./placeHumanArmGeometry";
import { prepareHumanArmChain } from "./prepareHumanArmChain";
import { resolveHumanArmChain } from "./resolveHumanArmChain";

/**
 * An arm's joint-space coordinates and what they place: the shoulder's
 * swing-twist chart (`swingTwistRange.chart`, continuous and one to one over
 * the range, scaled so a unit is near a degree of swing), the elbow's and
 * the wrist's clinical angles; the arm's forward kinematics from its
 * shoulder in a posed frame (`HumanArmFrame`) and its probes; the shapes
 * in its way and the probes' distances to them are `HumanArmShapes`'.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the nine-coordinate clinical/chart convention, actual FK/probe purpose and separate obstruction owner; the members document rig lifetime and units.
 * @evidence contracts/development/design.md#principled-representation Fixed setup metadata and per-instant frames feed actual FK in world metres and clinical degrees; one shoulder swing-twist chart avoids a three-angle shoulder discontinuity, with chart dimensions and array sizes remaining caller premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The existing setup, conversions and placement serve arm planning, differential feedback and collision checks; shared record shapes live once in HumanArmGeometryTypes and established interfaces inherit them here.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body, pose or target is named as a special case; the existing probe fractions are coarse geometry conventions, while the parent helper still requires a nonroot rig bone and coordinate arrays require nine entries.
 */
export namespace HumanArmGeometry {
  /** Coordinates of an arm: the shoulder's chart (two) and twist, the elbow's and the wrist's clinical triples. */
  export const DIMENSIONS: number = 9;

  /** The chart's unit disc in coordinate units. */
  export const SCALE: number = 100;

  /** The probe on the elbow. */
  export const ELBOW: number = 2;

  /** The probe on the wrist. */
  export const WRIST: number = 5;

  /** The probe on the middle fingertip. */
  export const TIP: number = 7;

  /** The first of the arm's collider probes among a placed arm's probes, after its eight axis spheres. */
  export const SURFACE: number = 8;
  export interface IBase extends T.IBase {}

  /**
   * An arm's setup.
   *
   * @param body The body.
   * @param side The arm.
   * @returns The setup.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the body, arm and returned setup; the namespace and setup members define coordinate units, clinical frames and carried rig data.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves this skeleton's current declared axes over the canonical family once, then uses that same table for the shoulder's swing-twist frame and every setup FK/chart reading; constraints retain first-matching-bone/default precedence.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One axes table and one setup record pair the three actual arm bones, effective constraints, rest transforms and mobile-axis flags; the engine fromAxes constructor owns the shoulder's canonical rest-frame pairing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No authored angle, ROM limit or rest transform is approximated, and the required upper-arm domain and actual rig bones remain caller premises rather than fabricated defaults.
   * @evidence contracts/development/implementation.md#efficient-algorithms Initial preparation is O(B): three first-bone scans serve both constraint and rest lookup instead of six, plus one axes merge. First requested clamps lazily index B bones and D names; bases are admitted once per name. Separate setups still read current rig data, actual projection/composition remains, and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One resolved axes table serves the shoulder frame and every FK/chart reading, and lazy per-name clamps/bases are shared only within this unchanged setup; a later preparation reads current skeleton contents instead of using a skeleton-identity snapshot.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the setup, its optional B-bone clamp index, at most D clamp/basis entries, one lazy shoulder-frame basis and one derived axes table, borrowing body/rest/constraint/axis records; all setup state is released with the operation without a global skeleton map.
   */
  export function prepare(body: IAutoMovieMotionHumanBody, side: "left" | "right"): IAutoMovieMotionHumanArmGeometry.ISetup {
    const bones: IAutoMovieMotionHumanArmGeometry.ISetup["bones"] = {
      upper: `${side}UpperArm`,
      lower: `${side}LowerArm`,
      hand: `${side}Hand`,
    };
    const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
      skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES);
    const lowerBone: IAutoMovieBone = find(body, bones.lower);
    const lower: IAutoMovieJointConstraint | null = getConstraint(
      bones.lower,
      lowerBone.constraint ?? null,
    );
    const handBone: IAutoMovieBone = find(body, bones.hand);
    const hand: IAutoMovieJointConstraint | null = getConstraint(
      bones.hand,
      handBone.constraint ?? null,
    );
    const has: (
      c: IAutoMovieJointConstraint | null,
      key: "flexion" | "abduction" | "twist",
    ) => boolean = (
      c: IAutoMovieJointConstraint | null,
      key: "flexion" | "abduction" | "twist",
    ): boolean => c === null || c[key] !== null;
    const bases: Map<AutoMovieHumanoidBone, IAutoMovieJointAxes> = new Map();
    const upperBone: IAutoMovieBone = find(body, bones.upper);
    return {
      body,
      bones,
      constraint: {
        upper: getConstraint(bones.upper, upperBone.constraint ?? null)!,
        lower,
        hand,
      },
      joint: swingTwistRange.prepare(
        swingTwistRange.fromAxes(bones.upper, axes[bones.upper])!,
      ),
      axes,
      rest: {
        upper: upperBone.rest,
        lower: lowerBone.rest,
        hand: handBone.rest,
      },
      free: [
        true,
        true,
        true,
        has(lower, "flexion"),
        has(lower, "abduction"),
        has(lower, "twist"),
        has(hand, "flexion"),
        has(hand, "abduction"),
        has(hand, "twist"),
      ],
      clamp: clampJointToSkeleton.prepare(body.skeleton, axes),
      basis: (
        bone: AutoMovieHumanoidBone,
        path: string,
      ): IAutoMovieJointAxes => {
        let basis: IAutoMovieJointAxes | undefined = bases.get(bone);
        if (basis === undefined) {
          const source: IAutoMovieJointAxes | undefined = axes[bone];
          basis = normalizeJointAxes(
            source === undefined ? DEFAULT_JOINT_AXES : source,
            path,
          );
          bases.set(bone, basis);
        }
        return basis;
      },
    };
  }

  /**
   * A bone's parent.
   *
   * @param body The body.
   * @param bone The bone.
   * @returns Its parent bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the requested bone and returned parent; the namespace documents the nonroot-bone premise.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the first matching actual skeleton bone's declared parent, the same parent link used by FK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared bone lookup and one parent read keep the hierarchy with its rig owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The existing cast assumes an actual nonroot arm bone; missing or null-parent input is outside that caller premise and is not repaired or newly admitted here.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(B) first-match scan over B skeleton bones, with constant output space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the local first-bone lookup owner and returns the actual parent name; no hierarchy snapshot is retained across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state and returns one borrowed semantic bone name.
   */
  export function parent(
    body: IAutoMovieMotionHumanBody,
    bone: AutoMovieHumanoidBone,
  ): AutoMovieHumanoidBone {
    return find(body, bone).parent as AutoMovieHumanoidBone;
  }

  /**
   * A joint's articulation from its clinical triple, clamped to the
   * skeleton's range (`clampJointToSkeleton`), using the same clinical
   * articulation as the displayed posture, so the arm planned is the arm shown.
   *
   * @param setup The arm.
   * @param bone The joint's bone.
   * @param of Its flexion, abduction and twist, degrees.
   * @returns The rotation from the bone's rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States clinical degree inputs, rig-ROM projection and the returned rest-relative articulation used by displayed FK.
   * @evidence contracts/development/implementation.md#principled-implementation First runs the setup's actual skeleton clamp, then admits its clinical basis at the original jointToQuaternion path and composes through jointToQuaternionOnBasis with the canonical rest frame, retaining final quaternion normalization.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared clamped triple, lazy basis reader and engine composition separate rig metadata from each requested numerical rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No articulation is replayed or approximated; basis admission remains after the clamp and before angle/frame composition, and failed admission is not stored.
   * @evidence contracts/development/implementation.md#efficient-algorithms After operation metadata is prepared, one actual clamp and fixed-size quaternion composition per call; each requested basis is admitted once rather than rechecking its unchanged components per candidate.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only setup-scoped constraint/frame/basis preparation under the unchanged-body premise; every incoming clinical triple still produces its own computed quaternion.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned quaternion; preparation belongs to the supplied setup, and this call retains no angle or rotation result.
   */
  export function rotation(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    bone: AutoMovieHumanoidBone,
    of: readonly [number, number, number],
  ): IAutoMovieQuaternion {
    const [flexion, abduction, twist]: [number, number, number] = clamped(
      setup,
      bone,
      of,
    );
    return Quaternion.normalize(
      jointToQuaternionOnBasis(
        { flexion, abduction, twist },
        setup.basis(bone, "jointToQuaternion axes"),
        HUMANOID_REST_FRAME[bone],
      ),
    );
  }

  /**
   * A joint's clinical triple clamped to the skeleton's range, the angles
   * forward kinematics reads (`rotation`).
   *
   * @param setup The arm.
   * @param bone The joint's bone.
   * @param of Its flexion, abduction and twist, degrees.
   * @returns The clamped triple.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the clinical degree triple, actual skeleton-ROM projection and its relationship to rotation.
   * @evidence contracts/development/implementation.md#principled-implementation Converts the triple to the existing joint record, applies the setup's actual clamp and reads the same three projected axes, preserving the existing null-to-zero lowering.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One joint adapter delegates projection to the shared engine clamp factory instead of rebuilding rig metadata in each FK candidate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the first matching rig override and canonical fallback through the existing clamp owner; no cached joint result or relaxed ROM substitutes for projection.
   * @evidence contracts/development/implementation.md#efficient-algorithms Initial setup metadata is O(B+D) across B bones and D requested names; each later call performs the existing numerical projection and constant-size record/triple conversion without a bone scan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the setup's operation-scoped clamp metadata for its unchanged skeleton while projecting every actual triple separately.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only temporary input/result records and one caller-owned triple are allocated; metadata lifetime belongs to the supplied setup and no projected answer is retained.
   */
  export function clamped(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    bone: AutoMovieHumanoidBone,
    of: readonly [number, number, number],
  ): [number, number, number] {
    const joint: IAutoMovieJointPose = setup.clamp({
      bone,
      flexion: of[0],
      abduction: of[1],
      twist: of[2],
    });
    return [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0];
  }

  /**
   * An arm's coordinates.
   *
   * @param setup The arm.
   * @param arm Its clinical triples.
   * @returns The coordinates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the arm's clinical triples and returned coordinates; the namespace defines shoulder chart scaling and elbow/wrist degree coordinates.
   * @evidence contracts/development/implementation.md#principled-implementation Projects the incoming shoulder as its actual displayed rotation, maps it through the swing-twist chart, scales its two disc coordinates by SCALE and appends separately projected elbow/wrist clinical triples.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shoulder chart plus two clamped triples assemble the existing nine-coordinate order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range source angles enter as the actually clamped arm; the existing SCALE changes coordinate units rather than fitting a desired answer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three actual joint projections and one chart lookup with fixed-size output, after one-time setup metadata and the existing region-table preparation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the setup's fixed chart frame, operation-scoped clamps/basis and existing region table; each supplied arm is encoded anew.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one caller-owned nine-entry array and retains no source arm or coordinate result; shared rig metadata remains setup-owned.
   */
  export function encode(setup: IAutoMovieMotionHumanArmGeometry.ISetup, arm: IAutoMovieMotionHumanArmClearance.IArm): number[] {
    const place: { x: number; y: number; twist: number } =
      swingTwistRange.chart(
        rotation(setup, setup.bones.upper, arm.upper),
        setup.constraint.upper,
        setup.joint,
      );
    // An arm already past a range enters as it is shown, clamped.
    return [
      place.x * SCALE,
      place.y * SCALE,
      place.twist,
      ...clamped(setup, setup.bones.lower, arm.lower),
      ...clamped(setup, setup.bones.hand, arm.hand),
    ];
  }

  /**
   * The shoulder's articulation at coordinates. The chart is one to one up
   * to the rest direction's antipode, where a direction has no azimuth, so a
   * place whose swing would reach it is drawn back along its azimuth to a
   * swing the joints' resolution (`ROM_TOLERANCE`) short of 180 degrees;
   * every rotation an arm can show lies inside, so an arm's coordinates
   * (`encode`) read back as the arm itself.
   *
   * @param setup The arm.
   * @param c The coordinates.
   * @returns The shoulder's rotation from its rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the chart's antipodal singularity, the ROM_TOLERANCE angular margin and returned shoulder articulation.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the region radius at the coordinate's azimuth, scales only a swing reaching the antipode back to 180 minus ROM_TOLERANCE degrees and applies the existing inverse swing-twist chart.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One coordinate norm, one admissible radial scale and one engine chart inversion expose the singularity handling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The existing angular resolution keeps the undefined antipode outside the chart and does not widen a ROM bound; coordinates require the existing finite nine-entry caller contract and valid shoulder domain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic and two existing region-radius/chart queries after the shared region table is prepared; no skeleton traversal or limb solve occurs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the unchanged setup shoulder constraint/frame and existing cached region table, recomputing the requested coordinate's actual rotation each call.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no coordinates or result; the caller owns the returned quaternion and the region cache remains with its existing owner.
   */
  export function shoulder(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    c: readonly number[],
  ): IAutoMovieQuaternion {
    const k: number = Math.hypot(c[0]!, c[1]!) / SCALE;
    const most: number =
      (180 - ROM_TOLERANCE) /
      swingTwistRange.radius(
        setup.constraint.upper,
        setup.joint,
        k > 0 ? (Math.atan2(c[1]!, c[0]!) * 180) / Math.PI : 0,
      );
    const scale: number = k > most ? most / k : 1;
    return swingTwistRange.placed(
      { x: (c[0]! * scale) / SCALE, y: (c[1]! * scale) / SCALE, twist: c[2]! },
      setup.constraint.upper,
      setup.joint,
    );
  }

  /**
   * An arm's clinical triples at coordinates.
   *
   * @param setup The arm.
   * @param c The coordinates.
   * @param turned The shoulder's rotation at these coordinates (`shoulder`) when the caller already holds it; computed when absent.
   * @returns The triples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinate input and returned clinical triples; the namespace documents their units and coordinate order.
   * @evidence contracts/development/implementation.md#principled-implementation Decodes the shoulder's actual chart rotation through its lazily admitted basis at the original decomposeJointRotation path, canonical rest frame and box-only ROM copy to choose an equivalent clinical reading; elbow/wrist coordinates remain their supplied degree triples.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shoulder chart inversion/decomposition and two direct triple slices preserve the established representation boundary.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Clearing swingTwist only for the decomposition's chart preference avoids a second radial projection; lower/hand coordinates are not silently clamped here, and consumers requiring display projection call rotation or clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size chart inversion, existing Euler decomposition and three output triples, with no bone scan or limb search; a swing-twist domain shares the inverse owner's box preparation instead of another spread per decode, while other domains keep their former copy path.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the setup's actual axes, canonical rest frame and shoulder constraint while decoding each coordinate vector independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns caller-owned triples and a wrapper, retaining no coordinate population. The inverse's existing weak per-constraint cache owns a swing-twist domain's box copy; other domains retain the former temporary copy, with no new persistent owner here.
   */
  export function arm(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    c: readonly number[],
    turned: IAutoMovieQuaternion = shoulder(setup, c),
  ): IAutoMovieMotionHumanArmClearance.IArm {
    const read: { flexion: number; abduction: number; twist: number } =
      decomposeJointRotationOnBasis(
        turned,
        setup.basis(setup.bones.upper, "decomposeJointRotation axes"),
        HUMANOID_REST_FRAME[setup.bones.upper],
        {
          bone: setup.bones.upper,
          constraint:
            setup.constraint.upper.swingTwist !== undefined &&
            setup.constraint.upper.swingTwist !== null
              ? setup.constraint.upper
              : { ...setup.constraint.upper, swingTwist: null },
        },
      );
    return {
      upper: [read.flexion, read.abduction, read.twist],
      lower: [c[3]!, c[4]!, c[5]!],
      hand: [c[6]!, c[7]!, c[8]!],
    };
  }

  /**
   * The actual arm chain at coordinates, without fingertip or probe observations.
   *
   * @param setup The unchanged arm rig metadata.
   * @param at The instant's shoulder-parent frame.
   * @param c The nine arm coordinates.
   * @returns Fresh world joint positions in metres and segment rotations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States actual FK, omitted observations, coordinate/frame inputs and fresh world-metre/rotation outputs.
   * @evidence contracts/development/implementation.md#principled-implementation Performs the original parent-first upper/forearm/hand compositions in the same order; an actual full-FK shoulder point for the same unchanged parent/rest frame is copied when present, otherwise the original offset calculation runs. Joint projection/chart owners and ignored rest scale are unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates the one FK body to resolveHumanArmChain with the existing pure shoulder/rotation functions; full placement attaches observations afterwards and an explicit derivative reader may share exact local work through that same body.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Recomputes every joint's actual transform for this candidate and parent frame; omits only unused fingertip/probe construction and caches no chain result or projection.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed three-joint FK, one chart inversion and two actual joint projections after setup/region preparation, without the eight axis probes or P collider transforms; full placement pays one additional fixed-size intermediate chain record.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses unchanged setup metadata and, when supplied, the exact completed full-FK shoulder point for the same parent/rest dependencies with a fresh output copy; each candidate's world rotations and remaining joint positions are recomputed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one fresh chain record and its six world vectors/quaternions; no input frame, candidate or computed chain is retained after return.
   */
  export function chain(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    c: readonly number[],
  ): Omit<IAutoMovieMotionHumanArmGeometry.IPlaced, "probes"> {
    return resolveHumanArmChain(setup, at, c, shoulder, rotation);
  }

  /**
   * Read chains during one synchronous derivative invocation, sharing only
   * completed identical local articulations under its unchanged setup/frame.
   *
   * @param setup The actual prepare-produced setup, unchanged for this derivative.
   * @param at This derivative's unchanged frame.
   * @returns A local chain reader, released when the derivative finishes or throws.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the one-derivative scope, unchanged dependencies, exact local-work reuse and caller release boundary.
   * @evidence contracts/development/implementation.md#principled-implementation A local shoulder or joint rotation depends only on its exact three coordinates, bone and fixed rig/domain; prepareHumanArmChain compares with Object.is and shares successful identical local work while recomputing the complete world prefix for every query.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One explicit prepared reader wraps the same pure shoulder/rotation owners used by cold chain; resolveHumanArmChain remains the single hierarchy implementation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every distinct local input still executes actual projection/composition, failures are not remembered and no target/user callback or final world-chain result is cached; private frozen quaternion copies cannot escape through mutable outputs.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant three-scalar equality work per local reader query, with the original numerical primitive on a miss and fixed world FK every time; at most one shoulder and two joint entries are held, without a runtime speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The reader's single unchanged setup/frame/domain scope and bone plus Object.is-equal local triples prove equivalence; keys snapshot scalars, input coordinate buffers are not retained and output world records are fresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One derivative invocation owns the reader, three latest local entries and borrowed setup/frame until completion or failure; no global collection or cross-fit, seed, instant or trajectory memo is introduced.
   */
  export function prepareChain(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
  ): (c: readonly number[]) => Omit<IAutoMovieMotionHumanArmGeometry.IPlaced, "probes"> {
    return prepareHumanArmChain(setup, at, shoulder, rotation);
  }

  /**
   * The arm placed in a frame.
   *
   * @param setup The arm.
   * @param at The frame.
   * @param c The coordinates.
   * @param surface Whether to place the collider probes too.
   * @returns The arm placed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the setup/frame/coordinate inputs, optional collider-probe placement and returned actual arm geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Parent-first quaternion/rest-offset FK places the upper arm, forearm, hand and fingertip; the shoulder uses chart inversion, lower/hand joints use actual ROM projection and clinical composition, and local surface probes follow their declared carrying segment.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain call feeds the probe attachment owner, so derivative readers share the same actual FK while full placement retains the fixed eight axis probes and optional surface map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the existing coarse axis-probe fractions and radius taper conventions unchanged, without claiming measured anatomy or an exact collider surface; surface probes retain zero radius and aligned owner indices remain a frame-producer premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms After setup metadata and region preparation, fixed three-joint FK, eight axis probes and O(P) requested surface transforms; one additional fixed-size chain record separates these phases, and disabling surface skips only its existing map.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses one unchanged setup's rig axes/clamps/bases, rest transforms and shoulder chart, but all world frames, joint projections and selected probe positions are actually computed for this candidate and instant.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the fresh placed record and eight-plus-P probe array; the temporary chain wrapper is released after attachment and its world vectors stay shared with the output, with no retained candidate or frame.
   */
  export function placed(
    setup: IAutoMovieMotionHumanArmGeometry.ISetup,
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    c: readonly number[],
    surface: boolean = true,
  ): IAutoMovieMotionHumanArmGeometry.IPlaced {
    return placeHumanArmGeometry(setup, at, chain(setup, at, c), surface);
  }
}

/** A bone of the body's skeleton. */
function find(body: IAutoMovieMotionHumanBody, bone: AutoMovieHumanoidBone): IAutoMovieBone {
  return readHumanBone(body, bone)!;
}
