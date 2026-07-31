import { useEffect, useState } from "react";
import {
  ChevronLeft, Heart, MapPin, Bed, Bath, Bus, Star,
  Share2, MessageCircle, Wifi, Droplet, Zap, Shield, Car, Sun, Droplets,
  BadgeCheck, Flag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  createInquiry, getUserProfile, getReviewsForTarget,
  createReview, hasReviewed, createReport,
} from "../lib/db";
import StarRating from "../components/StarRating";
import ReportModal from "../components/ReportModal";
import type { Listing, UserProfile, Review } from "../types";

const AMENITY_ICON: Record<string, typeof Wifi> = {
  WiFi: Wifi, Water: Droplet, Electricity: Zap, Security: Shield,
  Parking: Car, "Backup power": Sun, Borehole: Droplets,
};

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #7f1d1d, #b91c1c)",
  "linear-gradient(135deg, #0f766e, #14b8a6)",
  "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  "linear-gradient(135deg, #7c2d12, #ea580c)",
  "linear-gradient(135deg, #4c1d95, #7c3aed)",
  "linear-gradient(135deg, #365314, #65a30d)",
];

interface Props {
  listing: Listing;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onBack: () => void;
  onToast: (msg: string) => void;
}

export default function ListingDetail({ listing: l, isFav, onToggleFav, onBack, onToast }: Props) {
  const { profile } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [showInquiry, setShowInquiry] = useState(false);
  const coverIdx = l.title.length % COVER_GRADIENTS.length;

  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    getUserProfile(l.ownerId).then(setOwner).catch(console.error);
    getReviewsForTarget(l.ownerId).then(setReviews).catch(console.error);
    if (profile?.role === "student") {
      hasReviewed(profile.uid, l.id).then(setAlreadyReviewed).catch(console.error);
    }
  }, [l.ownerId, l.id, profile]);

  async function handleInquire() {
    if (!profile || !message.trim()) return;
    setSending(true);
    try {
      await createInquiry({
        listingId: l.id,
        listingTitle: l.title,
        studentId: profile.uid,
        studentName: profile.fullName,
        studentPhone: profile.phone,
        ownerId: l.ownerId,
        ownerName: l.ownerName,
        message: message.trim(),
        universityId: profile.universityId,
      });
      onToast("Inquiry sent to " + l.ownerName);
      setShowInquiry(false);
      setMessage("");
    } catch (err) {
      console.error(err);
      onToast("Failed to send inquiry");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmitReview() {
    if (!profile || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await createReview({
        reviewerId: profile.uid,
        reviewerName: profile.fullName,
        targetId: l.ownerId,
        listingId: l.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
        universityId: profile.universityId,
      });
      onToast("Review submitted");
      setShowReviewForm(false);
      setAlreadyReviewed(true);
      const updated = await getReviewsForTarget(l.ownerId);
      setReviews(updated);
      const updatedOwner = await getUserProfile(l.ownerId);
      setOwner(updatedOwner);
    } catch (err) {
      console.error(err);
      onToast("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }

  function handleShare() {
    const text = `Check out this listing on Student Crib: ${l.title} — $${l.price}/mo in ${l.suburb}. https://crib-zw.web.app`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="pb-28">
      {/* Cover */}
      <div
        className="h-64 relative flex items-center justify-center"
        style={{ background: l.photos[0] ? `url(${l.photos[0]}) center/cover` : COVER_GRADIENTS[coverIdx] }}
      >
        {!l.photos[0] && <span className="text-white/20 text-6xl font-bold">{l.suburb[0]}</span>}
        <button onClick={onBack} className="absolute top-3 left-3 h-9 w-9 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => onToggleFav(l.id)} className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center">
          <Heart size={18} className={isFav ? "fill-red-600 text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"} />
        </button>
        <button onClick={() => setShowReport(true)} className="absolute top-3 right-14 h-9 w-9 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center">
          <Flag size={16} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div className="p-4">
        {/* Price + distance */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-2xl font-bold text-brand-700 dark:text-brand-400">
              ${l.price}<span className="text-sm font-normal text-gray-400 dark:text-gray-500">/mo</span>
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{l.suburb} · {l.propertyType.replace("_", " ")}</p>
          </div>
          <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
            <MapPin size={13} />{l.distanceKm} km
          </span>
        </div>

        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-3">{l.title}</h1>

        {/* Quick stats */}
        <div className="flex gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1"><Bed size={15} />{l.beds} bed</span>
          <span className="flex items-center gap-1"><Bath size={15} />{l.baths} bath</span>
          {l.nearShuttle && <span className="flex items-center gap-1 text-brand-700 dark:text-brand-400"><Bus size={15} />Shuttle</span>}
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mt-4">
          {l.amenities.map((a) => {
            const Icon = AMENITY_ICON[a] ?? Wifi;
            return (
              <span key={a} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full">
                <Icon size={13} /> {a}
              </span>
            );
          })}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-4">{l.description}</p>

        {/* Address */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{l.address}</p>

        {/* Owner card */}
        <div className="flex items-center gap-3 mt-5 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl">
          <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold bg-brand-700 overflow-hidden">
            {owner?.photoURL ? (
              <img src={owner.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              l.ownerName.split(" ").map((w) => w[0]).join("")
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
              {l.ownerName}
              {owner?.verified && (
                <BadgeCheck size={14} className="text-blue-500 dark:text-blue-400 fill-blue-100" />
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              {owner && owner.reviewCount > 0 ? (
                <>
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  {owner.avgRating.toFixed(1)} ({owner.reviewCount} review{owner.reviewCount !== 1 ? "s" : ""}) · {l.ownerRole}
                </>
              ) : (
                <>No reviews yet · {l.ownerRole}</>
              )}
            </p>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Reviews</h2>
            <div className="space-y-2">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.reviewerName}</p>
                    <StarRating value={r.rating} readOnly size={13} />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave a review (students only, one per listing) */}
        {profile?.role === "student" && !alreadyReviewed && (
          <div className="mt-4">
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="text-sm text-brand-700 dark:text-brand-400 font-medium underline underline-offset-2"
              >
                Leave a review for {l.ownerName.split(" ")[0]}
              </button>
            ) : (
              <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 space-y-2">
                <StarRating value={reviewRating} onChange={setReviewRating} />
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was your experience with this landlord/agent?"
                  className="w-full h-20 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !reviewComment.trim()}
                  className="w-full h-10 rounded-xl bg-brand-700 text-white text-sm font-medium disabled:opacity-40"
                >
                  {submittingReview ? "Submitting…" : "Submit review"}
                </button>
              </div>
            )}
          </div>
        )}
        {profile?.role === "student" && alreadyReviewed && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">You've already reviewed this listing.</p>
        )}

        {/* Inquiry form */}
        {showInquiry && profile?.role === "student" && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${l.ownerName.split(" ")[0]}, I'm interested in this room…`}
              className="w-full h-24 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
            <button
              onClick={handleInquire}
              disabled={sending || !message.trim()}
              className="w-full mt-2 h-10 rounded-xl text-white text-sm font-medium bg-brand-700 disabled:opacity-40"
            >
              {sending ? "Sending…" : "Send inquiry"}
            </button>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3 flex gap-2 z-20">
        <button
          onClick={handleShare}
          className="h-12 w-12 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center text-green-600 dark:text-green-400"
        >
          <Share2 size={20} />
        </button>
        <button
          onClick={() => {
            if (profile?.role !== "student") {
              onToast("Only students can inquire");
              return;
            }
            setShowInquiry(!showInquiry);
          }}
          className="flex-1 h-12 rounded-xl text-white font-semibold flex items-center justify-center gap-2 bg-brand-700"
        >
          <MessageCircle size={18} /> Inquire Now
        </button>
      </div>

      {showReport && profile && (
        <ReportModal
          targetLabel={l.title}
          onClose={() => setShowReport(false)}
          onSubmit={async (reason, details) => {
            await createReport({
              reporterId: profile.uid,
              reporterName: profile.fullName,
              targetType: "listing",
              targetId: l.id,
              targetLabel: l.title,
              reason,
              details,
              universityId: profile.universityId,
            });
          }}
        />
      )}
    </div>
  );
}
