export type Post = {
  slug: string; title: string; excerpt: string; content: string; topic: string;
  coverImage?: string; coverAlt?: string;
  status: "draft" | "published"; publishedAt: string; updatedAt: string; readingMinutes: number;
};
