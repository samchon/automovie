/**
 * The options `automovie inspect` takes for itself, written `--<name>`; every other option is a key of the capture request grammar and becomes the page's address.
 *
 * A test enumerates them against the render README's key table, so each option the command takes is documented with the requirement it serves.
 */
export const AUTOMOVIE_INSPECT_OPTIONS: readonly string[] = ["module", "port", "props"];
