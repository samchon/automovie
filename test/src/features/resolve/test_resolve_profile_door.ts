import {
  IAutoMovieClip,
  IAutoMovieNode,
  IAutoMovieProfile,
  IAutoMovieProfileBinding,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieResolveOutput } from "@automovie/engine";
import { resolveFrame } from "@automovie/engine";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";

const IDENTITY: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

const node: (id: string, parent?: string | null) => IAutoMovieNode = (
  id: string,
  parent: string | null = null,
): IAutoMovieNode => ({
  id,
  name: null,
  parent,
  kind: "group",
  transform:
    id === "hinge"
      ? { ...IDENTITY, translation: { x: 0, y: 1, z: 0 } }
      : IDENTITY,
  mesh: null,
  camera: null,
  light: null,
  skin: null,
});

const DOOR_NODES: IAutoMovieNode[] = [
  node("door"),
  node("hinge", "door"),
  node("handleMirror"),
];

/** Quat for a rotation of `deg` about +Y. */
const yQuat: (deg: number) => [number, number, number, number] = (
  deg: number,
): [number, number, number, number] => {
  const half: number = (deg * Math.PI) / 360;
  return [0, Math.sin(half), 0, Math.cos(half)];
};

const doorClip: (deg: number) => IAutoMovieClip = (
  deg: number,
): IAutoMovieClip => ({
  id: "swing",
  name: null,
  duration: 1,
  loop: false,
  tracks: [
    {
      channel: { kind: "node", node: "hinge", path: "rotation" },
      times: [0],
      values: [...yQuat(deg)],
      interpolation: "linear",
    },
  ],
});

const SIN55: number = Math.sin((55 * Math.PI) / 180);
const COS55: number = Math.cos((55 * Math.PI) / 180);

/**
 * A conventional +Y hinge profile caps the tested swing at the 110-degree quaternion corner: x/z are zero, y lies in [0,sin55] and w in [cos55,1]. A copy driver mirrors the sampled hinge rotation onto another node before limits run.
 */
const DOOR_PROFILE: IAutoMovieProfile = {
  id: "door-profile",
  name: "hinge",
  drivers: [
    {
      type: "copy",
      owner: "mirror",
      source: "pivot",
      translation: false,
      rotation: true,
      scale: false,
      influence: 1,
    },
  ],
  limits: [
    {
      channel: { kind: "node", node: "pivot", path: "rotation" },
      min: [0, 0, 0, COS55],
      max: [0, SIN55, 0, 1],
    },
  ],
};

const DOOR_BINDING: IAutoMovieProfileBinding = {
  profile: "door-profile",
  boneMap: { pivot: "hinge", mirror: "handleMirror" },
};

const basisX: (m: number[]) => [number, number, number] = (
  m: number[],
): [number, number, number] => [m[0]!, m[1]!, m[2]!];

/**
 * Resolve a conventional door profile's admitted and excessive swings, checking bound remapping, profile diagnostics and the copy driver's in-range result. This does not prove that the copied node receives the hinge's later clamp.
 *
 * Scenarios:
 *
 * 1. An in-range 90° swing passes: no violations, the hinge's world X basis lands
 *    at `(0, 0, -1)` under its parent door.
 * 2. The profile's copy driver mirrors the hinge onto the dependent node in the
 *    same frame (same X basis): the declared dependency drives.
 * 3. An over-limit 150° swing clamps to exactly the 110° unit quaternion (the
 *    per-component corner): world X basis `(cos110°, 0, -sin110°)`, with the
 *    y-max and w-min breaches reported as violations tagged `profile:
 *    "door-profile"` on the hinge's rotation channel.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the real frame resolver with a door profile and boneMap, observing allowed swing, copy-driver world orientation and profile-tagged clamping of an excessive swing.
 * @evidence contracts/testing.md#independent-expectations Quarter-turn basis mapping gives (0,0,-1); authored quaternion bounds at sin55/cos55 produce the 110-degree corner, whose world X basis follows cosine110/negative sine110 independently of resolver output.
 * @evidence contracts/testing.md#distinguishing-cases In-range90 and over-limit150 swings contrast pass-through with two bound crossings, while the mirror checks binding/driver propagation; the corner example does not prove general component clamps preserve quaternion unit norm.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_profile_door entry executes portable synchronous profile/frame semantics for the existing conventional door fixture, without rendering or claiming physically measured hinge constraints.
 */
export function test_resolve_profile_door(): void {
  const open: IAutoMovieResolveOutput = resolveFrame({
    nodes: DOOR_NODES,
    clip: doorClip(90),
    limits: [],
    profiles: [{ profile: DOOR_PROFILE, binding: DOOR_BINDING }],
    seconds: 0,
  });
  TestValidator.equals("90° swing passes", open.violations.length, 0);
  const openX: [number, number, number] = basisX(open.world.get("hinge")!);
  TestValidator.equals(
    "hinge world rotated 90°",
    namedFacts([
      ["ncloseOpenX", (): boolean => nclose(openX[0], 0)],
      ["ncloseOpenX2", (): boolean => nclose(openX[1], 0)],
      ["ncloseOpenX3", (): boolean => nclose(openX[2], -1)],
    ]),
    { ncloseOpenX: true, ncloseOpenX2: true, ncloseOpenX3: true },
  );
  const mirrorX: [number, number, number] = basisX(
    open.world.get("handleMirror")!,
  );
  TestValidator.equals(
    "profile driver mirrors the hinge",
    namedFacts([
      ["ncloseMirrorX0", (): boolean => nclose(mirrorX[0], 0)],
      ["ncloseMirrorX2", (): boolean => nclose(mirrorX[2], -1)],
    ]),
    { ncloseMirrorX0: true, ncloseMirrorX2: true },
  );

  const slammed: IAutoMovieResolveOutput = resolveFrame({
    nodes: DOOR_NODES,
    clip: doorClip(150),
    limits: [],
    profiles: [{ profile: DOOR_PROFILE, binding: DOOR_BINDING }],
    seconds: 0,
  });
  TestValidator.equals(
    "150° swing breaches y-max and w-min",
    slammed.violations.length,
    2,
  );
  for (const violation of slammed.violations) {
    TestValidator.equals(
      "violation tagged with the door profile",
      violation.profile,
      "door-profile",
    );
    TestValidator.equals(
      "violation on the hinge rotation channel",
      violation.channel,
      "node:hinge:rotation",
    );
  }
  const cos110: number = Math.cos((110 * Math.PI) / 180);
  const sin110: number = Math.sin((110 * Math.PI) / 180);
  const slammedX: [number, number, number] = basisX(
    slammed.world.get("hinge")!,
  );
  TestValidator.equals(
    "over-swing clamps to exactly 110°",
    namedFacts([
      ["ncloseSlammedXCos110", (): boolean => nclose(slammedX[0], cos110)],
      ["ncloseSlammedX", (): boolean => nclose(slammedX[1], 0)],
      ["ncloseSlammedXSin110", (): boolean => nclose(slammedX[2], -sin110)],
    ]),
    {
      ncloseSlammedXCos110: true,
      ncloseSlammedX: true,
      ncloseSlammedXSin110: true,
    },
  );
}
