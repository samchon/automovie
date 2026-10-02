/**
 * The face and the body are the same kind of problem against the same engine:
 * a connected numerical basis, compact documents against it, and a static
 * export. Each anatomy lives in its own folder at this one level, and what
 * both need (region splitting, normals, the document text envelope, the glTF
 * extensions) lives in `common`, which imports neither of them. Dependencies
 * run `face -> common <- body` and never between the two anatomies; `human`
 * composes both into one person and is imported by neither.
 */
export * from "./body";
export * from "./common";
export * from "./face";
export * from "./human";
