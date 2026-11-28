# src/command/AutoMovieCommand.ts#AutoMovieCommand

## @evidence contracts/development/common.md#meaningful-documentation

The alias documents how to narrow a parsed request. Its nine variants document the literal commands and every exposed field, including target spelling, default flags, portable workspace segments and deferred option validation.

## @evidence contracts/development/design.md#principled-representation

Each command literal selects exactly one shape. Help and version have only their command keys. Create has a directory, workspace and force flags and an optional name. Add has a closed shorts or series family, one directory segment, force and an optional name. Each of capture, inspect, render, review and check has an ordered string array. A consumer can verify these exact packed structures by extracting each discriminant from the published Request type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parser owns the two scaffold grammars and the literal dispatch. Only create carries a workspace flag, and only add carries a family. The five production readers own their remaining options and receive raw tokens. Dispatch obtains the current directory and environment when it uses the request.
