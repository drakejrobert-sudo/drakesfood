export const blogNotificationPosts = [
  {
    slug: 'mediterranean-chicken-pasta',
    title: 'Mediterranean Chicken Pasta',
    summary:
      'Savory penne tossed with a bright tomato-spinach sauce, grilled Italian chicken, feta, and fresh parsley.',
    path: '/blog/mediterranean-chicken-pasta',
    heroImagePath: '/assets/blog/mediterranean-chicken-pasta/hero-finished-pasta.jpeg',
    heroImageAlt:
      'Mediterranean chicken pasta with sliced chicken, tomato sauce, feta, and parsley in a wide bowl',
  },
  {
    slug: 'drews-mexican-street-corn',
    title: "Drew's Mexican Street Corn",
    summary: 'A smoky, creamy, slightly charred spin on Mexican street corn for taco night.',
    path: '/blog/drews-mexican-street-corn',
    heroImagePath: '/assets/blog/drews-mexican-street-corn/5-taquitos-on-corn-with-tajin.JPG',
    heroImageAlt: 'Homemade taquitos served over creamy Mexican street corn and topped with Tajín',
  },
  {
    slug: 'chef-eds-sweet-turkey-bowl',
    title: "Chef Ed's Sweet Turkey Bowl",
    summary: 'A simple, healthy, in one bowl meal; my first shot at a submitted recipe!',
    path: '/blog/chef-eds-sweet-turkey-bowl',
  },
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
