export const handler = async () => ({
  statusCode: 501,
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    success: false,
    message: 'Recipe submissions are not connected yet.',
  }),
});
