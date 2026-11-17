# Source review

Read the whole requested change with its callers, inputs, consumers, error paths and tests, then check it against the [development contracts](../contracts/development/SKILL.md) its declarations answer.

## Truth of answers

Each answer states what the code does and claims no behavior, measurement or limit the code lacks. It cites what its [entities](../contracts/development/entities.md), [behaviors](../contracts/development/behaviors.md) or [composition](../contracts/development/composition.md) contract names for its respondent.

Check each answer against its item's [statements](../contracts/SKILL.md#items-and-statements), because a passing graph shows only that answers exist.

## The actual consumer

Run the checks that reach the actual consumer, including behavior that must stay unchanged. Visual and performance results come from stills under [visual debugging](../visual-debugging/SKILL.md) and [motion](../motion/SKILL.md), and listening results from the user under [audio](../audio/SKILL.md). Report the host or platform checks that could not run, and send repairs to [development](../development/SKILL.md).
