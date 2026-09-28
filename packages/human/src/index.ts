/**
 * The face and the body are the same kind of problem against the same engine:
 * a connected numerical basis, compact documents against it, and a static
 * export. Each anatomy lives in its own folder at this one level, and the
 * body imports what it shares with the face (region splitting, normals, the
 * document text envelope) rather than copying it.
 *
 * One level, not a taxonomy. Each folder's internals keep their own shape.
 */
export * from "./body";
export * from "./face";
