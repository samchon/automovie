import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieMotionCoupling, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanCarried, IAutoMovieMotionHumanCarriedCouplingPose, IAutoMovieMotionHumanColliders, IAutoMovieMotionHumanPosture, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";

/*
 * Where each hand of a bearer holds, in that bearer's anchor frame: the borne
 * region it holds on the coupling's key pose, left then right; null for a hand
 * that does not hold.
 * Parameter borne: The borne body.
 * Parameter coupling: The coupling.
 * Parameter row: The carry's row.
 * Parameter role: The bearer whose hands and anchor are read.
 * Parameter key: The carry posture builder, called only for a bearer with a hold.
 * Returns: The two holds, each the held region's point and outward normal in
 * that bearer's anchor frame, and the anchor bone.
 */
export function resolveCarriedHoldGeometry(
  borne: IAutoMovieMotionHumanBody,
  coupling: IAutoMovieMotionCoupling,
  row: IAutoMovieMotionHumanCarried.IRow,
  role: string,
  key: (
    row: IAutoMovieMotionHumanCarried.IRow,
    legs: readonly [number, number, number],
  ) => IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanCarriedCouplingPose.IHoldsResult {
  // A further bearer reads the places in its own anchor frame.
  const frame: BearerFrame | undefined =
    role === coupling.bearer ? undefined : coupling.bearers?.[role];
  const contactFor: (palm: AutoMovieHumanoidRegion) => MaybeContact = (
    palm: AutoMovieHumanoidRegion,
  ): MaybeContact =>
    coupling.contacts.find(
      (c: IAutoMovieMotionCoupling.IContact): boolean =>
        c.kind === "bear" && c.on.role === role && c.on.region === palm,
    );
  const left: ReturnType<typeof contactFor> = contactFor("palmLeft");
  const right: ReturnType<typeof contactFor> = contactFor("palmRight");
  const anchor: AutoMovieHumanoidBone = frame?.anchor ?? coupling.anchor;
  if (left === undefined && right === undefined)
    return { anchor, places: [null, null] };

  const keyed: IAutoMovieMotionHumanPosture = key(row, coupling.key.legs);
  const wanted: Set<AutoMovieHumanoidBone> = new Set(
    HumanColliders.bones(borne),
  );
  if (left !== undefined) wanted.add(borne.surfaces.regions[left.region].bone);
  if (right !== undefined)
    wanted.add(borne.surfaces.regions[right.region].bone);
  const mine: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    HumanTrunk.resolve(borne, keyed, undefined, undefined, wanted);
  const back: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
    humanPostureHeading(keyed),
  );
  const inverse: IAutoMovieQuaternion | undefined =
    frame === undefined ? undefined : AutoMovieEngineQuaternion.inverse(frame.rotation);
  // Compose the borne key into this bearer's anchor once. The torso and
  // fitted leg joints keep this transform throughout the hold.
  const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
    AutoMovieEngineQuaternion.multiply(coupling.key.rotation, back),
  );
  const ownTurn: IAutoMovieQuaternion =
    inverse === undefined
      ? turn
      : AutoMovieEngineQuaternion.normalize(AutoMovieEngineQuaternion.multiply(inverse, turn));
  const origin: IAutoMovieVector3 =
    frame === undefined || inverse === undefined
      ? coupling.key.position
      : AutoMovieEngineQuaternion.rotateVector(
          inverse,
          AutoMovieEngineVector3.subtract(coupling.key.position, frame.position),
        );
  const shapes: IAutoMovieMotionHumanColliders.IPlaced[] =
    HumanColliders.placed(borne, mine).map(
      (
        segment: IAutoMovieMotionHumanColliders.IPlaced,
      ): IAutoMovieMotionHumanColliders.IPlaced => ({
        ...segment,
        pose: {
          position: AutoMovieEngineVector3.add(
            origin,
            AutoMovieEngineQuaternion.rotateVector(ownTurn, segment.pose.position),
          ),
          rotation: AutoMovieEngineQuaternion.normalize(
            AutoMovieEngineQuaternion.multiply(ownTurn, segment.pose.rotation),
          ),
        },
      }),
    );
  const at: (contact: MaybeContact, index: number) => MaybeGrip = (
    contact: ReturnType<typeof contactFor>,
    index: number,
  ): IAutoMovieMotionHumanCarriedCouplingPose.IGrip | null => {
    if (contact === undefined) return null;
    const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      borne.surfaces.regions[contact.region];
    const placed: IAutoMovieMotionHumanCarriedCouplingPose.IHold =
      AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal(
        surface,
        mine.get(surface.bone)!,
      );
    const point: IAutoMovieVector3 =
      contact.at ??
      AutoMovieEngineVector3.add(
        coupling.key.position,
        AutoMovieEngineQuaternion.rotateVector(
          coupling.key.rotation,
          AutoMovieEngineQuaternion.rotateVector(back, placed.point),
        ),
      );
    const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      coupling.key.rotation,
      AutoMovieEngineQuaternion.rotateVector(back, placed.normal),
    );
    const fingers: IAutoMovieVector3 | undefined = row.holds[index]?.fingers;
    return {
      point:
        frame === undefined || inverse === undefined
          ? point
          : AutoMovieEngineQuaternion.rotateVector(
              inverse,
              AutoMovieEngineVector3.subtract(point, frame.position),
            ),
      normal:
        inverse === undefined
          ? normal
          : AutoMovieEngineQuaternion.rotateVector(inverse, normal),
      ...(fingers === undefined
        ? {}
        : {
            forward: AutoMovieEngineQuaternion.rotateVector(
              ownTurn,
              AutoMovieEngineQuaternion.rotateVector(
                mine.get(surface.bone)!.worldRotation,
                fingers,
              ),
            ),
          }),
      clearance: {
        clear: shapes.filter(
          (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
            segment.bone !== surface.bone,
        ),
        rests: shapes.filter(
          (segment: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
            segment.bone === surface.bone,
        ),
      },
    };
  };
  return {
    anchor,
    places: [at(left, 0), at(right, 1)],
  };
}

/*
 * A bearing contact when that hand is occupied.
 */
type MaybeContact = IAutoMovieMotionCoupling.IContact | undefined;

/*
 * A fitted grip when that hand is occupied.
 */
type MaybeGrip = IAutoMovieMotionHumanCarriedCouplingPose.IGrip | null;

/*
 * A further bearer's anchor in the shared coupling frame.
 */
type BearerFrame = NonNullable<IAutoMovieMotionCoupling["bearers"]>[string];
