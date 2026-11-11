import type { IAutoMoviePhysicalProfile } from "@automovie/interface";

import type { IAutoMovieMark } from "../geometry/IAutoMovieMark";
import type { AutoMoviePhysicsCache } from "./AutoMoviePhysicsCache";

/**
 * Turn articulated bodies at one cached instant into inspection marks: one bone segment per joint, from the parent segment's position to the child's, and one joint point per segment.
 *
 * It works on any body a physical profile describes, whatever its rig. A bone mark has kind `bone`, label `bone`, colour ochre `c8a24a` and path `<body>/<child>/bone`; a joint mark has kind `joint`, label `joint`, colour pink `ff7eb6` and path `<body>/<bone>/joint`, so a pattern naming a body or one of its bones selects its marks. Both are in world metres and unanchored, because the cached positions are world positions.
 *
 * It throws naming the body and bone when the frame lacks a segment the profile names.
 *
 * ```ts
 * const marks = markAutoMovieSkeleton({ bodies, frame: cache.at(seconds) });
 * ```
 *
 * @param props.bodies Scene body ids with their profiles, whose joints and segments are drawn.
 * @param props.frame The cached state at the drawn second.
 * @returns Every body's bone marks in joint order, then its joint marks in segment order, body by body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is drawn and from which data, the kinds, labels, colours, paths and frame of both mark kinds, the refusal, and shows the call.
 * @evidence contracts/development/implementation.md#principled-implementation A profile joint connects a parent segment to a child segment, so its bone is the line between the two segments' cached world positions, and each segment's position is where its joint sits; nothing is inferred from a rig's bone names.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over each body's joints, one over its segments.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing segment is refused instead of drawn at the origin, and no body or bone is treated specially; the two colours are a drawing convention chosen apart from every other kind's.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the joints and segments of the bodies.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one instant.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh marks and keeps nothing.
 */
export function markAutoMovieSkeleton(props: {
  bodies: readonly { id: string; profile: IAutoMoviePhysicalProfile }[];
  frame: AutoMoviePhysicsCache.IFrame;
}): IAutoMovieMark[] {
  const marks: IAutoMovieMark[] = [];
  for (const body of props.bodies) {
    const at: (bone: string) => number[] = (bone: string): number[] => {
      const state: AutoMoviePhysicsCache.ISegment | undefined =
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
