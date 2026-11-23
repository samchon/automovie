# src/human/skeleton/IAutoMovieHumanCrotchBinding.ts#IAutoMovieHumanCrotchBinding

## @evidence contracts/development/common.md#meaningful-documentation

The point and spatial half-width of a crotch skin-binding release, in metres. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IRelease declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IRelease separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanCrotchBinding exchanges the named IRelease contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/skeleton/IAutoMovieHumanCrotchBinding.ts#IAutoMovieHumanCrotchBinding.IRelease

## @evidence contracts/development/common.md#meaningful-documentation

Where the release lies.

## @evidence contracts/development/design.md#principled-representation `at`: Point where the release is half done, metres. `half`: Half of the release, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanCrotchBinding.release. Also types AutoMovieHumanCrotchBinding.moved.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `half`; callers supply the complete record.
