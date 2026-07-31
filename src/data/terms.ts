/**
 * Condensed Terms & Conditions shown inside the app before a new account
 * can be created. Full legal text lives in the separate
 * student-crib-terms-and-conditions.md document; this is the in-app
 * summary users actually read and accept.
 *
 * Bump TERMS_VERSION whenever the wording changes materially — existing
 * users are NOT re-prompted automatically on a version bump (that would
 * need a re-acceptance flow, not built yet), so treat version changes as
 * a deliberate, tracked event.
 */
export const TERMS_VERSION = "2026-07-17";

export const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "What Student Crib is",
    body:
      "Student Crib is a listing and connection platform. We help students find accommodation and second-hand items, and help landlords and agents advertise properties. We do not own, manage, or lease any property listed here, and we do not collect or process rent, deposits, or payments between users. All arrangements — viewings, leases, payments, item sales — happen directly between users, at their own risk.",
  },
  {
    title: "Your account",
    body:
      "You must be at least 16 years old. You must give accurate signup information, including your role and university. You're responsible for your account and everything that happens under it. One account per person.",
  },
  {
    title: "Listings (agents & landlords)",
    body:
      "By posting a listing you confirm you have the right to advertise the property and that the details are accurate to the best of your knowledge. Listings that are inaccurate, fraudulent, or discriminatory may be removed without notice.",
  },
  {
    title: "Marketplace",
    body:
      "Anyone can list items for sale. Payment and exchange happen directly between buyer and seller, outside the app. Student Crib has no part in and no liability for these transactions.",
  },
  {
    title: "Reviews",
    body:
      "Only students may leave reviews, only about landlords/agents, and only based on genuine experience. Harassment, defamation, or fake reviews may be removed.",
  },
  {
    title: "Acceptable use",
    body:
      "No fraudulent listings or reviews, no harassment or discrimination, no unlawful use of the app, and no misuse of contact details obtained here for spam or unsolicited marketing.",
  },
  {
    title: "No warranty, limited liability",
    body:
      "The app is provided as-is. We don't guarantee the accuracy of listings, reviews, or other user content. Student Crib is not liable for any loss arising from a transaction, lease, or dispute between users. Always view a property in person and verify identities before paying anyone.",
  },
  {
    title: "Changes & termination",
    body:
      "We may update these terms over time, and may suspend or remove accounts that violate them. You can stop using the app and request deletion of your account at any time.",
  },
];
