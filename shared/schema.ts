import { z } from "zod";

// Contribution data for a single day
export const contributionDaySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  count: z.number(),
  level: z.number(), // 0-4
});

export type ContributionDay = z.infer<typeof contributionDaySchema>;

// Full contribution data for a user
export const userContributionsSchema = z.object({
  username: z.string(),
  totalContributions: z.number(),
  days: z.array(contributionDaySchema),
});

export type UserContributions = z.infer<typeof userContributionsSchema>;

// Merged contribution data
export const mergedContributionsSchema = z.object({
  users: z.array(z.object({
    username: z.string(),
    totalContributions: z.number(),
    color: z.string(),
  })),
  totalContributions: z.number(),
  days: z.array(z.object({
    date: z.string(),
    count: z.number(),
    level: z.number(),
    perUser: z.record(z.string(), z.number()),
  })),
});

export type MergedContributions = z.infer<typeof mergedContributionsSchema>;

// Request schema
export const fetchContributionsSchema = z.object({
  usernames: z.array(z.string().min(1)).min(1).max(4),
});

export type FetchContributionsRequest = z.infer<typeof fetchContributionsSchema>;