# Captions

Captions put a film's speech and sound into text for a viewer who reads rather than hears. They are separate from the screen text the screenplay decides, such as a sign, a title or a subtitle that translates a line, which the film draws into the picture as the screenplay places it.

## Text and timing

Take each caption's text from the screenplay's speech, and its times from the accepted audio, by forced alignment of the text to the decoded speech, never from the screenplay's provisional timing. A generated take can say something other than its line, so compare a speech recognizer's transcript of each take with the screenplay and hand every difference to the user.

Start and end a caption on a cut when it falls near one, and leave a short gap between consecutive captions, because viewers reread a caption that crosses a cut, and one ending a few frames past a cut flashes.

## Style and format

Follow the style guide of the release the [delivery profile](project-context.md#what-to-record) records, such as [Netflix's timed text style guides](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977), for line length, lines per caption, reading speed and duration, and for captions for viewers who cannot hear: speaker identification, sound described in brackets and sung lyrics marked. The screenplay's [notation](../story/layers/notation.md) already marks off-screen speech, overlap and music usage these need.

Deliver the format the release takes, such as [WebVTT](https://www.w3.org/TR/webvtt1/), [IMSC](https://www.w3.org/TR/ttml-imsc1.2/) or SRT, as a sidecar file, burning it into the picture only where the release asks for that, and check the file by reading it back against the film's frames at matched seconds.
