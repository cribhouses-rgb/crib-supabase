import { useCallback, useEffect, useState, Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { getListing, getFavorites, addFavorite, removeFavorite, getOrCreateChat } from "./lib/db";
import Welcome from "./pages/Welcome";
import RoleSelect from "./pages/RoleSelect";
import AcceptTerms from "./pages/AcceptTerms";
import ProfileComplete from "./pages/ProfileComplete";
import HomeScreen from "./pages/HomeScreen";
import SearchScreen from "./pages/SearchScreen";
import ListingDetail from "./pages/ListingDetail";
import MarketplaceScreen from "./pages/MarketplaceScreen";
import RoommatesScreen from "./pages/RoommatesScreen";
import ProfileScreen from "./pages/ProfileScreen";
import ProviderDashboard from "./pages/ProviderDashboard";
import BottomTabs, { type TabId } from "./components/BottomTabs";
import Toast from "./components/Toast";
import type { Listing, Chat } from "./types";

// These are either full-screen "modal-like" flows that most sessions never
// open (Admin panel, Chat, the Add-* forms) or genuinely rare screens
// (Saved Searches). Splitting them out means the first load — which every
// single user pays for — doesn't include code most people won't touch in
// that session.
const AddRoommatePostForm = lazy(() => import("./pages/AddRoommatePostForm"));
const AddListingForm = lazy(() => import("./pages/AddListingForm"));
const AddMarketItemForm = lazy(() => import("./pages/AddMarketItemForm"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const ChatsListScreen = lazy(() => import("./pages/ChatsListScreen"));
const ChatThreadScreen = lazy(() => import("./pages/ChatThreadScreen"));
const SavedSearchesScreen = lazy(() => import("./pages/SavedSearchesScreen"));

function ScreenLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" />
    </div>
  );
}

function MainApp() {
  const { profile } = useAuth();
  const isStudent = profile?.role === "student";
  const [tab, setTab] = useState<TabId>("home");
  const [openListingId, setOpenListingId] = useState<string | null>(null);
  const [openListing, setOpenListing] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);
  const [showAddMarketItem, setShowAddMarketItem] = useState(false);
  const [showAddRoommatePost, setShowAddRoommatePost] = useState(false);
  const [showChatsList, setShowChatsList] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [openChat, setOpenChat] = useState<{ id: string; otherName: string; contextLabel: string } | null>(null);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [favListings, setFavListings] = useState<Listing[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const fireToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Load favorites
  useEffect(() => {
    if (!profile) return;
    getFavorites(profile.uid)
      .then((favs) => setFavIds(new Set(favs.map((f) => f.listingId))))
      .catch(console.error);
  }, [profile]);

  // Load fav listing details
  useEffect(() => {
    if (favIds.size === 0) { setFavListings([]); return; }
    Promise.all([...favIds].map((id) => getListing(id)))
      .then((results) => setFavListings(results.filter(Boolean) as Listing[]))
      .catch(console.error);
  }, [favIds]);

  // Load listing detail
  useEffect(() => {
    if (!openListingId) { setOpenListing(null); return; }
    getListing(openListingId).then(setOpenListing).catch(console.error);
  }, [openListingId]);

  async function toggleFav(id: string) {
    if (!profile) return;
    const newFavs = new Set(favIds);
    if (newFavs.has(id)) {
      newFavs.delete(id);
      await removeFavorite(profile.uid, id).catch(console.error);
    } else {
      newFavs.add(id);
      await addFavorite(profile.uid, id).catch(console.error);
    }
    setFavIds(newFavs);
  }

  // Starts (or resumes) a chat about a marketplace item or roommate post,
  // then opens the thread directly — used in place of the old WhatsApp
  // hand-off buttons on those two screens.
  async function handleStartChat(
    otherUid: string,
    otherName: string,
    contextId: string,
    contextLabel: string
  ) {
    if (!profile) return;
    const contextType = tab === "marketplace" ? "marketplace" : "roommate";
    try {
      const chatId = await getOrCreateChat(
        profile.uid, profile.fullName, otherUid, otherName, contextType, contextId, contextLabel
      );
      setOpenChat({ id: chatId, otherName, contextLabel });
    } catch (err) {
      console.error(err);
      fireToast("Couldn't start chat");
    }
  }

  function handleOpenChatFromList(chat: Chat) {
    if (!profile) return;
    const otherUid = chat.participantIds.find((id) => id !== profile.uid);
    const otherName = otherUid ? chat.participantNames[otherUid] ?? "Unknown" : "Unknown";
    setOpenChat({ id: chat.id, otherName, contextLabel: chat.contextLabel });
  }

  // Add listing form
  if (showAddListing) {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <AddListingForm onBack={() => setShowAddListing(false)} onToast={fireToast} />
        {toast && <Toast message={toast} />}
      </Suspense>
    );
  }

  // Add marketplace item form
  if (showAddMarketItem) {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <AddMarketItemForm onBack={() => setShowAddMarketItem(false)} onToast={fireToast} />
        {toast && <Toast message={toast} />}
      </Suspense>
    );
  }

  // Add roommate post form
  if (showAddRoommatePost) {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <AddRoommatePostForm onBack={() => setShowAddRoommatePost(false)} onToast={fireToast} />
        {toast && <Toast message={toast} />}
      </Suspense>
    );
  }

  // Open chat thread — takes priority over the chats list underneath it
  if (openChat) {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <ChatThreadScreen
          chatId={openChat.id}
          otherName={openChat.otherName}
          contextLabel={openChat.contextLabel}
          onBack={() => setOpenChat(null)}
        />
      </Suspense>
    );
  }

  // Chats list
  if (showChatsList) {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <ChatsListScreen
          onBack={() => setShowChatsList(false)}
          onOpenChat={handleOpenChatFromList}
        />
      </Suspense>
    );
  }

  // Saved searches (students only)
  if (showSavedSearches) {
    return (
      <Suspense fallback={<ScreenLoading />}>
        <SavedSearchesScreen
          onBack={() => setShowSavedSearches(false)}
          favs={favIds}
          onToggleFav={toggleFav}
          onOpenListing={(id) => { setShowSavedSearches(false); setOpenListingId(id); }}
        />
      </Suspense>
    );
  }

  // Listing detail
  if (openListing) {
    return (
      <>
        <ListingDetail
          listing={openListing}
          isFav={favIds.has(openListing.id)}
          onToggleFav={toggleFav}
          onBack={() => setOpenListingId(null)}
          onToast={fireToast}
        />
        {toast && <Toast message={toast} />}
      </>
    );
  }

  return (
    <>
      {tab === "home" && (
        isStudent ? (
          <HomeScreen
            favs={favIds}
            onToggleFav={toggleFav}
            onOpenListing={(id) => setOpenListingId(id)}
            onGoSearch={() => setTab("search")}
            onOpenChats={() => setShowChatsList(true)}
          />
        ) : (
          <ProviderDashboard
            onAddListing={() => setShowAddListing(true)}
            onToast={fireToast}
            onOpenChats={() => setShowChatsList(true)}
          />
        )
      )}
      {tab === "search" && (
        <SearchScreen
          favs={favIds}
          onToggleFav={toggleFav}
          onOpenListing={(id) => setOpenListingId(id)}
          onOpenSavedSearches={() => setShowSavedSearches(true)}
        />
      )}
      {tab === "marketplace" && (
        <MarketplaceScreen
          onToast={fireToast}
          onAddItem={() => setShowAddMarketItem(true)}
          onStartChat={handleStartChat}
        />
      )}
      {tab === "roommates" && isStudent && (
        <RoommatesScreen
          onToast={fireToast}
          onAddPost={() => setShowAddRoommatePost(true)}
          onStartChat={handleStartChat}
        />
      )}
      {tab === "profile" && (
        <ProfileScreen
          favListings={favListings}
          onOpenListing={(id) => setOpenListingId(id)}
          onToast={fireToast}
          onAddListing={() => setShowAddListing(true)}
          onAddMarketItem={() => setShowAddMarketItem(true)}
        />
      )}
      <BottomTabs active={tab} onChange={setTab} showRoommates={isStudent} />
      {toast && <Toast message={toast} />}
    </>
  );
}

function Router() {
  const { status } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);

  switch (status) {
    case "loading":
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" />
        </div>
      );
    case "signed-out":
      return <Welcome />;
    case "needs-role":
      return termsAccepted
        ? <RoleSelect />
        : <AcceptTerms onAccept={() => setTermsAccepted(true)} />;
    case "needs-profile":
      return <ProfileComplete />;
    case "ready":
      return <MainApp />;
    case "admin":
      return (
        <Suspense fallback={<ScreenLoading />}>
          <AdminPanel />
        </Suspense>
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-black flex justify-center">
        <div className="w-full max-w-md bg-gray-50 dark:bg-gray-900 min-h-screen relative">
          <Router />
        </div>
      </div>
    </AuthProvider>
  );
}
