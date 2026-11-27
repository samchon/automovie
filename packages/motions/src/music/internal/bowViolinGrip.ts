import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Prepare where the held bow's grip goes for a stroke: the bow turned by its
 * stroke rotation, with the hair point at a share from frog to tip laid on the
 * sounding point, lifted off the string along its outward normal.
 * Parameter contact: The sounding point on the string, world metres.
 * Parameter outward: The string bar's outward normal, unit.
 * Parameter rotation: The bow's stroke rotation from its held frame.
 * Parameter frog: The hair's frog end in the bow's held frame, metres.
 * Parameter hair: The hair from frog to tip in the bow's held frame, metres.
 * Returns: The grip's world point at a hair share and a lift, metres.
 */
export function bowViolinGrip(
  contact: IAutoMovieVector3,
  outward: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  frog: IAutoMovieVector3,
  hair: IAutoMovieVector3,
): (share: number, lift: number) => IAutoMovieVector3 {
  return (share: number, lift: number): IAutoMovieVector3 =>
    Vector3.subtract(
      Vector3.add(contact, Vector3.scale(outward, lift)),
      Quaternion.rotateVector(
        rotation,
        Vector3.add(frog, Vector3.scale(hair, share)),
      ),
    );
}
