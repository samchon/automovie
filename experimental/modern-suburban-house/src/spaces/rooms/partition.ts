import type { IHousePart } from "../../types/IHousePart";
import type { IWallHole } from "../../types/IWallHole";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import { straightWall } from "../straightWall";
import type { StoreyId } from "../StoreyId";
import { partitionSpan } from "./partitionSpan";

/**
 * A straight 0.15 m interior partition with its door voids.
 *
 * `axis` is the world axis the wall runs along, `across` its thickness range,
 * `along` its length range. Door holes are given in the same `along`
 * coordinate with world heights.
 */

export const partition = (props: {
  id: string;
  owner: string;
  storey: StoreyId;
  axis: "x" | "z";
  across: readonly [number, number];
  along: readonly [number, number];
  holes?: readonly IWallHole[];
}): IHousePart => {
  const [bottom, top] = partitionSpan(props.storey);
  return part(
    props.id,
    props.owner,
    "partition",
    PALETTE.interiorWall,
    straightWall({
      axis: props.axis,
      across: props.across,
      along: props.along,
      bottom,
      top,
      holes: props.holes,
    })
  );
};
