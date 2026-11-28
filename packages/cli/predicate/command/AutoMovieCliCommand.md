# src/command/AutoMovieCliCommand.ts#AutoMovieCliCommand.Request

## @evidence contracts/development/common.md#meaningful-documentation

The alias tells callers to narrow by command and links to the defining request union for per-variant fields.

## @evidence contracts/development/design.md#principled-representation

Request is a type alias for the same union returned by readArguments. The emitted declaration imports that union and retains the discriminants in the result of the publicly exported parser.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The facade names its parsing result and shares the union directly. AutoMovieCommand is the one owner of the variant fields.

# src/command/AutoMovieCliCommand.ts#AutoMovieCliCommand.readArguments

## @evidence contracts/development/common.md#meaningful-documentation

The docs identify the argument slice, the default help request, the standalone flag rule, the scaffold admission boundary and the five commands whose tokens are checked during execution.

## @evidence contracts/development/implementation.md#principled-implementation

The parser identifies one command and checks the flag arity before returning an output. Create and add delegate to their scaffold grammar readers and return only the admitted target and options. The production dispatch cases preserve the remaining tokens in a fresh array, including an empty list. The public parser tests exercise those shapes and distinguished refusal messages.

## @evidence contracts/development/implementation.md#efficient-algorithms

Dispatch reads the first token and retains the remaining list in input order. The scaffold readers make one pass over their tokens, and a production option reader runs only if the corresponding operation executes. All parser work uses the provided tokens.

# src/command/AutoMovieCliCommand.ts#AutoMovieCliCommand.run

## @evidence contracts/development/common.md#meaningful-documentation

The docs describe the full argument vector, working-directory dispatch, scaffold effects, returned statuses and reporting failures. The command's current binary path and the programmatic entry share this dispatcher.

## @evidence contracts/development/implementation.md#principled-implementation

Dispatch runs the parser on argv after the first two positions, awaits one operation and returns the observed command status. Production check reports the requested gate status, and live Inspector review reports script errors. Scaffold admission precedes file writes, and add completes any missing workspace catalog entries before writing the production. Thrown failures print a cause chain and resolve to status one unless failure reporting throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each request dispatches to one owner and carries its parsed data forward. Scaffold generation returns one file map for writing and listing the produced paths. Error reporting records each seen cause once so a repeated cause does not keep the traversal alive.
