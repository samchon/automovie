import type { IAutoMovieMotionHumanSpacecraftGlide } from "../law/IAutoMovieMotionHumanSpacecraftGlide";
import type { IAutoMovieMotionHumanCarried } from "./IAutoMovieMotionHumanCarried";

/**
 * Open parameters of the carried lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconCarriedParams {
  /** Be carried by another person. */
  carried: IAutoMovieMotionHumanCarried.IParams;

  /**
   * Be carried in a named carry: the body takes the carry's posture and rests
   * on the carrier by every contact of the carry's coupled meeting
   * (`HumanCarriedCoupling`): its resting region on the carrier's region and
   * its held regions on the carrier's palms, each window with its load share,
   * its clinging hands on the carrier's regions. The carrier performs `bearing`
   * over their own action. The lift into the carry and the set-down are the
   * `lift` and `setDown` seconds (`HumanCarriedLift`). A second helper named by
   * `with` takes the other side of a carry that has one
   * (`HumanCarriedCoupling.PAIRED`), and the body rests on both. A person named
   * as their own carrier is refused on `by`, a second helper on a carry with no
   * other side on `with`, and a borne mass no lean of a carrier balances on
   * `mass` with the feasible mass.
   *
   * The coupling is read from the meeting, computed once whichever role plans
   * first; at each second the carrier's displayed bones are read and the
   * carry's key posture rides the carrier's displayed bone its resting region
   * lies on, at the coupling's key offset (`HumanCarriedCouplingPose.posture`).
   * A meeting that is not solid falls back to the single-region placement on
   * the carrier's region, found by one forward kinematics of the trunk. The
   * row, the coupling, the windows, then one posture function. The posture is
   * rigid in the carry (no sag, no sway) and its angles are provisional; with
   * no carrier the posture is taken in place and declares no support. One key
   * resolution, one read of the carrier's bones and one frame composition per
   * posture. Planned once per instance; nothing is shared between instances.
   * The plan closes over its constants and the entry state, released with the
   * plan.
   */
  borne: IAutoMovieMotionHumanCarried.IBorne;

  /**
   * Hold a person in a named carry: the carrier's hands where the carry takes
   * the carried body. Performed over the carrier's own action
   * (`carrier.walk(...).over((o) => o.registered("bearing", ...))`), it claims
   * only the arms that hold. With two helpers each names the other by `beside`,
   * the one whose carry is the other side's being the second. With the carried
   * person named and the hold performed as an action of its own, the carrier
   * tips about its feet by the pair's own balance as its hands take the body
   * (`HumanCarriedCouplingLoad.lean`); over a walk, which keeps its trunk, the
   * composition schedules that tip as a layer (`HumanCarriedLean.coupled`), and
   * with no person named the table's lean (`HumanCarriedLean.layer`).
   *
   * With the carried person named (`of`), each holding wrist goes where the
   * coupled carry lays the held region, in the frame of the carrier's own
   * displayed bone the borne body rides (`HumanCarriedCouplingPose.holds`);
   * otherwise to a place measured from one of the carrier's own regions on the
   * trunk the carrier's action has placed, in arm lengths. A named person's
   * pair tips the carrier about its feet by its static balance. Either way the
   * hold follows the walk, and the arm is carried in joint space from what it
   * held (`AutoMovieMotionHumanArm.carried`). One arm primitive per holding
   * hand over the inherited base. The hands do not read the carried body, which
   * reads the carrier, so the two cannot chase each other; the holds' places
   * are provisional. One trunk resolution per holding arm per posture. Planned
   * once per instance; nothing is shared between instances. The plan closes
   * over its constants and the entry state, released with the plan.
   */
  bearing: IAutoMovieMotionHumanCarried.IBearing;

  /** Glide in a staged spacecraft interior. */
  spacecraftGlide: IAutoMovieMotionHumanSpacecraftGlide;
}
