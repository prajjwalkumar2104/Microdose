export type Category = { id: string; name: string };
export type Topic = { id: string; categoryId: string; title: string };

export const categories: Category[] = [
  { id: "gen", name: "General" },
  { id: "tech", name: "Technology & AI" },
  { id: "phil", name: "Philosophy" },
  { id: "bio", name: "Biology" },
  { id: "psych", name: "Psychology" },
  { id: "astro", name: "Astronomy" },
];

export const topics: Topic[] = [
  { id: "t1", categoryId: "gen", title: "The illusion of free time" },
  { id: "t2", categoryId: "gen", title: "Why nostalgia is a powerful drug" },
  { id: "t3", categoryId: "tech", title: "The ethics of open-source AI" },
  { id: "t4", categoryId: "tech", title: "Life before the smartphone" },
  { id: "t5", categoryId: "phil", title: "The Prosecutor's Fallacy" },
  { id: "t6", categoryId: "phil", title: "Absurdism in modern society" },
  { id: "t7", categoryId: "bio", title: "The intelligence of fungi" },
  { id: "t8", categoryId: "bio", title: "CRISPR and human evolution" },
  { id: "t9", categoryId: "psych", title: "The bystander effect" },
  { id: "t10", categoryId: "psych", title: "Why we dream" },
  { id: "t11", categoryId: "astro", title: "The Fermi Paradox" },
  { id: "t12", categoryId: "astro", title: "Concept of the Multiverse" },
];
