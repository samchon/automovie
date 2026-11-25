# Films

Each exported function and method of a screenplay film in `src/composition/films/<film>.ts` answers these items in its doc comment, beside [implementation](implementation.md). A film plays a screenplay folder rather than serving callers, so it documents that realization here instead of under [common](common.md). Without narrative passes, the film also cites the instructions it realizes. The catalog film answers [catalog](catalog.md) instead.

## Scene order

Does the film play every scene file of its screenplay folder in screenplay order, with their transitions, titles and subtitles?

Cite each scene file in the order the film plays it, as `@evidence docs/body/screenplay/<film folder>/<scene file> <what it plays>`. Every scene file belongs to a film. An `OMITTED` scene file is covered by an `@evidenceExclude` on the film. Ask the user to add a missing scene file to a fixed screenplay before citing it.

A scene that ends with a [transition block](../../story/layers/notation.md#records) leaves through that transition in the film's `playback` sequence, and every other scene cuts to the next. Each title and subtitle the scene files mark as screen text shows its wording at its beat. It is drawn in the film's picture or, where the picture is generated, composited from its clean render under [compositing](../../video/finishing.md#compositing).

## Delivery profile

Does the film take its raster, frame rate and running time from the delivery profile, and does a direct 3D film's loudness record take the profile's targets?

Use the [delivery profile](../../production/project-context.md#the-delivery-profile) for raster, frame rate and running time. The film keeps the profile's values outside a [channel render](../../video/requests.md#inputs).

A direct 3D film's [loudness record](../../audio/soundtrack.md#loudness-record) takes the delivery profile's targets. Check `delivery.loudness` against the profile.

## Camera response

Does a direct 3D film's camera response follow the adopted look and finishing approach, with each scene's exposure metered from its key subject and each exposure change it marks decided by the screenplay?

A direct 3D film's [camera response](../../video/direct-film.md#camera-response) takes its grade from the adopted [look](../../production/project-context.md#overview-and-look). It takes its tone curve and metering rule from the [finishing approach](../../production/project-context.md#finishing-approach). Each scene's `ev100` comes from that scene's key subject, metered under that rule. Each exposure change it marks with `change` in its exposure continuity check cites the screenplay decision behind it. Check `optics` against the look, the finishing approach and the metered key subjects, and each marked change against the screenplay.

## Sound list

Where a direct 3D film declares a sound list, does it carry each line its scenes speak and each cue their beats sound, with each speaker bound to the staged actor who plays that speaker?

The [sound list](../../audio/soundtrack.md#sound-list) carries each line its scenes speak, with the screenplay's text and a start frame within its beat. It carries each cue their beats sound. It binds each speaker to the staged actor who plays that speaker. Check `sound.lines`, `sound.cues` and `sound.speakers` against the cited scene files and the subjects their scenes bind.

## Composition only

Does the film compose only its scenes and accepted module capabilities using installed operators and the screenplay's decisions?

Resolve the ordered scenes once from one seed. Place absolute time only at screenplay anchors and follow the [composition rules](../../development/modules.md#how-the-parts-work-together).

Trace film choices in [source comments](../../development/modules.md#documenting-source) to the screenplay, profile, look, finishing approach or metered key subject.
