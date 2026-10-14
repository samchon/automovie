import { IAutoMovieClip, IAutoMovieTrack } from "@automovie/interface";
import { applyObjectMotion, applyObjectMotions } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, nclose } from "../internal/predicates";

const node: (
  path: "translation" | "rotation" | "scale" | "weights",
  values: number[],
) => IAutoMovieTrack = (
  // The complete node-channel union preserves the scale and weights cases.
  path: "translation" | "rotation" | "scale" | "weights",
  values: number[],
): IAutoMovieTrack => ({
  channel: { kind: "node", node: "prop", path },
  times: [0, 1],
  values,
  interpolation: "linear",
});

/** A mesh carrying `count` morph targets, all resting at zero. */
const morphMesh: (count: number) => THREE.Mesh = (
  count: number,
): THREE.Mesh => {
  const mesh: THREE.Mesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial(),
  );
  mesh.morphTargetInfluences = Array.from({ length: count }, (): number => 0);
  return mesh;
};

/**
 * `applyObjectMotion` applies sampled node channels to native transform and morph state. The former missing scale path left a 1-to-2 scale clip rigid despite engine consumers observing 1.5 at its midpoint.
 *
 * The former missing weights path similarly admitted and sampled a morph track without updating the native influence array.
 *
 * Scenarios:
 *
 * 1. Translation, rotation and scale tracks all write onto the resolved object at
 *    the sampled instant (t=0.5 of a 1s clip: position (1,2,3), the 45° slerped
 *    quaternion, scale 1.5).
 * 2. An unresolved node and a non-node (pointer) channel are skipped without
 *    touching anything or throwing.
 * 3. The documented carry-over contract: a channel absent from the clip keeps the
 *    object's existing value (the helper owns no rest poses: hosts that swap
 *    clips restore staged bases themselves).
 * 4. A `weights` track writes the sampled vector, by index, onto every morphable
 *    mesh beneath the resolved object, including a nested one; the value is the
 *    interpolated midpoint, not either endpoint.
 * 5. Boundaries of that write: an object with no morphable mesh is skipped without
 *    throwing, a mesh with fewer influences than the track is filled as far as
 *    it goes (a clip authored against another model), and a mesh with more
 *    keeps its untouched tail.
 * 6. A two-clip handoff uses the earlier translation before the later track's
 *    first key and the later translation after it; a future-only clip writes
 *    nothing before it starts.
 * 7. Authority is per channel: a simultaneous scale composes with translation,
 *    while equal-start duplicate translations choose producer append order.
 * 8. Renaming the same clips leaves the selected values unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies actual single and sequence object clips to native transform/morph state, asserting all four node paths, partial-channel preservation and per-channel temporal authority. Unresolved and pointer channels must not alter the resolved prop, while nested morphable meshes receive only their available indexed influences.
 * @evidence contracts/testing.md#independent-expectations Authored endpoints give midpoint translation (1,2,3), scale 1.5, quaternion sin/cos(pi/8) and morph weights (0.5,0.25); future starts, ordered equal-start duplicates and explicit tail 0.9 define the handoff/tail oracle. These values are independent of sampler output and inspect native CPU state, not rendered motion or anatomy.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts present/absent channels, resolved/unresolved nodes, direct/nested/no morph meshes, shorter/equal/longer influence counts and earlier/later/future-only authority. Disjoint channels compose, equal starts use producer order and renamed clip IDs preserve meaning; artifact admission and interpolation family coverage belong to engine units.
 * @evidence contracts/testing.md#execution-ownership The discoverable named unit directly invokes production appliers through owned node lookup callbacks with existing Three metadata fixtures. It starts no renderer, browser, GPU or Human host, and namedFacts executes only local predicates without registering another unit.
 */
export function test_viewer_apply_object_motion(): void {
  const s: number = Math.SQRT1_2;
  const clip: IAutoMovieClip = {
    id: "c",
    name: null,
    duration: 1,
    loop: false,
    tracks: [
      node("translation", [0, 0, 0, 2, 4, 6]),
      node("rotation", [0, 0, 0, 1, 0, s, 0, s]),
      node("scale", [1, 1, 1, 2, 2, 2]),
      {
        channel: { kind: "pointer", pointer: "/x", valueType: "scalar" },
        times: [0, 1],
        values: [0, 1],
        interpolation: "linear",
      },
      {
        channel: { kind: "node", node: "ghost", path: "translation" },
        times: [0, 1],
        values: [0, 0, 0, 9, 9, 9],
        interpolation: "linear",
      },
    ],
  };

  // 1. all three TRS channels write
  const prop: THREE.Object3D = new THREE.Object3D();
  applyObjectMotion(clip, 0.5, (n: string): THREE.Object3D | undefined =>
    n === "prop" ? prop : undefined,
  );
  const halfAngle: number = Math.PI / 8; // slerp(identity, 90°@Y, 0.5) = 45° about Y
  TestValidator.equals(
    "translation, rotation, and scale all land on the object",
    namedFacts([
      ["nclosePropPosition", (): boolean => nclose(prop.position.x, 1)],
      ["nclosePropPosition2", (): boolean => nclose(prop.position.y, 2)],
      ["nclosePropPosition3", (): boolean => nclose(prop.position.z, 3)],
      [
        "nclosePropQuaternion",
        (): boolean => nclose(prop.quaternion.y, Math.sin(halfAngle)),
      ],
      [
        "nclosePropQuaternion2",
        (): boolean => nclose(prop.quaternion.w, Math.cos(halfAngle)),
      ],
      ["nclosePropScale", (): boolean => nclose(prop.scale.x, 1.5)],
      ["nclosePropScale2", (): boolean => nclose(prop.scale.y, 1.5)],
      ["nclosePropScale3", (): boolean => nclose(prop.scale.z, 1.5)],
    ]),
    {
      nclosePropPosition: true,
      nclosePropPosition2: true,
      nclosePropPosition3: true,
      nclosePropQuaternion: true,
      nclosePropQuaternion2: true,
      nclosePropScale: true,
      nclosePropScale2: true,
      nclosePropScale3: true,
    },
  );

  // 2. Unresolved nodes and pointer channels preserve the sampled prop state without throwing.
  TestValidator.predicate(
    "unresolved and non-node channels are skipped",
    nclose(prop.position.x, 1),
  );

  // 3. the carry-over contract: a scale-less clip leaves scale untouched
  const rigid: IAutoMovieClip = {
    ...clip,
    tracks: [node("translation", [0, 0, 0, 2, 4, 6])],
  };
  applyObjectMotion(rigid, 1, (n: string): THREE.Object3D | undefined =>
    n === "prop" ? prop : undefined,
  );
  TestValidator.equals(
    "a channel absent from the clip keeps the object's existing value",
    namedFacts([
      ["nclosePropPosition", (): boolean => nclose(prop.position.x, 2)],
      ["nclosePropScale", (): boolean => nclose(prop.scale.x, 1.5)],
    ]),
    { nclosePropPosition: true, nclosePropScale: true },
  );

  // 4. weights land on every morphable mesh under the object, by index
  const morphs: IAutoMovieClip = {
    ...clip,
    tracks: [node("weights", [0, 0, 1, 0.5])],
  };
  const carrier: THREE.Object3D = new THREE.Object3D();
  const direct: THREE.Mesh = morphMesh(2);
  const nested: THREE.Object3D = new THREE.Object3D();
  const buried: THREE.Mesh = morphMesh(2);
  nested.add(buried);
  carrier.add(direct);
  carrier.add(nested);
  applyObjectMotion(morphs, 0.5, (n: string): THREE.Object3D | undefined =>
    n === "prop" ? carrier : undefined,
  );
  TestValidator.equals(
    "a weights track writes the sampled vector onto every morphable mesh",
    namedFacts([
      [
        "ncloseDirectMorphTargetInfluences",
        (): boolean => nclose(direct.morphTargetInfluences![0]!, 0.5),
      ],
      [
        "ncloseDirectMorphTargetInfluences2",
        (): boolean => nclose(direct.morphTargetInfluences![1]!, 0.25),
      ],
      [
        "ncloseBuriedMorphTargetInfluences",
        (): boolean => nclose(buried.morphTargetInfluences![0]!, 0.5),
      ],
      [
        "ncloseBuriedMorphTargetInfluences2",
        (): boolean => nclose(buried.morphTargetInfluences![1]!, 0.25),
      ],
    ]),
    {
      ncloseDirectMorphTargetInfluences: true,
      ncloseDirectMorphTargetInfluences2: true,
      ncloseBuriedMorphTargetInfluences: true,
      ncloseBuriedMorphTargetInfluences2: true,
    },
  );

  // 5. Boundaries: no morphable mesh, a shorter influence array, a longer one.
  const bare: THREE.Object3D = new THREE.Object3D();
  applyObjectMotion(morphs, 0.5, (n: string): THREE.Object3D | undefined =>
    n === "prop" ? bare : undefined,
  );
  TestValidator.equals(
    "an object with no morphable mesh is skipped",
    bare.children.length,
    0,
  );
  const short: THREE.Mesh = morphMesh(1);
  const long: THREE.Mesh = morphMesh(3);
  long.morphTargetInfluences![2] = 0.9;
  const mixed: THREE.Object3D = new THREE.Object3D();
  mixed.add(short);
  mixed.add(long);
  applyObjectMotion(morphs, 0.5, (n: string): THREE.Object3D | undefined =>
    n === "prop" ? mixed : undefined,
  );
  TestValidator.equals(
    "a shorter influence array fills as far as it goes and a longer one keeps its tail",
    namedFacts([
      [
        "shortMorphTargetInfluences",
        (): boolean => short.morphTargetInfluences!.length === 1,
      ],
      [
        "ncloseShortMorphTargetInfluences",
        (): boolean => nclose(short.morphTargetInfluences![0]!, 0.5),
      ],
      [
        "ncloseLongMorphTargetInfluences",
        (): boolean => nclose(long.morphTargetInfluences![0]!, 0.5),
      ],
      [
        "ncloseLongMorphTargetInfluences2",
        (): boolean => nclose(long.morphTargetInfluences![1]!, 0.25),
      ],
      [
        "ncloseLongMorphTargetInfluences3",
        (): boolean => nclose(long.morphTargetInfluences![2]!, 0.9),
      ],
    ]),
    {
      shortMorphTargetInfluences: true,
      ncloseShortMorphTargetInfluences: true,
      ncloseLongMorphTargetInfluences: true,
      ncloseLongMorphTargetInfluences2: true,
      ncloseLongMorphTargetInfluences3: true,
    },
  );

  const handoffA: IAutoMovieClip = {
    id: "held",
    name: null,
    duration: 2,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "prop", path: "translation" },
        times: [0, 1],
        values: [0, 0, 0, 1, 0, 0],
        interpolation: "linear",
      },
    ],
  };
  const handoffB: IAutoMovieClip = {
    id: "flying",
    name: null,
    duration: 2,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "prop", path: "translation" },
        times: [1, 2],
        values: [1, 0, 0, 2, 0, 0],
        interpolation: "linear",
      },
    ],
  };
  const authoritySink: THREE.Object3D = new THREE.Object3D();
  applyObjectMotions(
    [handoffA, handoffB],
    0.5,
    (): THREE.Object3D => authoritySink,
  );
  TestValidator.predicate(
    "a future handoff does not overwrite the current authority",
    nclose(authoritySink.position.x, 0.5),
  );
  applyObjectMotions(
    [handoffA, handoffB],
    1.5,
    (): THREE.Object3D => authoritySink,
  );
  TestValidator.predicate(
    "the later handoff takes authority after its first key",
    nclose(authoritySink.position.x, 1.5),
  );
  authoritySink.position.x = -3;
  applyObjectMotions([handoffB], 0.5, (): THREE.Object3D => authoritySink);
  TestValidator.predicate(
    "a future-only channel leaves the staged value untouched",
    nclose(authoritySink.position.x, -3),
  );

  const simultaneousScale: IAutoMovieClip = {
    id: "grow",
    name: null,
    duration: 2,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "prop", path: "scale" },
        times: [0, 2],
        values: [1, 1, 1, 2, 2, 2],
        interpolation: "linear",
      },
    ],
  };
  applyObjectMotions(
    [handoffA, handoffB, simultaneousScale],
    1.5,
    (): THREE.Object3D => authoritySink,
  );
  TestValidator.equals(
    "disjoint channels compose independently",
    namedFacts([
      [
        "ncloseAuthoritySinkPosition",
        (): boolean => nclose(authoritySink.position.x, 1.5),
      ],
      [
        "ncloseAuthoritySinkScale",
        (): boolean => nclose(authoritySink.scale.x, 1.75),
      ],
    ]),
    { ncloseAuthoritySinkPosition: true, ncloseAuthoritySinkScale: true },
  );
  const tied: IAutoMovieClip = {
    ...handoffB,
    id: "replacement",
    tracks: [
      {
        ...handoffB.tracks[0]!,
        values: [10, 0, 0, 20, 0, 0],
      },
    ],
  } satisfies IAutoMovieClip;
  applyObjectMotions(
    [handoffA, handoffB, tied],
    1.5,
    (): THREE.Object3D => authoritySink,
  );
  TestValidator.predicate(
    "equal-start duplicates choose later producer order",
    nclose(authoritySink.position.x, 15),
  );

  const renamedSink: THREE.Object3D = new THREE.Object3D();
  applyObjectMotions(
    [
      { ...handoffA, id: "anything" },
      { ...handoffB, id: "unrelated-name" },
    ],
    1.5,
    (): THREE.Object3D => renamedSink,
  );
  TestValidator.predicate(
    "clip ids do not participate in authority",
    nclose(renamedSink.position.x, 1.5),
  );
}
