/**
 * How a bounded body stands to a set of section planes.
 *
 * `cut` is a fact: some single plane removed the whole body. `crossed` is only
 * the absence of that fact — no one plane removed it whole — and does NOT
 * promise a surviving point, because two planes can between them remove a body
 * that neither removes alone. Reading `crossed` as "partly visible" is the
 * mistake this union is named to prevent.
 */
export type AutoMovieSectionPlaneState = "kept" | "cut" | "crossed";
