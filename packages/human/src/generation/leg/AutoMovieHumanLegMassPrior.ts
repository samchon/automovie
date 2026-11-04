/**
 * Where the leg's mass stands about its bone: at each station share of a
 * segment, the share of the section's front-to-back depth that lies ahead of
 * the bone's line, the front share. A shape prior in normalized part
 * coordinates, shared by every person.
 *
 * Direction from cross-sectional anatomy (Gray 1918): the quadriceps stand
 * ahead of the femur and the hamstrings behind it, with the adductors medial,
 * so the thigh's mass lies a little ahead of its bone; the gastrocnemius and
 * soleus stand behind the tibia, whose anterior border is subcutaneous, so the
 * shank's mass lies well behind its bone and comes forward toward the ankle,
 * where the calf's bellies give way to their tendon.
 *
 * Fitted on the references, so a prior awaiting a published law: the mean of
 * f1, f2, m1 and m2's level `leg_l` sections read against their own rigs
 * (by the historical reference reader), by bins a
 * tenth of the segment long, each person's own reading predicted within about
 * 0.025 by the other three. The proximal tenth of the thigh lies above the
 * crotch and carries no section; the joints' own tenths are left out.
 *
 * The deleted reader remains in git at 3672a547f0, path
 * test/src/features/human/reference/curves/test_human_reference_limb_mass.ts.
 * It sampled each cubic section span eight times, took the longest level
 * loop's body-X supports and used q=(front-boneX)/(front-back), with boneX
 * linearly interpolated on that reference's old rig. Its quality="all"
 * included suspect/broken source curves. This is sampled support, not an
 * exact continuous extreme, and does not establish the present pure joints
 * or bone-normal frame. Transferring q to that frame remains a placement
 * proxy. The retained table's final aggregation weighting was not recovered
 * by finding this reader; no new fit or private person reading was made.
 */
export namespace AutoMovieHumanLegMassPrior {
  /** One row: the bin's centre as a share from the proximal joint, and the front share there. */
  export interface IRow {
    /** Station share from the segment's proximal joint (hip or knee) to its distal one. */
    share: number;

    /** Share of the section's depth ahead of the bone's line. */
    front: number;
  }

  /** The thigh's rows, hip to knee. */
  export const THIGH: readonly IRow[] = [
    { share: 0.25, front: 0.534 },
    { share: 0.35, front: 0.578 },
    { share: 0.45, front: 0.586 },
    { share: 0.55, front: 0.577 },
    { share: 0.65, front: 0.567 },
    { share: 0.75, front: 0.566 },
    { share: 0.85, front: 0.556 },
  ];

  /** The shank's rows, knee to ankle. */
  export const SHANK: readonly IRow[] = [
    { share: 0.15, front: 0.353 },
    { share: 0.25, front: 0.322 },
    { share: 0.35, front: 0.321 },
    { share: 0.45, front: 0.326 },
    { share: 0.55, front: 0.334 },
    { share: 0.65, front: 0.341 },
    { share: 0.75, front: 0.363 },
    { share: 0.85, front: 0.419 },
  ];

  /**
   * The section's centre's offset ahead of the bone: with the section reaching
   * `ahead` in front of its centre and `behind` it, the bone stands where the
   * front share of the depth lies ahead of it.
   *
   * @param front The front share.
   * @param ahead Reach of the section in front of its centre, mm.
   * @param behind Reach of the section behind its centre, mm.
   * @returns The centre's offset ahead of the bone, mm.
   */
  export function offset(front: number, ahead: number, behind: number): number {
    return front * (ahead + behind) - ahead;
  }
}
