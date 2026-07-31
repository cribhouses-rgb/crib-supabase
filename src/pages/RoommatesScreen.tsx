import { useEffect, useState } from "react";
import { UserPlus, MapPin, Calendar, DollarSign, Trash2, CheckCircle, MessageCircle, Flag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRoommatePosts, getMyRoommatePosts, updateRoommatePost, deleteRoommatePost, createReport } from "../lib/db";
import ReportModal from "../components/ReportModal";
import type { RoommatePost } from "../types";

interface Props {
  onToast: (msg: string) => void;
  onAddPost: () => void;
  onStartChat: (otherUid: string, otherName: string, contextId: string, contextLabel: string) => void;
}

export default function RoommatesScreen({ onToast, onAddPost, onStartChat }: Props) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [posts, setPosts] = useState<RoommatePost[]>([]);
  const [myPosts, setMyPosts] = useState<RoommatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<RoommatePost | null>(null);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    if (tab === "browse") {
      getRoommatePosts(profile.universityId)
        .then((all) => setPosts(all.filter((p) => p.studentId !== profile.uid)))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      getMyRoommatePosts(profile.uid)
        .then(setMyPosts)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [profile, tab]);

  async function handleMarkFound(id: string) {
    await updateRoommatePost(id, { status: "found" });
    setMyPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: "found" } : p));
    onToast("Marked as found");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await deleteRoommatePost(id);
    setMyPosts((prev) => prev.filter((p) => p.id !== id));
    onToast("Post deleted");
  }

  return (
    <div className="pb-24">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Find a Roommate</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Connect with fellow students looking to share</p>
          </div>
          <button onClick={onAddPost}
            className="h-10 px-4 rounded-xl bg-brand-700 text-white text-sm font-medium flex items-center gap-1">
            <UserPlus size={15} /> Post
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          <button onClick={() => setTab("browse")}
            className={`flex-1 h-10 rounded-xl text-sm font-medium ${
              tab === "browse" ? "bg-brand-700 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
            }`}>Browse</button>
          <button onClick={() => setTab("mine")}
            className={`flex-1 h-10 rounded-xl text-sm font-medium ${
              tab === "mine" ? "bg-brand-700 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
            }`}>My post</button>
        </div>

        {tab === "browse" && (
          <div className="space-y-2 mt-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">
                No one's looking for a roommate right now.
              </p>
            ) : (
              posts.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700 relative">
                  <button
                    onClick={() => setReportTarget(p)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
                  >
                    <Flag size={12} className="text-gray-400 dark:text-gray-500" />
                  </button>
                  <div className="flex items-center gap-3 pr-8">
                    <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold bg-brand-700 overflow-hidden flex-shrink-0">
                      {p.studentPhotoURL ? (
                        <img src={p.studentPhotoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        p.studentName.split(" ").map((w) => w[0]).join("")
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{p.studentName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.bio}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><DollarSign size={11} /> up to ${p.budget}/mo</span>
                    {p.preferredSuburb && (
                      <span className="flex items-center gap-1"><MapPin size={11} /> {p.preferredSuburb}</span>
                    )}
                    {p.moveInDate && (
                      <span className="flex items-center gap-1"><Calendar size={11} /> {p.moveInDate}</span>
                    )}
                  </div>
                  <button
                    onClick={() => onStartChat(p.studentId, p.studentName, p.id, `Roommate: ${p.studentName}`)}
                    className="w-full mt-2 h-9 rounded-lg text-white text-xs font-medium bg-brand-700 flex items-center justify-center gap-1"
                  >
                    <MessageCircle size={13} /> Message {p.studentName.split(" ")[0]}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "mine" && (
          <div className="space-y-2 mt-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" />
              </div>
            ) : myPosts.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">
                You haven't posted yet. Tap "Post" to let others know you're looking.
              </p>
            ) : (
              myPosts.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">{p.bio}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        up to ${p.budget}/mo{p.preferredSuburb ? ` · ${p.preferredSuburb}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                      p.status === "looking" ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {p.status === "looking" && (
                      <button onClick={() => handleMarkFound(p.id)}
                        className="flex-1 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-1">
                        <CheckCircle size={12} /> Mark found
                      </button>
                    )}
                    <button onClick={() => handleDelete(p.id)}
                      className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {reportTarget && profile && (
        <ReportModal
          targetLabel={reportTarget.studentName}
          onClose={() => setReportTarget(null)}
          onSubmit={async (reason, details) => {
            await createReport({
              reporterId: profile.uid,
              reporterName: profile.fullName,
              targetType: "roommate",
              targetId: reportTarget.id,
              targetLabel: reportTarget.studentName,
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
