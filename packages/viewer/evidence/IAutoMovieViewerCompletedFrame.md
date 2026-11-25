# src/IAutoMovieViewerCompletedFrame.ts#IAutoMovieViewerCompletedFrame

## @evidence contracts/development/design.md#principled-representation

Carries original draw-completion scene/camera/pass and optional observed clock, with an application-owned state controller for typed IViewerFrameTransfer capture, restoration, explicit redraw and clock freezing; composite layer facts remain separate from original native objects.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The producer publishes one completion record while numerical application admission and transport consumers retain their own responsibilities; optional fields distinguish unavailable observations from false or zero values.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Requested state never substitutes for completed rendering; changed=false preserves idle facts, absent changed preserves eager saving and application-document changes still require fresh display facts.

## @evidence contracts/development/common.md#meaningful-documentation

Defines native versus composite objects, optional time semantics, numerical application prerequisite, idle/change classification and controller ownership.
