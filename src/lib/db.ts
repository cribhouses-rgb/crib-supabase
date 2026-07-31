import { supabase } from "../supabaseClient";
import type {
  Listing,
  ListingInput,
  Inquiry,
  MarketItem,
  MarketItemInput,
  Review,
  Favorite,
  Tenant,
  MaintenanceRequest,
  UserProfile,
  RoommatePost,
  RoommatePostInput,
  Report,
  ReportInput,
  SavedSearch,
  SavedSearchInput,
  Chat,
  ChatMessage,
  ChatContextType,
  ErrorLog,
} from "../types";

/* ------------------------------------------------------------------ */
/*  Row <-> app-type mappers.                                          */
/*  Postgres columns are snake_case; every type in src/types.ts is      */
/*  camelCase (kept that way on purpose so this migration didn't force  */
/*  a rewrite of every page component's field access). These mappers    */
/*  are the one place that boundary is crossed.                        */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function ts(value: unknown): number {
  return value ? new Date(value as string).getTime() : Date.now();
}

export function mapProfileRow(r: Row): UserProfile {
  return {
    uid: r.id,
    email: r.email,
    role: r.role,
    universityId: r.university_id,
    fullName: r.full_name ?? "",
    phone: r.phone ?? "",
    photoURL: r.photo_url ?? null,
    profileComplete: Boolean(r.profile_complete),
    avgRating: Number(r.avg_rating ?? 0),
    reviewCount: Number(r.review_count ?? 0),
    responseRate: Number(r.response_rate ?? 0),
    verified: Boolean(r.verified),
    termsAcceptedAt: r.terms_accepted_at ? ts(r.terms_accepted_at) : 0,
    termsVersion: r.terms_version ?? "",
    createdAt: ts(r.created_at),
  };
}

function mapListingRow(r: Row): Listing {
  return {
    id: r.id,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    ownerRole: r.owner_role,
    ownerPhotoURL: r.owner_photo_url ?? null,
    universityId: r.university_id,
    title: r.title,
    description: r.description ?? "",
    address: r.address ?? "",
    suburb: r.suburb,
    propertyType: r.property_type,
    price: Number(r.price),
    beds: r.beds,
    baths: r.baths,
    amenities: r.amenities ?? [],
    photos: r.photos ?? [],
    distanceKm: Number(r.distance_km ?? 0),
    nearShuttle: Boolean(r.near_shuttle),
    availableFrom: r.available_from ?? "",
    semester: r.semester,
    status: r.status,
    lat: r.lat,
    lng: r.lng,
    createdAt: ts(r.created_at),
    updatedAt: ts(r.updated_at),
  };
}

function listingToRow(data: Partial<Listing>): Row {
  const row: Row = {};
  if (data.ownerId !== undefined) row.owner_id = data.ownerId;
  if (data.ownerName !== undefined) row.owner_name = data.ownerName;
  if (data.ownerRole !== undefined) row.owner_role = data.ownerRole;
  if (data.ownerPhotoURL !== undefined) row.owner_photo_url = data.ownerPhotoURL;
  if (data.universityId !== undefined) row.university_id = data.universityId;
  if (data.title !== undefined) row.title = data.title;
  if (data.description !== undefined) row.description = data.description;
  if (data.address !== undefined) row.address = data.address;
  if (data.suburb !== undefined) row.suburb = data.suburb;
  if (data.propertyType !== undefined) row.property_type = data.propertyType;
  if (data.price !== undefined) row.price = data.price;
  if (data.beds !== undefined) row.beds = data.beds;
  if (data.baths !== undefined) row.baths = data.baths;
  if (data.amenities !== undefined) row.amenities = data.amenities;
  if (data.photos !== undefined) row.photos = data.photos;
  if (data.distanceKm !== undefined) row.distance_km = data.distanceKm;
  if (data.nearShuttle !== undefined) row.near_shuttle = data.nearShuttle;
  if (data.availableFrom !== undefined) row.available_from = data.availableFrom || null;
  if (data.semester !== undefined) row.semester = data.semester;
  if (data.status !== undefined) row.status = data.status;
  if (data.lat !== undefined) row.lat = data.lat;
  if (data.lng !== undefined) row.lng = data.lng;
  return row;
}

function mapInquiryRow(r: Row): Inquiry {
  return {
    id: r.id,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    studentId: r.student_id,
    studentName: r.student_name,
    studentPhone: r.student_phone ?? "",
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    message: r.message,
    reply: r.reply ?? null,
    status: r.status,
    universityId: r.university_id,
    createdAt: ts(r.created_at),
    repliedAt: r.replied_at ? ts(r.replied_at) : null,
  };
}

function mapMarketItemRow(r: Row): MarketItem {
  return {
    id: r.id,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    sellerPhone: r.seller_phone ?? "",
    universityId: r.university_id,
    title: r.title,
    description: r.description ?? "",
    category: r.category,
    condition: r.condition,
    price: Number(r.price),
    photos: r.photos ?? [],
    status: r.status,
    createdAt: ts(r.created_at),
  };
}

function mapReviewRow(r: Row): Review {
  return {
    id: r.id,
    reviewerId: r.reviewer_id,
    reviewerName: r.reviewer_name,
    targetId: r.target_id,
    listingId: r.listing_id,
    rating: r.rating,
    comment: r.comment ?? "",
    universityId: r.university_id,
    createdAt: ts(r.created_at),
  };
}

function mapTenantRow(r: Row): Tenant {
  return {
    id: r.id,
    landlordId: r.landlord_id,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    tenantName: r.tenant_name,
    tenantPhone: r.tenant_phone ?? "",
    leaseStart: r.lease_start ?? "",
    leaseEnd: r.lease_end ?? "",
    monthlyRent: Number(r.monthly_rent),
    balance: Number(r.balance),
    universityId: r.university_id,
    createdAt: ts(r.created_at),
  };
}

function mapMaintenanceRow(r: Row): MaintenanceRequest {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    tenantName: r.tenant_name,
    landlordId: r.landlord_id,
    listingId: r.listing_id,
    listingTitle: r.listing_title,
    description: r.description,
    status: r.status,
    universityId: r.university_id,
    createdAt: ts(r.created_at),
    resolvedAt: r.resolved_at ? ts(r.resolved_at) : null,
  };
}

function mapRoommateRow(r: Row): RoommatePost {
  return {
    id: r.id,
    studentId: r.student_id,
    studentName: r.student_name,
    studentPhone: r.student_phone ?? "",
    studentPhotoURL: r.student_photo_url ?? null,
    universityId: r.university_id,
    bio: r.bio,
    budget: Number(r.budget),
    preferredSuburb: r.preferred_suburb ?? "",
    moveInDate: r.move_in_date ?? "",
    status: r.status,
    createdAt: ts(r.created_at),
  };
}

function mapReportRow(r: Row): Report {
  return {
    id: r.id,
    reporterId: r.reporter_id,
    reporterName: r.reporter_name,
    targetType: r.target_type,
    targetId: r.target_id,
    targetLabel: r.target_label,
    reason: r.reason,
    details: r.details ?? "",
    status: r.status,
    universityId: r.university_id,
    createdAt: ts(r.created_at),
  };
}

function mapSavedSearchRow(r: Row): SavedSearch {
  return {
    id: r.id,
    uid: r.uid,
    universityId: r.university_id,
    label: r.label,
    suburb: r.suburb,
    propertyType: r.property_type,
    maxPrice: Number(r.max_price),
    createdAt: ts(r.created_at),
    lastCheckedAt: ts(r.last_checked_at),
  };
}

function mapChatRow(r: Row): Chat {
  return {
    id: r.id,
    participantIds: r.participant_ids ?? [],
    participantNames: r.participant_names ?? {},
    contextType: r.context_type,
    contextId: r.context_id,
    contextLabel: r.context_label,
    lastMessage: r.last_message ?? "",
    lastMessageAt: ts(r.last_message_at),
    createdAt: ts(r.created_at),
  };
}

function mapChatMessageRow(r: Row): ChatMessage {
  return {
    id: r.id,
    senderId: r.sender_id,
    text: r.text,
    createdAt: ts(r.created_at),
  };
}

function mapErrorLogRow(r: Row): ErrorLog {
  return {
    id: r.id,
    message: r.message,
    stack: r.stack ?? null,
    context: r.context,
    url: r.url ?? "",
    userAgent: r.user_agent ?? "",
    userId: r.user_id ?? null,
    userEmail: r.user_email ?? null,
    resolved: Boolean(r.resolved),
    createdAt: ts(r.created_at),
  };
}

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/*  Image uploads (Supabase Storage)                                   */
/* ------------------------------------------------------------------ */

const PHOTOS_BUCKET = "photos";

/**
 * Uploads to a Supabase Storage bucket called "photos" — create this
 * bucket once in the Supabase dashboard (Storage → New bucket → name it
 * "photos" → public) before this is used for real. Enforces the same
 * 5MB-per-file limit the Firebase version had client-side.
 */
export async function uploadImages(
  folder: string,
  docId: string,
  files: File[]
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    if (files[i].size > 5 * 1024 * 1024) {
      throw new Error(`Image ${i + 1} exceeds 5MB limit.`);
    }
    const path = `${folder}/${docId}/${Date.now()}_${i}.jpg`;
    const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, files[i]);
    assertNoError(error);
    const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

/* ------------------------------------------------------------------ */
/*  Listings                                                           */
/* ------------------------------------------------------------------ */

export async function createListing(data: ListingInput): Promise<string> {
  const { data: row, error } = await supabase
    .from("listings")
    .insert(listingToRow(data))
    .select("id")
    .single();
  assertNoError(error);
  return row!.id;
}

export async function getListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapListingRow(data);
}

export async function getListings(
  universityId: string,
  filters?: {
    suburb?: string;
    propertyType?: string;
    maxPrice?: number;
    status?: string;
  },
  maxResults = 50
): Promise<Listing[]> {
  let q = supabase
    .from("listings")
    .select("*")
    .eq("university_id", universityId)
    .eq("status", filters?.status ?? "available")
    .limit(maxResults);

  if (filters?.suburb) q = q.eq("suburb", filters.suburb);
  if (filters?.propertyType) q = q.eq("property_type", filters.propertyType);
  // Postgres can filter price server-side directly — no client-side
  // filtering or composite-index workaround needed here, unlike the
  // Firestore version.
  if (filters?.maxPrice) q = q.lte("price", filters.maxPrice);

  const { data, error } = await q;
  assertNoError(error);
  return (data ?? []).map(mapListingRow);
}

export async function getOwnerListings(ownerId: string): Promise<Listing[]> {
  const { data, error } = await supabase.from("listings").select("*").eq("owner_id", ownerId);
  assertNoError(error);
  return (data ?? []).map(mapListingRow);
}

export async function updateListing(id: string, data: Partial<Listing>): Promise<void> {
  const { error } = await supabase
    .from("listings")
    .update({ ...listingToRow(data), updated_at: new Date().toISOString() })
    .eq("id", id);
  assertNoError(error);
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  assertNoError(error);
}

/* ------------------------------------------------------------------ */
/*  Inquiries                                                          */
/* ------------------------------------------------------------------ */

export async function createInquiry(
  data: Omit<Inquiry, "id" | "createdAt" | "reply" | "repliedAt" | "status">
): Promise<string> {
  const { data: row, error } = await supabase
    .from("inquiries")
    .insert({
      listing_id: data.listingId,
      listing_title: data.listingTitle,
      student_id: data.studentId,
      student_name: data.studentName,
      student_phone: data.studentPhone,
      owner_id: data.ownerId,
      owner_name: data.ownerName,
      message: data.message,
      university_id: data.universityId,
      status: "pending",
    })
    .select("id")
    .single();
  assertNoError(error);
  return row!.id;
}

export async function getStudentInquiries(studentId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase.from("inquiries").select("*").eq("student_id", studentId);
  assertNoError(error);
  return (data ?? []).map(mapInquiryRow);
}

export async function getOwnerInquiries(ownerId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase.from("inquiries").select("*").eq("owner_id", ownerId);
  assertNoError(error);
  return (data ?? []).map(mapInquiryRow);
}

export async function replyToInquiry(id: string, reply: string): Promise<void> {
  const { error } = await supabase
    .from("inquiries")
    .update({ reply, replied_at: new Date().toISOString(), status: "replied" })
    .eq("id", id);
  assertNoError(error);
}

/* ------------------------------------------------------------------ */
/*  Marketplace                                                        */
/* ------------------------------------------------------------------ */

export async function createMarketItem(data: MarketItemInput): Promise<string> {
  const { data: row, error } = await supabase
    .from("marketplace")
    .insert({
      seller_id: data.sellerId,
      seller_name: data.sellerName,
      seller_phone: data.sellerPhone,
      university_id: data.universityId,
      title: data.title,
      description: data.description,
      category: data.category,
      condition: data.condition,
      price: data.price,
      photos: data.photos,
      status: data.status,
    })
    .select("id")
    .single();
  assertNoError(error);
  return row!.id;
}

export async function getMarketItems(universityId: string, category?: string): Promise<MarketItem[]> {
  let q = supabase
    .from("marketplace")
    .select("*")
    .eq("university_id", universityId)
    .eq("status", "available");
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  assertNoError(error);
  return (data ?? []).map(mapMarketItemRow);
}

export async function getMySellerItems(sellerId: string): Promise<MarketItem[]> {
  const { data, error } = await supabase.from("marketplace").select("*").eq("seller_id", sellerId);
  assertNoError(error);
  return (data ?? []).map(mapMarketItemRow);
}

export async function updateMarketItem(id: string, data: Partial<MarketItem>): Promise<void> {
  const row: Row = {};
  if (data.status !== undefined) row.status = data.status;
  if (data.title !== undefined) row.title = data.title;
  if (data.price !== undefined) row.price = data.price;
  const { error } = await supabase.from("marketplace").update(row).eq("id", id);
  assertNoError(error);
}

export async function deleteMarketItem(id: string): Promise<void> {
  const { error } = await supabase.from("marketplace").delete().eq("id", id);
  assertNoError(error);
}

/* ------------------------------------------------------------------ */
/*  Reviews                                                            */
/* ------------------------------------------------------------------ */

export async function createReview(data: Omit<Review, "id" | "createdAt">): Promise<string> {
  const { data: row, error } = await supabase
    .from("reviews")
    .insert({
      reviewer_id: data.reviewerId,
      reviewer_name: data.reviewerName,
      target_id: data.targetId,
      listing_id: data.listingId,
      rating: data.rating,
      comment: data.comment,
      university_id: data.universityId,
    })
    .select("id")
    .single();
  assertNoError(error);

  // Update the target's avg_rating / review_count. Same fetch-then-write
  // approach as the Firestore version (fine at this app's scale) — a
  // Postgres trigger would make this atomic if that's ever worth adding.
  const { data: target } = await supabase
    .from("profiles")
    .select("avg_rating, review_count")
    .eq("id", data.targetId)
    .maybeSingle();

  if (target) {
    const oldCount = Number(target.review_count ?? 0);
    const oldAvg = Number(target.avg_rating ?? 0);
    const newCount = oldCount + 1;
    const newAvg = Math.round(((oldAvg * oldCount + data.rating) / newCount) * 10) / 10;
    await supabase
      .from("profiles")
      .update({ avg_rating: newAvg, review_count: newCount })
      .eq("id", data.targetId);
  }

  return row!.id;
}

export async function getReviewsForTarget(targetId: string): Promise<Review[]> {
  const { data, error } = await supabase.from("reviews").select("*").eq("target_id", targetId);
  assertNoError(error);
  return (data ?? []).map(mapReviewRow);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error || !data) return null;
  return mapProfileRow(data);
}

export async function hasReviewed(reviewerId: string, listingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", reviewerId)
    .eq("listing_id", listingId);
  assertNoError(error);
  return (data ?? []).length > 0;
}

/* ------------------------------------------------------------------ */
/*  Favorites                                                          */
/* ------------------------------------------------------------------ */

export async function addFavorite(uid: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .upsert({ user_id: uid, listing_id: listingId, saved_at: new Date().toISOString() });
  assertNoError(error);
}

export async function removeFavorite(uid: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", uid)
    .eq("listing_id", listingId);
  assertNoError(error);
}

export async function getFavorites(uid: string): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id, saved_at")
    .eq("user_id", uid);
  assertNoError(error);
  return (data ?? []).map((r) => ({ listingId: r.listing_id, savedAt: ts(r.saved_at) }));
}

/* ------------------------------------------------------------------ */
/*  Tenants (landlord-only)                                            */
/* ------------------------------------------------------------------ */

export async function createTenant(data: Omit<Tenant, "id" | "createdAt">): Promise<string> {
  const { data: row, error } = await supabase
    .from("tenants")
    .insert({
      landlord_id: data.landlordId,
      listing_id: data.listingId,
      listing_title: data.listingTitle,
      tenant_name: data.tenantName,
      tenant_phone: data.tenantPhone,
      lease_start: data.leaseStart || null,
      lease_end: data.leaseEnd || null,
      monthly_rent: data.monthlyRent,
      balance: data.balance,
      university_id: data.universityId,
    })
    .select("id")
    .single();
  assertNoError(error);
  return row!.id;
}

export async function getLandlordTenants(landlordId: string): Promise<Tenant[]> {
  const { data, error } = await supabase.from("tenants").select("*").eq("landlord_id", landlordId);
  assertNoError(error);
  return (data ?? []).map(mapTenantRow);
}

export async function updateTenantBalance(id: string, payment: number): Promise<void> {
  const { data: current } = await supabase.from("tenants").select("balance").eq("id", id).maybeSingle();
  const newBalance = Number(current?.balance ?? 0) - payment;
  const { error } = await supabase.from("tenants").update({ balance: newBalance }).eq("id", id);
  assertNoError(error);
}

/* ------------------------------------------------------------------ */
/*  Maintenance requests                                               */
/* ------------------------------------------------------------------ */

export async function createMaintenanceRequest(
  data: Omit<MaintenanceRequest, "id" | "createdAt" | "resolvedAt" | "status">
): Promise<string> {
  const { data: row, error } = await supabase
    .from("maintenance")
    .insert({
      tenant_id: data.tenantId,
      tenant_name: data.tenantName,
      landlord_id: data.landlordId,
      listing_id: data.listingId,
      listing_title: data.listingTitle,
      description: data.description,
      university_id: data.universityId,
      status: "open",
    })
    .select("id")
    .single();
  assertNoError(error);
  return row!.id;
}

export async function getLandlordMaintenance(landlordId: string): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase.from("maintenance").select("*").eq("landlord_id", landlordId);
  assertNoError(error);
  return (data ?? []).map(mapMaintenanceRow);
}

export async function updateMaintenanceStatus(
  id: string,
  status: "in_progress" | "resolved"
): Promise<void> {
  const row: Row = { status };
  if (status === "resolved") row.resolved_at = new Date().toISOString();
  const { error } = await supabase.from("maintenance").update(row).eq("id", id);
  assertNoError(error);
}

/* ------------------------------------------------------------------ */
/*  Admin-only: unrestricted reads across all universities/owners.     */
/*  Gated by the is_admin() RLS policy, not by anything client-side.   */
/* ------------------------------------------------------------------ */

export async function adminGetAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from("profiles").select("*");
  assertNoError(error);
  return (data ?? []).map(mapProfileRow);
}

export async function adminGetAllListings(): Promise<Listing[]> {
  const { data, error } = await supabase.from("listings").select("*");
  assertNoError(error);
  return (data ?? []).map(mapListingRow);
}

export async function adminGetAllMarketItems(): Promise<MarketItem[]> {
  const { data, error } = await supabase.from("marketplace").select("*");
  assertNoError(error);
  return (data ?? []).map(mapMarketItemRow);
}

export async function adminGetAllInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase.from("inquiries").select("*");
  assertNoError(error);
  return (data ?? []).map(mapInquiryRow);
}

export async function adminGetAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase.from("reviews").select("*");
  assertNoError(error);
  return (data ?? []).map(mapReviewRow);
}

export async function adminDeleteListing(id: string): Promise<void> {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  assertNoError(error);
}

export async function adminDeleteMarketItem(id: string): Promise<void> {
  const { error } = await supabase.from("marketplace").delete().eq("id", id);
  assertNoError(error);
}

export async function adminSetUserVerified(uid: string, verified: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").update({ verified }).eq("id", uid);
  assertNoError(error);
}

/* ------------------------------------------------------------------ */
/*  Custom suburbs                                                     */
/* ------------------------------------------------------------------ */

export async function getCustomSuburbs(universityId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("suburbs")
    .select("names")
    .eq("university_id", universityId)
    .maybeSingle();
  if (error || !data) return [];
  return data.names ?? [];
}

export async function addCustomSuburb(universityId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;

  const { data: existing } = await supabase
    .from("suburbs")
    .select("names")
    .eq("university_id", universityId)
    .maybeSingle();

  const current: string[] = existing?.names ?? [];
  if (current.includes(trimmed)) return;

  const { error } = await supabase
    .from("suburbs")
    .upsert({ university_id: universityId, names: [...current, trimmed] });
  assertNoError(error);
}

/* ------------------------------------------------------------------ */
/*  Roommate posts                                                     */
/* ------------------------------------------------------------------ */

export async function createRoommatePost(data: RoommatePostInput): Promise<string> {
  const { data: row, error } = await supabase
    .from("roommates")
    .insert({
      student_id: data.studentId,
      student_name: data.studentName,
      student_phone: data.studentPhone,
      student_photo_url: data.studentPhotoURL,
      university_id: data.universityId,
      bio: data.bio,
      budget: data.budget,
      preferred_suburb: data.preferredSuburb,
      move_in_date: data.moveInDate || null,
      status: data.status,
    })
    .select("id")
    .single();
  assertNoError(error);
  return row!.id;
}

export async function getRoommatePosts(universityId: string): Promise<RoommatePost[]> {
  const { data, error } = await supabase
    .from("roommates")
    .select("*")
    .eq("university_id", universityId)
    .eq("status", "looking");
  assertNoError(error);
  return (data ?? []).map(mapRoommateRow);
}

export async function getMyRoommatePosts(studentId: string): Promise<RoommatePost[]> {
  const { data, error } = await supabase.from("roommates").select("*").eq("student_id", studentId);
  assertNoError(error);
  return (data ?? []).map(mapRoommateRow);
}

export async function updateRoommatePost(id: string, data: Partial<RoommatePost>): Promise<void> {
  const row: Row = {};
  if (data.status !== undefined) row.status = data.status;
  const { error } = await supabase.from("roommates").update(row).eq("id", id);
  assertNoError(error);
}

export async function deleteRoommatePost(id: string): Promise<void> {
  const { error } = await supabase.from("roommates").delete().eq("id", id);
  assertNoError(error);
}

/* ------------------------------------------------------------------ */
/*  Reports                                                             */
/* ------------------------------------------------------------------ */

export async function createReport(data: ReportInput): Promise<string> {
  const { data: row, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: data.reporterId,
      reporter_name: data.reporterName,
      target_type: data.targetType,
      target_id: data.targetId,
      target_label: data.targetLabel,
      reason: data.reason,
      details: data.details,
      university_id: data.universityId,
      status: "open",
    })
    .select("id")
    .single();
  assertNoError(error);
  return row!.id;
}

export async function adminGetAllReports(): Promise<Report[]> {
  const { data, error } = await supabase.from("reports").select("*");
  assertNoError(error);
  return (data ?? []).map(mapReportRow);
}

export async function adminUpdateReportStatus(id: string, status: "reviewed" | "dismissed"): Promise<void> {
  const { error } = await supabase.from("reports").update({ status }).eq("id", id);
  assertNoError(error);
}

/* ------------------------------------------------------------------ */
/*  Saved searches                                                     */
/* ------------------------------------------------------------------ */

export async function createSavedSearch(data: SavedSearchInput): Promise<string> {
  const { data: row, error } = await supabase
    .from("saved_searches")
    .insert({
      uid: data.uid,
      university_id: data.universityId,
      label: data.label,
      suburb: data.suburb,
      property_type: data.propertyType,
      max_price: data.maxPrice,
      last_checked_at: new Date(data.lastCheckedAt).toISOString(),
    })
    .select("id")
    .single();
  assertNoError(error);
  return row!.id;
}

export async function getSavedSearches(uid: string): Promise<SavedSearch[]> {
  const { data, error } = await supabase.from("saved_searches").select("*").eq("uid", uid);
  assertNoError(error);
  return (data ?? []).map(mapSavedSearchRow);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const { error } = await supabase.from("saved_searches").delete().eq("id", id);
  assertNoError(error);
}

export async function touchSavedSearch(id: string): Promise<void> {
  const { error } = await supabase
    .from("saved_searches")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("id", id);
  assertNoError(error);
}

export async function countNewMatches(search: SavedSearch): Promise<number> {
  const results = await getListings(search.universityId, {
    suburb: search.suburb ?? undefined,
    propertyType: search.propertyType ?? undefined,
    maxPrice: search.maxPrice,
  });
  return results.filter((l) => l.createdAt > search.lastCheckedAt).length;
}

/* ------------------------------------------------------------------ */
/*  Chat                                                                */
/* ------------------------------------------------------------------ */

function chatIdFor(contextType: ChatContextType, contextId: string, uidA: string, uidB: string): string {
  const pair = [uidA, uidB].sort().join("_");
  return `${contextType}_${contextId}_${pair}`;
}

export async function getOrCreateChat(
  myUid: string,
  myName: string,
  otherUid: string,
  otherName: string,
  contextType: ChatContextType,
  contextId: string,
  contextLabel: string
): Promise<string> {
  const id = chatIdFor(contextType, contextId, myUid, otherUid);

  // upsert with ignoreDuplicates means this is idempotent in one round
  // trip — no need for the separate "check, then insert" steps the
  // Firestore version needed.
  const { error } = await supabase.from("chats").upsert(
    {
      id,
      participant_ids: [myUid, otherUid],
      participant_names: { [myUid]: myName, [otherUid]: otherName },
      context_type: contextType,
      context_id: contextId,
      context_label: contextLabel,
      last_message: "",
      last_message_at: new Date().toISOString(),
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  assertNoError(error);

  return id;
}

export async function getMyChats(uid: string): Promise<Chat[]> {
  const { data, error } = await supabase.from("chats").select("*").contains("participant_ids", [uid]);
  assertNoError(error);
  return (data ?? []).map(mapChatRow).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

export async function sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const { error: msgError } = await supabase
    .from("chat_messages")
    .insert({ chat_id: chatId, sender_id: senderId, text: trimmed });
  assertNoError(msgError);

  const { error: chatError } = await supabase
    .from("chats")
    .update({ last_message: trimmed, last_message_at: new Date().toISOString() })
    .eq("id", chatId);
  assertNoError(chatError);
}

/**
 * Live-subscribes to a chat's messages, oldest-first, calling back with
 * the FULL message list each time (same contract as the Firestore
 * version's onSnapshot did) — not just the new delta. Internally this
 * does one initial fetch, then appends each new row Realtime pushes.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  let current: ChatMessage[] = [];

  supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .then(({ data }) => {
      current = (data ?? []).map(mapChatMessageRow);
      callback(current);
    });

  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_id=eq.${chatId}` },
      (payload) => {
        current = [...current, mapChatMessageRow(payload.new as Row)];
        callback(current);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/* ------------------------------------------------------------------ */
/*  Admin data export — manual backup, triggered from the admin panel.  */
/*  Same scope note as the Firebase version: on-demand, not scheduled.  */
/*  Chat messages intentionally excluded, same as before.               */
/* ------------------------------------------------------------------ */

export interface BackupData {
  exportedAt: string;
  users: UserProfile[];
  listings: Listing[];
  marketplace: MarketItem[];
  inquiries: Inquiry[];
  reviews: Review[];
  reports: Report[];
  roommates: RoommatePost[];
  savedSearches: SavedSearch[];
  tenants: Tenant[];
  maintenance: MaintenanceRequest[];
}

export async function adminExportAllData(): Promise<BackupData> {
  const [users, listings, marketplace, inquiries, reviews, reports, roommates, savedSearches, tenants, maintenance] =
    await Promise.all([
      adminGetAllUsers(),
      adminGetAllListings(),
      adminGetAllMarketItems(),
      adminGetAllInquiries(),
      adminGetAllReviews(),
      adminGetAllReports(),
      supabase.from("roommates").select("*").then(({ data }) => (data ?? []).map(mapRoommateRow)),
      supabase.from("saved_searches").select("*").then(({ data }) => (data ?? []).map(mapSavedSearchRow)),
      supabase.from("tenants").select("*").then(({ data }) => (data ?? []).map(mapTenantRow)),
      supabase.from("maintenance").select("*").then(({ data }) => (data ?? []).map(mapMaintenanceRow)),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    users, listings, marketplace, inquiries, reviews,
    reports, roommates, savedSearches, tenants, maintenance,
  };
}

/* ------------------------------------------------------------------ */
/*  Error logs                                                          */
/* ------------------------------------------------------------------ */

export async function adminGetErrorLogs(max = 100): Promise<ErrorLog[]> {
  const { data, error } = await supabase
    .from("error_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(max);
  assertNoError(error);
  return (data ?? []).map(mapErrorLogRow);
}

export async function adminMarkErrorResolved(id: string, resolved: boolean): Promise<void> {
  const { error } = await supabase.from("error_logs").update({ resolved }).eq("id", id);
  assertNoError(error);
}

export async function adminDeleteErrorLog(id: string): Promise<void> {
  const { error } = await supabase.from("error_logs").delete().eq("id", id);
  assertNoError(error);
}
