import type { IAutoMovieAngleRange, IAutoMovieJointConstraint, IAutoMovieFlexedAbduction } from "@automovie/interface";

export namespace DefaultHumanoidRomData {
  export const range = (min: number, max: number): IAutoMovieAngleRange => ({
    min,
    max,
  });

  export const constraint = (
    flexion: IAutoMovieAngleRange | null,
    abduction: IAutoMovieAngleRange | null,
    twist: IAutoMovieAngleRange | null,
  ): IAutoMovieJointConstraint => ({ flexion, abduction, twist });

  export const ballConstraint = (
    flexion: IAutoMovieAngleRange | null,
    abduction: IAutoMovieAngleRange | null,
    twist: IAutoMovieAngleRange | null,
    swingDeg: number,
    turn?: IAutoMovieAngleRange,
    reach?: number,
  ): IAutoMovieJointConstraint => ({
    flexion,
    abduction,
    twist,
    swingDeg,
    ...(turn === undefined
      ? {}
      : {
          swingTwist: { twist: turn, ...(reach === undefined ? {} : { reach }) },
        }),
  });

  /*
   * A finger's metacarpophalangeal joint (the knuckle): flexion 90 and
   * hyperextension 45, abduction 30 to either side, no axial turn. The upper
   * values of the active norms in McGraw-Hill's goniometry table (Prentice,
   * "Rehabilitation Techniques for Sports Medicine and Athletic Training", ch. 8:
   * MCP flexion 85-90, extension 30-45, abduction 20-30); the adduction toward
   * the middle finger mirrors the abduction, provisional (no located source
   * tabulates it apart). A two-freedom joint with no third freedom to read twice,
   * so its box of flexion and abduction is its own coordinate range and needs no
   * swing-twist gate.
   */
  export const KNUCKLE = constraint(range(-45, 90), range(-30, 30), null);

  /*
   * A hip's abduction ceiling flexed: 45 degrees with the hip straight (the
   * `abduction` interval's own) rising to 60 with the hip flexed 90, the upper
   * AAOS 1965 norm for abduction with the hip and knee flexed 90 (45-60), as
   * Cejudo, Sainz de Baranda, Santonja and Ayala tabulate it (2016, SporTK
   * 5(1):35-46, Table 1); flexion slackens the ligaments that stop a straight
   * hip's abduction (Kapandji, as they cite).
   */
  export const HIP_FLEXED_ABDUCTION: IAutoMovieFlexedAbduction = {
    flexion: 90,
    max: 60,
  };

  /*
   * A finger's proximal interphalangeal joint: a hinge, flexion 0 to 115 (the
   * same table's 100-115).
   */
  export const MIDDLE_JOINT = constraint(range(0, 115), null, null);

  /*
   * A finger's distal interphalangeal joint: a hinge, flexion 90 and
   * hyperextension 20 (the same table's 80-90 and 20; AAOS 90 as relayed).
   */
  export const END_JOINT = constraint(range(-20, 90), null, null);

  /*
   * The thumb's carpometacarpal joint, a saddle, gated by swing and twist.
   * Cooney, Lucca, Chao and Linscheid 1981 (J Bone Joint Surg Am 63:1371-1381)
   * measured total arcs of 53 degrees of flexion-extension, 42 of
   * abduction-adduction and 17 of axial rotation on biplane radiographs of 19
   * subjects. The rig reads the thumb on the hand's basis (`AutoMovieEngineHumanoidJointAxes`,
   * "as an approximation"), so its flexion, about the axis across the hand, moves
   * the thumb out of the palm's plane toward the palm: anatomical palmar
   * abduction, the 42-degree arc, from the rest (0) to 42. The rig's rest thumb
   * does not lie in the palm's plane: its neutral stops where its skin clears the
   * hand's (`AutoMovieHumanNeutralThumbCmc`), which leaves its tip about 20
   * degrees palmar of the knuckles' plane, so a palm laid flat on a floor would
   * sink the thumb. The joint's retroposition, the thumb carried back behind the
   * palm's plane (25 to 38 degrees, 31 ± 4, in 100 asymptomatic adults: Barakat,
   * Field and Taylor 2013, Hand 8(2):179-182), is admitted to -25, the low end of
   * that normal range, which brings the thumb into the palm's plane and some way
   * past it. Its abduction, about the palm's normal, swings the thumb within the
   * palm's plane: anatomical flexion-extension, the 53-degree arc, split evenly
   * about the rest (provisional: the rest's place in Cooney's arc is not stated).
   * The axial rotation's 17 degrees are split evenly likewise (provisional).
   */
  export const THUMB_BASE: IAutoMovieJointConstraint = {
    flexion: range(-25, 42),
    abduction: range(-26.5, 26.5),
    twist: range(-8.5, 8.5),
    swingTwist: { twist: range(-8.5, 8.5) },
  };

  /*
   * The thumb's metacarpophalangeal joint: flexion 0 to 55 (the same goniometry
   * table's 50-55); its small abduction has no located norm, so it stays
   * immobile.
   */
  export const THUMB_MIDDLE = constraint(range(0, 55), null, null);

  /*
   * The thumb's interphalangeal joint: flexion 90 and hyperextension 5 (the same
   * table's 85-90 and 0-5).
   */
  export const THUMB_END = constraint(range(-5, 90), null, null);

  /*
   * The farthest a shoulder's arm points from the T-pose, degrees, which keeps
   * the rest direction's antipode (the arm pointing through the chest, where the
   * twist has no value) outside the range. Provisional, with a known defect: one
   * radius on every great circle is a generalisation the anatomy does not have.
   * The shoulder's directional limit is a measured cone that varies with the
   * plane of elevation (Engin and Chen 1986, J Biomech Eng 108:215), not reached;
   * the figure is horizontal adduction from 90 degrees of abduction, 130 in
   * Physiotutors' active range of motion norms (IDEA gives 140; Norkin and White
   * tabulate none), and applied elsewhere it clamps a hand wiping the mouth,
   * which reaches 131, and an elbow brought to the midline ahead of the chest
   * (half the shoulder breadth across: 135 degrees for an upper arm of 0.226 m on
   * a half breadth of 0.153 m). That figure is the clinical angle only on the
   * horizontal great circle: the test starts at the T-pose and turns the arm in
   * the horizontal plane, so its angle is this swing there and no other circle
   * has a stated norm. The arm planner's variables are the swing-twist chart this
   * radius scales, so the figure is not changed for one place: a wider one
   * changes every arm trajectory's chart.
   */
  export const REACH: number = 130;
}
