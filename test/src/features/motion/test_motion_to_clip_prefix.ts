import {
  MOTION_ROOT_NODE_ID,
  Matrix4,
  motionToClip,
  resolveFrame,
  resolvePose,
  sampleMotion,
} from "@automovie/engine";
import {
  IAutoMovieMotion,
  IAutoMovieNode,
  IAutoMovieSkeleton,
  IAutoMovieTrack,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { bakeTimes } from "../internal/clipParity";
import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { namedFacts, qclose, vclose } from "../internal/predicates";

/**
 * Observe node/channel prefix identity and numeric bone-world agreement under one actor prefix. Default naming is checked through the existing selected ids and channel references, not serialized byte compatibility or a populated multi-actor scene.
 *
 * Scenarios:
 *
 * 1. Default (no prefix): node ids and channel refs are bare, the S1 contract
 *    unchanged for the selected root/bone ids and slash-free channel refs.
 * 2. Prefixed: every node id, every bone channel, and the root translation/rotation channels carry
 *    the prefix; no bare id survives.
 * 3. Parity holds under the prefix: the world of `"knightA/" + bone` over the
 *    prefixed bridge equals `resolvePose ∘ sampleMotion` on every bake time:
 *    prefixing renames the graph without moving it.
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes bare and knightA-prefixed graphs, checks selected bare names and all prefixed node/channel identities including root presence, then resolves the prefixed graph at every bake time and compares each fixture bone's position/rotation with clinical sampling/FK.
 * @evidence contracts/testing.md#independent-expectations Literal knightA/ and unchanged bone names independently determine graph addresses, with a bare-name twin exposing missing prefix propagation. FK/bridge equality is a metamorphic representation law using shared product math and existing default vclose/qclose tolerances; serialized bytes and prototype identity are not observed.
 * @evidence contracts/testing.md#distinguishing-cases Retains omitted versus explicit prefix, root and articulated bone tracks, mixed null/non-null root and every nonempty bake-time bone population. Two actors, prefix collisions and parent-prefix admission are outside this unchanged fixture.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns both bakes and all direct frame/FK observations. Local channel reading and existing fixture helpers register no cases and start no viewer, process or GPU artifact.
 */
export function test_motion_to_clip_prefix(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const motion: IAutoMovieMotion = makeMotion(
    [
      keyframe(
        0,
        makePose([joint("leftLowerArm", { flexion: 0 })], {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
      keyframe(1, makePose([joint("leftLowerArm", { flexion: 120 })])),
    ],
    1,
  );

  const channelNode: (track: IAutoMovieTrack) => string = (
    track: IAutoMovieTrack,
  ): string => (track.channel.kind === "node" ? track.channel.node : "");

  const bare: ReturnType<typeof motionToClip> = motionToClip({
    motion,
    skeleton,
  });
  TestValidator.equals(
    "default keeps the bare S1 naming",
    namedFacts([
      [
        "bareNodesNode",
        (): boolean =>
          bare.nodes.some(
            (node: IAutoMovieNode): boolean => node.id === MOTION_ROOT_NODE_ID,
          ),
      ],
      [
        "bareNodesNode2",
        (): boolean =>
          bare.nodes.some(
            (node: IAutoMovieNode): boolean => node.id === "leftLowerArm",
          ),
      ],
      [
        "bareClipTracks",
        (): boolean =>
          bare.clip.tracks.every(
            (track: IAutoMovieTrack): boolean =>
              !channelNode(track).includes("/"),
          ),
      ],
    ]),
    { bareNodesNode: true, bareNodesNode2: true, bareClipTracks: true },
  );

  const prefixed: ReturnType<typeof motionToClip> = motionToClip({
    motion,
    skeleton,
    nodePrefix: "knightA/",
  });
  TestValidator.predicate(
    "every node id carries the prefix",
    prefixed.nodes.every((node: IAutoMovieNode): boolean =>
      node.id.startsWith("knightA/"),
    ),
  );
  TestValidator.equals(
    "every channel ref carries the prefix (root TRS included)",
    namedFacts([
      [
        "prefixedClipTracks",
        (): boolean =>
          prefixed.clip.tracks.every((track: IAutoMovieTrack): boolean =>
            channelNode(track).startsWith("knightA/"),
          ),
      ],
      [
        "prefixedClipTracks2",
        (): boolean =>
          prefixed.clip.tracks.some(
            (track: IAutoMovieTrack): boolean =>
              channelNode(track) === `knightA/${MOTION_ROOT_NODE_ID}`,
          ),
      ],
    ]),
    { prefixedClipTracks: true, prefixedClipTracks2: true },
  );

  let parity: boolean = true;
  for (const time of bakeTimes(motion.duration)) {
    const world: Map<string, number[]> = resolveFrame({
      nodes: prefixed.nodes,
      clip: prefixed.clip,
      limits: [],
      seconds: time,
    }).world;
    for (const bone of resolvePose(sampleMotion(motion, time).pose, skeleton)) {
      const matrix: number[] | undefined = world.get(`knightA/${bone.bone}`);
      if (
        matrix === undefined ||
        !vclose(Matrix4.position(matrix), bone.worldPosition) ||
        !qclose(Matrix4.decompose(matrix).rotation, bone.worldRotation)
      ) {
        parity = false;
        break;
      }
    }
    if (!parity) break;
  }
  TestValidator.predicate("parity holds under the prefix", parity);
}
