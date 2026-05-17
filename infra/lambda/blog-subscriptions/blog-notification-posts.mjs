export const blogNotificationPosts = [
  {
    slug: 'mothers-day-baking',
    title: 'The One Day a Year I Bake',
    summary: 'A family tradition that continues to challenge me year after year.',
    path: '/blog/mothers-day-baking',
    heroImagePath: '/assets/blog/mothers-day-baking/mothers_day_11.jpeg',
    heroImageAlt: "Finished cheese danishes cooling after a Mother's Day bake",
  },
];

export function getBlogNotificationPost(slug) {
  return blogNotificationPosts.find((post) => post.slug === slug);
}
