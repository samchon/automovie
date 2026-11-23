# src/service/IAutoMovieServiceSystemLoad.ts#IAutoMovieServiceSystemLoad.IProps

## @evidence contracts/development/design.md#principled-representation

Port demand is summed in the supplied system's unit; to-root reads out ports and every other flow policy reads in ports, excluding bidirectional ports.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Network capacity checks and serviceNetworkSchematic use serviceSystemLoad with an existing IAutoMovieServiceSystem instead of duplicating the flow policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The system object need not be a member of network.systems at the type level; callers ensure consistency and admitted finite nonnegative demand, with no diversity or loss calculation.

## @evidence contracts/development/common.md#meaningful-documentation

Service graph and selected flow policy for declared demand aggregation. Port demand is summed in the supplied system's unit; to-root reads out ports and every other flow policy reads in ports, excluding bidirectional ports.
