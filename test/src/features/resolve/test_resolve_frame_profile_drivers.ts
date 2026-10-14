import {
  IAutoMovieClip,
  IAutoMovieNode,
  IAutoMovieProfile,
  IAutoMovieProfileBinding,
  IAutoMovieTransform,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieResolveOutput, resolveFrame } from "@automovie/engine";

import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";

const IDENTITY: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

const node: (id: string, translation?: IAutoMovieVector3) => IAutoMovieNode = (
  id: string,
  translation: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
): IAutoMovieNode => ({
  id,
  name: null,
  parent: null,
  kind: "group",
  transform: { ...IDENTITY, translation },
  mesh: null,
  camera: null,
  light: null,
  skin: null,
});

/** Rotate the prefixed hinge 90° about +Y (quat `(0, sin45, 0, cos45)`). */
const HINGE_CLIP: IAutoMovieClip = {
  id: "clip",
  name: null,
  duration: 1,
  loop: false,
  tracks: [
    {
      channel: { kind: "node", node: "actor/hinge", path: "rotation" },
      times: [0],
      values: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
      interpolation: "linear",
    },
  ],
};

const COPY_PROFILE: IAutoMovieProfile = {
  id: "mirror-profile",
  name: "mirror",
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
  limits: [],
};

const COPY_BINDING: IAutoMovieProfileBinding = {
  profile: "mirror-profile",
  boneMap: { pivot: "hinge", mirror: "handle" },
};

const AIM_PROFILE: IAutoMovieProfile = {
  id: "gaze-profile",
  name: "gaze",
  drivers: [
    {
      type: "aim",
      owner: "eye",
      target: "near",
      aimAxis: { x: 1, y: 0, z: 0 },
      upAxis: { x: 0, y: 1, z: 0 },
      worldUp: { x: 0, y: 1, z: 0 },
      influence: 1,
    },
  ],
  limits: [],
};

const AIM_BINDING: IAutoMovieProfileBinding = {
  profile: "gaze-profile",
  boneMap: { eye: "eye", near: "posX" },
};

/** X-basis column of a column-major world matrix. */
const basisX: (m: number[]) => [number, number, number] = (
  m: number[],
): [number, number, number] => [m[0]!, m[1]!, m[2]!];

/**
 * Bound profile drivers reach prefixed node channels, and directly supplied world drivers apply after profile drivers on the same owner.
 *
 * Scenarios:
 *
 * 1. A profile copy driver, bound with `nodePrefix: "actor/"` onto prefixed nodes,
 *    copies the hinge's 90° rotation onto the handle: both world matrices' X
 *    basis lands at `(0, 0, -1)`.
 * 2. Without the profile the handle stays at rest (X basis `(1, 0, 0)`): the
 *    negative twin proving the profile did it.
 * 3. World-pass precedence: a profile aim driver points the eye's X axis at a +X
 *    target while a direct aim driver on the same owner points it at a −X
 *    target: the direct driver applies after and wins (X basis `(-1, 0, 0)`);
 *    with only the profile aim the X basis stays `(1, 0, 0)` toward +X.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves frames with a prefixed profile rotation-copy driver and profile/direct aim drivers, observing copied X-basis columns, the no-profile rest neighbor and direct aim precedence.
 * @evidence contracts/testing.md#independent-expectations A quarter-turn about Y maps X to negative Z, rest leaves X unchanged and literal positive/negative X targets determine aim direction; the later direct aim must win over the profile aim, independently of resolver output.
 * @evidence contracts/testing.md#distinguishing-cases Prefixed copy versus no profile and profile-only versus contested direct aim distinguish remapping and world-driver order; scalar driven curves and malformed bindings belong to other tests.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_frame_profile_drivers entry synchronously executes the real binding/frame pipeline on portable data, with no live scene installation or substituted product methods.
 */
export function test_resolve_frame_profile_drivers(): void {
  const nodes: IAutoMovieNode[] = [
    node("actor/hinge", { x: 0, y: 1, z: 0 }),
    node("actor/handle"),
  ];
  const driven: IAutoMovieResolveOutput = resolveFrame({
    nodes,
    clip: HINGE_CLIP,
    limits: [],
    profiles: [
      { profile: COPY_PROFILE, binding: COPY_BINDING, nodePrefix: "actor/" },
    ],
    seconds: 0,
  });
  const hingeX: [number, number, number] = basisX(
    driven.world.get("actor/hinge")!,
  );
  const handleX: [number, number, number] = basisX(
    driven.world.get("actor/handle")!,
  );
  TestValidator.equals(
    "hinge rotated 90° about Y",
    namedFacts([
      ["ncloseHingeX", (): boolean => nclose(hingeX[0], 0)],
      ["ncloseHingeX2", (): boolean => nclose(hingeX[1], 0)],
      ["ncloseHingeX3", (): boolean => nclose(hingeX[2], -1)],
    ]),
    { ncloseHingeX: true, ncloseHingeX2: true, ncloseHingeX3: true },
  );
  TestValidator.equals(
    "profile copy drove the handle",
    namedFacts([
      ["ncloseHandleX", (): boolean => nclose(handleX[0], 0)],
      ["ncloseHandleX2", (): boolean => nclose(handleX[1], 0)],
      ["ncloseHandleX3", (): boolean => nclose(handleX[2], -1)],
    ]),
    { ncloseHandleX: true, ncloseHandleX2: true, ncloseHandleX3: true },
  );

  const bare: IAutoMovieResolveOutput = resolveFrame({
    nodes,
    clip: HINGE_CLIP,
    limits: [],
    seconds: 0,
  });
  const bareHandleX: [number, number, number] = basisX(
    bare.world.get("actor/handle")!,
  );
  TestValidator.equals(
    "without the profile the handle rests",
    namedFacts([
      ["ncloseBareHandleX0", (): boolean => nclose(bareHandleX[0], 1)],
      ["ncloseBareHandleX2", (): boolean => nclose(bareHandleX[2], 0)],
    ]),
    { ncloseBareHandleX0: true, ncloseBareHandleX2: true },
  );

  const gazeNodes: IAutoMovieNode[] = [
    node("eye"),
    node("posX", { x: 1, y: 0, z: 0 }),
    node("negX", { x: -1, y: 0, z: 0 }),
  ];
  const contested: IAutoMovieResolveOutput = resolveFrame({
    nodes: gazeNodes,
    clip: null,
    limits: [],
    drivers: [
      {
        type: "aim",
        owner: "eye",
        target: "negX",
        aimAxis: { x: 1, y: 0, z: 0 },
        upAxis: { x: 0, y: 1, z: 0 },
        worldUp: { x: 0, y: 1, z: 0 },
        influence: 1,
      },
    ],
    profiles: [{ profile: AIM_PROFILE, binding: AIM_BINDING }],
    seconds: 0,
  });
  const contestedX: [number, number, number] = basisX(
    contested.world.get("eye")!,
  );
  TestValidator.equals(
    "direct aim applies after the profile's and wins",
    namedFacts([
      ["ncloseContestedX0", (): boolean => nclose(contestedX[0], -1)],
      ["ncloseContestedX2", (): boolean => nclose(contestedX[2], 0)],
    ]),
    { ncloseContestedX0: true, ncloseContestedX2: true },
  );

  const profileOnly: IAutoMovieResolveOutput = resolveFrame({
    nodes: gazeNodes,
    clip: null,
    limits: [],
    profiles: [{ profile: AIM_PROFILE, binding: AIM_BINDING }],
    seconds: 0,
  });
  const profileOnlyX: [number, number, number] = basisX(
    profileOnly.world.get("eye")!,
  );
  TestValidator.equals(
    "profile aim alone points at +X",
    namedFacts([
      ["ncloseProfileOnlyX0", (): boolean => nclose(profileOnlyX[0], 1)],
      ["ncloseProfileOnlyX2", (): boolean => nclose(profileOnlyX[2], 0)],
    ]),
    { ncloseProfileOnlyX0: true, ncloseProfileOnlyX2: true },
  );
}
