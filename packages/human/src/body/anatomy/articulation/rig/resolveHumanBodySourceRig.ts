import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "../../../structures/IAutoMovieHumanBodyShoulderPose";
import type { AutoMovieHumanBodyToeBone } from "../../../structures/rig/AutoMovieHumanBodyToeBone";
import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodySide } from "../../identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import type { IAutoMovieHumanBodySourceRigResult } from "./IAutoMovieHumanBodySourceRigResult";
import type { IAutoMovieHumanBodySourceSite } from "./IAutoMovieHumanBodySourceSite";
import type { IAutoMovieHumanBodySourceToeBase } from "./IAutoMovieHumanBodySourceToeBase";
import { applyHumanBodySourcePelvicRhythm } from "./applyHumanBodySourcePelvicRhythm";
import { assertHumanBodySourceRig } from "./assertHumanBodySourceRig";
import { projectHumanBodySourceFrame } from "./projectHumanBodySourceFrame";
import { resolveHumanBodySourceAxes } from "./resolveHumanBodySourceAxes";
import { resolveHumanBodySourceHumerothoracic } from "./resolveHumanBodySourceHumerothoracic";
import { resolveHumanBodySourceToeBase } from "./resolveHumanBodySourceToeBase";
import { resolveHumanBodySourceToeRay } from "./resolveHumanBodySourceToeRay";

/**
 * Evaluate one source graph for skin projection, bone surfaces and all tissue attachment sites; unsupported requests refuse.
 *
 * Admits the supplied source graph before resolving common-body-metre rest/posed frames. Each authored coordinate must be finite, uniquely owned and consumed by a supported source driver. A failure throws without returning partial maps or changing the caller's graph or goals; successful outputs are shared by tissue attachment and skin projection consumers.
 *
 * @evidence contracts/common.md#principled-implementation Admission precedes parent-ordered FK, then pelvic rhythm, shared sites and public projections; consumed-address checks refuse any unsupported authored anatomical, public, shoulder or toe coordinate.
 * @evidence contracts/common.md#clear-and-simple-design The graph coordinator owns dispatch and output maps while joint-specific resolvers own their coordinate conventions, preserving one source authority for skin and tissues.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate rows, missing source consumers and simultaneous goal authorities refuse rather than disappear; public projections are derived from actual source bones, not another solved rig.
 * @evidence contracts/common.md#meaningful-documentation The public description identifies shared graph evaluation; expanded prose documents output frame units, source-admission premise and local-output failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Graph admission, per-node goal/profile searches and per-projection site searches dominate time; output maps scale with bones, sites and projections, with no quadratic geometry reconstruction hidden in this coordinator.
 * @evidence contracts/performance.md#reuse-equivalent-work A per-call toe-base map reuses one aggregate MTP result per side for all proximal rays and the public projection; equivalence is the same registered base, foot frame and evaluation goals.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All frame maps and address sets are evaluation-local; only completed maps escape in the result, so a refusal releases partial output without mutating the caller's source graph.
 */
export function resolveHumanBodySourceRig(
  input: IAutoMovieHumanBodySourceRigInput,
): IAutoMovieHumanBodySourceRigResult {
  assertHumanBodySourceRig(input.rig);
  const authored: Set<string> = new Set<string>();
  for (const goal of input.goals) {
    const key: string = `${goal.bone}.${goal.axis}`;
    if (authored.has(key) || !Number.isFinite(goal.value))
      throw new Error(
        "Anatomical motion needs unique finite source coordinates: " + key,
      );
    authored.add(key);
  }
  const used: Set<string> = new Set<string>();
  const publicRows: Set<string> = new Set<string>();
  for (const goal of input.pose) {
    if (publicRows.has(goal.bone))
      throw new Error(
        "Anatomical graph received duplicate public pose rows: " + goal.bone,
      );
    publicRows.add(goal.bone);
  }
  const shoulderRows: Set<string> = new Set<string>();
  for (const goal of input.shoulders) {
    if (shoulderRows.has(goal.bone))
      throw new Error(
        "Anatomical graph received duplicate public shoulder rows: " +
          goal.bone,
      );
    shoulderRows.add(goal.bone);
  }
  const bones: Map<AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform> =
    new Map<AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform>();
  const sites: Map<
    AutoMovieHumanBodyBoneId,
    ReadonlyMap<string, IAutoMovieVector3>
  > = new Map<
    AutoMovieHumanBodyBoneId,
    ReadonlyMap<string, IAutoMovieVector3>
  >();
  const projections: Map<
    AutoMovieHumanoidBone,
    IAutoMovieHumanBodyBoneTransform
  > = new Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBoneTransform>();
  const toeProjections: Map<
    AutoMovieHumanBodyToeBone,
    IAutoMovieHumanBodyBoneTransform
  > = new Map<AutoMovieHumanBodyToeBone, IAutoMovieHumanBodyBoneTransform>();
  const toeBases: Map<
    AutoMovieHumanBodySide,
    IAutoMovieHumanBodyBoneTransform
  > = new Map<AutoMovieHumanBodySide, IAutoMovieHumanBodyBoneTransform>();
  const toeRows: Set<AutoMovieHumanBodyToeBone> =
    new Set<AutoMovieHumanBodyToeBone>();
  for (const goal of input.toes ?? []) {
    if (
      toeRows.has(goal.bone) ||
      !Number.isFinite(goal.flexion) ||
      (goal.abduction !== undefined && !Number.isFinite(goal.abduction))
    )
      throw new Error(
        "Anatomical graph needs unique finite toe-ray requests: " + goal.bone,
      );
    toeRows.add(goal.bone);
  }
  for (const node of input.rig.nodes) {
    const parent: IAutoMovieHumanBodyBoneTransform | undefined =
      node.parent === null ? undefined : bones.get(node.parent);
    let posed: IAutoMovieHumanBodyBoneWorldRest;
    if (node.joint.kind === "humerothoracic") {
      const thorax: IAutoMovieHumanBodyBoneTransform | undefined = bones.get(
        node.joint.thorax,
      );
      if (thorax === undefined)
        throw new Error(
          "Anatomical TT source lacks its resolved thorax: " + node.id,
        );
      posed = resolveHumanBodySourceHumerothoracic(
        node,
        parent,
        thorax,
        input,
        used,
      );
      if (
        input.shoulders.some(
          (one: IAutoMovieHumanBodyShoulderPose): boolean =>
            node.joint.kind === "humerothoracic" &&
            one.bone === node.joint.neutral.bone,
        )
      )
        for (const axis of ["plane", "elevation", "axialRotation"])
          used.add(`public-shoulder.${node.joint.neutral.bone}.${axis}`);
    } else if (node.joint.kind === "toe-ray") {
      const definition: IAutoMovieHumanBodySourceToeBase | undefined =
        input.rig.toeBases?.find(
          (one: IAutoMovieHumanBodySourceToeBase): boolean =>
            node.joint.kind === "toe-ray" && one.side === node.joint.base,
        );
      const foot: IAutoMovieHumanBodyBoneTransform | undefined =
        definition === undefined ? undefined : bones.get(definition.parent);
      if (
        definition === undefined ||
        foot === undefined ||
        parent === undefined
      )
        throw new Error(
          "Source toe ray needs its actual metatarsal and common foot frame: " +
            node.id,
        );
      let base: IAutoMovieHumanBodyBoneTransform | undefined = toeBases.get(
        definition.side,
      );
      if (base === undefined) {
        base = resolveHumanBodySourceToeBase(definition, foot, input, used);
        toeBases.set(definition.side, base);
      }
      posed = resolveHumanBodySourceToeRay(
        node,
        parent,
        base,
        foot,
        input,
        used,
      );
    } else posed = resolveHumanBodySourceAxes(node, parent, input, used);
    const result: IAutoMovieHumanBodyBoneTransform = { rest: node.rest, posed };
    bones.set(node.id, result);
  }
  for (const definition of input.rig.toeBases ?? []) {
    let base: IAutoMovieHumanBodyBoneTransform | undefined = toeBases.get(
      definition.side,
    );
    if (base === undefined) {
      const parent: IAutoMovieHumanBodyBoneTransform | undefined = bones.get(
        definition.parent,
      );
      if (parent === undefined)
        throw new Error(
          "Source aggregate toe frame lacks its actual foot: " +
            definition.side,
        );
      base = resolveHumanBodySourceToeBase(definition, parent, input, used);
      toeBases.set(definition.side, base);
    }
    projections.set(definition.goal.bone, base);
  }
  applyHumanBodySourcePelvicRhythm(input, bones);
  for (const node of input.rig.nodes) {
    const posed: IAutoMovieHumanBodyBoneWorldRest = bones.get(node.id)!.posed;
    const resolved: Map<string, IAutoMovieVector3> = new Map<
      string,
      IAutoMovieVector3
    >();
    for (const site of node.sites)
      resolved.set(
        site.id,
        Vector3.add(
          posed.position,
          Quaternion.rotateVector(posed.rotation, site.position),
        ),
      );
    sites.set(node.id, resolved);
    for (const projection of node.projections) {
      const local: IAutoMovieVector3 =
        projection.site === undefined
          ? Vector3.create(0, 0, 0)
          : node.sites.find(
              (one: IAutoMovieHumanBodySourceSite): boolean =>
                one.id === projection.site,
            )!.position;
      projections.set(projection.bone, {
        rest: projectHumanBodySourceFrame(
          node.rest,
          local,
          projection.rotation,
        ),
        posed: projectHumanBodySourceFrame(posed, local, projection.rotation),
      });
    }
    for (const projection of node.toeProjections ?? []) {
      const local: IAutoMovieVector3 =
        projection.site === undefined
          ? Vector3.create(0, 0, 0)
          : node.sites.find(
              (one: IAutoMovieHumanBodySourceSite): boolean =>
                one.id === projection.site,
            )!.position;
      toeProjections.set(projection.bone, {
        rest: projectHumanBodySourceFrame(
          node.rest,
          local,
          projection.rotation,
        ),
        posed: projectHumanBodySourceFrame(posed, local, projection.rotation),
      });
    }
  }
  for (const goal of input.goals)
    if (!used.has(`${goal.bone}.${goal.axis}`))
      throw new Error(
        "Anatomical motion has no supported source axis/driver: " +
          goal.bone +
          "." +
          goal.axis,
      );
  for (const goal of input.authoredPose ?? input.pose)
    for (const axis of ["flexion", "abduction", "twist"] as const)
      if (
        goal[axis] !== null &&
        goal[axis] !== undefined &&
        !used.has(`public-pose.${goal.bone}.${axis}`)
      )
        throw new Error(
          "Public pose has no supported anatomical source axis/driver: " +
            goal.bone +
            "." +
            axis,
        );
  for (const goal of input.shoulders)
    for (const axis of ["plane", "elevation", "axialRotation"] as const)
      if (!used.has(`public-shoulder.${goal.bone}.${axis}`))
        throw new Error(
          "Public shoulder has no supported anatomical source driver: " +
            goal.bone +
            "." +
            axis,
        );
  for (const goal of input.toes ?? []) {
    if (!toeProjections.has(goal.bone))
      throw new Error(
        "Toe-ray request lacks its same-graph skin projection: " + goal.bone,
      );
    for (const axis of ["flexion", "abduction"] as const)
      if (
        goal[axis] !== undefined &&
        !used.has(`public-toe.${goal.bone}.${axis}`)
      )
        throw new Error(
          "Toe-ray request has no supported anatomical source axis: " +
            goal.bone +
            "." +
            axis,
        );
  }
  return { bones, sites, projections, toeProjections };
}
