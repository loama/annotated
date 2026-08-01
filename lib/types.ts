export type SourceType = "video" | "article" | "podcast";

export type Author = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  accent: string;
  bio: string;
};

export type Annotation = {
  id: string;
  sourceType: SourceType;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
  sourcePublisher: string;
  sourceImage?: string;
  excerpt?: string;
  startSeconds?: number;
  endSeconds?: number;
  resolution?: 240;
  commentary: string;
  audioCommentaryUrl?: string;
  createdAt: string;
  author: Author;
  applause: number;
  commentCount: number;
  tags: string[];
};

export type Comment = {
  id: string;
  annotationId: string;
  author: Author;
  body: string;
  createdAt: string;
};

export type Claim = {
  id: string;
  annotationId: string;
  reason: "copyright" | "context" | "privacy" | "other";
  details: string;
  email: string;
  createdAt: string;
};

export type StudioDraft = {
  sourceUrl: string;
  sourceTitle: string;
  sourceType: SourceType;
  selection: string;
  startSeconds: number;
  endSeconds: number;
  commentary: string;
};
