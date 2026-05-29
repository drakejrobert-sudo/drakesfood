import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const blogPostsPath = 'src/app/data/blog-posts.data.ts';
const notificationPostsPath = 'infra/lambda/blog-subscriptions/blog-notification-posts.mjs';

const blogPosts = extractBlogPosts(await readFile(blogPostsPath, 'utf8'));
const { blogNotificationPosts } = await import(pathToFileURL(`${process.cwd()}/${notificationPostsPath}`));
const errors = [];

for (const duplicateSlug of findDuplicateSlugs(blogNotificationPosts)) {
  errors.push(`Duplicate notification metadata slug "${duplicateSlug}" found.`);
}

const notificationPostsBySlug = new Map(blogNotificationPosts.map((post) => [post.slug, post]));

for (const blogPost of blogPosts) {
  const notificationPost = notificationPostsBySlug.get(blogPost.slug);

  if (!notificationPost) {
    errors.push(`Missing notification metadata for blog post "${blogPost.slug}".`);
    continue;
  }

  const expectedPath = `/blog/${blogPost.slug}`;

  if (notificationPost.title !== blogPost.title) {
    errors.push(
      `Notification title mismatch for "${blogPost.slug}": expected "${blogPost.title}", got "${notificationPost.title}".`,
    );
  }

  if (notificationPost.summary !== blogPost.summary) {
    errors.push(
      `Notification summary mismatch for "${blogPost.slug}": expected "${blogPost.summary}", got "${notificationPost.summary}".`,
    );
  }

  if (notificationPost.path !== expectedPath) {
    errors.push(
      `Notification path mismatch for "${blogPost.slug}": expected "${expectedPath}", got "${notificationPost.path}".`,
    );
  }
}

if (errors.length > 0) {
  console.error('Blog notification metadata check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Blog notification metadata covers ${blogPosts.length} blog post(s).`);

function extractBlogPosts(sourceText) {
  const sourceFile = ts.createSourceFile(blogPostsPath, sourceText, ts.ScriptTarget.Latest, true);
  const blogPostsDeclaration = findBlogPostsDeclaration(sourceFile);

  if (!blogPostsDeclaration || !ts.isArrayLiteralExpression(blogPostsDeclaration.initializer)) {
    throw new Error(`Could not find blogPosts array in ${blogPostsPath}.`);
  }

  return blogPostsDeclaration.initializer.elements
    .filter(ts.isObjectLiteralExpression)
    .map((element) => ({
      slug: getRequiredStringProperty(element, 'slug'),
      title: getRequiredStringProperty(element, 'title'),
      summary: getRequiredStringProperty(element, 'summary'),
    }));
}

function findBlogPostsDeclaration(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText() === 'blogPosts') {
    return node;
  }

  return ts.forEachChild(node, findBlogPostsDeclaration);
}

function findDuplicateSlugs(notificationPosts) {
  const seenSlugs = new Set();
  const duplicateSlugs = new Set();

  for (const post of notificationPosts) {
    if (seenSlugs.has(post.slug)) {
      duplicateSlugs.add(post.slug);
      continue;
    }

    seenSlugs.add(post.slug);
  }

  return duplicateSlugs;
}

function getRequiredStringProperty(objectLiteral, propertyName) {
  const property = objectLiteral.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      ts.isIdentifier(candidate.name) &&
      candidate.name.text === propertyName,
  );

  if (!property) {
    throw new Error(`Blog post is missing required "${propertyName}" property.`);
  }

  const initializer = property.initializer;

  if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
    return initializer.text;
  }

  throw new Error(`Blog post "${propertyName}" property must be a string literal.`);
}
