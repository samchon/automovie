/**
 * Names the two logical authored passes of one shared manuscript.
 *
 * `draft` means construction. `final` means scripts/screenplay naturalness. They select
 * `docs/body` and `docs/naturalness` respectively; construction evidence is detached,
 * while naturalness evidence stays inline in the working text.
 *
 * Naturalness compares its working text with the frozen construction snapshot
 * in `docs/revision`. The source flag chooses upstream approval dependencies.
 */
export type AuthoredPass = "draft" | "final";
