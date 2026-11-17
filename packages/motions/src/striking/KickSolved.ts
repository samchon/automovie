import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The contacts a kick's plan has solved, kept across the rebuilds of its
 * geometry.
 *
 * A kick's geometry is dropped whenever the performance settles (another
 * action was placed, a stop was committed) and built again on its next read:
 * once at its placement, once for each change of the stops the contact
 * resolution installs, and once for the display, three or four times a kick.
 * Each build solved its contacts again: the launch's carriage search (up to
 * eight leans of up to four step rounds of up to eight whole-posture fits,
 * `KickContact.choose`) and one more contact for each correction of the aim
 * that had arrived. A contact is a function of the goal, the step and the
 * lean it is asked with and of what the kick read at its launch (the aimed
 * point, which gives the line, the travel and the pelvis's turn), with the
 * body, the entry and the timing the plan's own. So the plan keeps each
 * contact with the arguments it was solved for, and a rebuilt geometry reads
 * it back while the launch reads the same; what the launch reads differently
 * (a partner shown elsewhere at that second) drops them all.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how often a geometry is rebuilt, what each build repeated, what a contact depends on and when the kept ones are dropped.
 * @evidence contracts/development/design.md#principled-representation The launch's reading and a list of solved contacts with their exact arguments; equality is of every component, never a tolerance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record, its constructor, the launch's admission and the lookup, read by the kick's geometry alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing is keyed by time or by text; a contact is read back only for the arguments it was solved for under the same launch.
 */
export namespace KickSolved {
  /**
   * One plan's solved contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds and when it is absent.
   * @evidence contracts/development/design.md#principled-representation The launch's inputs as read and the contacts solved under them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by `under` and `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact's type is the geometry's own, passed as a parameter.
   */
  export interface ISolved<P> {
    /** The point aimed at when the kick was launched, world metres; absent before the first build. */
    first?: IAutoMovieVector3;

    /** The line a redirect keeps of its source; absent for a fresh kick. */
    line?: IAutoMovieVector3;

    /** The step a redirect keeps of its source, metres; absent for a fresh kick. */
    step?: number;

    /** The contacts solved under that launch, each with its arguments. */
    plans: {
      goal: IAutoMovieVector3;
      decided: number | undefined;
      prefer: number | undefined;
      planned: P;
    }[];
  }

  /**
   * A plan's empty record.
   *
   * @returns The record, holding no contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation A plan starts with nothing solved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The record lives with the plan that made it.
   */
  export function create<P>(): ISolved<P> {
    return { plans: [] };
  }

  /**
   * Admit a build's launch: the kept contacts stay while the launch reads
   * the same point, line and step, and are dropped otherwise.
   *
   * @param solved The plan's record.
   * @param first The point aimed at when the kick is launched, world metres.
   * @param line The line a redirect keeps; absent for a fresh kick.
   * @param step The step a redirect keeps, metres; absent for a fresh kick.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is compared and what a difference does.
   * @evidence contracts/development/implementation.md#principled-implementation Every contact was solved on the line, the travel and the turn the launch's point gives, so another point voids them all.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison and one reset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Components are compared exactly; no nearly-equal launch keeps a contact.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A comparison.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Dropped contacts are released at once.
   */
  export function under<P>(
    solved: ISolved<P>,
    first: IAutoMovieVector3,
    line: IAutoMovieVector3 | undefined,
    step: number | undefined,
  ): void {
    if (
      solved.first !== undefined &&
      same(solved.first, first) &&
      solved.step === step &&
      (solved.line === undefined
        ? line === undefined
        : line !== undefined && same(solved.line, line))
    )
      return;
    solved.first = first;
    solved.plans.length = 0;
    if (line === undefined) delete solved.line;
    else solved.line = line;
    if (step === undefined) delete solved.step;
    else solved.step = step;
  }

  /**
   * A contact for a goal, a step and a lean: the one already solved for
   * exactly those, or a new one, kept.
   *
   * @param solved The plan's record, admitted for this build's launch (`under`); none solves without keeping.
   * @param goal The planned point, world metres.
   * @param decided The step when it is decided, metres.
   * @param prefer The lean tried first, degrees.
   * @param make Solve the contact.
   * @returns The contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the lookup, its key and the case with no record.
   * @evidence contracts/development/implementation.md#principled-implementation A contact is a function of these three arguments under one launch, so the same arguments give the contact already solved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan, else one solve and one push.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact equality of every argument; a contact solved for another lean or step is never returned.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of at most one contact per aim observation, a dozen, against a search of whole-posture fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Equivalence is the same launch (`under`) and the same goal, step and lean; the body, the entry and the timing are the plan's own and do not change.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most the launch's contact and one per correction of the aim, released with the plan or when the launch reads differently.
   */
  export function plan<P>(
    solved: ISolved<P> | undefined,
    goal: IAutoMovieVector3,
    decided: number | undefined,
    prefer: number | undefined,
    make: () => P,
  ): P {
    if (solved === undefined) return make();
    for (const known of solved.plans)
      if (
        known.decided === decided &&
        known.prefer === prefer &&
        same(known.goal, goal)
      )
        return known.planned;
    const planned: P = make();
    solved.plans.push({ goal, decided, prefer, planned });
    return planned;
  }

  /** Whether two points have the same components exactly. */
  function same(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  }
}
