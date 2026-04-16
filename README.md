# Contribution Merger

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

Merge up to 4 GitHub accounts into one contribution graph.

This project fetches each profile's public GitHub contribution calendar, combines the daily totals, and renders a single heatmap with per-user breakdowns.

## Features

- Merge up to 4 GitHub usernames
- See combined contribution totals for the last year
- View per-user counts inside the tooltip
- Clean GitHub-inspired UI with light and dark theme support
- Vercel-ready frontend + serverless API setup

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Vercel Serverless Functions
- Cheerio for parsing GitHub contribution pages

## Local Development

```bash
npm install
npm run dev
```

If you want to run the Vercel API routes locally as well, use `vercel dev`.

## Build

```bash
npm run build
```

## How It Works

1. Submit 1 to 4 GitHub usernames.
2. The API fetches each user's public contribution calendar from GitHub.
3. Daily counts are merged into a single dataset.
4. The frontend renders the combined heatmap and shows per-user contribution breakdowns on hover.

## Deploy

This repo is set up for Vercel deployment out of the box.

