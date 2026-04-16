import * as cheerio from "cheerio";

async function fetchUserContributions(username) {
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ContributionsMerger/1.0)",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch contributions for ${username}: ${response.status}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const days = [];

  $("td.ContributionCalendar-day").each((_, el) => {
    const $el = $(el);
    const date = $el.attr("data-date");
    const level = parseInt($el.attr("data-level") || "0", 10);
    const id = $el.attr("id");

    if (!date) return;

    let count = 0;
    if (id) {
      const tooltip = $(`tool-tip[for="${id}"]`);
      const tooltipText = tooltip.text().trim();
      const match = tooltipText.match(/^(\d+)\s+contribution/);
      if (match) {
        count = parseInt(match[1], 10);
      }
    }

    days.push({ date, count, level });
  });

  days.sort((a, b) => a.date.localeCompare(b.date));

  const totalContributions = days.reduce((sum, d) => sum + d.count, 0);

  return { username, totalContributions, days };
}

function mergeContributions(usersData) {
  const dateMap = new Map();

  for (const user of usersData) {
    for (const day of user.days) {
      const existing = dateMap.get(day.date);
      if (existing) {
        existing.count += day.count;
        existing.perUser[user.username] = day.count;
      } else {
        dateMap.set(day.date, {
          count: day.count,
          perUser: { [user.username]: day.count },
        });
      }
    }
  }

  const counts = Array.from(dateMap.values())
    .map((d) => d.count)
    .filter((c) => c > 0);
  const sortedCounts = [...counts].sort((a, b) => a - b);
  const q1 = sortedCounts[Math.floor(sortedCounts.length * 0.25)] || 1;
  const q2 = sortedCounts[Math.floor(sortedCounts.length * 0.5)] || 1;
  const q3 = sortedCounts[Math.floor(sortedCounts.length * 0.75)] || 1;

  function getLevel(count) {
    if (count === 0) return 0;
    if (count <= q1) return 1;
    if (count <= q2) return 2;
    if (count <= q3) return 3;
    return 4;
  }

  const days = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      level: getLevel(data.count),
      perUser: data.perUser,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const userColors = ["#2f81f7", "#da3633", "#f0883e", "#8957e5"];

  const users = usersData.map((u, i) => ({
    username: u.username,
    totalContributions: u.totalContributions,
    color: userColors[i % userColors.length],
  }));

  const totalContributions = usersData.reduce(
    (sum, u) => sum + u.totalContributions,
    0
  );

  return { users, totalContributions, days };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { usernames } = req.body || {};

    if (
      !usernames ||
      !Array.isArray(usernames) ||
      usernames.length === 0 ||
      usernames.length > 4
    ) {
      return res.status(400).json({ error: "Provide 1-4 GitHub usernames" });
    }

    const results = await Promise.allSettled(
      usernames.map((u) => fetchUserContributions(u.trim()))
    );

    const successful = [];
    const errors = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        successful.push(result.value);
      } else {
        errors.push({
          username: usernames[i],
          error: result.reason?.message || "Unknown error",
        });
      }
    });

    if (successful.length === 0) {
      return res.status(400).json({
        error: "Could not fetch contributions for any user",
        errors,
      });
    }

    const merged = mergeContributions(successful);

    return res.json({
      data: merged,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
