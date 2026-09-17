# Settings fixed-graph account

## Fixed-graph coverage {#fixed-graph-coverage}

<!--
@evidence contracts/fixed-graph.md#one-house-and-one-attached-garage This account closes the fixed one-house, attached-garage graph before downstream design owners proceed.
@evidenceReview contracts/fixed-graph.md#one-house-and-one-attached-garage #80c3cd7 The fixed-graph account compares the contract's one-house/attached-garage route with the compiled topology: one stair is the only cross-storey connector, the service band reaches the empty garage through the mudroom, and no vehicle population is present. The edge would fail if any second building, hidden route, second stair, or vehicle proxy appeared.
-->

The current compiled topology has one main house, one attached garage, 15 spaces, and 31 openings. The stair is the only cross-storey connector, the service band reaches the empty garage through the mudroom, and no vehicle population is present. This account records the fixed graph as the current basis for the reviewed space and source realization; a second building, hidden route, second stair, or vehicle proxy would falsify it.
