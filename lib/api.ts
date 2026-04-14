const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API = `${BASE_URL}/api/v1`;

// ─── Token helpers ───────────────────────────────────────────────────────────
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
};

export const removeToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const buildQueryString = (params: Record<string, any>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

const getSafeNumber = (...values: any[]): number => {
  for (const value of values) {
    const num = Number(value);
    if (!Number.isNaN(num) && Number.isFinite(num)) return num;
  }
  return 0;
};

// ✅ FIX: Proper error message handler
const getErrorMessage = (err: any): string => {
  if (!err) return "";

  if (typeof err === "string") return err;

  if (typeof err === "object") {
    return (
      err.message ||
      err.error ||
      err.detail ||
      JSON.stringify(err)
    );
  }

  return String(err);
};

export const unwrapList = <T = any>(response: any): T[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.posts)) return response.posts;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.notifications)) return response.notifications;
  if (Array.isArray(response?.creators)) return response.creators;
  if (Array.isArray(response?.comments)) return response.comments;
  if (Array.isArray(response?.transactions)) return response.transactions;
  if (Array.isArray(response?.payments)) return response.payments;
  if (Array.isArray(response?.data?.posts)) return response.data.posts;
  if (Array.isArray(response?.data?.comments)) return response.data.comments;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  return [];
};

export const unwrapItem = <T = any>(response: any): T => {
  if (response?.data && !Array.isArray(response.data)) return response.data;
  if (response?.item && !Array.isArray(response.item)) return response.item;
  if (response?.post && !Array.isArray(response.post)) return response.post;
  if (response?.creator && !Array.isArray(response.creator)) return response.creator;
  if (response?.wallet && !Array.isArray(response.wallet)) return response.wallet;
  if (response?.payment && !Array.isArray(response.payment)) return response.payment;
  if (response?.transaction && !Array.isArray(response.transaction)) return response.transaction;
  if (response?.comment && !Array.isArray(response.comment)) return response.comment;
  return response;
};

const normalizeCreator = (creator: any = {}) => {
  const user = creator?.user || {};

  return {
    ...creator,
    id:
      creator?.id ??
      creator?.creator_id ??
      creator?.user_id ??
      user?.id ??
      null,

    username:
      creator?.username ||
      creator?.user_name ||
      creator?.handle ||
      user?.username ||
      user?.user_name ||
      "",

    display_name:
      creator?.display_name ||
      creator?.full_name ||
      creator?.name ||
      user?.display_name ||
      user?.full_name ||
      user?.name ||
      creator?.username ||
      user?.username ||
      "Creator",

    avatar_url:
      creator?.avatar_url ||
      creator?.avatar ||
      creator?.profile_image ||
      creator?.profile_picture ||
      creator?.image ||
      user?.avatar_url ||
      user?.avatar ||
      user?.profile_image ||
      user?.profile_picture ||
      "",

    cover_photo_url:
      creator?.cover_photo_url ||
      creator?.cover_image ||
      creator?.cover ||
      creator?.banner ||
      creator?.header_image ||
      user?.cover_photo_url ||
      user?.cover_image ||
      user?.cover ||
      user?.banner ||
      "",

    is_verified: Boolean(
      creator?.is_verified ||
      creator?.verified ||
      user?.is_verified ||
      user?.verified
    ),

    is_free: Boolean(
      creator?.is_free === true ||
      user?.is_free === true ||
      Number(creator?.subscription_price ?? creator?.price ?? user?.subscription_price ?? user?.price ?? 0) === 0
    ),

    subscription_price: Number(
      creator?.subscription_price ??
      creator?.price ??
      user?.subscription_price ??
      user?.price ??
      0
    ),

    bio:
      creator?.bio ||
      creator?.description ||
      creator?.about ||
      user?.bio ||
      user?.description ||
      "",

    is_online: Boolean(
      creator?.is_online ||
      creator?.online ||
      user?.is_online ||
      user?.online
    ),

    subscribers_count: Number(
      creator?.subscribers_count ??
      creator?.total_subscribers ??
      creator?.subscriber_count ??
      user?.subscribers_count ??
      user?.total_subscribers ??
      0
    ),
  };
};

const normalizeComment = (comment: any = {}) => {
  const user = comment?.user || comment?.creator || comment?.author || {};

  return {
    ...comment,
    id: comment?.id ?? comment?.comment_id ?? `${Date.now()}-${Math.random()}`,
    content:
      comment?.content ||
      comment?.text ||
      comment?.comment ||
      comment?.body ||
      comment?.message ||
      "",
    created_at: comment?.created_at || comment?.createdAt || null,
    user: {
      ...user,
      id: user?.id ?? comment?.user_id ?? null,
      username:
        user?.username ||
        user?.user_name ||
        user?.handle ||
        comment?.username ||
        "User",
      display_name:
        user?.display_name ||
        user?.full_name ||
        user?.name ||
        user?.username ||
        comment?.username ||
        "User",
      avatar_url:
        user?.avatar_url ||
        user?.avatar ||
        user?.profile_image ||
        user?.profile_picture ||
        "",
    },
  };
};

const normalizeCommentsList = (response: any) => {
  const list =
    Array.isArray(response) ? response :
    Array.isArray(response?.data) ? response.data :
    Array.isArray(response?.items) ? response.items :
    Array.isArray(response?.results) ? response.results :
    Array.isArray(response?.comments) ? response.comments :
    Array.isArray(response?.data?.comments) ? response.data.comments :
    [];

  return list.map((item: any) => normalizeComment(item));
};

export const normalizePost = (post: any = {}) => {
  const creator = normalizeCreator(post?.creator || post?.user || post?.profile || {});

  const is_ppv = Boolean(
    post?.is_ppv ||
      post?.ppv ||
      post?.is_paid ||
      post?.paid_post ||
      post?.locked ||
      post?.is_locked ||
      post?.visibility === "ppv"
  );

  const is_locked = Boolean(
    post?.is_locked ||
      post?.locked ||
      post?.can_view === false ||
      is_ppv ||
      (!post?.is_free && post?.is_free !== undefined)
  );

  const normalizedCaption =
    post?.caption ||
    post?.content ||
    post?.description ||
    post?.text ||
    "";

  const likesCount = getSafeNumber(
    post?.likes_count,
    post?.like_count,
    post?.total_likes,
    post?.stats?.likes_count,
    post?.stats?.like_count,
    post?.stats?.total_likes,
    Array.isArray(post?.likes) ? post.likes.length : undefined,
    Array.isArray(post?.liked_by) ? post.liked_by.length : undefined
  );

  const commentsCount = getSafeNumber(
    post?.comments_count,
    post?.comment_count,
    post?.total_comments,
    post?.stats?.comments_count,
    post?.stats?.comment_count,
    post?.stats?.total_comments,
    Array.isArray(post?.comments) ? post.comments.length : undefined
  );

  return {
    ...post,
    creator,
    creator_id: post?.creator_id ?? creator?.id ?? post?.user_id ?? null,
    title: post?.title || "",
    caption: normalizedCaption,
    content: normalizedCaption,
    description: normalizedCaption,
    likes_count: likesCount,
    comments_count: commentsCount,
    like_count: likesCount,
    comment_count: commentsCount,
    is_liked: Boolean(
      post?.is_liked ??
      post?.liked ??
      post?.viewer_has_liked ??
      post?.meta?.is_liked
    ),
    is_bookmarked: Boolean(
      post?.is_bookmarked ??
      post?.bookmarked ??
      post?.viewer_has_bookmarked
    ),
    is_ppv,
    is_locked,
  };
};

const normalizeListOfPosts = (response: any) => {
  return unwrapList(response).map((item: any) => normalizePost(item));
};

const normalizeWallet = (wallet: any = {}) => {
  return {
    ...wallet,
    id: wallet?.id ?? null,
    balance: Number(wallet?.balance ?? wallet?.amount ?? 0),
    currency: wallet?.currency || "USD",
    created_at: wallet?.created_at || null,
    updated_at: wallet?.updated_at || null,
  };
};

const normalizePayment = (payment: any = {}) => {
  return {
    ...payment,
    id: payment?.id ?? null,
    provider: payment?.provider || "",
    provider_transaction_id: payment?.provider_transaction_id || "",
    amount: Number(payment?.amount ?? 0),
    currency: payment?.currency || "USD",
    status: String(payment?.status || "").toLowerCase(),
    created_at: payment?.created_at || null,
    creator: payment?.creator ? normalizeCreator(payment.creator) : payment?.creator,
    recipient: payment?.recipient ? normalizeCreator(payment.recipient) : payment?.recipient,
  };
};

const normalizeListOfPayments = (response: any) => {
  return unwrapList(response).map((item: any) => normalizePayment(item));
};

// ─── Core fetch wrapper ──────────────────────────────────────────────────────
export async function apiFetch<T = any>(
  path: string,
  method: Method = "GET",
  body?: any,
  isFormData = false
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;

  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (error: any) {
    throw new Error("Network error or CORS issue");
  }

  const responseData = await res.json().catch(() => ({}));

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  // ✅ FIXED ERROR HANDLING
  if (!res.ok) {
    throw new Error(
      getErrorMessage(responseData?.detail) ||
      getErrorMessage(responseData?.message) ||
      getErrorMessage(responseData?.error) ||
      `Error ${res.status}`
    );
  }

  if (res.status === 204) {
    return {} as T;
  }

  return responseData;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch("/auth/login", "POST", { email, password }),

  register: (data: {
    email: string;
    password: string;
    display_name: string;
  }) => apiFetch("/auth/register", "POST", data),

  me: () => apiFetch("/user/profile/me"),
};

// ─── FEED ────────────────────────────────────────────────────────────────────
export const feedApi = {
  getAllCreatorsPosts: async (limit = 20, offset = 0) => {
    const res = await apiFetch(
      `/user/browse/posts${buildQueryString({ limit, offset })}`
    );

    const list = normalizeListOfPosts(res);
    return {
      ...(typeof res === "object" && res ? res : {}),
      data: list,
    };
  },

  getAllCreatorsPostsRaw: (limit = 20, offset = 0) =>
    apiFetch(`/user/browse/posts${buildQueryString({ limit, offset })}`),

  getAllCreatorsPostsList: async (limit = 20, offset = 0) => {
    const res = await apiFetch(
      `/user/browse/posts${buildQueryString({ limit, offset })}`
    );
    return normalizeListOfPosts(res);
  },
};

// ─── BROWSE / CREATOR PROFILE ────────────────────────────────────────────────
export const browseApi = {
  getCreators: async (limit = 20, offset = 0) => {
    const res = await apiFetch(
      `/user/browse/creators${buildQueryString({ limit, offset })}`
    );

    const list = unwrapList(res).map((item: any) => normalizeCreator(item));
    return {
      ...(typeof res === "object" && res ? res : {}),
      data: list,
    };
  },

  getCreatorsList: async (limit = 20, offset = 0) => {
    const res = await apiFetch(
      `/user/browse/creators${buildQueryString({ limit, offset })}`
    );
    return unwrapList(res).map((item: any) => normalizeCreator(item));
  },

  getCreatorProfile: async (creatorId: string | number) => {
    const res = await apiFetch(`/user/browse/creators/${creatorId}`);
    const item = normalizeCreator(unwrapItem(res));

    return {
      ...(typeof res === "object" && res ? res : {}),
      data: item,
    };
  },

  getCreatorProfileItem: async (creatorId: string | number) => {
    const res = await apiFetch(`/user/browse/creators/${creatorId}`);
    return normalizeCreator(unwrapItem(res));
  },

  getCreatorPosts: async (
    creatorId: string | number,
    limit = 20,
    offset = 0
  ) => {
    const res = await apiFetch(
      `/user/browse/creators/${creatorId}/posts${buildQueryString({
        limit,
        offset,
      })}`
    );

    const list = normalizeListOfPosts(res);
    return {
      ...(typeof res === "object" && res ? res : {}),
      data: list,
    };
  },

  getCreatorPostsList: async (
    creatorId: string | number,
    limit = 20,
    offset = 0
  ) => {
    const res = await apiFetch(
      `/user/browse/creators/${creatorId}/posts${buildQueryString({
        limit,
        offset,
      })}`
    );
    return normalizeListOfPosts(res);
  },

  getPost: async (postId: string | number, creatorId: string | number) => {
    const res = await apiFetch(
      `/user/browse/posts/${postId}${buildQueryString({
        creator_id: creatorId,
      })}`
    );

    const item = normalizePost(unwrapItem(res));
    return {
      ...(typeof res === "object" && res ? res : {}),
      data: item,
    };
  },

  checkPostAccess: (postId: string | number, creatorId: string | number) =>
    apiFetch(
      `/user/browse/posts/${postId}/check-access${buildQueryString({
        creator_id: creatorId,
      })}`
    ),

  getCreatorByUsername: async (username: string) => {
    const creators = await browseApi.getCreatorsList(100, 0);
    return (
      creators.find(
        (c: any) => c?.username?.toLowerCase() === username.toLowerCase()
      ) || null
    );
  },

  getCreatorFullProfile: async (
    creatorId: string | number,
    limit = 20,
    offset = 0
  ) => {
    const [creator, posts] = await Promise.all([
      browseApi.getCreatorProfileItem(creatorId),
      browseApi.getCreatorPostsList(creatorId, limit, offset),
    ]);

    return {
      creator,
      posts,
    };
  },
};

// ─── CREATORS API ALIAS ──────────────────────────────────────────────────────
export const creatorsApi = {
  getCreatorById: (creatorId: string | number) =>
    browseApi.getCreatorProfile(creatorId),

  getCreatorProfile: (creatorId: string | number) =>
    browseApi.getCreatorProfile(creatorId),

  getCreatorPosts: (creatorId: string | number, limit = 20, offset = 0) =>
    browseApi.getCreatorPosts(creatorId, limit, offset),

  getCreatorByUsername: async (username: string) =>
    browseApi.getCreatorByUsername(username),

  getCreatorFullProfile: async (
    creatorId: string | number,
    limit = 20,
    offset = 0
  ) => browseApi.getCreatorFullProfile(creatorId, limit, offset),
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────
export const userProfileApi = {
  getMe: () => apiFetch("/user/profile/me"),

  updateMe: (data: {
    username?: string;
    display_name?: string;
    bio?: string;
    phone?: string;
    date_of_birth?: string;
  }) => {
    const formData = new FormData();
    formData.append("profile_update", JSON.stringify(data));
    return apiFetch("/user/profile/me", "PUT", formData, true);
  },

  updateMeWithAvatar: (
  data: {
    username?: string;
    display_name?: string;
    bio?: string;
    phone?: string;
    date_of_birth?: string;
  },
  avatar?: File | null
) => {
  const formData = new FormData();
  formData.append("profile_update", JSON.stringify(data));

  if (avatar) {
    formData.append("avatar", avatar);
  }

  return apiFetch("/user/profile/me", "PUT", formData, true);
},

  updateMeWithFiles: (
    data: {
      username?: string;
      display_name?: string;
      bio?: string;
      phone?: string;
      date_of_birth?: string;
    },
    files?: {
      avatar?: File | null;
      cover_image?: File | null;
    }
  ) => {
    const formData = new FormData();
    formData.append("profile_update", JSON.stringify(data));

    if (files?.avatar) {
      formData.append("avatar", files.avatar);
    }

    if (files?.cover_image) {
      formData.append("cover_image", files.cover_image);
    }

    return apiFetch("/user/profile/me", "PUT", formData, true);
  },
};

// ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
export const subscriptionsApi = {
  getMySubscriptions: () => apiFetch("/user/subscriptions/"),

  subscribe: (creatorId: string | number) =>
    apiFetch(`/user/subscriptions/creators/${creatorId}`, "POST"),

  unsubscribe: (creatorId: string | number) =>
    apiFetch(`/user/subscriptions/creators/${creatorId}`, "DELETE"),
};


// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export type NotificationItem = {
  id: string | number;
  type?: string;
  text?: string;
  is_read?: boolean;
  action_url?: string;
  sender?: {
    id?: string | number;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  metadata?: Record<string, any>;
  created_at?: string;
};

export type NotificationListResponse = {
  data?: NotificationItem[];
  status?: string;
  message?: string;
  pagination?: {
    total?: number;
    limit?: number;
    offset?: number;
    has_more?: boolean;
  };
};

export const notificationsApi = {
  getNotifications: async (limit = 20, offset = 0) => {
    const res = await apiFetch<NotificationListResponse>(
      `/user/notifications${buildQueryString({ limit, offset })}`
    );

    return {
      ...res,
      data: Array.isArray(res?.data) ? res.data : [],
      pagination: {
        total: Number(res?.pagination?.total ?? 0),
        limit: Number(res?.pagination?.limit ?? limit),
        offset: Number(res?.pagination?.offset ?? offset),
        has_more: Boolean(res?.pagination?.has_more),
      },
    };
  },

  getNotificationsList: async (limit = 20, offset = 0) => {
    const res = await notificationsApi.getNotifications(limit, offset);
    return res.data || [];
  },

  getUnreadCount: () => apiFetch("/user/notifications/unread-count"),

  markRead: (notificationId: string | number) =>
    apiFetch(`/user/notifications/${notificationId}/read`, "PUT"),

  markAllRead: () => apiFetch("/user/notifications/read-all", "PUT"),
};

// ─── MESSAGES ────────────────────────────────────────────────────────────────
export const messagesApi = {
  getConversations: (limit = 20, offset = 0) =>
    apiFetch(`/user/conversations${buildQueryString({ limit, offset })}`),

  startConversation: (creatorId: string | number) =>
    apiFetch("/user/conversations", "POST", { creator_id: creatorId }),

  getConversation: (conversationId: string | number) =>
    apiFetch(`/user/conversations/${conversationId}`),

  getMessages: (conversationId: string | number, limit = 50, offset = 0) =>
    apiFetch(
      `/user/conversations/${conversationId}/messages${buildQueryString({
        limit,
        offset,
      })}`
    ),

  sendMessage: (conversationId: string | number, content: string) =>
    apiFetch(`/user/conversations/${conversationId}/messages`, "POST", {
      content,
      message_type: "text",
    }),

  markAsRead: (conversationId: string | number) =>
    apiFetch(`/user/conversations/${conversationId}/read`, "PATCH"),
};

// ─── INTERACTIONS ────────────────────────────────────────────────────────────
export const interactApi = {
  toggleLike: async (postId: string | number) => {
    const res = await apiFetch(`/user/interact/posts/${postId}/like`, "POST");

    return {
      raw: res,
      liked: Boolean(
        res?.liked ??
        res?.is_liked ??
        res?.data?.liked ??
        res?.data?.is_liked
      ),
      likes_count: getSafeNumber(
        res?.likes_count,
        res?.like_count,
        res?.data?.likes_count
      ),
    };
  },

  // ✅ FIXED FUNCTION
  toggleBookmark: async (
    postId: string | number,
    creatorId: string | number
  ) => {
    const res = await apiFetch(
      `/user/interact/posts/${postId}/bookmark${buildQueryString({
        creator_id: creatorId,
      })}`,
      "POST"
    );

    return {
      raw: res,
      bookmarked: Boolean(
        res?.bookmarked ??
        res?.is_bookmarked ??
        res?.data?.bookmarked ??
        res?.data?.is_bookmarked
      ),
    };
  },

  getComments: async (postId: string | number, limit = 50, offset = 0) => {
    const res = await apiFetch(
      `/user/interact/posts/${postId}/comments${buildQueryString({
        limit,
        offset,
      })}`
    );

    return {
      raw: res,
      comments: Array.isArray(res?.data) ? res.data : [],
      comments_count: getSafeNumber(
        res?.comments_count,
        res?.data?.comments_count
      ),
    };
  },

  createComment: async (
    postId: string | number,
    content: string,
    parent_id?: string | number | null
  ) => {
    const body: Record<string, any> = { content };
    if (parent_id) body.parent_id = parent_id;

    const res = await apiFetch(
      `/user/interact/posts/${postId}/comments`,
      "POST",
      body
    );

    return {
      raw: res,
      comment: res?.data || res,
    };
  },

  deleteComment: (commentId: string | number) =>
    apiFetch(`/user/interact/comments/${commentId}`, "DELETE"),

  unlockPost: (postId: string | number) =>
    apiFetch(`/user/interact/posts/${postId}/unlock`, "POST"),
};

// ─── BOOKMARKS ───────────────────────────────────────────────────────────────
export const bookmarksApi = {
  getBookmarks: async () => {
    const res = await apiFetch("/user/bookmarks/");

    // your backend returns: { data: [...] }
    const list = Array.isArray(res?.data) ? res.data : [];

    return list.map((post: any) => normalizePost(post));
  },
};

// ─── WALLET ──────────────────────────────────────────────────────────────────
export const walletApi = {
  getWallet: async () => {
    const res = await apiFetch("/user/wallet/");
    return normalizeWallet(unwrapItem(res));
  },

  getTransactions: async () => {
    const res = await apiFetch("/user/wallet/transactions");
    return normalizeListOfPayments(res);
  },

  deposit: async (amount: number) => {
    return apiFetch("/user/wallet/deposit", "POST", { amount });
  },
};

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const paymentsApi = {
  getPaymentHistory: async () => {
    const res = await apiFetch("/user/payments/");
    return normalizeListOfPayments(res);
  },

  getPaymentHistoryRaw: () => apiFetch("/user/payments/"),
};

// ─── MEDIA URL helper ────────────────────────────────────────────────────────
export const mediaUrl = (
  path: string | null | undefined,
  addCacheBust = false
): string => {
  if (!path) return "/placeholder.jpg";

  const cleanPath = String(path).trim();
  if (!cleanPath) return "/placeholder.jpg";

  let finalUrl = "";

  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://") ||
    cleanPath.startsWith("blob:")
  ) {
    finalUrl = cleanPath;
  } else if (cleanPath.startsWith("//")) {
    finalUrl = `http:${cleanPath}`;
  } else if (cleanPath.startsWith("/")) {
    finalUrl = `${BASE_URL}${cleanPath}`;
  } else if (cleanPath.startsWith("media/")) {
    finalUrl = `${BASE_URL}/${cleanPath}`;
  } else if (cleanPath.startsWith("uploads/")) {
    finalUrl = `${BASE_URL}/${cleanPath}`;
  } else {
    finalUrl = `${BASE_URL}/${cleanPath}`;
  }

  if (addCacheBust && !finalUrl.startsWith("blob:")) {
    const separator = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${separator}t=${Date.now()}`;
  }

  return finalUrl;
};