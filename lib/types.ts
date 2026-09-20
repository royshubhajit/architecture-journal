export type Post = {
  slug: string; title: string; excerpt: string; content: string; topic: string;
  coverImage?: string; coverAlt?: string;
  contentFormat?: "markdown" | "html";
  status: "draft" | "published"; publishedAt: string; updatedAt: string; readingMinutes: number;
};

export type BlogTheme = "paper" | "ink" | "grid";

export type SiteSettings = {
  theme: BlogTheme;
  updatedAt: string;
  auth?: { passwordDigest: string; sessionVersion: string };
};
