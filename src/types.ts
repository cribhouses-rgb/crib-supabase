export type UserRole = "student" | "agent" | "landlord";

export interface University {
  id: string;
  name: string;
  domain: string;
  /** Approx campus coordinates for distance calculations. */
  lat: number;
  lng: number;
  /**
   * A code unique to this university, shown only inside the admin panel.
   * Entering it unlocks that university's filtered data view there.
   * Not used anywhere else in the app (not a signup or login gate).
   */
  adminCode: string;
}

/* ------------------------------------------------------------------ */
/*  users/{uid}                                                        */
/* ------------------------------------------------------------------ */

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  universityId: string;
  fullName: string;
  phone: string;
  photoURL: string | null;
  profileComplete: boolean;
  /** Average rating received (landlord/agent only, 0 if no reviews). */
  avgRating: number;
  /** Total number of reviews received. */
  reviewCount: number;
  /** Percentage of inquiries responded to (landlord/agent only). */
  responseRate: number;
  /** Set by admin only, via the admin panel — never by the user themselves. */
  verified: boolean;
  /** Timestamp when the user accepted the Terms & Conditions (required at signup). */
  termsAcceptedAt: number;
  /** Which version of the terms they accepted (see src/data/terms.ts). */
  termsVersion: string;
  createdAt: number;
}

export type NewUserProfile = Pick<UserProfile, "uid" | "email" | "role" | "universityId">;

/* ------------------------------------------------------------------ */
/*  listings/{listingId}                                               */
/* ------------------------------------------------------------------ */

export type PropertyType = "single_room" | "shared" | "flat" | "house";

export interface Listing {
  id: string;
  /** UID of the landlord or agent who owns the listing. */
  ownerId: string;
  ownerName: string;
  ownerRole: "agent" | "landlord";
  ownerPhotoURL: string | null;
  /** University this listing is associated with. */
  universityId: string;
  title: string;
  description: string;
  address: string;
  suburb: string;
  propertyType: PropertyType;
  /** Monthly price in USD. */
  price: number;
  beds: number;
  baths: number;
  amenities: string[];
  /** URLs of uploaded photos (max 10). */
  photos: string[];
  /** Distance in km from the university campus. */
  distanceKm: number;
  /** Whether a HIT shuttle stop is nearby. */
  nearShuttle: boolean;
  /** ISO date string when the property becomes available. */
  availableFrom: string;
  /** Which semester this listing targets (1, 2, 3, or null for any). */
  semester: number | null;
  /** Is this listing currently available or has it been rented? */
  status: "available" | "rented";
  /** Latitude for map display. */
  lat: number;
  /** Longitude for map display. */
  lng: number;
  createdAt: number;
  updatedAt: number;
}

export type ListingInput = Omit<Listing, "id" | "createdAt" | "updatedAt">;

/* ------------------------------------------------------------------ */
/*  inquiries/{inquiryId}                                              */
/* ------------------------------------------------------------------ */

export interface Inquiry {
  id: string;
  /** The listing this inquiry is about. */
  listingId: string;
  listingTitle: string;
  /** The student who sent the inquiry. */
  studentId: string;
  studentName: string;
  studentPhone: string;
  /** The landlord/agent who received the inquiry. */
  ownerId: string;
  ownerName: string;
  /** The student's message. */
  message: string;
  /** Owner's reply, if any. */
  reply: string | null;
  status: "pending" | "replied" | "closed";
  universityId: string;
  createdAt: number;
  repliedAt: number | null;
}

/* ------------------------------------------------------------------ */
/*  marketplace/{itemId}                                               */
/* ------------------------------------------------------------------ */

export type MarketCategory = "textbooks" | "furniture" | "electronics";
export type ItemCondition = "like_new" | "good" | "fair" | "poor";

export interface MarketItem {
  id: string;
  /** UID of the seller. */
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  universityId: string;
  title: string;
  description: string;
  category: MarketCategory;
  condition: ItemCondition;
  /** Price in USD. */
  price: number;
  /** URLs of uploaded photos (max 5). */
  photos: string[];
  status: "available" | "sold";
  createdAt: number;
}

export type MarketItemInput = Omit<MarketItem, "id" | "createdAt">;

/* ------------------------------------------------------------------ */
/*  reviews/{reviewId}                                                 */
/* ------------------------------------------------------------------ */

export interface Review {
  id: string;
  /** The student who wrote the review. */
  reviewerId: string;
  reviewerName: string;
  /** The landlord/agent being reviewed. */
  targetId: string;
  /** The listing this review is about. */
  listingId: string;
  /** 1-5 star rating. */
  rating: number;
  comment: string;
  universityId: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  favorites (subcollection: users/{uid}/favorites/{listingId})       */
/* ------------------------------------------------------------------ */

export interface Favorite {
  listingId: string;
  savedAt: number;
}

/* ------------------------------------------------------------------ */
/*  tenants/{tenantId} (landlord-only)                                 */
/* ------------------------------------------------------------------ */

export interface Tenant {
  id: string;
  /** The landlord who manages this tenant. */
  landlordId: string;
  /** The listing/property. */
  listingId: string;
  listingTitle: string;
  tenantName: string;
  tenantPhone: string;
  /** ISO date string. */
  leaseStart: string;
  /** ISO date string. */
  leaseEnd: string;
  /** Monthly rent in USD. */
  monthlyRent: number;
  /** Running balance: positive = tenant owes, negative = overpaid. */
  balance: number;
  universityId: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  maintenance/{requestId} (tenant → landlord)                       */
/* ------------------------------------------------------------------ */

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  landlordId: string;
  listingId: string;
  listingTitle: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  universityId: string;
  createdAt: number;
  resolvedAt: number | null;
}

/* ------------------------------------------------------------------ */
/*  roommates/{postId} — students looking for a roommate               */
/* ------------------------------------------------------------------ */

export interface RoommatePost {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  studentPhotoURL: string | null;
  universityId: string;
  /** Short bio: about them, what they're looking for, lifestyle notes. */
  bio: string;
  /** Max they can contribute toward rent per month, in USD. */
  budget: number;
  /** Preferred suburb, or empty string if open to anywhere. */
  preferredSuburb: string;
  /** ISO date string — when they want to move in. */
  moveInDate: string;
  status: "looking" | "found";
  createdAt: number;
}

export type RoommatePostInput = Omit<RoommatePost, "id" | "createdAt">;

/* ------------------------------------------------------------------ */
/*  reports/{reportId} — user-submitted reports for admin review       */
/* ------------------------------------------------------------------ */

export type ReportTargetType = "listing" | "marketplace" | "roommate" | "user";
export type ReportReason =
  | "fake_or_scam"
  | "inappropriate_content"
  | "harassment"
  | "misleading_info"
  | "other";

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  /** Human-readable label for the target, shown in the admin panel (listing title, item title, person's name). */
  targetLabel: string;
  reason: ReportReason;
  details: string;
  status: "open" | "reviewed" | "dismissed";
  universityId: string;
  createdAt: number;
}

export type ReportInput = Omit<Report, "id" | "createdAt" | "status">;

/* ------------------------------------------------------------------ */
/*  savedSearches/{id} — students' saved filter combos                 */
/* ------------------------------------------------------------------ */

export interface SavedSearch {
  id: string;
  uid: string;
  universityId: string;
  label: string;
  suburb: string | null;
  propertyType: string | null;
  maxPrice: number;
  createdAt: number;
  /** Timestamp of the last time the student viewed this search's results — used to count "new" matches since then. */
  lastCheckedAt: number;
}

export type SavedSearchInput = Omit<SavedSearch, "id" | "createdAt">;

/* ------------------------------------------------------------------ */
/*  chats/{chatId} and chats/{chatId}/messages/{messageId}              */
/* ------------------------------------------------------------------ */

export type ChatContextType = "marketplace" | "roommate" | "listing";

export interface Chat {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  contextType: ChatContextType;
  contextId: string;
  contextLabel: string;
  lastMessage: string;
  lastMessageAt: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  errorLogs/{id} — client-side error tracking (write-only for users,  */
/*  read-only for admin). See src/lib/errorLog.ts for how these get     */
/*  created.                                                             */
/* ------------------------------------------------------------------ */

export interface ErrorLog {
  id: string;
  message: string;
  stack: string | null;
  /** Where in the app this happened — e.g. "React render", "sign-in", a screen name. */
  context: string;
  url: string;
  userAgent: string;
  userId: string | null;
  userEmail: string | null;
  resolved: boolean;
  createdAt: number;
}
