import { placementChildNode } from "@automovie/engine";
import type {
  IAutoMoviePropArticulation,
  IAutoMoviePropSpec,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieBuiltPropArticulation } from "./IAutoMovieBuiltPropArticulation.js";
import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import type { IBuildPropArticulationProps } from "./IBuildPropArticulationProps.js";
import { applyTransform } from "./applyTransform.js";

/**
 * One prop joint's rest placement, restored before every frame.
 */
interface IJointRest {
  /** Joint object mutated by playback and restored before the next sample. */
  object: THREE.Object3D;

  /** Owned clone of the joint's rest-local metre translation. */
  position: THREE.Vector3;

  /** Owned clone of the rest-local orientation. */
  quaternion: THREE.Quaternion;

  /** Owned clone of its dimensionless rest-local scale. */
  scale: THREE.Vector3;
}

/**
 * Build the moving parts of a shot's props into the scene a host assembled.
 *
 * A prop's articulation is data everywhere else in the pipeline: `forgeProp`
 * gates it, `sceneToNodes` lowers it under the placement, and the performance
 * boundary bounds a clip that drives it. On screen it was nothing at all: the
 * viewer built one model object per scene node and added it to that node's
 * group, so a hinge existed in the artifact and had no object to turn. A shot
 * could therefore carry a validated, ROM-checked swing that rendered a door
 * standing still, which is the silent drop this package refuses everywhere
 * else.
 *
 * Two things make the joint real, and they are separate:
 *
 * - **The frame.** Each declared joint becomes a `THREE.Object3D` at its own
 *   local transform, parented to its declared parent joint or, for a root
 *   joint, to the placement group the host already built. Its name is
 *   {@link placementChildNode}'s, the engine's own lowering law, so the object a
 *   clip channel names is found by the same string the artifact was gated
 *   against rather than by a second spelling of the prefix.
 * - **The part.** A joint that names a `mesh` takes that part of the prop's model
 *   out of the model root and carries it, so turning the joint turns something
 *   visible. The part does not move when it changes hands: its authored
 *   transform stays MODEL-local, which is the frame `propOccupancyBounds`
 *   measures the prop's volume in and every containment, bearing and clearance
 *   judgment is made against. A leaf hung on a hinge therefore stands exactly
 *   where the record says it stands, and only what carries it changes.
 *
 * Anything that cannot resolve throws rather than being skipped, the rule
 * {@link buildScene} states for an unresolvable node: a silently unparented leaf
 * renders frozen at its model's origin while every other part of the frame
 * looks right, and nothing downstream would report it.
 *
 * A prop drawing an imported appearance has no addressable parts (see
 * {@link createImportedModelObject}), so a joint of one may name no `mesh`; its
 * frame is still built and still turns whatever it holds.
 *
 * What this does NOT do is run a prop profile's drivers. A profile's limits and
 * drivers are resolved by `resolveFrame`, which is the engine's frame solver
 * rather than the viewer's, so a handle declared to mirror its hinge is honored
 * where the shot is gated and stands still where the shot is drawn. Only the
 * channels a clip carries move here, exactly as {@link applyObjectMotions}
 * states for every other object it drives.
 *
 * @evidence contracts/common.md#principled-implementation Builds all admitted local joint frames before parenting and resolves engine-lowered joint names/named model parts, using native attach to preserve existing world placement; acyclic unique joint data and transform hierarchies compatible with Three attach (no unsupported nonuniform scale decomposition) are premises. Profile drivers are not evaluated here.
 * @evidence contracts/common.md#clear-and-simple-design Owns the joint-to-existing-part lowering and saved local rests, leaving portable joint/driver solving to engine resolveFrame and sampled object-channel writes to the host; no current production host is wired to this producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing placement/parent/part refuses instead of fabricating a mesh, and placementChildNode supplies canonical names; first prop spec per node wins and partial scene reparenting before a later refusal has no rollback, both requiring upstream admission rather than a hidden repair.
 * @evidence contracts/common.md#meaningful-documentation Explains separate joint frame/visible part, model-versus-joint transform meaning, imported-part limitation, saved-rest reset and unimplemented profile-driver projection rather than claiming complete prop playback.
 * @evidence contracts/performance.md#efficient-algorithms Maps S prop specs once, visits scene placements and J articulated joints in three linear passes with map lookups, stores J joint/rest records and restores J local TRS values; attach/world-matrix propagation adds actual scene-hierarchy work.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses already-built model parts and canonical lowered names, and captures rest TRS once for repeated restore; mutable parenting/playback makes independent lowering effectful rather than a cacheable scene-id lookup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New joint groups own no GPU buffers and borrow/reparent existing parts; returned registry/rest closures retain J groups and rest clones until host lifetime ends. There is no detach or partial-failure rollback API, and actual model geometry/material ownership remains with the model/scene host.
 */
export const buildPropArticulation: (
  props: IBuildPropArticulationProps,
) => IAutoMovieBuiltPropArticulation = (
  props: IBuildPropArticulationProps,
): IAutoMovieBuiltPropArticulation => {
  const registry: Map<string, IAutoMoviePropSpec> = new Map<
    string,
    IAutoMoviePropSpec
  >();
  for (const spec of props.props)
    if (!registry.has(spec.node)) registry.set(spec.node, spec);

  const joints: Map<string, THREE.Object3D<THREE.Object3DEventMap>> = new Map<
    string,
    THREE.Object3D
  >();
  const rests: IJointRest[] = [];
  for (const placement of props.scene.nodes) {
    const spec: IAutoMoviePropSpec | undefined = registry.get(placement.model);
    // A placement no prop registry claims is a set piece or an actor, and a
    // rigid prop declares no joints; both stand exactly as the host built them.
    if (spec === undefined || spec.articulation === null) continue;
    const articulation: IAutoMoviePropArticulation = spec.articulation;
    const group: THREE.Object3D<THREE.Object3DEventMap> | undefined =
      props.nodeObjects.get(placement.id);
    const built: IAutoMovieModelObject | undefined = props.modelObjects.get(
      placement.id,
    );
    if (group === undefined || built === undefined)
      throw new Error(
        `prop "${placement.model}" is placed at scene node "${placement.id}", which the host built no object for`,
      );

    // Every frame first, then the parenting: a joint may declare its parent
    // after itself, which `forgeProp` allows and a single pass would drop.
    const local: Map<string, THREE.Object3D<THREE.Object3DEventMap>> = new Map<
      string,
      THREE.Object3D
    >();
    for (const joint of articulation.nodes) {
      const object: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
      object.name = placementChildNode(placement.id, joint.id);
      applyTransform(object, joint.transform);
      local.set(joint.id, object);
      joints.set(object.name, object);
      rests.push({
        object,
        position: object.position.clone(),
        quaternion: object.quaternion.clone(),
        scale: object.scale.clone(),
      });
    }
    for (const joint of articulation.nodes) {
      const object: THREE.Object3D<THREE.Object3DEventMap> = local.get(
        joint.id,
      )!;
      if (joint.parent === null) {
        group.add(object);
        continue;
      }
      const parent: THREE.Object3D<THREE.Object3DEventMap> | undefined =
        local.get(joint.parent);
      if (parent === undefined)
        throw new Error(
          `prop joint "${object.name}" declares parent "${joint.parent}", which this prop does not declare`,
        );
      parent.add(object);
    }
    // World matrices before any part moves, because the move preserves them.
    group.updateMatrixWorld(true);
    for (const joint of articulation.nodes) {
      if (joint.mesh === null) continue;
      const part: THREE.Object3D<THREE.Object3DEventMap> | undefined =
        built.parts.get(joint.mesh);
      if (part === undefined)
        throw new Error(
          `prop joint "${placementChildNode(placement.id, joint.id)}" drives part "${joint.mesh}", which its built model does not carry`,
        );
      // `attach`, not `add`: a part's authored transform is MODEL-local, which
      // is the frame `propOccupancyBounds` measures its volume in and every
      // containment, bearing and clearance judgment is made against. Reparenting
      // with `add` would reinterpret that same transform as joint-local, so the
      // engine and the frame would disagree about where the leaf is by exactly
      // the hinge's own offset. `attach` keeps the part where the model put it
      // and only changes what carries it afterwards.
      local.get(joint.id)!.attach(part);
    }
  }

  return {
    joints,
    restore: (): void => {
      for (const rest of rests) {
        rest.object.position.copy(rest.position);
        rest.object.quaternion.copy(rest.quaternion);
        rest.object.scale.copy(rest.scale);
      }
    },
  };
};
