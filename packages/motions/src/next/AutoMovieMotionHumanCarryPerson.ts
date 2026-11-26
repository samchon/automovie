import { HumanAssistedTransfer as HumanAssistedTransferSource } from "../lexicon/HumanAssistedTransfer";
import { HumanCarried as HumanCarriedLaw } from "../lexicon/HumanCarried";
import { HumanCarriedCoupling as HumanCarriedCouplingSource } from "../lexicon/HumanCarriedCoupling";
import { HumanCarriedCouplingFit as HumanCarriedCouplingFitSource } from "../lexicon/HumanCarriedCouplingFit";
import { HumanCarriedCouplingLoad as HumanCarriedCouplingLoadSource } from "../lexicon/HumanCarriedCouplingLoad";
import { HumanCarriedCouplingPose as HumanCarriedCouplingPoseSource } from "../lexicon/HumanCarriedCouplingPose";
import { HumanCarriedLean as HumanCarriedLeanSource } from "../lexicon/HumanCarriedLean";
import { HumanCarriedLift as HumanCarriedLiftLaw } from "../lexicon/HumanCarriedLift";
import { HumanCoupled as HumanCoupledSource } from "../lexicon/HumanCoupled";
import { HumanHoldMesh as HumanHoldMeshSource } from "../lexicon/HumanHoldMesh";

/**
 * Carrying a person: the carry and its lift. An infant held is
 * `IAutoMovieMotionHumanCare.holdInfant`.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `carryPerson`: Being carried by another person: on the back, in the arms or
 *   over a shoulder.
 * - `carriedLift`: The lift into a carry and the set-down out of it: the carried
 *   body leaves the posture it was entered in for the carry's over the first
 *   `lift` seconds, and over the last `setDown` seconds comes down to stand
 *   where the carrier has brought it.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanCarriedCoupling`: The coupling of a named carry: the meeting kind whose
 *   borne role rests on the bearer by several contacts with load shares, whose
 *   borne mass and centre enter the bearer's balance, and the per-instant solve
 *   that puts the borne body on the bearer's displayed regions.
 * - `HumanCarriedCouplingFit`: The key pose of a coupled carry placed on its
 *   bearer: the bearer's stance and the borne legs changed least from the
 *   upright bearer and the carry's own legs so every hold's wrist goal lies
 *   within its arm, the borne resting region exactly on the bearer's, its turn
 *   about that point fitted to the row's hold places.
 * - `HumanCarriedCouplingLoad`: The weight a coupled carry puts on its bearers:
 *   the bearing contacts' shares of the borne weight, each bearer's load for a
 *   layer's lean (`HumanLoad.lean`), the tip that balances a bearer the borne
 *   body rides, and the capacity a bearer's moment balance bounds.
 * - `HumanCarriedCouplingPose`: The borne body of a coupled carry placed on its
 *   bearer: the carry's key posture, the region places both bodies are read at,
 *   the anchor bone the borne body rides, its posture carried by that bone at
 *   each instant and the bearer's hold places.
 * - `HumanCarriedLean`: The carrier's lean against the load of a carried person:
 *   a load on the back brings the trunk forward, a load before the chest or
 *   pulled from ahead brings it back, so the carrier's and the load's common
 *   centre of mass stays over the feet.
 * - `HumanCoupled`: The two-body compositions: carries with their lift and
 *   set-down, a supported walk, and throws and takedowns, each a mutual record
 *   over shipped laws, with no law per hold.
 * - `HumanHoldMesh`: A two-person hold's key pose adapted to any pair of bodies:
 *   the joints of both bodies at the key pose, the target bodies' bone lengths
 *   and the hold's contacts go through the interaction mesh
 *   (`HumanInteractionMesh`, Ho, Komura and Tai 2010), and each body's adapted
 *   joints become its limb goals (each wrist and ankle on its adapted joint,
 *   bent toward its adapted elbow or knee) and its root's shift, which the
 *   existing limb fits (`resolveHumanPosture`) resolve.
 * - `HumanAssistedTransfer`: Stage one actor's role in a paired
 *   chair-to-care-seat transfer.
 *
 * Use `IAutoMovieMotionHumanCarried.IParams` for the carry and
 * `IAutoMovieMotionHumanCarriedLift.IParams` for the lift and set-down timing.
 */
export namespace AutoMovieMotionHumanCarryPerson {
  /**
   * Being carried by another person: on the back, in the arms or over a
   * shoulder. The carried person keeps the posture they are in and goes rigidly
   * with one bone of the carrier (the upper chest when none is named), so
   * whatever the carrier does (walk, turn, stoop) takes them along. The carrier
   * performs their own action, such as a carry of the load in both hands.
   * Register `HumanCarried.carried` to use it.
   *
   * The named carries (`CARRIES`: piggyback, cradle, over the shoulder,
   * supported) are two laws for the two people: `borne` puts the carried body
   * in the carry's posture with its resting region on the carrier's, and
   * `bearing`, performed over the carrier's own action, puts the carrier's
   * hands where the carry holds.
   *
   * First pass: the lift into the carry and the set-down are not planned, the
   * carried body does not sag or cling, and its weight does not lean the
   * carrier.
   */
  export import carryPerson = HumanCarriedLaw;

  /**
   * The lift into a carry and the set-down out of it: the carried body leaves
   * the posture it was entered in for the carry's over the first `lift`
   * seconds, and over the last `setDown` seconds comes down to stand where the
   * carrier has brought it.
   *
   * Both are a blend on minimum-jerk progress between two whole postures: the
   * displayed root rises before it crosses and crosses before it comes down,
   * each on a minimum-jerk half of the phase, so the body goes over the carrier
   * rather than through it; its quaternion follows the shortest rotation and
   * the joints go with it, and the carry's own posture keeps following the
   * carrier meanwhile, so the body arrives on a carrier who walks. The carried
   * body's contact with the carrier is declared only between the two, while it
   * rests there; the feet leave the floor as the lift begins and come back to
   * it as the set-down ends, so no floor window lies inside either phase.
   *
   * First pass: the body is carried through the blend by nothing that is shown
   * (the carrier's hands arrive by `bearing`'s own take-up, and no hand is
   * placed under the body while it rises); the arms that cling are blended from
   * where they hung to where their hold's goal puts them, as joint angles, and
   * take the goal itself once the lift is done; the body is set down standing,
   * whatever the carry, on the floor under where its root is carried.
   */
  export import carriedLift = HumanCarriedLiftLaw;

  /**
   * The coupling of a named carry: the meeting kind whose borne role rests on
   * the bearer by several contacts with load shares, whose borne mass and
   * centre enter the bearer's balance, and the per-instant solve that puts the
   * borne body on the bearer's displayed regions.
   *
   * - **Key pose.** The carry's posture of the borne body (its heading, tip and
   *   leg angles, `HumanCarried.CARRIES`) placed with its resting region on the
   *   bearer's region, and turned about that point so its held regions come
   *   nearest the places the row's holds put the bearer's hands; the borne legs
   *   and a lone bearer's stance (trunk inclination and knee lowering) are the
   *   carry's own and upright changed least so every hold lies within its arm,
   *   a hold beyond it refused (`HumanCarriedCouplingFit.fit`); it is a pure
   *   function of the two bodies and the carry, so the record is the same
   *   whichever role plans first and wherever the pair stands.
   * - **Floor.** A drag (`HumanCarriedDrag`) also rests the dragged body's lowest
   *   region on the floor (role `ground`), which takes its share of the weight,
   *   so a dragger carries only what its contacts bear.
   * - **Contacts.** The resting region on the bearer's region, unless a lift
   *   holds it at the arms' reach above (`IRow.rise`), where it touches
   *   nothing; each bearer hand's palm under the borne region it holds
   *   (`HOLDS`), both bearing; and each clinging hand on the bearer's region it
   *   clings to, a grip.
   * - **Load shares.** The bearing contacts' and the clinging hands' shares of
   *   the borne weight, each a point support at its region (a clinging hand at
   *   its palm), are the least-norm shares whose weighted centre lies under the
   *   borne centre of mass, the vertical reactions of a body at rest on point
   *   supports (static equilibrium of forces and of the moments about the
   *   vertical's two horizontal axes), none of them a pull.
   * - **Borne body per instant.** The borne key pose rides the bone its resting
   *   region lies on (the anchor), a parent constraint at the key offset, as a
   *   held object keeps its offset in the hand: the resting region stays on its
   *   region however the bearer's trunk turns and bends. The bearer's hands
   *   reach the held regions in the same anchor frame
   *   (`HumanCarriedCouplingPose.holds`). It is per instant, with no state, so
   *   it cannot lag a turning bearer.
   * - **Capacity.** The borne mass is refused above the mass whose moment about
   *   the bearer's base exceeds the bearer's own at a right angle, `m d <= M
   *   h`, the bound beyond which no lean balances the pair (`HumanLoad.lean`).
   *   No study of person-carrying capacity was found (a search on
   *   casualty-carry capacity relative to the rescuer's mass returned none), so
   *   no tighter per-carry bound is set.
   * - **Two helpers.** A carry with another side (`PAIRED`: a supported walk)
   *   takes a second helper as the role `second`, standing where its side's
   *   region meets the borne body's on that side; the borne body rests on both,
   *   each helper bearing its contacts' share.
   *
   * First pass: the key pose is the carry's table posture with its legs and the
   * bearer's stance fitted, not a whole-body fit of both bodies
   * (`HumanBodyFit`); the borne centre is read with the arms at their clinical
   * zero. The bearer tips by the pair's balance forward and sideways
   * (`HumanCarriedCouplingLoad.lean`); the capacity reads the moment along the
   * facing alone (`HumanLoad.lean`).
   */
  export import HumanCarriedCoupling = HumanCarriedCouplingSource;

  /**
   * The key pose of a coupled carry placed on its bearer: the bearer's stance
   * and the borne legs changed least from the upright bearer and the carry's
   * own legs so every hold's wrist goal lies within its arm, the borne resting
   * region exactly on the bearer's, its turn about that point fitted to the
   * row's hold places. `HumanCarriedCoupling` builds the coupling on it.
   */
  export import HumanCarriedCouplingFit = HumanCarriedCouplingFitSource;

  /**
   * The weight a coupled carry puts on its bearers: the bearing contacts'
   * shares of the borne weight, each bearer's load for a layer's lean
   * (`HumanLoad.lean`), the tip that balances a bearer the borne body rides,
   * and the capacity a bearer's moment balance bounds. `HumanCarriedCoupling`
   * states the coupling these read.
   */
  export import HumanCarriedCouplingLoad = HumanCarriedCouplingLoadSource;

  /**
   * The borne body of a coupled carry placed on its bearer: the carry's key
   * posture, the region places both bodies are read at, the anchor bone the
   * borne body rides, its posture carried by that bone at each instant and the
   * bearer's hold places. `HumanCarriedCoupling` states the coupling these
   * read.
   */
  export import HumanCarriedCouplingPose = HumanCarriedCouplingPoseSource;

  /**
   * The carrier's lean against the load of a carried person: a load on the back
   * brings the trunk forward, a load before the chest or pulled from ahead
   * brings it back, so the carrier's and the load's common centre of mass stays
   * over the feet.
   *
   * The lean is an additive layer, as breath and affect are: the whole body
   * pitches about the midpoint of its planted feet by the angle, the inverted
   * pendulum whose moment balance the angle solves (`HumanLoad.lean`), on top
   * of whatever the carrier's own action holds, so a walk keeps its joints and
   * counter-rotation and its feet stay planted. A walk keeps its trunk for
   * itself, so the lean cannot be part of `bearing`, which is an overlay; the
   * composition schedules the layer over the carry: `layers: { carrier: [{
   * layer: HumanCarriedLean.layer("piggyback"), from: { of: "carry" }, to: {
   * of: "carry", event: "end" }, fade: HumanCarried.TAKE }] }`, with `carry`
   * the anchor of the carrier's action.
   *
   * The direction is the mechanics' and the load-carriage literature's: the
   * trunk's forward lean grows with a load carried on the back (Knapik, Harman
   * and Reynolds 1996, "Load carriage using packs", Applied Ergonomics 27, a
   * review). The sizes are provisional: no study of carrying a whole person was
   * read for them. A piggyback leans 20 degrees forward, a load over the
   * shoulder 10; a cradle and the drags lean back 10. The dance lifts have no
   * table angle: their lean is the coupled load's moment balance alone
   * (`HumanCarriedCouplingLoad.load`), and none without it.
   *
   * With the carried person named, `bearing` performed as its own action tips
   * the carrier by the coupled pair's own balance through `tipped`
   * (`HumanCarriedCouplingLoad.lean`), forward and sideways; performed over a
   * walk, which keeps its trunk, the composition schedules that tip as a layer
   * (`coupled`); the table's layer is left for a carry with no person.
   *
   * First pass: the layer's lean is a constant of the carry, coming in over the
   * window's fade; it does not follow the carrier's stride.
   */
  export import HumanCarriedLean = HumanCarriedLeanSource;

  /**
   * The two-body compositions: carries with their lift and set-down, a
   * supported walk, and throws and takedowns, each a mutual record over shipped
   * laws, with no law per hold.
   *
   * - **carry**: the bearer performs `bearing` with the borne person named, the
   *   borne person `borne` on the bearer, so the pair is one coupled meeting: a
   *   fireman's carry (`overShoulder`), a piggyback, a cradle, a supported walk
   *   (`supported`), a drag, each with the lift into it and the set-down out of
   *   it as the borne body's support sequence.
   * - **throw**: the thrower takes a collar-and-sleeve grip and enters under the
   *   thrown body, its fulcrum lowered to the height of the thrown body's front
   *   (`clinch` with `under`, tsukuri), and the thrown person answers the pull
   *   through it (`perturb`) with the author's outcome, turning over the
   *   throw's fulcrum on the thrower when thrown. The pull itself is the
   *   performance's force input (`HumanPerformance.IInput.forces`, sized by
   *   `HumanForceExchange.breaking` or `pull`), since a force starts no
   *   action.
   *
   * The fulcrum of each throw is the thrower's region the thrown body turns
   * over in the throw's common description: seoi-nage over the upper back and
   * shoulder, o-goshi over the hip at the lower back, o-soto-gari backward over
   * the reaping thigh, the single-leg takedown over the shoulder driven into
   * the hip.
   *
   * - **carry** also gives the dance's waist lift and overhead lift (`waistLift`,
   *   `overheadLift`: the lifted body coupled to the lifter, the overhead one
   *   held an arm's length above the shoulders).
   * - **supportWalk**: one person walked between two helpers, each with `bearing`
   *   on its side of a supported walk and the helped person `borne` on both,
   *   one coupled meeting of three roles.
   * - **helpUp**: helping someone up from the floor, both performing `support`,
   *   the helped hand gripping the helper's palm until the feet bear alone.
   * - **grappling**: both performers follow one authored grappling scene,
   *   including its lead side, result and clock.
   *
   * Arm wrestling is `HumanSocial.armWrestle` with the author's winner; the
   * loser's trunk turn the winner's torque gives is not planned. A tug of war
   * has no law.
   */
  export import HumanCoupled = HumanCoupledSource;

  /**
   * A two-person hold's key pose adapted to any pair of bodies: the joints of
   * both bodies at the key pose, the target bodies' bone lengths and the hold's
   * contacts go through the interaction mesh (`HumanInteractionMesh`, Ho,
   * Komura and Tai 2010), and each body's adapted joints become its limb goals
   * (each wrist and ankle on its adapted joint, bent toward its adapted elbow
   * or knee) and its root's shift, which the existing limb fits
   * (`resolveHumanPosture`) resolve.
   *
   * The key pose is a coupled solve of the hold on two reference bodies, never
   * authored per hold; a contact keeps the offset between its two joints that
   * the key pose has, so a hand on a back stays a hand's thickness off the
   * spine joint.
   *
   * First pass: a contact's offset is kept as the key pose has it, not scaled
   * to the target bodies' surfaces; the trunk's joint angles are not refitted
   * to the adapted spine, only shifted with the hips.
   */
  export import HumanHoldMesh = HumanHoldMeshSource;

  /**
   * Stage one actor's role in a paired chair-to-care-seat transfer.
   *
   * The phases share the same explicit hand target and seconds. The occupant
   * transfers support through the feet before moving to the next seat. The
   * helper's clasp stays until the new seat bears. The paired measurements in
   * [Riccoboni et al.](https://pubmed.ncbi.nlm.nih.gov/33070065/) motivate
   * observing the helper and occupant separately over the same motion.
   */
  export const HumanAssistedTransfer: typeof HumanAssistedTransferSource =
    HumanAssistedTransferSource;
}
