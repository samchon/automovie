# Films

Each exported function and method of a screenplay film in `src/composition/films/<film>.ts` answers these items in its doc comment, beside [implementation](implementation.md). A film plays a screenplay folder rather than serving callers, so it documents that realization here instead of under [common](common.md). Without narrative passes, the film also cites the instructions it realizes. The catalog film answers [composition](composition.md) instead.

## Scene order

Does the film play every scene file of its screenplay folder in screenplay order, with their transitions, titles and subtitles?

Cite each scene file in the order the film plays it, as `@evidence docs/body/screenplay/<film folder>/<scene file> <what it plays>`. Every scene file belongs to a film. An `OMITTED` scene file is covered by an `@evidenceExclude` on the film. Ask the user to add a missing scene file to a fixed screenplay before citing it.

## Delivery profile

Does the film take its raster, frame rate and running time from the delivery profile, and does a direct 3D film's loudness record take the profile's targets?

Use the [delivery profile](../../production/project-context.md#the-delivery-profile) for raster, frame rate and running time. A channel render for a model sets the film's rate and size to the model's for that render only, as [requests](../../video/requests.md#inputs) sets.

A direct 3D film's [loudness record](../../audio/soundtrack.md#loudness-record) takes the delivery profile's targets. Check `delivery.loudness` against the profile.

## Camera response

Does a direct 3D film's camera response follow the adopted look and finishing approach, with each exposure change it marks decided by the screenplay?

A direct 3D film's [camera response](../../video/direct-film.md#camera-response) takes its grade from the adopted [look](../../production/project-context.md#overview-and-look) and its exposure and tone curve from the [finishing approach](../../production/project-context.md#finishing-approach). Each exposure change it marks with `change` in its exposure continuity check cites the screenplay decision behind it. Check `optics` against the look and the finishing approach, and each marked change against the screenplay.

## Sound list

Where a direct 3D film declares a sound list, does it carry each line its scenes speak and each cue their beats sound, with each speaker bound to the staged actor who speaks it?

The [sound list](../../audio/soundtrack.md#sound-list) carries each line its scenes speak, with the screenplay's text and a start frame within its beat, and each cue their beats sound, and binds each speaker to the staged actor who plays them. Check `sound.lines`, `sound.cues` and `sound.speakers` against the cited scene files and the subjects their scenes bind.

## Realization comments

Can a reader trace each value the film passes, and each default it relies on, to the screenplay, profile or look entry it takes?

Comment each such value with its source and how it realizes it, so a reader can check it against that source without deriving it again.

## Composition only

Does the film compose only its scenes and accepted module capabilities using installed operators and the screenplay's decisions?

Resolve the film once from one seed. Place absolute time only at screenplay anchors. Order the scenes and compose any capability the film calls with installed operators. Their capability owners handle calculations, constants, coordinates, direct law imports, URL parameters, archive loads and runtime selections. Use the same capabilities as the catalog.
