import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Locate midline subnasale from two straight landmark distances, in head-frame millimetres.
 *
 * The measured nasion–subnasale chord is not its vertical projection. Intersect its sphere with the tragion-distance sphere and the sagittal plane; choose the lower of the two intersections. The tragion distance is a separately sourced profile proportion supplied by the caller. Incompatible chords have no anatomical solution and are rejected rather than shortened by a square-root clamp.
 */
export function locateAutoMovieHumanSubnasale(props: {
  nasion: IAutoMovieVector3;
  tragion: IAutoMovieVector3;
  noseHeight: number;
  tragionDistance: number;
}): { y: number; z: number } {
  const { nasion, tragion, noseHeight, tragionDistance }: typeof props = props;
  const nasalRadius2: number = noseHeight ** 2 - nasion.x ** 2;
  const tragionRadius2: number = tragionDistance ** 2 - tragion.x ** 2;
  const dy: number = nasion.y - tragion.y;
  const dz: number = nasion.z - tragion.z;
  const distance: number = Math.hypot(dy, dz);
  if (!(nasalRadius2 > 0 && tragionRadius2 > 0 && distance > 0))
    throw new Error("Head landmark chords cannot locate sagittal subnasale");
  const along: number =
    (tragionRadius2 - nasalRadius2 + distance ** 2) / (2 * distance);
  const across2: number = tragionRadius2 - along ** 2;
  if (across2 < 0)
    throw new Error("Nasal and tragion chords do not intersect at subnasale");
  const across: number = Math.sqrt(across2);
  const sign: number = dz >= 0 ? 1 : -1;
  return {
    y: tragion.y + (along * dy - sign * across * dz) / distance,
    z: tragion.z + (along * dz + sign * across * dy) / distance,
  };
}
