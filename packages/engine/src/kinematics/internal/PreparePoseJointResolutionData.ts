import type { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";

export namespace PreparePoseJointResolutionData {
  /*
   * Null clinical rest genuinely resolves to this exact positive-zero rig angle.
   */
  export const REST_ANGLE: readonly [number] = [0];

  /*
   * Immutable rig declarations share only factors actually requested at exact rig
   * rest.
   */
  export const REST_ANGLES: jointToQuaternionOnBasis.IFixedAngles = {
    flexion: REST_ANGLE,
    abduction: REST_ANGLE,
    twist: REST_ANGLE,
  };
}
