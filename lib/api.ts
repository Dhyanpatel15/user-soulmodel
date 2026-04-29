const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API = `${BASE_URL}/api/v1`;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AnyObj = Record<string, any>;

const isBrowser = () => typeof window !== "undefined";
const asObj = (v: any): AnyObj => (v && typeof v === "object" ? v : {});
const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const first = (...values: any[]) =>
  values.find((v) => v !== undefined && v !== null && v !== "") ?? "";

const firstNum = (...values: any[]) => {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const boolFrom = (...values: any[]) => Boolean(first(...values, false));

const buildQueryString = (params: AnyObj = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  return qs.toString() ? `?${qs}` : "";
};

const errMsg = (err: any): string => {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    return err.message || err.error || err.detail || JSON.stringify(err);
  }
  return String(err);
};

// ─── Token helpers ───────────────────────────────────────────────────────────
// ─── Token helpers ───────────────────────────────────────────────────────────
export const getToken = () =>
  isBrowser() ? localStorage.getItem("access_token") : null;

export const clearLoggedInUserCache = () => {
  if (!isBrowser()) return;

  localStorage.removeItem("loggedInUsername");
  localStorage.removeItem("loggedInUsernameToken");

  localStorage.removeItem("username");
  localStorage.removeItem("user_name");
  localStorage.removeItem("currentUsername");

  localStorage.removeItem("user");
  localStorage.removeItem("authUser");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("profile");
  localStorage.removeItem("userData");
  localStorage.removeItem("account");
};

export const setToken = (token: string) => {
  if (!isBrowser()) return;

  const oldToken = localStorage.getItem("access_token");

  if (oldToken && oldToken !== token) {
    clearLoggedInUserCache();
  }

  localStorage.setItem("access_token", token);
};

export const removeToken = () => {
  if (!isBrowser()) return;

  localStorage.removeItem("access_token");
  clearLoggedInUserCache();
};

// ─── Unwrap helpers ──────────────────────────────────────────────────────────
const listKeys = [
  "data",
  "items",
  "results",
  "posts",
  "rows",
  "notifications",
  "creators",
  "comments",
  "transactions",
  "payments",
];

export const unwrapList = <T = any>(response: any): T[] => {
  if (Array.isArray(response)) return response;

  for (const key of listKeys) {
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.data?.[key])) return response.data[key];
  }

  return [];
};

export const unwrapItem = <T = any>(response: any): T => {
  for (const key of [
    "data",
    "item",
    "post",
    "creator",
    "wallet",
    "payment",
    "transaction",
    "comment",
  ]) {
    if (response?.[key] && !Array.isArray(response[key])) return response[key];
  }

  return response;
};

// ─── Core fetch wrapper ──────────────────────────────────────────────────────
export async function apiFetch<T = any>(
  path: string,
  method: Method = "GET",
  body?: any,
  isFormData = false
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
  };

  let res: Response;

  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Network error or CORS issue");
  }

  if (res.status === 204) return {} as T;

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    removeToken();
    if (isBrowser()) window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(
      errMsg(data?.detail) ||
        errMsg(data?.message) ||
        errMsg(data?.error) ||
        `Error ${res.status}`
    );
  }

  return data;
}

// ─── Normalizers ─────────────────────────────────────────────────────────────
const normalizeStatus = (status: any) => {
  const s = String(status || "").toLowerCase();

  if (!s || ["paid", "completed", "success", "succeeded"].includes(s)) {
    return "success";
  }

  if (["failed", "error", "cancelled", "canceled"].includes(s)) {
    return "failed";
  }

  if (["pending", "processing"].includes(s)) {
    return "pending";
  }

  return s;
};

const detectFlow = (item: AnyObj = {}): "credit" | "debit" => {
  const explicit = String(
    first(
      item.flow,
      item.transaction_flow,
      item.metadata_?.flow,
      item.metadata?.flow
    )
  ).toLowerCase();

  if (explicit === "credit" || explicit === "debit") return explicit;

  const type = String(
    first(item.type, item.transaction_type, item.entry_type, item.kind)
  ).toLowerCase();

  if (
    [
      "deposit",
      "credit",
      "refund",
      "topup",
      "top_up",
      "wallet_credit",
      "added",
    ].some((t) => type.includes(t))
  ) {
    return "credit";
  }

  if (
    [
      "ppv",
      "subscription",
      "gift",
      "unlock",
      "payment",
      "purchase",
      "debit",
      "spent",
      "deducted",
      "withdrawal",
    ].some((t) => type.includes(t))
  ) {
    return "debit";
  }

  return toNum(item.amount) < 0 ? "debit" : "credit";
};

const normalizeCreator = (creator: AnyObj = {}) => {
  const data = asObj(creator.data);
  const nested = asObj(
    first(creator.creator, data.creator, creator.profile, data.profile, creator)
  );
  const subscription = asObj(
    first(creator.subscription, data.subscription, nested.subscription, {})
  );
  const user = asObj(first(nested.user, creator.user, data.user, {}));

  const price = firstNum(
    subscription.subscription_price,
    subscription.price,
    subscription.monthly_price,
    nested.subscription_price,
    nested.price,
    nested.monthly_price,
    creator.subscription_price,
    creator.price,
    creator.monthly_price,
    user.subscription_price,
    user.price,
    user.monthly_price
  );

  const subscribed = boolFrom(
    subscription.is_subscribed,
    subscription.subscribed,
    nested.is_subscribed,
    nested.subscribed,
    creator.is_subscribed,
    creator.subscribed
  );

  return {
    ...creator,
    ...nested,

    id: first(
      nested.id,
      nested.creator_id,
      nested.user_id,
      creator.id,
      creator.creator_id,
      creator.user_id,
      user.id,
      null
    ),

    username: first(
      nested.username,
      nested.user_name,
      nested.handle,
      creator.username,
      creator.user_name,
      creator.handle,
      user.username,
      user.user_name
    ),

    display_name: first(
      nested.display_name,
      nested.full_name,
      nested.name,
      creator.display_name,
      creator.full_name,
      creator.name,
      user.display_name,
      user.full_name,
      user.name,
      nested.username,
      user.username,
      "Creator"
    ),

    avatar_url: first(
      nested.avatar_url,
      nested.avatar,
      nested.profile_image,
      nested.profile_picture,
      nested.image,
      creator.avatar_url,
      creator.avatar,
      creator.profile_image,
      creator.profile_picture,
      creator.image,
      user.avatar_url,
      user.avatar,
      user.profile_image,
      user.profile_picture
    ),

    cover_photo_url: first(
      nested.cover_photo_url,
      nested.cover_image,
      nested.cover,
      nested.banner,
      nested.header_image,
      creator.cover_photo_url,
      creator.cover_image,
      creator.cover,
      creator.banner,
      creator.header_image,
      user.cover_photo_url,
      user.cover_image,
      user.cover,
      user.banner
    ),

    is_verified: boolFrom(
      nested.is_verified,
      nested.verified,
      creator.is_verified,
      creator.verified,
      user.is_verified,
      user.verified
    ),

    is_subscribed: subscribed,

    is_free:
      nested.is_free === true ||
      creator.is_free === true ||
      user.is_free === true ||
      price === 0,

    subscription_price: price,

    bio: first(
      nested.bio,
      nested.description,
      nested.about,
      creator.bio,
      creator.description,
      creator.about,
      user.bio,
      user.description
    ),

    is_online: boolFrom(
      nested.is_online,
      nested.online,
      creator.is_online,
      creator.online,
      user.is_online,
      user.online
    ),

    subscribers_count: firstNum(
      nested.subscribers_count,
      nested.total_subscribers,
      nested.subscriber_count,
      creator.subscribers_count,
      creator.total_subscribers,
      creator.subscriber_count,
      user.subscribers_count,
      user.total_subscribers
    ),

    subscription: {
      ...subscription,
      subscription_price: price,
      is_subscribed: subscribed,
    },
  };
};

const normalizeComment = (comment: AnyObj = {}) => {
  const user = asObj(first(comment.user, comment.creator, comment.author, {}));

  return {
    ...comment,
    id: first(comment.id, comment.comment_id, `${Date.now()}-${Math.random()}`),
    content: first(
      comment.content,
      comment.text,
      comment.comment,
      comment.body,
      comment.message
    ),
    created_at: first(comment.created_at, comment.createdAt, null),
    user: {
      ...user,
      id: first(user.id, comment.user_id, null),
      username: first(
        user.username,
        user.user_name,
        user.handle,
        comment.username,
        "User"
      ),
      display_name: first(
        user.display_name,
        user.full_name,
        user.name,
        user.username,
        comment.username,
        "User"
      ),
      avatar_url: first(
        user.avatar_url,
        user.avatar,
        user.profile_image,
        user.profile_picture
      ),
    },
  };
};

export const normalizePost = (post: AnyObj = {}) => {
  const creator = normalizeCreator(first(post.creator, post.user, post.profile, {}));

  const premium =
    boolFrom(
      post.is_premium,
      post.is_ppv,
      post.ppv,
      post.is_paid,
      post.paid_post
    ) || ["ppv", "premium"].includes(post.visibility);

  const subscribed = boolFrom(
    post.viewer_is_subscribed,
    post.is_subscribed,
    post.subscription_active,
    post.has_subscription,
    post.creator?.is_subscribed,
    creator.is_subscribed
  );

  const caption = first(post.caption, post.content, post.description, post.text);

  const likes = firstNum(
    post.likes_count,
    post.like_count,
    post.total_likes,
    post.stats?.likes_count,
    post.stats?.like_count,
    post.stats?.total_likes,
    Array.isArray(post.likes) ? post.likes.length : undefined,
    Array.isArray(post.liked_by) ? post.liked_by.length : undefined
  );

  const comments = firstNum(
    post.comments_count,
    post.comment_count,
    post.total_comments,
    post.stats?.comments_count,
    post.stats?.comment_count,
    post.stats?.total_comments,
    Array.isArray(post.comments) ? post.comments.length : undefined
  );

  const locked = premium && !subscribed;

  return {
    ...post,
    creator,
    creator_id: first(post.creator_id, creator.id, post.user_id, null),
    title: post.title || "",
    caption,
    content: caption,
    description: caption,
    likes_count: likes,
    like_count: likes,
    comments_count: comments,
    comment_count: comments,
    is_liked: boolFrom(
      post.is_liked,
      post.liked,
      post.viewer_has_liked,
      post.meta?.is_liked
    ),
    is_bookmarked: boolFrom(
      post.is_bookmarked,
      post.bookmarked,
      post.viewer_has_bookmarked
    ),
    is_premium: premium,
    is_ppv: premium,
    is_subscribed: subscribed,
    can_view: !locked,
    is_locked: locked,
  };
};

const normalizePosts = (res: any) => unwrapList(res).map(normalizePost);
const normalizeComments = (res: any) => unwrapList(res).map(normalizeComment);

const normalizeWallet = (wallet: AnyObj = {}) => ({
  ...wallet,
  id: first(wallet.id, null),
  balance: toNum(first(wallet.balance, wallet.amount)),
  currency: wallet.currency || "USD",
  created_at: wallet.created_at || null,
  updated_at: wallet.updated_at || null,
});

export const normalizeTransaction = (tx: AnyObj = {}) => {
  const flow = detectFlow(tx);
  const amount = Math.abs(toNum(first(tx.amount, tx.transaction_amount)));

  return {
    ...tx,
    id: first(tx.id, null),
    type: String(
      first(tx.type, tx.transaction_type, tx.entry_type, tx.kind)
    ).toLowerCase(),
    flow,
    amount,
    signed_amount: flow === "debit" ? -amount : amount,
    currency: tx.currency || "USD",
    status: normalizeStatus(tx.status),
    title: first(
      tx.title,
      tx.description,
      tx.label,
      tx.reason,
      flow === "credit" ? "Wallet Credit" : "Wallet Debit"
    ),
    note: first(tx.note, tx.message, tx.metadata_?.note, tx.metadata?.note),
    reference_type: tx.reference_type || null,
    reference_id: first(tx.reference_id, null),
    creator_id: first(tx.creator_id, null),
    provider: first(tx.provider, tx.metadata_?.provider, tx.metadata?.provider),
    provider_transaction_id: first(
      tx.provider_transaction_id,
      tx.reference,
      tx.metadata_?.payment_tx_id,
      tx.metadata?.payment_tx_id
    ),
    created_at: first(tx.created_at, tx.date, tx.timestamp, null),
    metadata_: tx.metadata_ || tx.metadata || {},
  };
};

const normalizePayment = (payment: AnyObj = {}) => {
  const amount = Math.abs(toNum(first(payment.amount, payment.transaction_amount)));

  return {
    ...payment,
    id: first(payment.id, null),
    provider: payment.provider || "",
    provider_transaction_id: first(
      payment.provider_transaction_id,
      payment.reference
    ),
    amount,
    signed_amount: -amount,
    currency: payment.currency || "USD",
    status: normalizeStatus(first(payment.status, payment.payment_status)),
    type: String(
      first(
        payment.type,
        payment.transaction_type,
        payment.entry_type,
        payment.kind,
        "payment"
      )
    ).toLowerCase(),
    flow: "debit",
    title: first(
      payment.title,
      payment.description,
      payment.label,
      payment.reason,
      "Payment"
    ),
    note: first(payment.note, payment.message),
    created_at: first(payment.created_at, payment.date, payment.timestamp, null),
    creator: payment.creator ? normalizeCreator(payment.creator) : payment.creator,
    recipient: payment.recipient
      ? normalizeCreator(payment.recipient)
      : payment.recipient,
  };
};

export const normalizeUserProfile = (profile: AnyObj = {}) => {
  const data = asObj(profile.data);
  const user = asObj(
    first(profile.user, data.user, profile.profile, data.profile, data, profile, {})
  );

  return {
    ...profile,
    ...data,
    ...user,
    id: first(user.id, data.id, profile.id, null),
    email: first(user.email, data.email, profile.email),
    username: first(
      user.username,
      user.user_name,
      user.handle,
      data.username,
      data.user_name,
      data.handle,
      profile.username,
      profile.user_name,
      profile.handle
    ),
    display_name: first(
      user.display_name,
      user.full_name,
      user.name,
      data.display_name,
      data.full_name,
      data.name,
      profile.display_name,
      profile.full_name,
      profile.name,
      user.username,
      data.username,
      profile.username,
      "User"
    ),
    full_name: first(
      user.full_name,
      user.display_name,
      user.name,
      data.full_name,
      data.display_name,
      data.name,
      profile.full_name,
      profile.display_name,
      profile.name
    ),
    avatar: first(
      user.avatar,
      user.avatar_url,
      user.profile_image,
      user.profile_picture,
      user.image,
      data.avatar,
      data.avatar_url,
      data.profile_image,
      data.profile_picture,
      data.image,
      profile.avatar,
      profile.avatar_url,
      profile.profile_image,
      profile.profile_picture,
      profile.image
    ),
    avatar_url: first(
      user.avatar_url,
      user.avatar,
      user.profile_image,
      user.profile_picture,
      user.image,
      data.avatar_url,
      data.avatar,
      data.profile_image,
      data.profile_picture,
      data.image,
      profile.avatar_url,
      profile.avatar,
      profile.profile_image,
      profile.profile_picture,
      profile.image
    ),
    cover_image: first(
      user.cover_image,
      user.cover_photo_url,
      user.cover_url,
      data.cover_image,
      data.cover_photo_url,
      data.cover_url,
      profile.cover_image,
      profile.cover_photo_url,
      profile.cover_url
    ),
    bio: first(user.bio, data.bio, profile.bio),
  };
};

const withData = (res: any, data: any) => ({
  ...(typeof res === "object" && res ? res : {}),
  data,
});

const profileForm = (
  data: AnyObj,
  files?: {
    avatar?: File | null;
    cover_image?: File | null;
  }
) => {
  const formData = new FormData();
  formData.append("profile_update", JSON.stringify(data));
  if (files?.avatar) formData.append("avatar", files.avatar);
  if (files?.cover_image) formData.append("cover_image", files.cover_image);
  return formData;
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch("/auth/login", "POST", { email, password }),

  register: (data: {
    email: string;
    password: string;
    display_name: string;
  }) => apiFetch("/auth/register", "POST", data),

  me: async () => normalizeUserProfile(await apiFetch("/user/profile/me")),

  forgotPassword: (email: string) =>
    apiFetch("/auth/forgot-password", "POST", { email }),

  resetPassword: (token: string, new_password: string) =>
    apiFetch("/auth/reset-password", "POST", { token, new_password }),
};

// ─── FEED ────────────────────────────────────────────────────────────────────
export const feedApi = {
  getAllCreatorsPosts: async (limit = 20, offset = 0) => {
    const res = await apiFetch(
      `/user/browse/posts${buildQueryString({ limit, offset })}`
    );
    return withData(res, normalizePosts(res));
  },

  getAllCreatorsPostsRaw: (limit = 20, offset = 0) =>
    apiFetch(`/user/browse/posts${buildQueryString({ limit, offset })}`),

  getAllCreatorsPostsList: async (limit = 20, offset = 0) =>
    normalizePosts(
      await apiFetch(`/user/browse/posts${buildQueryString({ limit, offset })}`)
    ),
};

// ─── BROWSE / CREATOR PROFILE ────────────────────────────────────────────────
export const browseApi = {
  getCreators: async (limit = 20, offset = 0) => {
    const res = await apiFetch(
      `/user/browse/creators${buildQueryString({ limit, offset })}`
    );
    return withData(res, unwrapList(res).map(normalizeCreator));
  },

  getCreatorsList: async (limit = 20, offset = 0) =>
    unwrapList(
      await apiFetch(`/user/browse/creators${buildQueryString({ limit, offset })}`)
    ).map(normalizeCreator),

  getCreatorProfile: async (creatorId: string | number) => {
    const res = await apiFetch(`/user/browse/creators/${creatorId}`);
    return withData(res, normalizeCreator(res));
  },

  getCreatorProfileItem: async (creatorId: string | number) =>
    normalizeCreator(await apiFetch(`/user/browse/creators/${creatorId}`)),

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
    return withData(res, normalizePosts(res));
  },

  getCreatorPostsList: async (
    creatorId: string | number,
    limit = 20,
    offset = 0
  ) =>
    normalizePosts(
      await apiFetch(
        `/user/browse/creators/${creatorId}/posts${buildQueryString({
          limit,
          offset,
        })}`
      )
    ),

  getPost: async (postId: string | number, creatorId: string | number) => {
    const res = await apiFetch(
      `/user/browse/posts/${postId}${buildQueryString({
        creator_id: creatorId,
      })}`
    );
    return withData(res, normalizePost(unwrapItem(res)));
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
        (creator: any) =>
          creator?.username?.toLowerCase() === username.toLowerCase()
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

    return { creator, posts };
  },
};

// ─── CREATORS API ALIAS ──────────────────────────────────────────────────────
export const creatorsApi = {
  getCreatorById: browseApi.getCreatorProfile,
  getCreatorProfile: browseApi.getCreatorProfile,
  getCreatorPosts: browseApi.getCreatorPosts,
  getCreatorByUsername: browseApi.getCreatorByUsername,
  getCreatorFullProfile: browseApi.getCreatorFullProfile,
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────
export const userProfileApi = {
  getMe: async () => normalizeUserProfile(await apiFetch("/user/profile/me")),

  updateMe: async (data: AnyObj) =>
    normalizeUserProfile(
      await apiFetch("/user/profile/me", "PUT", profileForm(data), true)
    ),

  updateMeWithAvatar: async (data: AnyObj, avatar?: File | null) =>
    normalizeUserProfile(
      await apiFetch(
        "/user/profile/me",
        "PUT",
        profileForm(data, { avatar }),
        true
      )
    ),

  updateMeWithFiles: async (
    data: AnyObj,
    files?: {
      avatar?: File | null;
      cover_image?: File | null;
    }
  ) =>
    normalizeUserProfile(
      await apiFetch("/user/profile/me", "PUT", profileForm(data, files), true)
    ),
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
        total: toNum(res?.pagination?.total),
        limit: toNum(res?.pagination?.limit, limit),
        offset: toNum(res?.pagination?.offset, offset),
        has_more: Boolean(res?.pagination?.has_more),
      },
    };
  },

  getNotificationsList: async (limit = 20, offset = 0) =>
    (await notificationsApi.getNotifications(limit, offset)).data || [],

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
    apiFetch("/user/conversations", "POST", {
      creator_id: creatorId,
    }),

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

    const rawLiked = first(
      res?.liked,
      res?.is_liked,
      res?.data?.liked,
      res?.data?.is_liked
    );

    const rawLikes = first(
      res?.likes_count,
      res?.like_count,
      res?.total_likes,
      res?.data?.likes_count,
      res?.data?.like_count,
      res?.data?.total_likes
    );

    return {
      raw: res,
      liked: typeof rawLiked === "boolean" ? rawLiked : undefined,
      likes_count: rawLikes === "" ? undefined : Number(rawLikes),
    };
  },

  toggleBookmark: async (
    postId: string | number,
    creatorId: string | number
  ) => {
    const query = buildQueryString({
      creator_id: creatorId,
    });

    const res = await apiFetch(
      `/user/interact/posts/${postId}/bookmark${query}`,
      "POST"
    );

    return {
      raw: res,
      bookmarked: boolFrom(
        res?.bookmarked,
        res?.is_bookmarked,
        res?.data?.bookmarked,
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

    const comments = normalizeComments(res);

    return {
      raw: res,
      comments,
      comments_count: firstNum(
        res?.comments_count,
        res?.comment_count,
        res?.data?.comments_count,
        res?.data?.comment_count,
        comments.length
      ),
    };
  },

  createComment: async (
    postId: string | number,
    content: string,
    parent_id?: string | number | null
  ) => {
    const res = await apiFetch(
      `/user/interact/posts/${postId}/comments`,
      "POST",
      {
        content,
        ...(parent_id ? { parent_id } : {}),
      }
    );

    return {
      raw: res,
      comment: normalizeComment(res?.data || res),
      comments_count: firstNum(
        res?.comments_count,
        res?.comment_count,
        res?.data?.comments_count,
        res?.data?.comment_count
      ),
    };
  },

  deleteComment: (commentId: string | number) =>
    apiFetch(`/user/interact/comments/${commentId}`, "DELETE"),

  unlockPost: (postId: string | number) =>
    apiFetch(`/user/interact/posts/${postId}/unlock`, "POST"),
};

// ─── BOOKMARKS ───────────────────────────────────────────────────────────────
export const bookmarksApi = {
  getBookmarks: async () =>
    unwrapList(await apiFetch("/user/bookmarks/")).map(normalizePost),
};

// ─── WALLET ──────────────────────────────────────────────────────────────────
export const walletApi = {
  getWallet: async () =>
    normalizeWallet(unwrapItem(await apiFetch("/user/wallet/"))),

  getTransactions: async () =>
    unwrapList(await apiFetch("/user/wallet/transactions")).map(
      normalizeTransaction
    ),

  getTransactionsRaw: () => apiFetch("/user/wallet/transactions"),

  deposit: (amount: number) =>
    apiFetch("/user/wallet/deposit", "POST", { amount }),
};

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const paymentsApi = {
  getPaymentHistory: async () =>
    unwrapList(await apiFetch("/user/payments/")).map(normalizePayment),

  getPaymentHistoryRaw: () => apiFetch("/user/payments/"),
};

// ─── COMBINED FINANCIAL HELPERS ──────────────────────────────────────────────
export const financeApi = {
  getAllTransactions: async () => {
    const [walletTransactions, paymentHistory] = await Promise.all([
      walletApi.getTransactions().catch(() => []),
      paymentsApi.getPaymentHistory().catch(() => []),
    ]);

    const merged = [...walletTransactions, ...paymentHistory];

    const uniqueMap = new Map<string, any>();

    for (const item of merged) {
      const key = `${item?.id}-${item?.flow}-${item?.amount}-${item?.created_at}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }

    return Array.from(uniqueMap.values()).sort((a: any, b: any) => {
      const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  },
};

export const creatorRequestApi = {
  becomeCreator: () => apiFetch("/user/become-creator", "POST"),
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