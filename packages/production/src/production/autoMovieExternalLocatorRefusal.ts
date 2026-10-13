

/**
 * Why an external locator cannot cross the credential boundary.
 *
 * Non-URL identifiers remain valid inputs. A caller that requires a URL owns its protocol and syntax policy separately from this credential boundary.
 *
 * @evidence contracts/common.md#principled-implementation URL parsing detects username/password; a failed absolute scheme:// spelling is malformed, while non-URL identifiers remain admitted.
 * @evidence contracts/common.md#clear-and-simple-design Locator admission owns only credentials; callers choose protocol and syntax policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The absolute-URL regex distinguishes a malformed URL from a non-URL identifier, rather than allowing a credential exception.
 * @evidence contracts/common.md#meaningful-documentation Explains the two refusal categories and null for an identifier without detected credentials.
 * @evidence contracts/performance.md#efficient-algorithms URL parsing and the fallback regex inspect L input units with local URL/string storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Every supplied spelling is parsed afresh; no mutable locator or policy cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local URL becomes unreachable after the nullable category returns; no network request or handle is opened.
 */
export const autoMovieExternalLocatorRefusal: (value: string) => "credential-bearing" | "malformed-absolute-url" | null = (value: string): "credential-bearing" | "malformed-absolute-url" | null => {
    try {
        const parsed: URL = new URL(value);
        return parsed.username.length !== 0 || parsed.password.length !== 0
            ? "credential-bearing"
            : null;
    }
    catch {
        return /^[a-z][a-z0-9+.-]*:\/\//iu.test(value)
            ? "malformed-absolute-url"
            : null;
    }
};
