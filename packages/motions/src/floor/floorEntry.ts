import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";

/**
 * How a law that gets the body down onto the floor (a crawl, an inchworm,
 * a lie down) starts from the base it is entered on.
 *
 * Each such law has its own way down from standing. Entered off its feet,
 * on the knees or crouched over the hands (where a crawl ends), the body is
 * already low, so the law's first floor posture is reached by a blend from
 * the posture the entry displays, the hips carried straight between the two,
 * instead of from a standing body put back at the entry's root. A base with
 * no way down planned from it (lying, seated, hanging, leaning) is refused,
 * so a composition never jumps from one base to another.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the problem, the two answers and which bases get which.
 * @evidence contracts/development/design.md#principled-representation The base axis decides the start (`HumanBase`): the laws plan from the entry state (the motion skill's laws rule), and the bases they have no route from are refused, as the transitions rule asks of an impossible change of plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The accepted bases, the gate, the standing reference, the displayed entry, the blend and its per-joint blend, read by `crawl`, `crawlDown`, `crawlFrame`, `crawlInchworm` and `lieDown`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law is named here; each passes its own name to the gate.
 */
export namespace floorEntry {
  /** The bases a floor law starts from: standing by its own way down, kneeling and crouched by a blend from the displayed entry. */
  export const BASES: readonly IAutoMovieMotionHumanBase.Kind[] = [
    "standing",
    "kneeling",
    "crouched",
  ];

  /**
   * Whether a floor law is entered standing, refusing a base it has no way
   * down from.
   *
   * @param context The action's context.
   * @param action The law's name, for the refusal.
   * @returns `true` standing, `false` kneeling or crouched.
   * @throws {HumanRefusal} `base` on `base` for any other base, naming it and the accepted ones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the two answers and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The entry's base is the one the performance passes on from the act before (`HumanBase.after`), so the gate reads what carries the body, not a guess from its pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read and one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The refusal names the base found and the accepted ones; nothing is clamped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the entry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function standing(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
    action: string,
  ): boolean {
    const kind: IAutoMovieMotionHumanBase.Kind = context.entry.base.kind;
    if (kind === "standing") return true;
    if (BASES.includes(kind)) return false;
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: kind,
      feasible: { kind: "alternatives", values: [...BASES] },
      reason: `${action} gets down onto the floor from standing, kneeling or crouched, and the body is ${kind} where it starts`,
      fix: "end the act before it on the feet or on the hands and knees; getting up from lying, sitting or hanging is not in the vocabulary yet",
    });
  }

  /**
   * Where a floor law starts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each member is and when the blend source is absent.
   * @evidence contracts/development/design.md#principled-representation The law's standing measure and, off the feet, the displayed entry it blends from; standing, there is none, so the two cases cannot be mixed up.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by the three floor laws.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture type.
   */
  export interface IStart {
    /** The standing posture the law measures from: the stance it stands in, or one over the entry when it does not stand. */
    standing: IAutoMovieMotionHumanPosture;

    /** The displayed entry the way down blends from; null when the body enters standing, since the law's own way down starts there. */
    entered: IAutoMovieMotionHumanPosture | null;
  }

  /**
   * Where a floor law starts: entered standing, the stance it stands in;
   * entered kneeling or crouched, an upright stance over the entry for its
   * geometry and the displayed entry for its way down.
   *
   * @param context The action's context.
   * @param action The law's name, for the refusal.
   * @param over What the stance off the feet stands over.
   * @param stood The stance a standing entry stands in.
   * @returns The start.
   * @throws {HumanRefusal} `base` for a base the law has no way down from (`standing`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two starts and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The gate, then the law's own stance or `reference` and `displayed`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the gate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beyond one resolution off the feet.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Off the feet, one immutable displayed-entry reading serves both the blend source and any hip-based standing reference; the standing branch retains its one original stood callback without constructing a display copy.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function start(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">,
    action: string,
    over: "hips" | "feet",
    stood: () => IAutoMovieMotionHumanPosture,
  ): IStart {
    if (standing(context, action)) return { standing: stood(), entered: null };
    const entered: IAutoMovieMotionHumanPosture = displayed(context);
    return { standing: referenceFrom(context, over, entered), entered };
  }

  /**
   * A floor law's posture with its way down taken from the entry: the law's
   * own posture once its way down is done or when it was entered standing,
   * and before that the blend from the displayed entry to the law's posture
   * at the end of its way down, which is read once.
   *
   * @param body The body.
   * @param entered The displayed entry; null when the law was entered standing.
   * @param at The law's second at the end of its way down.
   * @param weight How far down the body is at a second, in [0, 1].
   * @param posture The law's posture at a second over a base posture.
   * @returns The posture at a second over a base posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two cases, what is read once and each input.
   * @evidence contracts/development/implementation.md#principled-implementation The law's posture at the end of its way down is written by its solved joint angles (`GymnasticsFlight.frozen`), so the blend arrives on the pose the law shows from there on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch and one blend.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Off the feet, one lazy full arrival resolution and two fixed endpoint floor readings serve the transition; each interior query keeps its actual changing floor reading and joint blend. The ordinary standing/finished branch adds no preparation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The arrival is computed once from the floor law's fixed base reference. Each actual writer query forwards synchronous parent FK/ROM sources through arrival freezing and transition floor observations, sharing only exact prerequisites while changing joints/fits remain current.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one arrival and fixed transition for the plan's life; current-call FK/ROM sources end with return or throw and never enter that retained geometry.
   */
  export function down(
    body: IAutoMovieMotionHumanBody,
    entered: IAutoMovieMotionHumanPosture | null,
    at: number,
    weight: (seconds: number) => number,
    posture: IAutoMovieMotionHumanPrimitive["write"],
  ): IAutoMovieMotionHumanPrimitive["write"] {
    let arrived: IAutoMovieMotionHumanPosture | undefined;
    let transition: ReturnType<typeof between> | undefined;
    return (
      base: IAutoMovieMotionHumanPosture,
      seconds: number,
      before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      const w: number = weight(seconds);
      if (entered === null || w >= 1)
        return posture(base, seconds, before, resolution, projection);
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const project: ReturnType<typeof prepareHumanPostureProjection> =
        projection ?? prepareHumanPostureProjection(body);
      arrived ??= GymnasticsFlight.frozen(
        body,
        posture(base, at, before, read, project),
        read,
        project,
      );
      transition ??= between(body, entered, arrived);
      return transition(w, read, project);
    };
  }

  /**
   * An upright stance at the entry, the reference a floor law measures its
   * geometry from when the body is not standing: over the floor under the
   * entry's hips, or under the middle of its ankles, heading the entry's
   * way.
   *
   * @param context The action's context.
   * @param over What the stance stands over.
   * @returns The standing posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the stance is for, where it stands and its heading.
   * @evidence contracts/development/implementation.md#principled-implementation `stand.posture`, the owner of a quiet stance, placed at a floor point read off the entry's displayed bones.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One floor point and one stance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The stance is only the law's measure; it is never shown, since the law blends from the displayed entry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains the original quiet-standing construction. A reference alone reads only displayed root/heading or two entry ankles; it builds no unobserved clinical joint map. Start still creates its one required J-joint blend source.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares referenceFrom's original anchor and standing owner with start; start can lend its already constructed actual display, while this standalone call still observes the supplied entry normally.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reference(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">,
    over: "hips" | "feet",
  ): IAutoMovieMotionHumanPosture {
    return referenceFrom(context, over);
  }

  /** Reuse only this call's actual immutable entry display while preserving the original anchor and standing geometry. */
  function referenceFrom(
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">,
    over: "hips" | "feet",
    entered?: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    const at: IAutoMovieVector3 =
      over === "hips"
        ? hips(context.body, entered ?? displayedFrame(context))
        : Vector3.scale(
            Vector3.add(
              context.entry.feet.left.ankle,
              context.entry.feet.right.ankle,
            ),
            0.5,
          );
    return stand.posture(
      context.body,
      { x: at.x, y: 0, z: at.z },
      context.entry.posture.yaw,
    );
  }

  /**
   * The posture the entry displays, written by its joint angles alone: its
   * root, its heading read off the root's rotation and every joint's
   * clinical angles, so it resolves to the displayed pose itself.
   *
   * @param context The action's context.
   * @returns The posture, with no limb goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and what the result resolves to.
   * @evidence contracts/development/implementation.md#principled-implementation The displayed pose holds each joint's clinical triple and the root's frame, and `resolveHumanPosture.angles` inverts the heading the resolver composes, so nothing is re-derived from bone directions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pose with no root frame reads the entry posture's root and heading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the entry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function displayed(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
  ): IAutoMovieMotionHumanPosture {
    const pose: IAutoMoviePose = context.entry.pose;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const joint of pose.joints)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
    return { ...displayedFrame(context), joints, limbs: {} };
  }

  /** Read the original displayed root/heading without copying unrelated joints for a reference-only observation. */
  function displayedFrame(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
  ): Pick<IAutoMovieMotionHumanPosture, "root" | "yaw" | "pitch" | "roll"> {
    const pose: IAutoMoviePose = context.entry.pose;
    const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
    return pose.root === undefined || pose.root === null
      ? {
          root: posture.root,
          yaw: posture.yaw,
          pitch: posture.pitch,
          roll: posture.roll,
        }
      : {
          root: pose.root.translation,
          ...resolveHumanPosture.angles(pose.root.rotation),
        };
  }

  /**
   * A blend between two postures written by joint angles alone: every
   * joint's angles, the heading the short way round and the tips go by the
   * weight, and the hips joint travels on the straight line between its two
   * places, the root following from it. Carrying the root instead would
   * swing the hips through the air between two tilted bodies, whose roots
   * lie far from their hips. Where the blended angles would put a limb
   * deeper under the floor than the two ends have it, the body is raised by
   * the difference (`knockdown.rest`).
   *
   * @param body The body.
   * @param from The posture at weight 0, with no limb goal.
   * @param to The posture at weight 1, with no limb goal.
   * @param weight The weight in [0, 1].
   * @param resolution Optional exact FK source borrowed only during this transition query.
   * @param projection Optional genuine same-body ROM metadata from this query.
   * @returns The blended posture; `from` at 0 and `to` at 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves how, why the hips carry the root and each input.
   * @evidence contracts/development/implementation.md#principled-implementation Joint-space interpolation of two whole postures, with the root placed under the interpolated hips by the posture's own heading, the relation the resolver places the hips by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the joints, one root and one floor reading of the blend and of each end.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ends return the given postures unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints the two postures hold, plus three forward kinematics over the body's shapes for the floor reading.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blend(
    body: IAutoMovieMotionHumanBody,
    from: IAutoMovieMotionHumanPosture,
    to: IAutoMovieMotionHumanPosture,
    weight: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    return between(body, from, to)(weight, resolution, projection);
  }

  /**
   * Prepare a transition between two fixed joint-space floor postures. The
   * endpoints are immutable for this transition's lifetime; only progress
   * changes. Their hip points and floor clearances are measured lazily on
   * the first interior query and retained with this finite transition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States endpoint immutability, progress, lazy endpoint-measurement lifetime and optional nonescaping synchronous FK/ROM sources on each returned read.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same joint interpolation, shortest yaw and hip-carried root as blend, raising only the blend's floor penetration beyond the endpoints' interpolated penetration.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared joint interpolation and one lazy endpoint record feed each independent progress query.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact endpoint queries return the supplied postures; the floor clearance and its bounds are unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Endpoint clearances cost two floor readings once, first actual floor demand prepares native collider selection once and endpoint hips prepare one native fixed vector interpolation. Each interior query retains changing hip interpolation, actual floor placement/bounds and O(J) joints.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only fixed endpoint hip coefficients, yaw/joint pairs, floor clearances and unchanged-body collider selection share. Each interior call borrows or owns synchronous FK/ROM across actual endpoint/current floor readings; the intermediate posture, all current shape transforms and changing floor bounds remain recomputed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One transition owns two postures, fixed joint pairs, two floor scalars and at most one native fixed collider reader until release. Optional current-call FK/ROM loans end on return or throw; no query history, posed answer, workspace or handle is retained.
   */
  export function between(
    body: IAutoMovieMotionHumanBody,
    from: IAutoMovieMotionHumanPosture,
    to: IAutoMovieMotionHumanPosture,
  ): (
    weight: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanPosture {
    const interpolate: (weight: number) => IAutoMovieMotionHumanPosture["joints"] = jointBlend(
      from.joints,
      to.joints,
    );
    const turn: number = ((((to.yaw - from.yaw) % 360) + 540) % 360) - 180;
    let floor: ReturnType<typeof knockdown.prepareRest> | undefined;
    let fixed:
      | {
          hips: ReturnType<typeof Vector3.prepareLerp>;
          sunkFrom: number;
          sunkTo: number;
        }
      | undefined;
    return (
      weight: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      if (weight <= 0) return from;
      if (weight >= 1) return to;
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const project: ReturnType<typeof prepareHumanPostureProjection> =
        projection ?? prepareHumanPostureProjection(body);
      const sunk: (posture: IAutoMovieMotionHumanPosture) => number = (
        posture: IAutoMovieMotionHumanPosture,
      ): number => {
        floor ??= knockdown.prepareRest(body);
        return Math.max(0, floor(posture, read, project) - posture.root.y);
      };
      fixed ??= {
        hips: Vector3.prepareLerp(hips(body, from), hips(body, to)),
        sunkFrom: sunk(from),
        sunkTo: sunk(to),
      };
      const lerp = (a: number, b: number): number => a + (b - a) * weight;
      const joints: IAutoMovieMotionHumanPosture["joints"] = interpolate(weight);
      const heading: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll"> = {
        yaw: from.yaw + turn * weight,
        pitch: lerp(from.pitch, to.pitch),
        roll: lerp(from.roll, to.roll),
      };
      const carried: IAutoMovieMotionHumanPosture = {
        ...heading,
        root: Vector3.subtract(
          fixed.hips(weight),
          Quaternion.rotateVector(
            resolveHumanPosture.heading(heading),
            body.rest.get("hips")!,
          ),
        ),
        joints,
        limbs: {},
      };

      // The floor is a constraint on the way: angles blended between two
      // postures that rest on the floor can dip a limb under it, so the body
      // is raised by whatever sinks deeper than the two ends themselves do.
      const rise: number = Math.max(
        0,
        sunk(carried) - lerp(fixed.sunkFrom, fixed.sunkTo),
      );
      return rise === 0
        ? carried
        : { ...carried, root: { ...carried.root, y: carried.root.y + rise } };
    };
  }

  /**
   * Two postures' joints blended angle by angle: each joint that either holds
   * goes from its first triple to its second by the weight, a joint only
   * one holds from or to clinical zero.
   *
   * @param from The joints at weight 0.
   * @param to The joints at weight 1.
   * @param weight The weight.
   * @returns The blended joints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blend, a missing joint and each input.
   * @evidence contracts/development/implementation.md#principled-implementation Joint-space interpolation of clinical angles, the way between two postures a free movement takes (Soechting and Lacquaniti 1981).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the joints either holds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing joint reads clinical zero, as the resolver reads it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one per-joint blend of the floor laws, read by `blend`, the crawl's way down and its arms.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blended(
    from: IAutoMovieMotionHumanPosture["joints"],
    to: IAutoMovieMotionHumanPosture["joints"],
    weight: number,
  ): IAutoMovieMotionHumanPosture["joints"] {
    return jointBlend(from, to)(weight);
  }

  /**
   * Prepare the ordered union of two fixed clinical-joint maps; absent
   * joints retain their original clinical-zero endpoint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed inputs, order and missing-joint semantics.
   * @evidence contracts/development/implementation.md#principled-implementation Each output uses the original linear clinical-angle expression with the original endpoint values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare one ordered bone/pair list, then write fresh triples per query.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No endpoint shortcut, angle wrapping or zero-joint omission changes the emitted map.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(J) preparation removes per-query key-array and Set reconstruction; each query remains O(J) for its required fresh map.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed endpoint triples and their ordered union are shared; each query has independent output arrays.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains one pair per union bone and ends with the owning transition; no query results or history survive.
   */
  export function jointBlend(
    from: IAutoMovieMotionHumanPosture["joints"],
    to: IAutoMovieMotionHumanPosture["joints"],
  ): (weight: number) => IAutoMovieMotionHumanPosture["joints"] {
    const pairs: [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
      readonly [number, number, number],
    ][] = [];
    for (const bone of new Set([
      ...Object.keys(from),
      ...Object.keys(to),
    ]) as Set<AutoMovieHumanoidBone>) {
      const a: readonly [number, number, number] = from[bone] ?? [0, 0, 0];
      const b: readonly [number, number, number] = to[bone] ?? [0, 0, 0];
      pairs.push([bone, a, b]);
    }
    return (weight: number): IAutoMovieMotionHumanPosture["joints"] => {
      const joints: IAutoMovieMotionHumanPosture["joints"] = {};
      for (const [bone, a, b] of pairs)
        joints[bone] = [
          a[0] + (b[0] - a[0]) * weight,
          a[1] + (b[1] - a[1]) * weight,
          a[2] + (b[2] - a[2]) * weight,
        ];
      return joints;
    };
  }

  /** Where a posture's hips joint is: its root plus the hips' rest place turned by its heading. */
  function hips(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw" | "pitch" | "roll">,
  ): IAutoMovieVector3 {
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        resolveHumanPosture.heading(posture),
        body.rest.get("hips")!,
      ),
    );
  }
}
