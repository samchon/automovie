# Recording authored work

Write the message about what the production now establishes, changes, or repairs, not the mechanical edit. State a downstream consequence when the change has one, so the log remains usable as production history.

Before committing text outside ASCII, decode every staged file as strict UTF-8 and reject a replacement character. Valid decoding alone cannot detect a substituted accent, curly quote, or unrelated-script letter, so also inspect the staged writing systems and reject a character that does not belong to the production's language. Encoding damage often raises no build error.
