import {
  autoMovieFlameNodeName,
  compileAutoMovieFlameFlicker,
  resolveShotLighting,
  sampleAutoMovieFlame,
} from "@automovie/engine";
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

import type { IAutoMovieModelObject } from "../IAutoMovieModelObject.js";
import { applyLightState } from "../applyLightState.js";
import type { IAutoMovieFlamesObject } from "./IAutoMovieFlamesObject.js";
import type { IPrepareAutoMovieFlamesProps } from "./IPrepareAutoMovieFlamesProps.js";
import { createAutoMovieFlameMaterial } from "./createAutoMovieFlameMaterial.js";

/**
 * Build a shot's flames once and mount each on its prop.
 *
 * Every cue becomes one mesh named `flame:<node>/<cue id>`, parented to the
 * node's model object at the emitter affordance's frame, so it follows the
 * prop's placement, object motion and carriage. It draws with
 * `createAutoMovieFlameMaterial`, front faces only for a closed small or open
 * flame and both faces for an ember's disc, casts no shadow so it never
 * occludes its own light, and takes render order −1, below the prop's parts, so
 * a lantern's blended globe always draws over the flame inside it.
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
 * flame only inside its `on` interval. It also writes each bound flame's light
 * clip onto the `THREE.Light` that `resolveLight` gives for the staged light,
 * through `resolveShotLighting` and `applyLightState`, at the same shot-local
 * second and whether or not the flame burns then: the clip's intensity track
 * carries the flicker and the switching together, and its position and rotation
 * tracks carry the binding to the prop's emitter. The flame and the light it
 * motivates are applied together, so every host that places the film, the
 * Viewer, a capture and the delivered video alike, shows the light flicker with
 * its flame. A node without a mounted object, a missing emitter, an
 * unresolvable bound light or a bound light `resolveLight` cannot find throws,
 * after releasing what was made.
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
  const meshes: THREE.Mesh[] = [];
  const emissions: { color: IAutoMovieColor; luminance: number }[] = [];

  // Each bound flame's light: the built light, the staged one it rests at and
  // the binding's clip that drives it.
  const bindings: (IBoundLight | null)[] = [];
  const release: () => void = (): void => {
    for (const mesh of meshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
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

      const binding: IBoundLight | null =
        cue.light === undefined ? null : boundLight(cue, props);
      const emission: { color: IAutoMovieColor; luminance: number } =
        binding === null
          ? cue.emission!
          : {
              color: binding.staged.color,
              luminance:
                binding.staged.intensity /
                compileAutoMovieFlameFlicker(cue, props.shot.duration).mean,
            };
      const geometry: THREE.BufferGeometry = toGeometry(
        sampleAutoMovieFlame(cue, 0).mesh,
      );
      const mesh: THREE.Mesh = new THREE.Mesh(
        geometry,
        createAutoMovieFlameMaterial(
          emission.color,
          emission.luminance,
          cue.size.kind !== "ember",
        ),
      );
      meshes.push(mesh);
      emissions.push(emission);
      bindings.push(binding);
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
      if (!Number.isFinite(seconds))
        throw new RangeError(`Flames cannot be sampled at ${seconds} s`);
      cues.forEach((cue: IAutoMovieFlameCue, index: number): void => {
        // The bound light first: its track holds zero outside `on`, so it is
        // written while the flame is hidden too.
        const binding: IBoundLight | null = bindings[index]!;
        if (binding !== null)
          applyLightState(
            binding.target,
            resolveShotLighting({
              lights: [binding.staged],
              clips: [binding.clip],
              seconds,
            })[0]!,
          );

        const mesh: THREE.Mesh = meshes[index]!;
        mesh.visible =
          cue.on === undefined || (cue.on[0] <= seconds && seconds < cue.on[1]);
        if (!mesh.visible) return;
        const sample: { mesh: IAutoMovieMesh; area: number } =
          sampleAutoMovieFlame(cue, seconds);
        const position: THREE.BufferAttribute = mesh.geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        (position.array as Float32Array).set(sample.mesh.positions);
        position.needsUpdate = true;
        const normal: THREE.BufferAttribute = mesh.geometry.getAttribute(
          "normal",
        ) as THREE.BufferAttribute;
        (normal.array as Float32Array).set(sample.mesh.normals ?? []);
        normal.needsUpdate = true;
        mesh.geometry.computeBoundingSphere();

        // An ember's glow factor is its area over the bare disc's.
        if (cue.size.kind === "ember") {
          const { color, luminance }: (typeof emissions)[number] =
            emissions[index]!;
          const scale: number =
            (luminance * sample.area) /
            (Math.PI * cue.size.radius * cue.size.radius);
          (mesh.material as THREE.MeshBasicMaterial).color.setRGB(
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

/** A bound flame's practical light, as `apply` drives it. */
interface IBoundLight {
  /** The built light `resolveLight` returned. */
  target: THREE.Light;

  /** The staged light: its rest state and its on-state intensity and colour. */
  staged: IAutoMovieLight;

  /** The binding's light clip, whose id is the binding id. */
  clip: IAutoMovieClip;
}

/**
 * The light a bound flame's binding drives: the light clip with the binding's
 * id names the light by its intensity pointer `/lights/<id>/intensity`, whose
 * escaped id is unescaped per RFC 6901, and `resolveLight` gives its built
 * light.
 */
function boundLight(
  cue: IAutoMovieFlameCue,
  props: IPrepareAutoMovieFlamesProps,
): IBoundLight {
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
  if (clip === undefined || light === undefined)
    throw new Error(
      `Flame "${autoMovieFlameNodeName(cue.node, cue.id)}" names light binding "${cue.light}", which drives no staged light`,
    );
  const target: THREE.Light | undefined = props.resolveLight(light.id);
  if (target === undefined)
    throw new Error(
      `Flame "${autoMovieFlameNodeName(cue.node, cue.id)}" drives light "${light.id}", which resolveLight did not find`,
    );
  return { target, staged: light, clip };
}
