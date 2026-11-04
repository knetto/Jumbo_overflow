export const ANONYMOUS_AUTHOR = 'Anonieme collega';

// Anonymous contributions carry no name or branch in their public data.
// Ownership stays on the server so authors can still manage their question.
export function contributionIdentity(profile, anonymous = false) {
  return anonymous
    ? { anonymous: true, author: ANONYMOUS_AUTHOR, branch: null }
    : { anonymous: false, author: profile.name, branch: profile.branch };
}
