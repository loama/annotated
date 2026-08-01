import type { Author, SessionUser } from "./types";

export function sessionAuthor(user: SessionUser): Author {
  const names = user.name.trim().split(/\s+/);
  const initials = names.slice(0, 2).map((name) => name[0]?.toUpperCase()).join("") || "A";
  return {
    id: `google-${user.id}`,
    name: user.name,
    handle: `@${user.email.split("@")[0]}`,
    initials,
    accent: "#B54732",
    bio: "Reader and annotator keeping original sources close to the conversation.",
  };
}
