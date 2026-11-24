/**
 * One wall of a furnished room, named by the room-frame axis it closes.
 *
 * The room frame has its origin at the floor centre, so for a room of width `w`
 * and depth `d` the walls' inner faces are the planes `x = -w/2` (`"-x"`), `x =
 * +w/2` (`"+x"`), `z = -d/2` (`"-z"`) and `z = +d/2` (`"+z"`).
 */
export type AutoMovieFurnishingWall = "-z" | "+z" | "-x" | "+x";
