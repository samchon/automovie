import type {
  IAutoMovieScript,
  IAutoMovieStageActor,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { describeInvalidValue } from "../../../validation/internal/describeInvalidValue";

/*
 * Check the correspondence between the cast and its placements. Duplicate cast
 * ids keep their first member. Every actor claims its staged id even when it
 * has another fault. A mount needs another placed actor as its parent.
 * Diagnostics follow cast declarations, missing placements and actor order.
 */
export function admitStageCast(
  declared: readonly CastMember[],
  actors: readonly IAutoMovieStageActor[],
  claim: (id: string, path: string) => void,
  out: IAutoMovieViolationCollector,
): Map<string, CastMember> {
  const cast: Map<string, CastMember> = new Map();
  const castIndex: Map<string, number> = new Map();
  declared.forEach((member: CastMember, index: number): void => {
    const existing: number | undefined = castIndex.get(member.node);
    if (existing !== undefined) {
      out.push(
        "type",
        `$script.cast[${index}].node`,
        `script cast node "${describeInvalidValue(member.node)}" is duplicated; first declared at $script.cast[${existing}].node`,
        member.node,
      );
      return;
    }
    cast.set(member.node, member);
    castIndex.set(member.node, index);
  });

  const placed: Set<string> = new Set(
    actors.map((actor: IAutoMovieStageActor): string => actor.node),
  );
  declared.forEach((member: CastMember, index: number): void => {
    if (!placed.has(member.node))
      out.push(
        "type",
        "$input.actors",
        `cast node "${describeInvalidValue(member.node)}" (cast[${index}]) must be placed by staging`,
        member.node,
      );
  });

  actors.forEach((actor: IAutoMovieStageActor, index: number): void => {
    const path: string = `$input.actors[${index}]`;
    claim(actor.node, `${path}.node`);
    if (!cast.has(actor.node))
      out.push(
        "type",
        `${path}.node`,
        `placement must name a script cast node, but "${describeInvalidValue(actor.node)}" is not in the cast`,
        actor.node,
      );
    if (actor.attach === undefined) return;
    if (actor.attach.parent === actor.node)
      out.push(
        "type",
        `${path}.attach.parent`,
        "a node cannot ride itself",
        actor.attach.parent,
      );
    else if (!placed.has(actor.attach.parent))
      out.push(
        "type",
        `${path}.attach.parent`,
        `mount parent "${describeInvalidValue(actor.attach.parent)}" must be a placed actor`,
        actor.attach.parent,
      );
  });
  return cast;
}

/*
 * A script member whose model is resolved by its declared node id.
 */
type CastMember = IAutoMovieScript["cast"][number];
