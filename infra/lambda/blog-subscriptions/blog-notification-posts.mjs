export const blogNotificationPosts = [
  {
    slug: 'mothers-day-baking',
    title: 'The One Day a Year I Bake',
    summary: 'A family tradition that continues to challenge me year after year.',
    path: '/blog/mothers-day-baking',
  },
];

export function getBlogNotificationPost(slug) {
  return blogNotificationPosts.find((post) => post.slug === slug);
}
