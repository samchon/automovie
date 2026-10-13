import type * as THREE from "three";

/**
 * The articulation subtrees one scene's props contribute.
 *
 * @author Samchon
 */
export interface IAutoMovieBuiltPropArticulation {
  /**
   * Every lowered joint by its scene id (`<placement>/<joint>`), which is the
   * name a shot's `objectMotions` track addresses it by.
   */
  joints: ReadonlyMap<string, THREE.Object3D>;

  /**
   * Put every joint back where its prop declares it stands.
   *
   * The same obligation a host already has for staged node transforms:
   * {@link applyObjectMotions} writes only the channels the clip carries and the
   * engine's own resolver falls back to rest instead, so a host that seeks
   * backwards past a clip's first key would otherwise keep whatever the last
   * draw left behind.
   */
  restore: () => void;
}
