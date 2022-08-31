// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "SMART Health Links",
  tagline: "Consumer-controlled health data sharing with standardized links",
  url: "https://docs.smarthealthit.org",
  baseUrl: "/smart-health-links/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "smart-on-fhir", // Usually your GitHub org/user name.
  projectName: "smart-health-links", // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/smart-on-fhir/smart-health-links/tree/main/",
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Health Links",
        logo: {
          alt: "SMART Logo",
          src: "img/logo-smart.svg",
        },
        items: [
          // {
          //   type: "doc",
          //   docId: "index",
          //   position: "left",
          //   label: "Goals",
          // },
          // {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: "https://github.com/smart-on-fhir/smart-health-links",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "SHL Introduction",
                to: "/",
              },
              {
                label: "SHL Design Overview",
                to: "/design",
              },
              {
                label: "SHL User Stories",
                to: "/user-stories",
              },
              {
                label: "SHL Protocol Specification",
                to: "/spec",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "FHIR Chat (#smart/health-cards)",
                href: "https://chat.fhir.org/#narrow/stream/284830-smart.2Fhealth-cards",
              },
              {
                label: "Call notes in HL7 Confluence",
                href: "https://confluence.hl7.org/display/AP/SMART+Health+Links+Call+Notes",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Boston Children's Hospital, Boston, MA<br>CC-BY 4.0`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
