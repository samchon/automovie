import type { IAutoMovieHumanPersonHeadSolveTable } from "../structures/IAutoMovieHumanPersonHeadSolveTable";

/**
 * The head solve (`solveHumanPersonHead`): four head measurements met by eight
 * face channels, head circumference pursued second.
 *
 * Each channel moves a distinct effect, read from the measured response of
 * every head rule to every channel at both ends on the neutral person:
 * - `headHeight` raises the whole head, so it moves tragion–top of head and
 *   menton–sellion together;
 * - `foreheadHeight` raises the forehead and vault only: tragion–top of head,
 *   not menton–sellion;
 * - `chinHeight` lengthens the lower face only: menton–sellion;
 * - `headDepth` deepens the head front to back: head length (and
 *   circumference);
 * - `posteriorHeadDepth` deepens the back of the head only: head length;
 * - `headWidth` widens the head: head breadth, with 1.52 mm of circumference
 *   per millimetre of breadth;
 * - `cranialBreadth` widens the vault: head breadth, with 0.80 mm of
 *   circumference per millimetre of breadth;
 * - `templeWidth` fills the temples: circumference with almost no breadth.
 *
 * Eight channels for four measurements leave a choice. Head circumference is
 * pursued within it, then the solve takes the one that departs least from the
 * standard head (`humanPersonHeadDeparture`). Circumference is not met
 * outright: with head length and breadth held, these channels move it by about
 * +12 / −22 mm, while ANSUR II subjects' circumference exceeds the ellipse of
 * their own head length and breadth by 1.3 % to 7.3 % (5th to 95th
 * percentile) against 0.7 % to 1.3 % for this head. The remaining miss is a
 * named gap: the head shape space has no channel for cranial fullness at a
 * given length and breadth, and the hair the ANSUR tape compresses cannot be
 * separated from the data. The head outline blends are not used: each mixes
 * several of these effects.
 *
 * @author Samchon
 */
export const HUMAN_PERSON_HEAD_SOLVE: IAutoMovieHumanPersonHeadSolveTable = {
  measurements: ["tragionTopOfHead", "headLength", "headBreadth", "mentonSellionLength"],
  secondary: ["headCircumference"],
  channels: ["headHeight", "foreheadHeight", "chinHeight", "headDepth", "posteriorHeadDepth", "headWidth", "cranialBreadth", "templeWidth"],
};
