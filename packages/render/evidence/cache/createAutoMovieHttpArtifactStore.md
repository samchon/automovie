# src/cache/createAutoMovieHttpArtifactStore.ts#createAutoMovieHttpArtifactStore

## @evidence contracts/development/implementation.md#principled-implementation

Uses the Fetch standard's methods and status codes and Web Crypto's SHA-256, which equals Node's createHash digest on the server, so both sides verify the same content digest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Transport only; the engine resolver decides reuse and the middleware owns files.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only 404 means absent; every other failure rejects instead of being read as a miss.

## @evidence contracts/development/implementation.md#efficient-algorithms

One request per operation; digest cost is linear in artifact bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The store shares nothing itself; the engine resolver decides reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each request's body is held only until it resolves; no connection or cache is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States why the store is server-backed, the routes and header, the secure-context requirement and failure behavior.
