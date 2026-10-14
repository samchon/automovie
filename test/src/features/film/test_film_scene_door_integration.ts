import type {
  IAutoMovieClip,
  IAutoMovieNode,
  IAutoMovieProfile,
  IAutoMovieProfileBinding,
  IAutoMoviePropArticulation,
  IAutoMoviePropSpec,
  IAutoMovieScene,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieForgedProp } from "../../../../packages/engine/src/film/IAutoMovieForgedProp";
import { forgeProp } from "../../../../packages/engine/src/film/forgeProp";
import { Matrix4 } from "../../../../packages/engine/src/math/Matrix4";
import type { IAutoMovieResolveOutput } from "../../../../packages/engine/src/resolve/IAutoMovieResolveOutput";
import type { IAutoMovieResolveViolation } from "../../../../packages/engine/src/resolve/IAutoMovieResolveViolation";
import { resolveFrame } from "../../../../packages/engine/src/resolve/resolveFrame";
import { sceneToNodes } from "../../../../packages/engine/src/resolve/sceneToNodes";
import { createDoorPropSpec } from "../internal/createDoorPropSpec";
import { createModel } from "../internal/fixtures";
import { namedFacts, nclose, vclose } from "../internal/predicates";

/**
 * Quaternion components for the authored rotation in degrees about +Y.
 *
 * Supplies the input quaternion used by the door clip; observable world basis and violations are asserted by the owning integration entry.
 * The conventional half-angle axis quaternion authors the clip, while the entry's full-angle cosine/sine supplies its independent world-basis expectations.
 * The original 90-degree legal and 150-degree excessive rotations share this input construction; profile clamping is the product's responsibility.
 * This private pure input helper runs inside the discovered CPU entry and retains no state or native resource.
 */
function yQuat(deg: number): number[] {
  const half: number = (deg * Math.PI) / 360;
  return [0, Math.sin(half), 0, Math.cos(half)];
}

/**
 * Construct the original single-key hinge clip for the supplied angle.
 *
 * Supplies the prefixed hinge rotation channel to the actual scene resolver used by the integration entry.
 * The authored channel, angle and one-second clock are input; full-angle world vectors and declared profile limits determine expected outcomes in the entry.
 * Preserves the legal and excessive angle pair and single-key linear clip without adding another interpolation policy.
 * The private clip constructor is called only by the discovered portable door integration case and creates caller-owned records without a host or cache.
 */
function swing(deg: number): IAutoMovieClip {
  return {
    id: "swing",
    name: null,
    duration: 1,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "frontDoor/hinge", path: "rotation" },
        times: [0],
        values: yQuat(deg),
        interpolation: "linear",
      },
    ],
  };
}

/**
 * Read the transformed local +X basis from a column-major world matrix.
 *
 * Exposes the resolver's first matrix column for the owning entry's numerical hinge and copy-driver assertions.
 * Column-major basis layout defines indices zero through two; the entry compares these observations with its independently calculated rotation vectors.
 * Reads legal hinge, copied mirror and clamped excessive hinge outputs, preserving each original asserted component.
 * This private synchronous observation reader serves the discovered CPU integration entry and retains no matrix or host resource.
 */
function basisX(m: number[]): [number, number, number] {
  return [m[0]!, m[1]!, m[2]!];
}

const SCENE: IAutoMovieScene = {
  id: "hall",
  name: null,
  nodes: [
    {
      id: "frontDoor",
      model: "door",
      transform: {
        translation: { x: 5, y: 0, z: 2 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      motion: null,
      pose: null,
    },
    {
      id: "knight",
      model: "hero",
      transform: {
        translation: { x: -2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      motion: null,
      pose: null,
    },
  ],
  cameras: [],
  lights: [],
};

/**
 * The #603×S3 integration made whole: a door forged by forgeProp is placed in a scene, its articulation lowers into the one scene graph, and its author-declared constraint executes with the placement composed in: the S4/#642 door oracles now hold through the scene, alongside a second occupant whose skeleton shares the graph without collision.
 *
 * Scenarios:
 *
 * 1. The forged door forges, lowers under its placement, and an in-range 90° swing
 * passes: the hinge's world position is `placement + (0,1,0)` (the placement composition is real), and its world X basis lands at `(0,0,-1)`.
 * 2. The declared copy driver mirrors the hinge in the same scene graph.
 * 3. An over-limit 150° swing clamps to exactly 110° (world X basis `(cos110°, 0,
 * −sin110°)`) with every violation tagged by the forged profile on the prefixed hinge channel.
 * 4. The second occupant's bones live in the same graph (`knight/hips` resolves):
 * no id collisions between actor and prop subtrees.
 *
 * @evidence contracts/testing.md#behavioral-verification Forges and lowers a placed door beside an actor, then resolves legal and excess rotations; world hinge position, copied orientation, prefixed profile violations and actor-bone membership show placement, articulation and the actor subtree share one executable graph.
 * @evidence contracts/testing.md#independent-expectations Identity placement rotation makes hinge translation (5,0,2)+(0,1,0)=(5,1,2), and Y rotation maps +X to (cos(angle),0,-sin(angle)). The authored component boundary corresponds to 110 degrees, checked with vclose/nclose rather than a resolver-derived snapshot; graph membership proves identity coexistence rather than rendered appearance.
 * @evidence contracts/testing.md#distinguishing-cases Pins legal 90-degree travel and 150-degree excess, copied hinge orientation, placement translation and a second rigged occupant; profile id and placement prefix must remain attached to every violation. Unplaced articulation, malformed binding and midpoint travel admission belong to the other forge and object-motion tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable entry owns four synchronous numerical integration observations over portable source and shared in-memory fixtures; it starts no renderer, native build or external consumer.
 */
export function test_film_scene_door_integration(): void {
  const base: IAutoMoviePropSpec = createDoorPropSpec();
  // A distinctive hinge translation so the placement-composition oracle is
  // provable: hinge world position must be placement + (0, 1, 0).
  const forged: IAutoMovieForgedProp = forgeProp({
    ...base,
    articulation: {
      ...base.articulation!,
      nodes: base.articulation!.nodes.map(
        (node: IAutoMovieNode): IAutoMovieNode =>
          node.id === "hinge"
            ? {
                ...node,
                transform: {
                  ...node.transform,
                  translation: { x: 0, y: 1, z: 0 },
                },
              }
            : node,
      ),
    },
  });
  TestValidator.equals("the door forges", forged.success, true);
  if (forged.success !== true) return;
  const articulation: IAutoMoviePropArticulation = forged.prop.articulation!;

  const nodes: IAutoMovieNode[] = sceneToNodes({
    scene: SCENE,
    props: { door: forged.prop },
    models: { hero: { ...createModel(), id: "hero" } },
  });
  const profiles: {
    profile: IAutoMovieProfile;
    binding: IAutoMovieProfileBinding;
    nodePrefix: string;
  }[] = [
    {
      profile: articulation.profile,
      binding: articulation.binding,
      nodePrefix: "frontDoor/",
    },
  ];

  const open: IAutoMovieResolveOutput = resolveFrame({
    nodes,
    clip: swing(90),
    limits: [],
    profiles,
    seconds: 0,
  });
  TestValidator.equals("90° swing passes in-scene", open.violations.length, 0);
  const hinge: number[] = open.world.get("frontDoor/hinge")!;
  TestValidator.predicate(
    "hinge world position composes the placement",
    vclose(Matrix4.position(hinge), { x: 5, y: 1, z: 2 }),
  );
  const openX: [number, number, number] = basisX(hinge);
  TestValidator.predicate(
    "hinge world rotated 90° through the scene",
    nclose(openX[0], 0) && nclose(openX[1], 0) && nclose(openX[2], -1),
  );
  const mirrorX: [number, number, number] = basisX(
    open.world.get("frontDoor/handleMirror")!,
  );
  TestValidator.predicate(
    "the declared driver mirrors the hinge in-scene",
    nclose(mirrorX[0], 0) && nclose(mirrorX[2], -1),
  );

  const slammed: IAutoMovieResolveOutput = resolveFrame({
    nodes,
    clip: swing(150),
    limits: [],
    profiles,
    seconds: 0,
  });
  TestValidator.equals(
    "over-swing violations tagged by the forged profile on the prefixed channel",
    namedFacts([
      ["overSwingRefused", (): boolean => slammed.violations.length > 0],
      [
        "taggedByForgedProfile",
        (): boolean =>
          slammed.violations.every(
            (violation: IAutoMovieResolveViolation): boolean =>
              violation.profile === "door-profile",
          ),
      ],
      [
        "onPrefixedHingeChannel",
        (): boolean =>
          slammed.violations.every(
            (violation: IAutoMovieResolveViolation): boolean =>
              violation.channel === "node:frontDoor/hinge:rotation",
          ),
      ],
    ]),
    {
      overSwingRefused: true,
      taggedByForgedProfile: true,
      onPrefixedHingeChannel: true,
    },
  );
  const cos110: number = Math.cos((110 * Math.PI) / 180);
  const sin110: number = Math.sin((110 * Math.PI) / 180);
  const slammedX: [number, number, number] = basisX(
    slammed.world.get("frontDoor/hinge")!,
  );
  TestValidator.predicate(
    "over-swing clamps to the 110° boundary through the scene",
    nclose(slammedX[0], cos110) &&
      nclose(slammedX[1], 0) &&
      nclose(slammedX[2], -sin110),
  );

  TestValidator.predicate(
    "the second occupant shares the graph without collision",
    open.world.has("knight/hips"),
  );
}
