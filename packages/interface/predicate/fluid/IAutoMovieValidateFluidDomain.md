# src/fluid/IAutoMovieValidateFluidDomain.ts#IAutoMovieValidateFluidDomain.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The type documents the structurally typed input and semantic field findings. The Courant comparison requires five positive finite operands and reports an unstable value at the timestep.

## @evidence contracts/development/design.md#principled-representation

The request carries one required nonmutated fluid domain. TypeScript establishes the record shape; validateFluidDomain checks its semantic lattice, scalar, array, flow and stability constraints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The validator consumes an authored fluid domain directly. It returns located findings without involving the feature binding or invoking simulation.

# src/fluid/IAutoMovieValidateFluidDomain.ts#IAutoMovieValidateFluidDomain.IProps.domain

## @evidence contracts/development/common.md#meaningful-documentation

The required domain provides the structural input. The validator reads it without modification and reports semantic defects at field paths.
