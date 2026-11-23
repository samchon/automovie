import type {
  IAutoMovieRenderSubject,
  IAutoMovieRenderSubjectOfShot,
} from "@automovie/interface";

/**
 * Read a compiled shot as a render subject.
 *
 * The canonical compiled-shot adapter uses this field projection and derives
 * the artifact's simulated drawable rows. Other callers must supply those rows
 * explicitly; omitted supplemental arrays become empty. Texture upload and
 * residency facts come from the capture host, rather than the compiled
 * artifact.
 */
export const autoMovieRenderSubjectOfShot: (
  props: IAutoMovieRenderSubjectOfShot.IProps,
) => IAutoMovieRenderSubject = (
  props: IAutoMovieRenderSubjectOfShot.IProps,
): IAutoMovieRenderSubject => ({
  scene: props.compiled.scene,
  models: props.compiled.models,
  environments: props.compiled.builtEnvironments ?? [],
  instanceSets: props.compiled.instanceSets,
  formations: props.compiled.formations,
  effects: props.compiled.effects,
  waterBodies: props.waterBodies ?? [],
  softBodies: props.softBodies ?? [],
  plantings: props.plantings ?? [],
  textures: props.textures ?? [],
  surfaceGraphics: props.compiled.shot.surfaceGraphics ?? [],
  fonts: props.compiled.shot.fonts ?? [],
  flames: props.compiled.shot.flames ?? [],
  textureResidency: props.textureResidency,
});
