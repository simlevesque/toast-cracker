import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>toast-cracker</title>
        <link rel="stylesheet" href="/styles.css" />
        <script src="/sodium.js"></script>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
