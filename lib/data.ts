export const currentUser = {
  id: "u1",
  name: "deversh",
  username: "devershyvqxo5ay",
  initials: "MK",
  avatar: null,
};

export const creators = [
  {
    id: "c1",
    name: "Siyaa",
    username: "dhyan2g03rk99",
    verified: true,
    subscribers: 1,
    posts: 1,
    media: 2,
    bio: "Hey 💕 I share exclusive content you won't find anywhere else. Subscribe to get daily updates, premium photos, and real moments.",
    price: 4.99,
    avatar: "https://i.pravatar.cc/150?img=47",
    banner: "https://picsum.photos/seed/siyaa/900/300",
    subscribed: true,
  },
  {
    id: "c2",
    name: "Luna Rose",
    username: "lunarose_official",
    verified: true,
    subscribers: 234,
    posts: 87,
    media: 312,
    bio: "Travel lover 🌍 | Fitness & lifestyle | Behind the scenes content just for you!",
    price: 9.99,
    avatar: "https://i.pravatar.cc/150?img=32",
    banner: "https://picsum.photos/seed/luna/900/300",
    subscribed: false,
  },
  {
    id: "c3",
    name: "Arjun Mehta",
    username: "arjun_creates",
    verified: false,
    subscribers: 56,
    posts: 23,
    media: 91,
    bio: "Artist & photographer capturing raw moments 📸. Exclusive prints and BTS for subscribers.",
    price: 6.99,
    avatar: "https://i.pravatar.cc/150?img=12",
    banner: "https://picsum.photos/seed/arjun/900/300",
    subscribed: true,
  },
];

export const posts = [
  {
    id: "p1",
    creatorId: "c1",
    creator: creators[0],
    content: "New post just dropped! Check it out 💕",
    image: "https://picsum.photos/seed/post1/600/400",
    likes: 12,
    comments: 3,
    tips: 2,
    locked: false,
    createdAt: "2h ago",
  },
  {
    id: "p2",
    creatorId: "c2",
    creator: creators[1],
    content: "Exclusive content for my subscribers only 🔥",
    image: null,
    likes: 89,
    comments: 14,
    tips: 7,
    locked: true,
    createdAt: "5h ago",
  },
  {
    id: "p3",
    creatorId: "c3",
    creator: creators[2],
    content: "Behind the scenes from today's shoot 📸",
    image: "https://picsum.photos/seed/post3/600/400",
    likes: 34,
    comments: 6,
    tips: 1,
    locked: false,
    createdAt: "1d ago",
  },
  {
    id: "p4",
    creatorId: "c1",
    creator: creators[0],
    content: "Morning vibes ☀️",
    image: "https://picsum.photos/seed/post4/600/400",
    likes: 45,
    comments: 9,
    tips: 5,
    locked: false,
    createdAt: "2d ago",
  },
];

export const mediaItems = [
  { id: "m1", type: "image", src: "https://picsum.photos/seed/m1/300/300", creatorId: "c1" },
  { id: "m2", type: "image", src: "https://picsum.photos/seed/m2/300/300", creatorId: "c1" },
  { id: "m3", type: "video", src: "https://picsum.photos/seed/m3/300/300", creatorId: "c2", locked: true },
  { id: "m4", type: "image", src: "https://picsum.photos/seed/m4/300/300", creatorId: "c3" },
  { id: "m5", type: "image", src: "https://picsum.photos/seed/m5/300/300", creatorId: "c2" },
  { id: "m6", type: "image", src: "https://picsum.photos/seed/m6/300/300", creatorId: "c3" },
];

export const messages = [
  { id: "msg1", from: "c1", text: "Hey! Thanks for subscribing 💕", time: "10:30 AM", read: true },
  { id: "msg2", from: "c3", text: "New content coming your way soon!", time: "Yesterday", read: false },
];

export const notifications = [
  { id: "n1", type: "like", actor: "Luna Rose", content: "liked your comment", time: "2m ago", read: false },
  { id: "n2", type: "subscribe", actor: "Siyaa", content: "started a new post", time: "1h ago", read: false },
  { id: "n3", type: "tip", actor: "Arjun Mehta", content: "sent you a tip of ₹50", time: "3h ago", read: true },
  { id: "n4", type: "message", actor: "Luna Rose", content: "sent you a message", time: "1d ago", read: true },
];

export const payments = [
  { id: "pay1", creator: "Siyaa", amount: 4.99, date: "Mar 15, 2025", status: "paid" },
  { id: "pay2", creator: "Arjun Mehta", amount: 6.99, date: "Feb 15, 2025", status: "paid" },
  { id: "pay3", creator: "Luna Rose", amount: 9.99, date: "Jan 15, 2025", status: "failed" },
];

export const bookmarkedPosts = [posts[0], posts[2]];
