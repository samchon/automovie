/**
 * The closure of a part's section round its course, across an opening a neighbour fills.
 *
 * A part fitted on its own side of a dividing surface has sections that are open where the surface cuts them. The fit reads a closed
 * section, and the construction reads more than the fit does: a composed end takes each child's whole root section in its end plane,
 * crosses neighbouring sections for the forks and reads the seam as the valley of the two walls' union
 * (`IAutoMovieConstructionSplit.ICompose`), and a join on a declared loop reads the part's face through the loop with its 2-jet
 * (`AutoMovieSolidSharedCurve`). So the buried arc of a root section is not free wall. It is the part itself where the host or a
 * neighbour covers it, and this module builds it as that: the part's own tube continued (`continued`).
 *
 * What others do with the buried part of a limb, read for this choice (`packages/human/docs/techniques/joints-one-shot.md`, The
 * correction): aircraft lofting defines the wing through the fuselage to the centreline and makes it real only outside, with a
 * tangent arc fillet between the two surfaces (Raymer, Aircraft Design, sections 4.3 and 7.8); convolution surfaces run each skeleton
 * segment to its end inside the junction and add the fields (Bloomenthal and Shoemake 1991); a feature wireframe and a base mesh
 * have no buried part at all and fill the branch with patches or a hull between closed sections that stand off it (Wang 2005; the
 * skin modifier). This engine's composed end is of the first kind: it needs the continued section.
 */
export namespace FamilyConicClosure {
  /** A point or a direction of a section's chart, mm. */
  export type P = [number, number];

  /** The step a continued closure is laid in round the course, radians: a degree. */
  export const CONTINUED_STEP: number = Math.PI / 180;

  /**
   * The buried part of a section as the part's own tube continued: at each phase of the opening, the radius about the course of the
   * part's whole section (`tube`), brought to the kept skin's radius and direction at both of the opening's ends.
   *
   * A part that enters a host does continue inside it: the bone and its tissue run on along the part's course. Where the part stands
   * free its section is known, and the buried arc of a root section is that section carried along the course, as a wing's sections are
   * carried through a fuselage to be trimmed by it. The ratio of the closure's radius to the tube's is a cubic in the phase, in its
   * logarithm, that takes the kept skin's ratio and its rate at the two ends, so the closed section passes through the skin's ends
   * with the skin's own directions and is the tube itself where the kept skin already lies on the tube. Two neighbouring rays
   * continued this way overlap by a lens, each one's buried arc inside the other's section and the two crossing at the kept skins'
   * ends, which is what a composed end reads of its children; a part on a host's side is a tube inside the host. Nothing is chosen:
   * there is no far point, no depth and no turn.
   *
   * Premises, refused by name: the tube is positive at both ends; each end of the kept skin advances round the course in the
   * opening's sense (a skin end that runs back in phase has no radius function to continue).
   *
   * @param exit Where the kept skin leaves, mm from the course point.
   * @param leaving The skin's unit direction of travel there.
   * @param entry Where the kept skin comes back.
   * @param arriving The skin's unit direction of travel there.
   * @param tube The part's whole section: its radius about the course point at a phase, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation In polar form about the course, a curve's rate of `ln r` in the phase is the ratio of its direction's radial and circumferential parts; the cubic Hermite of the log ratio matches value and rate at both ends, so the closure is C1 with the kept skin and equals the tube where both ratios are one and both rates agree.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two end readings, one cubic, one pass over the opening's phases.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No far point, depth, turn or margin; a premise that fails returns its name and numbers and no closure.
   * @evidence contracts/development/implementation.md#efficient-algorithms One tube reading a degree of opening and four for the end rates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller prepares the tube once for a part.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the closure's points.
   * @evidence contracts/development/common.md#meaningful-documentation States the construction, its premises and each refusal.
   */
  export function continued(exit: P, leaving: P, entry: P, arriving: P, tube: (phase: number) => number): P[] | string {
    const start: number = Math.atan2(exit[1], exit[0]);
    const gap: number = (((Math.atan2(entry[1], entry[0]) - start) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (!(gap > 0)) return "the opening spans no phase";
    // The rate of ln r in the phase along a direction at a point: its radial part over its circumferential part.
    const rate = (at: P, along: P, label: string): number | string => {
      const r: number = Math.hypot(at[0], at[1]);
      const [radial, round]: [number, number] = [(along[0] * at[0] + along[1] * at[1]) / r, (along[1] * at[0] - along[0] * at[1]) / r];
      return round > 1e-9 ? radial / round : `the kept skin's ${label} does not advance round the course (circumferential part ${round})`;
    };
    const [one, two]: (number | string)[] = [rate(exit, leaving, "exit"), rate(entry, arriving, "entry")];
    if (typeof one === "string") return one;
    if (typeof two === "string") return two;
    const [w0, w1]: [number, number] = [tube(start), tube(start + gap)];
    if (!(w0 > 0 && w1 > 0)) return `the part's whole section has no radius at the opening's ends (${w0} and ${w1} mm)`;
    const slope = (phase: number): number => (Math.log(tube(phase + CONTINUED_STEP / 2)) - Math.log(tube(phase - CONTINUED_STEP / 2))) / CONTINUED_STEP;
    const [h0, h1]: [number, number] = [Math.log(Math.hypot(exit[0], exit[1]) / w0), Math.log(Math.hypot(entry[0], entry[1]) / w1)];
    const [m0, m1]: [number, number] = [(one - slope(start)) * gap, (two - slope(start + gap)) * gap];
    const count: number = Math.max(2, Math.ceil(gap / CONTINUED_STEP));
    const out: P[] = [];
    for (let k: number = 1; k < count; ++k) {
      const t: number = k / count;
      const h: number = (2 * t * t * t - 3 * t * t + 1) * h0 + (t * t * t - 2 * t * t + t) * m0 + (-2 * t * t * t + 3 * t * t) * h1 + (t * t * t - t * t) * m1;
      const phase: number = start + gap * t;
      const r: number = tube(phase) * Math.exp(h);
      out.push([r * Math.cos(phase), r * Math.sin(phase)]);
    }
    return out;
  }
}
