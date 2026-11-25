# Implementation

Answer from the function, its callees and its callers.

## Principled implementation

Why does the method give the required result throughout its supported domain?

Connect the calculation and its bounds to the domain, a specification or an independent source. Explain the boundary cases and the basis of constants, tolerances and exceptions.

Repair failures at the decision or operation that causes them. A fixture-specific rule or substituted result cannot establish correctness for the domain.

## Efficient algorithms

Does the operation do only the work its result needs, with clear ownership and bounds?

Explain the division of work and the dominant cost across calls. Justify full traversals and rebuilding. Base speed claims on comparable measurements.

The owner prepares common inputs once. Each read uses its inputs and the prepared result without writing hidden state.

When the operation keeps data, handles or tasks, give the bound and identify what acquires and releases them through completion, failure, cancellation or transfer.
