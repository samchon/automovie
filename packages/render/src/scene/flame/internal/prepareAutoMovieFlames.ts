import { autoMovieFlameNodeName, AutoMovieEngineFlame } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieClip,
  IAutoMovieColor,
  IAutoMovieFlameCue,
  IAutoMovieLight,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieTrack,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieModelObject } from "../../IAutoMovieModelObject.js";
import { readAutoMovieBufferAttribute } from "../../readAutoMovieBufferAttribute.js";
import type { IAutoMovieFlamesObject } from "../IAutoMovieFlamesObject.js";
import type { IPrepareAutoMovieFlamesProps } from "../IPrepareAutoMovieFlamesProps.js";
import { createAutoMovieFlameMaterial } from "../createAutoMovieFlameMaterial.js";

/**
 * Build a shot's flames once and mount each on its prop.
 *
 * Every cue becomes one mesh named `flame:<node>/<cue id>`, parented to the
 * node's model object at the emitter affordance's frame, so it follows the
 * prop's placement, object motion and carriage. It draws with
 * `createAutoMovieFlameMaterial`, casts no shadow so it never occludes its own
 * light, and takes render order −1, below the prop's parts, so a lantern's
 * blended globe always draws over the flame inside it.
 *
 * Its luminance comes from its light. For a cue bound to a practical light, the
 * light clip whose id is the binding id names the staged light by its intensity
 * track's pointer; the flame's colour is that light's colour and its luminance
 * `I_on / Ā`, the light's on-state intensity over the mean silhouette area of
 * `compileAutoMovieFlameFlicker`, so the light's mean intensity is the flame's
 * mean luminance times its mean area. An unbound cue takes its `emission`. An
 * ember's luminance also follows its glow factor.
 *
 * `apply` re-evaluates each flame's shape with `sampleAutoMovieFlame` at the
 * exact time, rewriting the mesh's positions and normals in place, and shows a
 * flame only inside its `on` interval. A node without a mounted object, a
 * missing emitter or an unresolvable bound light throws, after releasing what
 * was made.
 */
export function prepareAutoMovieFlames(
  props: IPrepareAutoMovieFlamesProps,
): IAutoMovieFlamesObject {
  const cues: readonly IAutoMovieFlameCue[] = props.shot.flames ?? [];
  const models: Map<string, IAutoMovieModel> = new Map(
    props.models.map((model: IAutoMovieModel): [string, IAutoMovieModel] => [
      model.id,
      model,
    ]),
  );
  const modelOfNode: Map<string, string> = new Map(
    props.scene.nodes.map(
      (node: { id: string; model: string }): [string, string] => [
        node.id,
        node.model,
      ],
    ),
  );
  const meshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] =
    [];
  const emissions: { color: IAutoMovieColor; luminance: number }[] = [];
  const release: () => void = (): void => {
    for (const mesh of meshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
  };

  try {
    for (const cue of cues) {
      const name: string = autoMovieFlameNodeName(cue.node, cue.id);
      const model: IAutoMovieModel | undefined = models.get(
        modelOfNode.get(cue.node) ?? "",
      );
      const object: IAutoMovieModelObject | undefined = props.resolveNode(
        cue.node,
      );
      const emitter: IAutoMovieAffordance | undefined =
        model?.affordances?.find(
          (entry: IAutoMovieAffordance): boolean => entry.id === cue.emitter,
        );
      if (object === undefined || emitter === undefined)
        throw new Error(`Flame "${name}" has no mounted prop or emitter`);

      const emission: { color: IAutoMovieColor; luminance: number } =
        cue.light === undefined ? cue.emission! : boundEmission(cue, props);
      const geometry: THREE.BufferGeometry = toGeometry(
        AutoMovieEngineFlame.sampleAutoMovieFlame(cue, 0).mesh,
      );
      const mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> =
        new THREE.Mesh(
          geometry,
          createAutoMovieFlameMaterial(emission.color, emission.luminance),
        );
      meshes.push(mesh);
      emissions.push(emission);
      mesh.name = name;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.renderOrder = -1;
      const { translation, rotation }: typeof emitter.frame = emitter.frame;
      mesh.position.set(translation.x, translation.y, translation.z);
      mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      object.object.add(mesh);
    }
  } catch (error) {
    release();
    throw error;
  }

  let disposed: boolean = false;
  return {
    apply: (seconds: number): void => {
      cues.forEach((cue: IAutoMovieFlameCue, index: number): void => {
        const mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> =
          meshes[index]!;
        mesh.visible =
          cue.on === undefined || (cue.on[0] <= seconds && seconds < cue.on[1]);
        if (!mesh.visible) return;
        const sample: { mesh: IAutoMovieMesh; area: number } =
          AutoMovieEngineFlame.sampleAutoMovieFlame(cue, seconds);
        const position: THREE.BufferAttribute = readAutoMovieBufferAttribute(
          mesh.geometry,
          "position",
        );
        position.copyArray(sample.mesh.positions);
        position.needsUpdate = true;
        const normal: THREE.BufferAttribute = readAutoMovieBufferAttribute(
          mesh.geometry,
          "normal",
        );
        normal.copyArray(sample.mesh.normals ?? []);
        normal.needsUpdate = true;
        mesh.geometry.computeBoundingSphere();

        // An ember's glow factor is its area over the bare disc's.
        if (cue.size.kind === "ember") {
          const { color, luminance }: (typeof emissions)[number] =
            emissions[index]!;
          const scale: number =
            (luminance * sample.area) /
            (Math.PI * cue.size.radius * cue.size.radius);
          mesh.material.color.setRGB(
            color.r * scale,
            color.g * scale,
            color.b * scale,
          );
        }
      });
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      release();
    },
  };
}

/** A Three geometry over an engine mesh's positions, normals and indices. */
function toGeometry(mesh: IAutoMovieMesh): THREE.BufferGeometry {
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(mesh.positions), 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(new Float32Array(mesh.normals ?? []), 3),
  );
  if (mesh.indices !== null) geometry.setIndex(mesh.indices);
  return geometry;
}

/**
 * A bound flame's colour and luminance from the light its binding drives: the
 * light clip with the binding's id names the light by its intensity pointer
 * `/lights/<id>/intensity`, whose escaped id is unescaped per RFC 6901.
 */
function boundEmission(
  cue: IAutoMovieFlameCue,
  props: IPrepareAutoMovieFlamesProps,
): { color: IAutoMovieColor; luminance: number } {
  const clip: IAutoMovieClip | undefined = props.shot.lightMotions?.find(
    (entry: IAutoMovieClip): boolean => entry.id === cue.light,
  );
  const pointer: string | undefined = clip?.tracks
    .map((track: IAutoMovieTrack): string | undefined =>
      track.channel.kind === "pointer" ? track.channel.pointer : undefined,
    )
    .find(
      (entry: string | undefined): boolean =>
        entry !== undefined && entry.endsWith("/intensity"),
    );
  const match: RegExpExecArray | null =
    pointer === undefined ? null : /^\/lights\/(.+)\/intensity$/.exec(pointer);
  const id: string | undefined = match?.[1]
    ?.replaceAll("~1", "/")
    .replaceAll("~0", "~");
  const light: IAutoMovieLight | undefined = props.scene.lights.find(
    (entry: IAutoMovieLight): boolean => entry.id === id,
  );
  if (light === undefined)
    throw new Error(
      `Flame "${autoMovieFlameNodeName(cue.node, cue.id)}" names light binding "${cue.light}", which drives no staged light`,
    );
  const mean: number = AutoMovieEngineFlame.compileAutoMovieFlameFlicker(
    cue,
    props.shot.duration,
  ).mean;
  return { color: light.color, luminance: light.intensity / mean };
}
