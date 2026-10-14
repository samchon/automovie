/**
 * Conventional display target ((50+16)/116) cubed for the upper CIELAB lightness
 * branch at L*=50. It selects numerical calibration rather than certifying a
 * current rendered grey card; the fixed scalar has no native resource lifetime.
 */
export const HUMAN_PREVIEW_MIDDLE_GREY: number = ((50 + 16) / 116) ** 3;
