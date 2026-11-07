import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Fighter } from "../motion/fighter/Fighter";
import { Strike } from "../motion/striking/Strike";
import { FilmEvents } from "../runtime/FilmEvents";
import { BoutScript } from "../shots/kickboxing/ring-bout/BoutScript";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";

/** Select reacting anatomical branches. Normal placement remains authored; only a real finishing contact can release the complete receiver in Engine. */
export function boutDynamicSegments(
  profile: P,
  id: FilmPlan.ActorId,
  seconds: number,
): string[] {
  if (id === "referee") return [];
  const roots: Set<string> = new Set();
  if (Fighter.touchWeight(seconds) > 0) roots.add("leftUpperArm");
  for (const action of BoutScript.actions) {
    if (!Strike.envelope(action, seconds).active) continue;
    const kick: boolean = BoutScript.specs[action.technique].limb === "leg";
    if (action.actor === id) {
      const side: "left" | "right" = BoutScript.specs[action.technique].side;
      roots.add(`${side}${kick ? "UpperLeg" : "UpperArm"}`);
      if (kick) roots.add(`${side}UpperArm`);
    } else {
      const relation: ReturnType<typeof FilmEvents.relation> =
        FilmEvents.relation(action);
      if (relation === "guard") {
        roots.add("leftUpperArm");
        roots.add("rightUpperArm");
      } else if (relation === "head") roots.add("neck");
      else if (relation === "shin-check") roots.add("leftUpperLeg");
      else if (relation === "body") {
        if (BoutScript.specs[action.technique].target === "leg") {
          roots.add("leftUpperLeg");
          roots.add("rightUpperLeg");
        } else roots.add("spine");
      }
    }
  }
  const selected: Set<string> = new Set(roots);
  /** The provider hierarchy closes each selected subtree. */
  function descend(parent: string): void {
    for (const joint of profile.joints.filter(
      (joint: P.IJoint): boolean => joint.parent === parent,
    )) {
      selected.add(joint.child);
      descend(joint.child);
    }
  }
  for (const root of roots) descend(root);
  return profile.segments
    .filter((segment: P.ISegment): boolean => selected.has(segment.bone))
    .map((segment: P.ISegment): string => segment.bone);
}
