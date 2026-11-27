import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedLean,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanLoad,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLoad } from "../../perform/internal/HumanLoad";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";

/*
 * The carrier's lean against the load of a carried person: a load on the back
 * brings the trunk forward, a load before the chest or pulled from ahead brings
 * it back, so the carrier's and the load's common centre of mass stays over the
 * feet.
 *
 * The lean is an additive layer, as breath and affect are: the whole body
 * pitches about the midpoint of its planted feet by the angle, the inverted
 * pendulum whose moment balance the angle solves (`HumanLoad.lean`), on top of
 * whatever the carrier's own action holds, so a walk keeps its joints and
 * counter-rotation and its feet stay planted. A walk keeps its trunk for
 * itself, so the lean cannot be part of `bearing`, which is an overlay; the
 * composition schedules the layer over the carry: `layers: { carrier: [{ layer:
 * HumanCarriedLean.layer("piggyback"), from: { of: "carry" }, to: { of:
 * "carry", event: "end" }, fade: HumanCarried.TAKE }] }`, with `carry` the
 * anchor of the carrier's action.
 *
 * The direction is the mechanics' and the load-carriage literature's: the
 * trunk's forward lean grows with a load carried on the back (Knapik, Harman
 * and Reynolds 1996, "Load carriage using packs", Applied Ergonomics 27, a
 * review). The sizes are provisional: no study of carrying a whole person was
 * read for them. A piggyback leans 20 degrees forward, a load over the shoulder
 * 10; a cradle and the drags lean back 10. The dance lifts have no table angle:
 * their lean is the coupled load's moment balance alone
 * (`HumanCarriedCouplingLoad.load`), and none without it.
 *
 * With the carried person named, `bearing` performed as its own action tips the
 * carrier by the coupled pair's own balance through `tipped`
 * (`HumanCarriedCouplingLoad.lean`), forward and sideways; performed over a
 * walk, which keeps its trunk, the composition schedules that tip as a layer
 * (`coupled`); the table's layer is left for a carry with no person.
 *
 * First pass: the layer's lean is a constant of the carry, coming in over the
 * window's fade; it does not follow the carrier's stride.
 */
export namespace HumanCarriedLean {
  /*
   * The carrier's whole-body pitch against each carry's load when no mass is
   * known, degrees; positive leans forward.
   */
  export const LEANS: Readonly<
    Record<IAutoMovieMotionHumanCarried.Carry, number>
  > = {
    piggyback: 20,
    cradle: -10,
    overShoulder: 10,
    supported: 0,
    supportedLeft: 0,
    waistLift: 0,
    overheadLift: 0,
    // A shoulder ride keeps the load over the spine's axis, as head loads do
    // (Maloiy et al. 1986, Nature 319:668), so the carrier does not pitch.
    shoulders: 0,
    armpitDrag: -10,
    collarDrag: -10,
    ankleDrag: -10,
  };

  /*
   * The lean of a carry as a layer.
   * Parameter carry: The carry.
   * Parameter load: The carrier's and the load's masses and the load's distance
   * ahead, when known: the lean is then the moment balance's
   * (`HumanLoad.lean`), and the table's angle otherwise or when no lean
   * balances it.
   * Returns: The layer, named `carryLean`; schedule it over the carry, with the
   * take-up as its fade.
   */
  export function layer(
    carry: IAutoMovieMotionHumanCarried.Carry,
    load?: IAutoMovieMotionHumanLoad.ILeanProps,
  ): IAutoMovieMotionHumanLayer {
    // A known load leans the body by its moment; the table's
    // provisional angle stands only when no mass is known.
    const balanced: number | null =
      load === undefined ? null : HumanLoad.lean(load);
    const lean: number = balanced ?? LEANS[carry];
    return {
      name: "carryLean",
      channels: ["root", "trunk"],
      apply: (
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieMotionHumanPosture => tipped(posture, lean, 0),
    };
  }

  /*
   * The tip of a coupled carry as a layer, for a `bearing` performed over an
   * action that keeps the trunk for itself (a walk), where the bearing's own
   * tip is not taken.
   * Parameter tip: The pair's balance (`HumanCarriedCouplingLoad.lean`), degrees
   * forward and toward the right.
   * Returns: The layer, named `carryLean`; schedule it over the carry, with the
   * take-up as its fade.
   */
  export function coupled(
    tip: IAutoMovieMotionHumanCarriedLean.ICoupledTip,
  ): IAutoMovieMotionHumanLayer {
    return {
      name: "carryLean",
      channels: ["root", "trunk"],
      apply: (
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieMotionHumanPosture => tipped(posture, tip.pitch, tip.roll),
    };
  }

  /*
   * The whole body tipped about the midpoint of its planted feet: the inverted
   * pendulum a carrier's balance turns. The planted leg goals stay in the
   * world, so the ankles take the tip and the joints the posture holds are
   * kept.
   * Parameter posture: The posture.
   * Parameter pitch: Degrees added forward.
   * Parameter roll: Degrees added toward the body's right.
   * Returns: The tipped posture; about the root when no leg is planted.
   */
  export function tipped(
    posture: IAutoMovieMotionHumanPosture,
    pitch: number,
    roll: number,
  ): IAutoMovieMotionHumanPosture {
    const legs: IAutoMovieHumanLimbGoal[] = [
      posture.limbs.leftLeg,
      posture.limbs.rightLeg,
    ].filter((g): g is IAutoMovieHumanLimbGoal => g !== undefined);
    const pivot: IAutoMovieVector3 =
      legs.length === 0
        ? posture.root
        : Vector3.scale(
            legs.reduce(
              (
                s: IAutoMovieVector3,
                g: IAutoMovieHumanLimbGoal,
              ): IAutoMovieVector3 => Vector3.add(s, g.point),
              { x: 0, y: 0, z: 0 },
            ),
            1 / legs.length,
          );
    const own: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(humanPostureHeading(posture)),
      Vector3.subtract(pivot, posture.root),
    );
    const turned: IAutoMovieMotionHumanPosture = {
      ...posture,
      pitch: posture.pitch + pitch,
      roll: posture.roll + roll,
    };
    return {
      ...turned,
      root: Vector3.subtract(
        pivot,
        Quaternion.rotateVector(humanPostureHeading(turned), own),
      ),
    };
  }
}
