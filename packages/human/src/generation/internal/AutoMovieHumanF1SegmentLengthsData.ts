import type { IAutoMovieHumanSegmentJoint } from "@automovie/interface";
import { AutoMovieHumanF1Placing as T } from "../AutoMovieHumanF1Placing";
import type { AutoMovieVector3Tuple } from "@automovie/interface";

/*
 * The fingers and their segment prefixes; the thumb's bones are its metacarpal's, proximal's and distal's.
 */
export const FINGERS: readonly string[] = ["index", "middle", "ring", "pinky", "thumb"];

export const joint = (name: string): IAutoMovieHumanSegmentJoint => {
  const found: IAutoMovieHumanSegmentJoint | undefined = T.CHAIN.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === name);
  if (found === undefined) throw new Error("f1's chain has no joint " + name);
  return found;
};

export const norm = (v: AutoMovieVector3Tuple): number => Math.hypot(v[0], v[1], v[2]);
