# src/index.ts#IAutoMovieInspectorAction

## @evidence contracts/development/design.md#principled-representation

A union keyed by `type`, one member per kind of edit, each carrying exactly what that edit needs: a pattern and a direction for a toggle, an sRGB colour or null for a colour, a shade from the request's own union, a view text, subject seconds, a subject name or null, an address text, or a whole request.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the viewer, dispatched by the inspector's panels and read only by the reducer. Shades are the inspection request's own union and a restored request is the capture plan request, so no parallel type is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a request field: every edit is of a grammar key's text, so the typed request stays render's alone and a value the grammar refuses is refused with the key named.

## @evidence contracts/development/common.md#meaningful-documentation

Tabulates every action with the key it edits and the request member it changes.

# src/index.ts#IAutoMovieInspectorAction.IToggle

## @evidence contracts/development/design.md#principled-representation

The list is named by its action type and the pattern is the path grammar's text, so a toggle of an absent pattern adds it and of a present one removes it, whatever the list.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant, the pattern and the direction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `on` states the direction instead of flipping, so a repeated dispatch is idempotent.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member means.

# src/index.ts#IAutoMovieInspectorAction.IColor

## @evidence contracts/development/design.md#principled-representation

A colour is an sRGB hex integer, the form marks and the palette use; null takes the pattern's colour out of the list.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant, the pattern and the colour.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Removal is null rather than a reserved colour, so every integer is a colour.

## @evidence contracts/development/common.md#meaningful-documentation

States the encoding and the null case.

# src/index.ts#IAutoMovieInspectorAction.IShade

## @evidence contracts/development/design.md#principled-representation

One shade from the inspection request's union; the page draws one pass, so several passes collapse to this one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant and the shade.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shade type is the request's own, so an unknown shade cannot be dispatched.

## @evidence contracts/development/common.md#meaningful-documentation

States that several passes become one.

# src/index.ts#IAutoMovieInspectorAction.ISwitch

## @evidence contracts/development/design.md#principled-representation

The switch is named by its key and its state is a boolean, written `1` or `0`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant, the key and the state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only the switches a panel offers are listed, so no key outside the grammar can be named.

## @evidence contracts/development/common.md#meaningful-documentation

States what each key does.

# src/index.ts#IAutoMovieInspectorAction.IView

## @evidence contracts/development/design.md#principled-representation

A view is its text in the inspection view grammar, which the plan reader checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant and the text.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The text replaces every view, because the page draws through one.

## @evidence contracts/development/common.md#meaningful-documentation

States the grammar and the replacement.

# src/index.ts#IAutoMovieInspectorAction.ITime

## @evidence contracts/development/design.md#principled-representation

Subject seconds, written as the `at` key, which replaces any even sampling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant and the second.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Playback does not dispatch it per frame; a pause or a seek does, so the request names the picture shown when nothing moves.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the key and when it is dispatched.

# src/index.ts#IAutoMovieInspectorAction.ILocate

## @evidence contracts/development/design.md#principled-representation

Subject seconds written as `at`, as `time` writes them, and the path patterns that replace the `label` list.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant, the second and the patterns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller passes only paths the scene draws, because a label pattern that matches nothing is refused; an empty list clears the labels.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the replacement and the empty case.

# src/index.ts#IAutoMovieInspectorAction.ISubject

## @evidence contracts/development/design.md#principled-representation

A subject name, or null for the host's only subject.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant and the name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null keeps the grammar's own meaning instead of an empty name.

## @evidence contracts/development/common.md#meaningful-documentation

States the null case.

# src/index.ts#IAutoMovieInspectorAction.IText

## @evidence contracts/development/design.md#principled-representation

The text is a query string of the plan grammar's keys, with or without its leading `?`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant and the text.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A refused text keeps the previous request, so a typing mistake never blanks the picture.

## @evidence contracts/development/common.md#meaningful-documentation

States the text's form and the refusal.

# src/index.ts#IAutoMovieInspectorAction.IRestore

## @evidence contracts/development/design.md#principled-representation

The scene's refusal comes after the grammar accepted the request, such as a mark pattern that matches no kind, so the scene hands back the request it draws and the reason.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant, the request and the reason.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The request is a whole plan request the scene applied before, not a partial patch.

## @evidence contracts/development/common.md#meaningful-documentation

States who dispatches it and why.
