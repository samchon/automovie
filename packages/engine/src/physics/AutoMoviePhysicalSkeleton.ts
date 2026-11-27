import type {
  IAutoMovieMark,
  IAutoMovieMarkSkeleton,
  IAutoMoviePhysicalSegmentState,
} from "@automovie/interface";

/** Inspection marks for cached physical skeletons. */
export namespace AutoMoviePhysicalSkeleton {
  /**
   * Turn articulated bodies at one cached instant into inspection marks: one bone
   * segment per joint, from the parent segment's position to the child's, and one
   * joint point per segment.
   *
   * It works on any body a physical profile describes, whatever its rig. A bone
   * mark has kind `bone`, label `bone`, colour ochre `c8a24a` and path
   * `<body>/<child>/bone`; a joint mark has kind `joint`, label `joint`, colour
   * pink `ff7eb6` and path `<body>/<bone>/joint`, so a pattern naming a body or
   * one of its bones selects its marks. Both are in world metres and unanchored,
   * because the cached positions are world positions.
   *
   * It throws naming the body and bone when the frame lacks a segment the profile
   * names.
   *
   * ```ts
   * const marks = AutoMoviePhysicalSkeleton.mark({
   *   bodies,
   *   frame: cache.at(seconds),
   * });
   * ```
   *
   * @param props.bodies Scene body ids with their profiles, whose joints and
   *   segments are drawn.
   * @param props.frame The cached state at the drawn second.
   * @returns Every body's bone marks in joint order, then its joint marks in
   *   segment order, body by body.
   */
  export function mark(
    props: IAutoMovieMarkSkeleton.IProps,
  ): IAutoMovieMark[] {
    const marks: IAutoMovieMark[] = [];
    for (const body of props.bodies) {
      const at: (bone: string) => number[] = (bone: string): number[] => {
        const state: IAutoMoviePhysicalSegmentState | undefined =
          props.frame.bodies[body.id]?.[bone];
        if (state === undefined)
          throw new Error(
            `markAutoMovieSkeleton: the frame has no segment ${body.id}/${bone}`,
          );
        return [state.position.x, state.position.y, state.position.z];
      };
      for (const joint of body.profile.joints)
        marks.push({
          path: `${body.id}/${joint.child}/bone`,
          kind: "bone",
          label: "bone",
          color: 0xc8a24a,
          shape: {
            type: "segments",
            points: [...at(joint.parent), ...at(joint.child)],
          },
          flagged: false,
          anchor: null,
        });
      for (const segment of body.profile.segments)
        marks.push({
          path: `${body.id}/${segment.bone}/joint`,
          kind: "joint",
          label: "joint",
          color: 0xff7eb6,
          shape: { type: "points", points: at(segment.bone) },
          flagged: false,
          anchor: null,
        });
    }
    return marks;
  }
}
