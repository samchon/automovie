# src/serveAutoMovieDrawPage.ts#serveAutoMovieDrawPage

## @evidence contracts/development/common.md#meaningful-documentation

States what is generated and where, how the build is configured and why, where the server listens, what the return holds, and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A built page served by `vite preview` does not rebuild or reload while pages draw, which the development server does on a new import; the scratch folder sits inside the production so bare imports resolve from its own dependencies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Generate through `writeAutoMovieModulePage`, which the inspector page shares, build, find a port, preview; the draw function and subjects are the page's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The production's page and configuration file are left untouched; the generated page replaces only the build input.

## @evidence contracts/development/implementation.md#efficient-algorithms

One build per host; every capture of the host reuses the served page.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The built page serves every subject and round of one host.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The server and the scratch folder are owned by the returned `close`, which stops one and deletes the other; a failed start deletes the folder before rejecting.
