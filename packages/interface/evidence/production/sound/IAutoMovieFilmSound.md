# src/production/sound/IAutoMovieFilmSound.ts#IAutoMovieFilmSound

## @evidence contracts/development/common.md#meaningful-documentation

States who declares it, who mixes it, what the room-tone beds supply, how paths resolve, which ids must be unique and why, and that it excludes a delivery soundtrack path.

## @evidence contracts/development/design.md#principled-representation

A film's adopted sound as data: lines on the film-frame clock with their byte and receipt paths, cues in the timeline's own placement shape, speaker bindings, the plan's ducking policy and optional room-tone beds in the plan's own type. Id uniqueness, the exclusion of a delivery soundtrack and file existence are runtime refusals of the render route.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns it; the scaffold's `IFilmProduction` declares it, the draw scene and subject description carry it, and render's `mixAutoMovieFilmSound` consumes every member, copying the room-tone beds into the plan. Cues and bindings reuse the timeline track type and `IAutoMovieDialogueSpeakerBinding` from their owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ducking policy is the plan's own optional type rather than a copy; no member serves one film.

# src/production/sound/IAutoMovieFilmSound.ts#IAutoMovieFilmSound.ILine

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the receipt must match, the frame unit and the paths' role; the comment gives the speech-span rule.

## @evidence contracts/development/design.md#principled-representation

A line has a start frame but no end: its end follows from its admitted bytes, so a line cannot claim a length its samples do not have.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The route reads every member: the id and text for admission, language and speaker for the plan, the start for placement and the two paths for reading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional speaker means no mouth moves, which the viseme join reports as not run; nothing is defaulted.

# src/production/sound/IAutoMovieFilmSound.ts#IAutoMovieFilmSound.ICue

## @evidence contracts/development/common.md#meaningful-documentation

States that a cue is placed as a timeline audio entry and that its asset is a production-relative path.

## @evidence contracts/development/design.md#principled-representation

The alias reuses the timeline's frame-grid placement fields, so a cue's trim, fades and bus mean the same on both paths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The route maps each cue onto the plan with a derived seed; no member is added.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No duplicate cue type is declared; the alias names the existing owner.
