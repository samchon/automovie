/**
 * How many samples go round each lingual ring.
 *
 * The count is a tessellation choice, not a measurement. `buildPortraitTongue`
 * lays its vertices out ring by ring with this many samples, so every reader of
 * that layout, `portraitTongueStation` included, takes the count from here.
 *
 * @author Samchon
 */
export const portraitTongueColumns = 48;
