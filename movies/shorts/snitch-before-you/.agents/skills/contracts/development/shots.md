# Shots

Each exported function under `src/shots/` answers these items in its doc comment, beside [common](common.md) and [implementation](implementation.md). It cites each screenplay unit it executes as `@evidence docs/body/screenplay/<file>.md#<unit> <what it executes>`, and every screenplay H2 is executed by some function.

## Does the shot execute its screenplay units? {#screenplay-execution}

Does the function carry what its cited screenplay units decide, their actions, participants, contacts, consequences and framing, as data the motion modules execute, without omitting, altering or adding to them? What the scene must contain is the screenplay's decision; the shot owes its faithful execution. A renamed function, an uninvoked module, an omitted participant or an altered outcome does not establish the unit, and a gap in the screenplay is repaired there rather than filled in the shot.

## Does continuing action keep its state across cuts? {#continuing-state}

Does each pose, facing, attachment, possession, mark and motion state the screenplay establishes continue across camera changes and into the next shot, changing only where the screenplay changes it? A new view cannot silently restart an action or reset a state.
