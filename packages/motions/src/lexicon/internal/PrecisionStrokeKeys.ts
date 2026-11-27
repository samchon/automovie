/*
 * A precision stroke's key poses beyond its contact: how far a two-handed
 * swing's trunk coils back at the top and turns on at the finish.
 */
export namespace PrecisionStrokeKeys {
  /*
   * The trunk's coil away from the shot at the top of a two-handed backswing,
   * degrees, of the shoulders over the pelvis: the X-factor, about 45 to 60
   * degrees between the shoulders and the pelvis at the top in golfers
   * (Bourgain et al. 2022, Golf swing biomechanics: a systematic review, Sports
   * 10(6):91; the shoulders near 90 and the pelvis near 45 to 53 degrees in
   * Myers et al. 2008, Rotational biomechanics of the elite golf swing, J Appl
   * Biomech 24:181), its lower bound, the sources' figures differing by
   * method.
   */
  export const COIL: number = 45;

  /*
   * The trunk's turn on toward the shot at the finish of a two-handed swing,
   * degrees past its turn at the contact: the shoulders face the target at the
   * finish (provisional; no measured value is common to the golf and batting
   * sources).
   */
  export const FINISH: number = 90;
}
