import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid({
  lang: "en-US",
  title: "API Specifications",
  description: "API Specifications",
  cleanUrls: true,
  markdown: {
    lineNumbers: true,
  },
  themeConfig: {
    search: {
      provider: "local",
    },
    sidebar: [
      {
        text: "REST",
        collapsed: false,
        items: [
          { text: "Overview", link: "/rest/" },
          { text: "General rules", link: "/rest/general-rules" },
          { text: "Resources", link: "/rest/resources" },
          { text: "Entities", link: "/rest/entities" },
          { text: "Heritage Collections", link: "/rest/heritage-collections" },
          { text: "Extensions", link: "/rest/extensions" },
          { text: "Facets", link: "/rest/facets" },
          { text: "Suggestions", link: "/rest/suggestions" },
        ],
      },
      {
        text: "GraphQL (placeholder)",
        collapsed: false,
        items: [{ text: "Overview", link: "/graphql/" }],
      },
    ],
  },
});
