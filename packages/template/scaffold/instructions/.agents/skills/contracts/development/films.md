# Films

Each exported function and method of a screenplay film in `src/composition/films/<film>.ts` answers these items in its doc comment, beside [implementation](implementation.md). A film plays a screenplay folder rather than serving callers, so it documents that realization here instead of under [common](common.md). The catalog film answers [composition](composition.md) instead.

## Scene order

Does the film play every scene file of its screenplay folder in screenplay order, with their transitions, titles and subtitles?

Cite each scene file in the order the film plays it, as `@evidence docs/body/screenplay/<film folder>/<scene file> <what it plays>`. Every scene file belongs to a film. An `OMITTED` scene file is covered by an `@evidenceExclude` on the film. Without narrative passes, the film also cites the instructions it realizes.

Play the numbered scenes with their transitions, titles and subtitles. Ask the user to add a missing scene file to a fixed screenplay before citing it.

## Delivery profile

Does the film take its raster, frame rate and running time from the delivery profile and its grade from the screenplay and profile, and does a direct 3D film's loudness record take the profile's targets?

Use the [delivery profile](../../production/project-context.md#the-delivery-profile) for raster, frame rate and running time. Take the grade from the screenplay and profile.

A direct 3D film's [loudness record](../../audio/soundtrack.md#loudness-record) takes the delivery profile's targets. Check `delivery.loudness` against the profile.

## Camera response

Does a direct 3D film's camera response follow the adopted look, with each exposure change it marks decided by the screenplay?

A direct 3D film's [camera response](../../video/direct-film.md#camera-response) takes the adopted [look](../../production/project-context.md#overview-and-look). Each exposure change it marks with `change` in its exposure continuity check cites the screenplay decision behind it. Check `optics` against the look and each marked change against the screenplay.

## Sound list

Where a direct 3D film declares a sound list, does it carry each line its scenes speak, bound to the staged actor who speaks it?

The [sound list](../../audio/soundtrack.md#sound-list) carries each line its scenes speak, with the screenplay's text and a start frame within its beat, and binds each speaker to the staged actor who plays them. Check `sound.lines` and `sound.speakers` against the cited scene files and the subjects their scenes bind.

## Realization comments

Can a reader trace each value the film passes, and each default it relies on, to the screenplay, profile or look entry it takes?

Comment each such value with its source and how it realizes it, so a reader can check it against that source without deriving it again.

## Composition only

Does the film compose only its scenes and accepted module capabilities using installed operators and the screenplay's decisions?

Resolve the film once from one seed. Place absolute time only at screenplay anchors. Order the scenes and compose any capability the film calls with installed operators. Their capability owners handle calculations, constants, coordinates, direct law imports, URL parameters, archive loads and runtime selections. Use the same capabilities as the catalog.
