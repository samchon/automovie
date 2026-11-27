/**
 * How the film response stage keeps the alpha of a picture drawn over a
 * transparent clear; where a stage takes it, absent draws an opaque picture
 * whose alpha is 1.
 *
 * - `transparent`: the beauty layer over a transparent background. Alpha is the
 *   scene's coverage, the glare spreads it with the light, and a participating
 *   medium adds its own opacity in front of it, so in linear light the layer
 *   composited over a backdrop equals the opaque picture of that backdrop.
 * - `coverage`: the graphics plate, whose alpha is the drawn graphics' coverage
 *   alone; a medium dims and lights only what they cover.
 *
 * In both the stage carries colour associated with alpha through its filters
 * and gives the response, exposure to grade, to straight colour, leaving alpha
 * unchanged. Because the response is not linear, a layer composited after it
 * matches the opaque picture exactly only where alpha is 0 or 1; a partly
 * covered pixel, a soft edge or thin haze, is responded on its own colour
 * rather than on its mix with the backdrop. Glare a bright source spreads past
 * its coverage is light with almost no alpha, which straight 8-bit alpha cannot
 * hold after a saturating curve, so such a halo falls to nothing in the layer;
 * only associated output can carry light without coverage (Porter and Duff's
 * luminescent pixels), so a halo that matters belongs in the opaque film.
 */
export type AutoMovieRenderFilmAlpha = "transparent" | "coverage";
