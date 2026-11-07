import {
  type preparePhysicalGeometry as Geometry,
  projectPhysicalSupportReach,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { FilmBodyRig as Rig } from "../rig/FilmBodyRig";
import { FilmVector as V } from "../rig/FilmVector";
import { Foot } from "../rig/Foot";
import { filmTrunkFromSegments } from "../rig/filmTrunkFromSegments";
import { filmKickApproach } from "./filmKickApproach";
import type { filmKickGeometry } from "./filmKickGeometry";

/** Resolve all receiver-relative approaches from one snapshot, then translate each authored target tree coherently. This stage changes authoring goals only; the original planted goals and shared fitting remain authoritative. */
export function filmKickApproaches(
  contexts: Record<string, filmKickGeometry.IContext>,
  policy: Omit<Parameters<typeof projectPhysicalSupportReach>[0], "supports">,
  options: {
    actualTrunks: boolean;
    enabled: boolean;
    geometry?: Geometry.IQueries;
  },
): Record<string, ReturnType<typeof projectPhysicalSupportReach>> {
  const approach: Record<
    string,
    ReturnType<typeof projectPhysicalSupportReach>
  > = {};
  for (const [id, context] of Object.entries(contexts)) {
    const opponent: filmKickGeometry.IContext | undefined =
      contexts[id === "a" ? "b" : id === "b" ? "a" : ""];
    const supports: Parameters<
      typeof projectPhysicalSupportReach
    >[0]["supports"] = (["left", "right"] as const).flatMap(
      (
        side: "left" | "right",
      ): Parameters<
        typeof projectPhysicalSupportReach
      >[0]["supports"][number][] => {
        const leg: (typeof context.frame.legs)[typeof side] =
          context.frame.legs[side];
        if (leg.kind !== "place" || leg.placement.lift !== 0) return [];
        const ankle: V.Value = options.actualTrunks
          ? V.tuple(context.trunk.segments[`${side}Foot`]!.position)
          : Foot.goals(leg.placement, context.rig.footVector).ankle;
        return [
          {
            origin: V.vector(context.trunk.hipJoints[side]),
            target: V.vector(ankle),
            radius:
              0.95 * (context.rig.legLengths[0] + context.rig.legLengths[1]),
          },
        ];
      },
    );
    approach[id] =
      opponent && options.enabled
        ? filmKickApproach(
            context,
            opponent,
            supports,
            policy,
            options.geometry,
          )
        : {
            translation: { x: 0, y: 0, z: 0 },
            maximumExcess: 0,
            converged: true,
          };
  }

  // Compute every result before applying travel, so iteration order never supplies
  // one actor with a receiver that the previous actor has already moved.
  for (const [id, context] of Object.entries(contexts)) {
    const delta: V.Value = V.tuple(approach[id]!.translation);
    if (V.length(delta) === 0) continue;
    context.root = {
      ...context.root,
      position: V.add(context.root.position, delta),
    };
    context.trunk = translated(context.trunk, context.rig.profile, delta);
    if (context.authored)
      context.authored = translated(context.authored, context.rig.profile, delta);
    if (context.nominal)
      context.nominal = translated(context.nominal, context.rig.profile, delta);
  }
  return approach;
}

/** Translate every collider and its semantic landmarks together, preserving the separate nominal aiming hint. */
function translated(trunk: Rig.Trunk, profile: P, delta: V.Value): Rig.Trunk {
  const segments: Record<string, P.ITransform> = Object.fromEntries(
    Object.entries(trunk.segments).map(
      ([bone, pose]: [string, P.ITransform]): [string, P.ITransform] => [
        bone,
        { ...pose, position: V.vector(V.add(V.tuple(pose.position), delta)) },
      ],
    ),
  );
  return {
    ...filmTrunkFromSegments(segments, profile),
    head: V.add(trunk.head, delta),
    headCenter: V.add(trunk.headCenter, delta),
  };
}
