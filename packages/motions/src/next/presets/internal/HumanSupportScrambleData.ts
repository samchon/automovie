import { HumanSupportContacts } from "../HumanSupportContacts";
import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";
import { getUp } from "../../../floor/internal/getUp";

export const { FEET, on } = HumanSupportContacts;

/*
 * Lead with the left foot while the right knee carries the body onto the ledge.
 */
export const HALF_KNEEL: IAutoMovieMotionHumanSupport.IStance["prefer"] =
  getUp.halfKneeling("left");
