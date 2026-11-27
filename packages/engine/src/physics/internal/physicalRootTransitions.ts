import type { IAutoMovieFootfallPattern } from "@automovie/interface";

import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";
import type { AutoMovieEngineXpbdWorld } from "../AutoMovieEngineXpbdWorld";
import { AutoMovieEnginePhysicalRootBounds } from "../AutoMovieEnginePhysicalRootBounds";

/*
 * The support transitions a root task carries (`trackPhysicalRoot`): the force
 * bounds of the contacts of the limbs leaving and entering the stance
 * (`AutoMovieEnginePhysicalRootBounds`), on their carriers' bodies; the lifted limbs'
 * contacts released to the contact passes, so their swings move them off the
 * floor; and every stance limb's carriers kept the task's stance whatever
 * their load, so their legs keep their posture rows.
 * Parameter input: The body's support pattern, its segments by bone, the stance
 * limbs, the limbs asked to step that have not lifted, the lifted limbs, the
 * feet's seating shares and the vertical force the stance is asked for,
 * newtons.
 * Returns: The task's bounds, released contacts and stance, each present only
 * when not empty.
 */
export function physicalRootTransitions(input: {
  pattern: readonly IAutoMovieFootfallPattern["limbs"][number][];
  segments: ReadonlyMap<string, AutoMovieEngineXpbdBody>;
  stance: readonly IAutoMovieFootfallPattern["limbs"][number][];
  requested: readonly string[];
  lifted: readonly string[];
  seating?: Readonly<Record<string, { bearing?: number; entry?: number }>>;
  force: number;
}): Pick<AutoMovieEngineXpbdWorld.IRootTask, "bounds" | "released" | "stance"> {
  const carriers = (bone: string | undefined): AutoMovieEngineXpbdBody[] => {
    const limb: IAutoMovieFootfallPattern["limbs"][number] | undefined =
      input.pattern.find(
        (candidate: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
          candidate.bone === bone,
      );
    return limb
      ? (limb.contacts ?? [limb.bone]).flatMap(
          (carrier: string): AutoMovieEngineXpbdBody[] => {
            const rigid: AutoMovieEngineXpbdBody | undefined =
              input.segments.get(carrier);
            return rigid ? [rigid] : [];
          },
        )
      : [];
  };
  const bounds: AutoMovieEngineXpbdWorld.IBound[] = AutoMovieEnginePhysicalRootBounds.set({
    force: input.force,
    requested: input.requested,
    stance: input.stance.map(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): string => limb.bone,
    ),
    ...(input.seating ? { seating: input.seating } : {}),
  }).flatMap(
    (bound: AutoMovieEnginePhysicalRootBounds.IBound): AutoMovieEngineXpbdWorld.IBound[] => {
      const bodies: AutoMovieEngineXpbdBody[] = carriers(bound.bone);
      return bodies.length > 0 ? [{ bodies, force: bound.force }] : [];
    },
  );
  const released: AutoMovieEngineXpbdBody[] = input.lifted.flatMap(
    (bone: string): AutoMovieEngineXpbdBody[] => carriers(bone),
  );
  const stance: AutoMovieEngineXpbdBody[] = input.stance.flatMap(
    (limb: IAutoMovieFootfallPattern["limbs"][number]): AutoMovieEngineXpbdBody[] =>
      carriers(limb.bone),
  );
  return {
    ...(bounds.length > 0 ? { bounds } : {}),
    ...(released.length > 0 ? { released: new Set(released) } : {}),
    ...(stance.length > 0 ? { stance } : {}),
  };
}
