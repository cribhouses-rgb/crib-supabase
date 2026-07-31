import { supabase } from "../supabaseClient";
import { createListing, createMarketItem } from "./db";
import { SEED_LISTINGS, SEED_MARKETPLACE } from "../data/seed-data";

/**
 * Seeds Supabase with sample listings and marketplace items.
 *
 * Call this once from the Admin Panel / Profile screen button. It checks
 * whether seed data already exists before writing, so running it twice
 * won't duplicate anything.
 *
 * The signed-in user's uid is stamped as the owner/seller so the data is
 * editable by that account (RLS enforces the owner_id/seller_id match).
 */
export async function seedDatabase(uid: string): Promise<{ listings: number; market: number }> {
  let listingsAdded = 0;
  let marketAdded = 0;

  const { data: existingListings } = await supabase
    .from("listings")
    .select("id")
    .eq("university_id", "hit")
    .limit(1);

  if (!existingListings || existingListings.length === 0) {
    for (const listing of SEED_LISTINGS) {
      await createListing({ ...listing, ownerId: uid });
      listingsAdded++;
    }
  }

  const { data: existingMarket } = await supabase
    .from("marketplace")
    .select("id")
    .eq("university_id", "hit")
    .limit(1);

  if (!existingMarket || existingMarket.length === 0) {
    for (const item of SEED_MARKETPLACE) {
      await createMarketItem({ ...item, sellerId: uid });
      marketAdded++;
    }
  }

  return { listings: listingsAdded, market: marketAdded };
}
