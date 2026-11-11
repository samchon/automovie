/**
 * The options `automovie review` takes, written `--<name>`; it takes no other.
 *
 * `readAutoMovieReviewOptions` refuses any option outside the list, and a test enumerates them against the render README's key table, so each option the command takes is documented with the requirement it serves.
 */
export const AUTOMOVIE_REVIEW_OPTIONS: readonly string[] = ["url", "seconds", "out"];
