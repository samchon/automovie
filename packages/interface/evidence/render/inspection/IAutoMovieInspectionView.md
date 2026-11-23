# src/render/inspection/IAutoMovieInspectionView.ts#IAutoMovieInspectionView

## @evidence contracts/development/design.md#principled-representation

The three ways a camera is placed need different data, so each is one member of a union keyed by `type`: the film camera has none, a fixed camera two points in world metres, and a name the projection and focus a fitted view takes. A fixed or film view cannot carry a focus because the union gives it none.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the renderer's inspection beside its parser and resolver, read by every host that takes a view as text.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No named viewpoint or subject view is listed in the type: names stay strings until a subject is known.

## @evidence contracts/development/common.md#meaningful-documentation

States the three forms, who writes and reads the record, and why a name is resolved later.

# src/render/inspection/IAutoMovieInspectionView.ts#IAutoMovieInspectionView.IFilm

## @evidence contracts/development/design.md#principled-representation

The delivery camera is the subject's, so the view holds only its discriminant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It is a member of the union, not an absent view, so a list of views can include it.

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn and the text.

# src/render/inspection/IAutoMovieInspectionView.ts#IAutoMovieInspectionView.IFixed

## @evidence contracts/development/design.md#principled-representation

Two distinct world points fix the direction, the up direction fixes the roll, and the projection is either the subject's perspective lens or an orthographic scale in metres per picture pixel; together they are the whole of a recorded camera's pose and projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant, the two points, the scale and the up direction; the scale and the up are what a recorded orthographic or vertical camera needs to be repeated exactly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fitting member: a fixed view is not fitted. A perspective camera is a null scale rather than a scale of zero, and world `+Y` is a null up rather than a written default.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units, text and what each optional member means when absent.

# src/render/inspection/IAutoMovieInspectionView.ts#IAutoMovieInspectionView.INamed

## @evidence contracts/development/design.md#principled-representation

A name is either a subject's view or a named viewpoint fitted to bounds; projection and focus only change the fit, so they ride on the name.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant, the name and the three switches.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Focus is null or one of two forms, so a pattern and the flagged focus cannot both be given.

## @evidence contracts/development/common.md#meaningful-documentation

States the text and what each member changes.
