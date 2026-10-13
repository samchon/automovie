import type { Document, Root, Node as GLTFNode, Mesh, Camera, Skin, vec3, vec4, Animation, AnimationChannel, AnimationSampler, Accessor } from "@gltf-transform/core";
import type { IAutoMovieIngestResult } from "./IAutoMovieIngestResult";
import type { IAutoMovieNode, IAutoMovieClip, IAutoMovieTrack, AutoMovieInterpolation, AutoMovieNodeKind } from "@automovie/interface";
import { accessorValues } from "./internal/accessorValues";

/**
 * Map a parsed glTF/GLB {@link Document} onto automovie's core node graph and animation clips, with no three.js and no humanoid assumptions.
 *
 * Current repository callers exercise this parsed-document mapper through tests. The production asset inventory uses the separate byte inspector and host loaders; this export does not establish a wired parsed-document runtime import flow.
 *
 * `@gltf-transform/core` parses the bytes headlessly, and this mapper rewrites its structures structurally so props, cameras and characters import the same way. Every node keeps its local TRS, its parent, and the mesh, camera and skin it carries; a skin joint is a `bone` even when it also carries a mesh, then a mesh node is `mesh`, a camera node `camera`, and anything else `group`. Lights are not read. Every animation channel becomes a node track with the glTF sampler's keyframes, its interpolation mapped LINEAR, STEP and CUBICSPLINE to `linear`, `step` and `cubicspline` with an absent one read as LINEAR as glTF specifies, and its values decoded from normalized integers where the accessor declares them. Humanoid retargeting is the separate {@link humanoidSkeleton} stage.
 *
 * A channel that the engine's sample pass could not replay throws instead of importing: no target node, no or unknown target path, no sampler, no input or output data, an unknown interpolation, keyframe times that are not finite, non-negative and strictly increasing, non-finite output values, or an output length that disagrees with the keyframe count, the path's component count and the cubic-spline tangent triple.
 *
 * @param doc Parsed document; it is only read.
 * @returns New arrays the caller owns, sharing no storage with the document.
 *
 * @evidence contracts/common.md#principled-implementation Node and clip structure is mapped one to one with index ids, kinds follow a fixed precedence of joint, mesh, camera, then group, and each channel is checked against glTF's own sampler rules: an allowed path and interpolation, strictly increasing times, finite values, and output arity of keyframes times components times three for cubic splines; normalized accessors decode through `accessorValues`.
 * @evidence contracts/common.md#clear-and-simple-design The function builds the id, parent, joint and resource-index maps once and maps nodes and animations; `toTrack` owns all channel validation, and the path and interpolation tables replace the former unchecked casts and the silent linear fallback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown interpolation or target path now throws instead of becoming `linear` or passing through a cast, and no fixture-specific node, path or value is special-cased; lights are documented as not read.
 * @evidence contracts/common.md#meaningful-documentation The documentation states what each node keeps, the kind precedence, the interpolation mapping, normalized decoding, every refusal, and that the returned arrays share no storage with the document.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in nodes plus their child links, skin joints, and the total keyframe values across channels; each accessor is copied once into its track and every lookup goes through a hash map built once per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The mapper is a pure single pass over one document per call; a sampler shared by channels is copied per track so each track owns its arrays, which the result's ownership contract requires.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The lookup maps are local and released on return or throw; the result retains new node records and per-track copies of keyframe data proportional to the document's animation size, owned by the caller, and no handle or task.
 * @author Samchon
 */
export const ingestDocument: (doc: Document) => IAutoMovieIngestResult = (doc: Document): IAutoMovieIngestResult => {
  const root: Root = doc.getRoot();
  const gltfNodes: GLTFNode[] = root.listNodes();

  const idByNode: Map<GLTFNode, string> = new Map<GLTFNode, string>();
  gltfNodes.forEach((node: GLTFNode, i: number): void => {
    idByNode.set(node, `node_${i}`);
  });

  const parentByNode: Map<GLTFNode, GLTFNode> = new Map<GLTFNode, GLTFNode>();
  for (const node of gltfNodes)
    for (const child of node.listChildren()) parentByNode.set(child, node);

  const jointSet: Set<GLTFNode> = new Set<GLTFNode>();
  for (const skin of root.listSkins())
    for (const joint of skin.listJoints()) jointSet.add(joint);

  const meshIds: Map<Mesh, string> = indexIds(root.listMeshes());
  const cameraIds: Map<Camera, string> = indexIds(root.listCameras());
  const skinIds: Map<Skin, string> = indexIds(root.listSkins());

  const nodes: IAutoMovieNode[] = gltfNodes.map(
    (node: GLTFNode): IAutoMovieNode => {
      const parent: GLTFNode | undefined = parentByNode.get(node);
      const t: vec3 = node.getTranslation();
      const r: vec4 = node.getRotation();
      const s: vec3 = node.getScale();
      const mesh: Mesh | null = node.getMesh();
      const camera: Camera | null = node.getCamera();
      const skin: Skin | null = node.getSkin();
      return {
        id: idByNode.get(node)!,
        name: node.getName() === "" ? null : node.getName(),
        parent: parent !== undefined ? idByNode.get(parent)! : null,
        kind: kindOf(node, jointSet),
        transform: {
          translation: { x: t[0], y: t[1], z: t[2] },
          rotation: { x: r[0], y: r[1], z: r[2], w: r[3] },
          scale: { x: s[0], y: s[1], z: s[2] },
        },
        mesh: mesh !== null ? meshIds.get(mesh)! : null,
        camera: camera !== null ? cameraIds.get(camera)! : null,
        light: null,
        skin: skin !== null ? skinIds.get(skin)! : null,
      };
    },
  );

  const clips: IAutoMovieClip[] = root
    .listAnimations()
    .map((anim: Animation, i: number): IAutoMovieClip => {
      const tracks: IAutoMovieTrack[] = anim
        .listChannels()
        .map(
          (channel: AnimationChannel): IAutoMovieTrack =>
            toTrack(channel, idByNode),
        );
      return {
        id: `clip_${i}`,
        name: anim.getName() === "" ? null : anim.getName(),
        duration: tracks.reduce(
          (max: number, track: IAutoMovieTrack): number =>
            Math.max(max, track.times[track.times.length - 1]!),
          0,
        ),
        loop: false,
        tracks,
      };
    });

  return { nodes, clips };
};

type AutoMovieNodeTrackPath = "translation" | "rotation" | "scale" | "weights";

/** Components per keyframe for each fixed-width path; `weights` varies. */
const COMPONENTS: Readonly<Record<AutoMovieNodeTrackPath, number | null>> = {
  translation: 3,
  rotation: 4,
  scale: 3,
  weights: null,
};

const INTERPOLATIONS: Readonly<Record<string, AutoMovieInterpolation>> = {
  LINEAR: "linear",
  STEP: "step",
  CUBICSPLINE: "cubicspline",
};

/** Map each item to its decimal list index. */
const indexIds: <T>(items: T[]) => Map<T, string> = <T>(items: T[]): Map<T, string> => {
  const map: Map<T, string> = new Map<T, string>();
  items.forEach((item: T, i: number): void => {
    map.set(item, `${i}`);
  });
  return map;
};

const kindOf: (node: GLTFNode, joints: Set<GLTFNode>) => AutoMovieNodeKind = (node: GLTFNode, joints: Set<GLTFNode>): AutoMovieNodeKind =>
  joints.has(node)
    ? "bone"
    : node.getMesh() !== null
      ? "mesh"
      : node.getCamera() !== null
        ? "camera"
        : "group";

const toTrack: (channel: AnimationChannel, idByNode: Map<GLTFNode, string>) => IAutoMovieTrack = (
  channel: AnimationChannel,
  idByNode: Map<GLTFNode, string>,
): IAutoMovieTrack => {
  const target: GLTFNode | null = channel.getTargetNode();
  if (target === null) throw new Error("animation channel must target a node");
  const targetId: string = idByNode.get(target)!;
  const fail: (message: string) => never = (message: string): never => {
    throw new Error(`animation channel for node "${targetId}" ${message}`);
  };

  const targetPath: string | null = channel.getTargetPath();
  if (targetPath === null || Object.hasOwn(COMPONENTS, targetPath) === false)
    return fail(
      `target path must be translation, rotation, scale, or weights, but was ${JSON.stringify(targetPath)}`,
    );
  const path: AutoMovieNodeTrackPath = targetPath as AutoMovieNodeTrackPath;

  const sampler: AnimationSampler | null = channel.getSampler();
  if (sampler === null) return fail("must have a sampler");
  const input: Accessor | null = sampler.getInput();
  if (input === null) return fail("must have input times");
  const output: Accessor | null = sampler.getOutput();
  if (output === null) return fail("must have output values");

  const times: number[] | null = accessorValues(input);
  if (times === null) return fail("input times must have data");
  if (times.length === 0) return fail("input times must not be empty");
  const values: number[] | null = accessorValues(output);
  if (values === null) return fail("output values must have data");
  if (values.length === 0) return fail("output values must not be empty");

  // glTF reads an absent interpolation as LINEAR; a sampler built in code
  // without one reports `undefined` despite the declared string type.
  const rawInterpolation: string =
    (sampler.getInterpolation() as string | undefined) ?? "LINEAR";
  const interpolation: AutoMovieInterpolation | undefined = Object.hasOwn(
    INTERPOLATIONS,
    rawInterpolation,
  )
    ? INTERPOLATIONS[rawInterpolation]
    : undefined;
  if (interpolation === undefined)
    return fail(
      `interpolation must be LINEAR, STEP, or CUBICSPLINE, but was ${JSON.stringify(rawInterpolation)}`,
    );

  for (let i: number = 0; i < times.length; ++i)
    if (
      Number.isFinite(times[i]) === false ||
      times[i]! < 0 ||
      (i > 0 && times[i]! <= times[i - 1]!)
    )
      return fail(
        `input times must be finite, non-negative and strictly increasing, but key ${i} is ${times[i]}`,
      );
  if (values.every(Number.isFinite) === false)
    return fail("output values must be finite");

  const perKeyframeGroup: number =
    times.length * (interpolation === "cubicspline" ? 3 : 1);
  const fixed: number | null = COMPONENTS[path];
  if (fixed !== null) {
    const expected: number = perKeyframeGroup * fixed;
    if (values.length !== expected)
      return fail(
        `${path} output values length must be ${expected}, but was ${values.length}`,
      );
  } else if (values.length % perKeyframeGroup !== 0)
    return fail(
      `weights output values length must be a multiple of ${perKeyframeGroup}, but was ${values.length}`,
    );

  return {
    channel: { kind: "node", node: targetId, path },
    times,
    values,
    interpolation,
  };
};
